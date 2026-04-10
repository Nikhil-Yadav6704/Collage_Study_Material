import { Router } from 'express';
import { supabase } from '../../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/requireRole';

const router = Router();

// GET /api/admin/tags
// Sub-library for aliases and subject mappings
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const { search } = req.query;

  let query = supabase
    .from('subject_aliases')
    .select('*, subject:subjects(name)')
    .order('alias');

  if (search) {
    query = query.ilike('alias', `%${search}%`);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ tags: data });
});

// DELETE /api/admin/tags/:id
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('subject_aliases')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

export default router;
