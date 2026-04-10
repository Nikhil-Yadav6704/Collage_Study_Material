import { Router } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// POST /api/ratings
// Add or update rating for a material
const ratingSchema = z.object({
  material_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(300).optional(),
});

router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = ratingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { material_id, rating, comment } = parsed.data;

  const { data, error } = await supabase
    .from('ratings')
    .upsert({
      user_id: req.user!.id,
      material_id,
      rating,
      comment: comment || null,
      updated_at: new Date(),
    }, { onConflict: 'user_id,material_id' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: req.user!.id,
    action: 'rate_material',
    entity_type: 'material',
    entity_id: material_id,
    metadata: { rating },
  });

  return res.json({ rating: data });
});

// GET /api/ratings/material/:id
// Get all ratings for a specific material
router.get('/material/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('ratings')
    .select(`
      id, rating, comment, created_at,
      user:profiles(id, full_name, avatar_url)
    `)
    .eq('material_id', id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ratings: data });
});

export default router;
