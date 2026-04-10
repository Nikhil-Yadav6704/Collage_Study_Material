import { Router } from 'express';
import { supabase } from '../../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { requireModerator } from '../../middleware/requireRole';

const router = Router();

// GET /api/moderator/colleagues — list other mods in the same dept
router.get('/', requireAuth, requireModerator, async (req: AuthenticatedRequest, res) => {
  const { data: assignment } = await supabase
    .from('moderator_assignments').select('department_id').eq('user_id', req.user!.id).single();
  if (!assignment) return res.status(403).json({ error: 'No assignment found' });

  const { data, error } = await supabase
    .from('moderator_assignments')
    .select(`
      id, created_at,
      user:profiles(id, full_name, roll_number, email)
    `)
    .eq('department_id', assignment.department_id);

  if (error) return res.status(500).json({ error: error.message });

  // Add stats to each mod (mocking for now unless real tables exist)
  const modsWithStats = (data || []).map((m: any) => {
    const profile = Array.isArray(m.user) ? m.user[0] : m.user;
    return {
      ...m,
      is_you: profile?.id === req.user!.id,
      user: profile,
      stats: { uploads: 0, reviews: 0, guidelines: 0 } 
    };
  });


  return res.json({ moderators: modsWithStats });
});

export default router;
