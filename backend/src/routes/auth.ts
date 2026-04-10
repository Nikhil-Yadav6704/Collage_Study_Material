import { Router } from 'express';
import { supabase } from '../config/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/complete-signup
const completeSignupSchema = z.object({
  full_name: z.string().min(2).max(100),
  department_id: z.string().uuid(),
  admission_year: z.coerce.number().int().min(2015).max(new Date().getFullYear()),
  roll_number: z.string().min(3).max(20),
  password: z.string().min(8).max(72),
});

router.post('/complete-signup', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = completeSignupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { full_name, department_id, admission_year, roll_number, password } = parsed.data;

  // Compute current academic year (1-4)
  const currentCalendarYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed
  // Academic year starts in July (month >= 6)
  const academicYearStart = currentMonth >= 6 ? currentCalendarYear : currentCalendarYear - 1;
  const yearsElapsed = academicYearStart - admission_year;
  const computed_year = Math.min(Math.max(yearsElapsed + 1, 1), 4).toString();

  const { data: profile } = await supabase
    .from('profiles')
    .select('college_form_completed')
    .eq('id', req.user!.id)
    .single();

  if (profile?.college_form_completed) {
    return res.status(400).json({ error: 'College form already completed' });
  }

  const { data: format } = await supabase
    .from('roll_number_formats')
    .select('regex_pattern, example')
    .eq('department_id', department_id)
    .eq('year', computed_year) // use computed year for format validation
    .single();

  if (format) {
    const regex = new RegExp(format.regex_pattern, 'i');
    if (!regex.test(roll_number)) {
      return res.status(400).json({
        error: `Invalid roll number format. Expected format: ${format.example}`,
        example: format.example,
      });
    }
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('roll_number', roll_number)
    .single();

  if (existing) {
    return res.status(400).json({ error: 'Roll number already registered' });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name,
      department_id,
      year: computed_year,
      admission_year: admission_year,
      roll_number,
      password_hash,
      college_form_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.user!.id);

  if (error) return res.status(500).json({ error: 'Failed to complete signup' });

  await supabase.from('activity_logs').insert({
    user_id: req.user!.id,
    action: 'signup_completed',
    entity_type: 'profile',
    entity_id: req.user!.id,
  });

  return res.json({ success: true, message: 'Profile completed' });
});

// POST /api/auth/signin-roll-number
const rollSigninSchema = z.object({
  roll_number: z.string().min(3).max(20),
  password: z.string().min(1),
});

router.post('/signin-roll-number', async (req, res) => {
  const parsed = rollSigninSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { roll_number, password } = parsed.data;
  const ip = req.ip;

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id, email, role, department_id, year, status,
      password_hash, full_name, college_form_completed,
      roll_number, avatar_url, created_at, last_active_at,
      department:departments(id, name, short_name)
    `)
    .eq('roll_number', roll_number)
    .single();

  if (!profile || !profile.password_hash) {
    await supabase.from('login_logs').insert({
      method: 'roll_number', ip_address: ip, success: false,
    });
    return res.status(401).json({ error: 'Invalid roll number or password' });
  }

  const passwordMatch = await bcrypt.compare(password, profile.password_hash);

  await supabase.from('login_logs').insert({
    user_id: profile.id,
    method: 'roll_number',
    ip_address: ip,
    success: passwordMatch,
  });

  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid roll number or password' });
  }

  if (profile.status !== 'active') {
    return res.status(403).json({ error: `Account ${profile.status}` });
  }

  const token = jwt.sign(
    { userId: profile.id, type: 'roll_number_session' },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
  );

  await supabase.from('profiles').update({ last_active_at: new Date() }).eq('id', profile.id);

  return res.json({
    token,
    user: {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      department_id: profile.department_id,
      year: profile.year,
      college_form_completed: profile.college_form_completed,
      roll_number: profile.roll_number,
      status: profile.status,
      avatar_url: profile.avatar_url || null,
      created_at: profile.created_at,
      last_active_at: profile.last_active_at || null,
      department: profile.department || null,
    },
  });
});

// POST /api/auth/admin-signin
router.post('/admin-signin', async (req, res) => {
  const parsed = rollSigninSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { roll_number, password } = parsed.data;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, role, status, password_hash, full_name, roll_number, created_at, avatar_url')
    .eq('roll_number', roll_number)
    .single();

  if (!profile || profile.role !== 'admin') {
    await supabase.from('login_logs').insert({
      method: 'roll_number', ip_address: req.ip, success: false,
    });
    return res.status(401).json({ error: 'Unauthorized — admin credentials required' });
  }

  const passwordMatch = await bcrypt.compare(password, profile.password_hash!);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: profile.id, type: 'roll_number_session' },
    process.env.JWT_SECRET!,
    { expiresIn: '12h' }
  );

  await supabase.from('login_logs').insert({
    user_id: profile.id, method: 'roll_number', ip_address: req.ip, success: true,
  });

  return res.json({
    token,
    user: {
      id: profile.id,
      email: profile.email,
      role: 'admin',
      full_name: profile.full_name,
      roll_number: profile.roll_number,
      status: profile.status,
      avatar_url: profile.avatar_url || null,
      created_at: profile.created_at,
      last_active_at: null,
      department_id: null,
      year: null,
      college_form_completed: true,
      department: null,
    }
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id, full_name, email, roll_number, year, role, status, avatar_url,
      admission_year, department_id,
      college_form_completed, created_at, last_active_at,
      department:departments(id, name, short_name)
    `)
    .eq('id', req.user!.id)
    .single();

  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  await supabase.from('profiles')
    .update({ last_active_at: new Date() })
    .eq('id', req.user!.id);

  return res.json({ user: profile });
});

// PATCH /api/auth/change-password
const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8).max(72),
});

router.patch('/change-password', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { current_password, new_password } = parsed.data;

  const { data: profile } = await supabase
    .from('profiles')
    .select('password_hash')
    .eq('id', req.user!.id)
    .single();

  if (!profile?.password_hash) return res.status(400).json({ error: 'No password set' });

  const match = await bcrypt.compare(current_password, profile.password_hash);
  if (!match) return res.status(400).json({ error: 'Current password is incorrect' });

  const new_hash = await bcrypt.hash(new_password, 12);
  await supabase.from('profiles')
    .update({ password_hash: new_hash })
    .eq('id', req.user!.id);

  return res.json({ success: true });
});

// GET /api/auth/roll-number-format
router.get('/roll-number-format', async (req, res) => {
  const { department_id, year } = req.query;
  if (!department_id || !year) return res.status(400).json({ error: 'Missing params' });

  // ADD: compute academic year if a calendar year was passed
  let lookupYear = year as string;
  const yearNum = parseInt(lookupYear);
  if (yearNum > 10) {
    // It's a calendar year (e.g. 2023) — compute academic year (1-4)
    const now = new Date();
    const academicStart = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    const elapsed = academicStart - yearNum;
    lookupYear = String(Math.min(Math.max(elapsed + 1, 1), 4));
  }

  const { data } = await supabase
    .from('roll_number_formats')
    .select('regex_pattern, example')
    .eq('department_id', department_id)
    .eq('year', lookupYear)
    .single();

  return res.json({ format: data || null });
});

// POST /api/auth/logout
// Clears last_active_at so the user drops off the "online" count immediately
router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res) => {
  await supabase
    .from('profiles')
    .update({ last_active_at: null })
    .eq('id', req.user!.id);

  return res.json({ success: true });
});

export default router;
