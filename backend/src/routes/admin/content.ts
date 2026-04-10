import { Router } from 'express';
import { supabase } from '../../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/requireRole';

const router = Router();

// GET /api/admin/content
// List all materials with status/type/dept/folder filters
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const { status, type, department_id, folder_id, search, page = '1', limit = '50' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  let query = supabase
    .from('materials')
    .select('*, department:departments(name, short_name), subject:subjects(name)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status === 'active') query = query.eq('is_active', true);
  if (status === 'deleted') query = query.eq('is_active', false);
  if (type) query = query.eq('material_type', type);
  if (department_id) query = query.eq('department_id', department_id);
  if (folder_id) query = query.eq('folder_id', folder_id);
  if (search) query = query.ilike('title', `%${search}%`);

  const { data, error, count } = await query.range(offset, offset + parseInt(limit as string) - 1);
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ content: data, total: count });
});


// PATCH /api/admin/content/:id
// Manually update material metadata or status
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const { error } = await supabase
    .from('materials')
    .update(updateData)
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

export default router;
