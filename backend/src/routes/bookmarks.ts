import { Router } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/bookmarks
// List user's bookmarks with material details
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      id, created_at,
      material:materials(
        id, title, material_type, file_name, external_url, url_domain,
        subject:subjects(name)
      )
    `)
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ bookmarks: data });
});

// POST /api/bookmarks
// Toggle bookmark for a material
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { material_id } = req.body;
  if (!material_id) return res.status(400).json({ error: 'Material ID required' });

  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', req.user!.id)
    .eq('material_id', material_id)
    .single();

  if (existing) {
    // Already bookmarked -> remove
    await supabase.from('bookmarks').delete().eq('id', existing.id);
    return res.json({ success: true, action: 'removed' });
  } else {
    // Not bookmarked -> add
    await supabase.from('bookmarks').insert({
      user_id: req.user!.id,
      material_id: material_id,
    });
    return res.json({ success: true, action: 'added' });
  }
});

export default router;
