import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase, supabaseAnon } from '../config/supabase';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'student' | 'moderator' | 'admin';
    department_id: string | null;
    year: string | null;
    status: string;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  // Try roll-number JWT first
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string; type: 'roll_number_session';
    };

    if (decoded.type === 'roll_number_session') {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, role, department_id, year, status')
        .eq('id', decoded.userId)
        .single();

      if (error || !profile) return res.status(401).json({ error: 'Invalid session' });
      if (profile.status !== 'active') return res.status(403).json({ error: 'Account suspended' });

      req.user = profile as any;
      return next();
    }
  } catch {
    // Not a custom JWT
  }

  // Try Supabase Auth token (Google OAuth)
  try {
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    let profile = null;

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, role, department_id, year, status')
      .eq('id', user.id)
      .single();

    if (!existingProfile) {
      // Profile doesn't exist yet (DB trigger race condition for brand-new Google users)
      // Create it on the fly so the first login succeeds
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          avatar_url: user.user_metadata?.avatar_url || null,
          google_id: user.user_metadata?.sub || null,
          college_form_completed: false,
          role: 'student',
          status: 'active',
        })
        .select('id, email, role, department_id, year, status')
        .single();

      if (createError) {
        // Profile might have been created between our check and insert — try one more read
        const { data: retryProfile } = await supabase
          .from('profiles')
          .select('id, email, role, department_id, year, status')
          .eq('id', user.id)
          .single();

        if (!retryProfile) return res.status(401).json({ error: 'Could not create user profile' });
        profile = retryProfile;
      } else {
        profile = newProfile;
      }
    } else {
      profile = existingProfile;
    }

    if (profile.status !== 'active') return res.status(403).json({ error: 'Account suspended' });

    req.user = profile as any;
    return next();
  } catch {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};
