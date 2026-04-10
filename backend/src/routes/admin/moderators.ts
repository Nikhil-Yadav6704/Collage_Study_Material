import { Router } from 'express';
import { supabase } from '../../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/requireRole';

const router = Router();

// GET /api/admin/moderators
// List all moderator assignments across all departments
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('moderator_assignments')
    .select(`
      id, assigned_at,
      user:profiles!user_id(id, full_name, email, roll_number),
      department:departments(id, name),
      assigner:profiles!assigned_by(full_name)
    `)
    .order('assigned_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ moderators: data });
});

// POST /api/admin/moderators/assign
// Manually assign a user to a department as a moderator
router.post('/assign', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  const { user_id, department_id } = req.body;

  const { error } = await supabase.from('moderator_assignments').upsert({
    user_id,
    department_id,
    assigned_by: req.user!.id,
    updated_at: new Date(),
  });

  if (error) return res.status(500).json({ error: error.message });

  // Ensure user has moderator role
  await supabase.from('profiles').update({ role: 'moderator' }).eq('id', user_id);

  return res.json({ success: true });
});

// DELETE /api/admin/moderators/:id
// Remove moderator assignment
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const { data: assignment } = await supabase
    .from('moderator_assignments')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  await supabase.from('moderator_assignments').delete().eq('id', id);

  // Check if user has any other assignments, if not, demote to student
  const { data: remaining } = await supabase
    .from('moderator_assignments')
    .select('id')
    .eq('user_id', assignment.user_id);

  if (!remaining || remaining.length === 0) {
    await supabase.from('profiles').update({ role: 'student' }).eq('id', assignment.user_id);
  }

  return res.json({ success: true });
});

export default router;
