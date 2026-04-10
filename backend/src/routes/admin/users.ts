import { Router } from 'express';
import { supabase } from '../../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/requireRole';

const router = Router();

// GET /api/admin/users
// Retrieves all profiles with search, filter, and pagination
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const { search, role, status, page = '1', limit = '20' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  let query = supabase
    .from('profiles')
    .select('*, department:departments(name)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (role) query = query.eq('role', role);
  if (status) query = query.eq('status', status);
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,roll_number.ilike.%${search}%`);
  }

  const { data, error, count } = await query.range(offset, offset + parseInt(limit as string) - 1);
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ users: data, total: count });
});

// PATCH /api/admin/users/:id/status — update status only
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['active', 'suspended', 'banned'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

// PATCH /api/admin/users/:id/role — update role only
router.patch('/:id/role', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { role, department_id } = req.body;

  if (!['student', 'moderator', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  // Prevent admins from demoting themselves
  if (id === req.user!.id && role !== 'admin') {
    return res.status(400).json({ error: 'You cannot change your own role' });
  }

  await supabase.from('profiles').update({ role }).eq('id', id);

  if (role === 'moderator' && department_id) {
    // Assign to department if promoting to moderator
    await supabase.from('moderator_assignments').upsert({
      user_id: id,
      department_id,
      assigned_by: req.user!.id,
    });
  } else if (role === 'student') {
    // Remove all moderator assignments if demoting
    await supabase.from('moderator_assignments').delete().eq('user_id', id);
  }

  return res.json({ success: true });
});

// PATCH /api/admin/users/:id/year — manually override a student's academic year
// Allows admins to handle students with backlogs, gap years, or repeat years
router.patch('/:id/year', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { year } = req.body as { year: string };

  if (!['1', '2', '3', '4'].includes(year)) {
    return res.status(400).json({ error: 'Year must be 1, 2, 3, or 4' });
  }

  const { error } = await supabase
    .from('profiles')
    .update({ year, updated_at: new Date() })
    .eq('id', id)
    .eq('role', 'student'); // Only allow year override for students

  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('activity_logs').insert({
    user_id: req.user!.id,
    action: 'admin_year_override',
    entity_type: 'profile',
    entity_id: id,
    metadata: { new_year: year, overridden_by: req.user!.id },
  });

  return res.json({ success: true });
});

export default router;

