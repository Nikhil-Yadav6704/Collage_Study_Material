import { Router } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireModerator, requireAdmin } from '../middleware/requireRole';

const router = Router();

// GET /api/folders — get folder tree (filtered by user role)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;

  let query = supabase
    .from('folders')
    .select(`
      id, name, parent_id, department_id, semester, subject_id,
      folder_type, type_key, created_at,
      department:departments(id, name, short_name),
      subject:subjects(id, name)
    `)
    .order('name');

  // Students see only their department
  if (user.role === 'student' && user.department_id) {
    query = query.eq('department_id', user.department_id);
  }
  // Moderators see only their assigned department
  else if (user.role === 'moderator') {
    const { data: assignment } = await supabase
      .from('moderator_assignments')
      .select('department_id')
      .eq('user_id', user.id)
      .single();
    if (assignment) query = query.eq('department_id', assignment.department_id);
  }
  // Admins see everything

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ folders: data });
});

// Fix 8: POST /api/folders — moderators can create in their dept, admins create anywhere
router.post('/', requireAuth, requireModerator, async (req: AuthenticatedRequest, res) => {
  const { name, parent_id, department_id, semester, subject_id, folder_type, type_key } = req.body;
  const user = req.user!;

  // Moderators can only create in their assigned department
  if (user.role === 'moderator') {
    const { data: assignment } = await supabase
      .from('moderator_assignments')
      .select('department_id')
      .eq('user_id', user.id)
      .single();
    if (!assignment || assignment.department_id !== department_id) {
      return res.status(403).json({ error: 'You can only create folders in your assigned department' });
    }
  }

  const { data, error } = await supabase
    .from('folders')
    .insert({
      name, parent_id: parent_id || null,
      department_id: department_id || null,
      semester: semester || null,
      subject_id: subject_id || null,
      folder_type: folder_type || 'generic',
      type_key: type_key || null,
      created_by: req.user!.id,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ folder: data });
});

// Fix 8: PATCH /api/folders/:id — moderators can rename folders in their dept
router.patch('/:id', requireAuth, requireModerator, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const user = req.user!;

  // Verify moderator owns this folder's department
  if (user.role === 'moderator') {
    const { data: folder } = await supabase
      .from('folders').select('department_id').eq('id', id).single();
    const { data: assignment } = await supabase
      .from('moderator_assignments').select('department_id').eq('user_id', user.id).single();
    if (!assignment || folder?.department_id !== assignment.department_id) {
      return res.status(403).json({ error: 'Cannot modify folders outside your department' });
    }
  }

  const { error } = await supabase
    .from('folders').update({ name, updated_at: new Date() }).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

// Fix 8: DELETE /api/folders/:id — same dept check for moderators
router.delete('/:id', requireAuth, requireModerator, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const user = req.user!;

  if (user.role === 'moderator') {
    const { data: folder } = await supabase
      .from('folders').select('department_id').eq('id', id).single();
    const { data: assignment } = await supabase
      .from('moderator_assignments').select('department_id').eq('user_id', user.id).single();
    if (!assignment || folder?.department_id !== assignment.department_id) {
      return res.status(403).json({ error: 'Cannot delete folders outside your department' });
    }
  }

  await supabase.from('folders').delete().eq('id', id);
  return res.json({ success: true });
});

// PATCH /api/folders/:id/tags — update tags on a folder (admin only)
router.patch('/:id/tags', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { tags } = req.body as { tags: string[] };

  if (!Array.isArray(tags)) return res.status(400).json({ error: 'tags must be array' });

  const { error } = await supabase
    .from('folders')
    .update({ tags: tags.map(t => t.toLowerCase().trim()), updated_at: new Date() })
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

export default router;
