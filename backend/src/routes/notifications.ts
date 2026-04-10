import { Router } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications
// Retrieves latest notifications for the current user
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });

  const unread_count = (data || []).filter((n) => !n.is_read).length;

  return res.json({ notifications: data, unread_count });
});

// PATCH /api/notifications/:id/read
// Mark a specific notification as read
router.patch('/:id/read', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  // FIXED: was 'read_at: new Date()' — correct field is 'is_read: true'
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', req.user!.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

// PATCH /api/notifications/mark-all-read
// Mark all notifications for the user as read
router.patch('/mark-all-read', requireAuth, async (req: AuthenticatedRequest, res) => {
  // FIXED: was 'read_at: new Date()' and '.is("read_at", null)'
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', req.user!.id)
    .eq('is_read', false);  // only update unread ones

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

// POST /api/notifications/request-profile-correction
// Students and moderators can request admin to fix their locked fields
router.post('/request-profile-correction', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { note } = req.body as { note: string };
  const userId = req.user!.id;
  const userEmail = req.user!.email;

  if (!note?.trim()) return res.status(400).json({ error: 'Please describe the correction needed.' });

  // Fetch full profile for display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, roll_number')
    .eq('id', userId)
    .single();

  const displayName = profile?.full_name || userEmail;
  const rollNum = profile?.roll_number || 'no roll#';

  // Notify all admins
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  const notifyAll = (admins || []).map(admin =>
    supabase.from('notifications').insert({
      user_id: admin.id,
      type: 'system_alert',
      title: 'Profile Correction Request',
      message: `${displayName} (${rollNum}) needs a correction: "${note.trim()}"`,
      metadata: { user_id: userId, user_email: userEmail },
    })
  );
  await Promise.all(notifyAll);

  return res.json({ success: true });
});

export default router;
