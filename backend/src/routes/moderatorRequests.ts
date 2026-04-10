import { Router } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireRole';
import { notificationService } from '../services/notificationService';

const router = Router();

// POST /api/moderator-requests
// Submit a moderator application
// Fix 6B: Removed linked_in_url — column doesn't exist in schema
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { reason, department_id } = req.body;
  const user = req.user!;

  // Only students can apply
  if (user.role !== 'student') {
    return res.status(400).json({ error: 'Only students can apply to be moderators' });
  }

  const { data, error } = await supabase
    .from('moderator_requests')
    .insert({
      user_id: user.id,
      department_id: department_id || user.department_id,
      reason,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.status(201).json({ request: data });
});

// GET /api/moderator-requests
// List applications (Admins see all, students see their own)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { status } = req.query;

  let query = supabase
    .from('moderator_requests')
    .select(`
      *,
      user:profiles!user_id(id, full_name, roll_number, email),
      department:departments(name)
    `)
    .order('created_at', { ascending: false });

  if (user.role === 'student') {
    query = query.eq('user_id', user.id);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ requests: data });
});

// PATCH /api/moderator-requests/:id/review — Admin decision
// Fix 6A: admin_note → admin_message (matches DB migration)
router.patch('/:id/review', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, admin_message } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  // Get the request details
  const { data: request } = await supabase
    .from('moderator_requests')
    .select('user_id, department_id')
    .eq('id', id)
    .single();

  if (!request) return res.status(404).json({ error: 'Request not found' });

  // Update the request
  const { error } = await supabase
    .from('moderator_requests')
    .update({
      status,
      reviewed_by: req.user!.id,
      reviewed_at: new Date(),
      admin_message,
    })
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });

  // If approved, promote user and assign department
  if (status === 'approved') {
    // 1. Update user role
    await supabase.from('profiles').update({ role: 'moderator' }).eq('id', request.user_id);

    // 2. Assign to department
    await supabase.from('moderator_assignments').insert({
      user_id: request.user_id,
      department_id: request.department_id,
      assigned_by: req.user!.id,
    });

    // 3. Notify student
    await notificationService.create(
      request.user_id,
      'moderator_added',
      'Congratulations!',
      'Your moderator application has been approved. You now have moderator privileges for your department.',
      { request_id: id }
    );
  } else {
    // Notify student of rejection
    await notificationService.create(
      request.user_id,
      'moderator_request_decision',
      'Moderator Application Update',
      admin_message || 'Your application was not approved at this time.',
      { request_id: id }
    );
  }

  return res.json({ success: true });
});

export default router;
