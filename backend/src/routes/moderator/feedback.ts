import { Router } from 'express';
import { supabase } from '../../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { requireModerator } from '../../middleware/requireRole';

const router = Router();

// GET /api/moderator/feedback/overview — aggregate stats for dashboard
router.get('/overview', requireAuth, requireModerator, async (req: AuthenticatedRequest, res) => {
  const { data: assignment } = await supabase
    .from('moderator_assignments').select('department_id').eq('user_id', req.user!.id).single();
  if (!assignment) return res.status(403).json({ error: 'No assignment found' });

  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: avgRating },
    { count: totalComments },
    { count: newThisWeek },
    { count: flaggedCount },
  ] = await Promise.all([
    supabase.from('materials').select('average_rating').eq('department_id', assignment.department_id).eq('is_active', true),
    supabase.from('ratings').select('id', { count: 'exact', head: true })
      .in('material_id', (await supabase.from('materials').select('id').eq('department_id', assignment.department_id).then(r => r.data?.map(m => m.id) || []))),
    supabase.from('ratings').select('id', { count: 'exact', head: true })
      .gte('created_at', lastWeek)
      .in('material_id', (await supabase.from('materials').select('id').eq('department_id', assignment.department_id).then(r => r.data?.map(m => m.id) || []))),
    supabase.from('comment_reports').select('id', { count: 'exact', head: true }).eq('is_resolved', false),
  ]);

  const avg = avgRating && avgRating.length > 0 
    ? avgRating.reduce((s: number, m: any) => s + (m.average_rating || 0), 0) / avgRating.length 
    : 0;

  return res.json({
    avg_rating: avg || 0,
    total_comments: totalComments || 0,
    new_this_week: newThisWeek || 0,
    flagged_count: flaggedCount || 0,
  });
});

// GET /api/moderator/feedback/materials — list materials with their comments
router.get('/materials', requireAuth, requireModerator, async (req: AuthenticatedRequest, res) => {
  const { data: assignment } = await supabase
    .from('moderator_assignments').select('department_id').eq('user_id', req.user!.id).single();
  if (!assignment) return res.status(403).json({ error: 'No assignment' });

  const { data: materials, error } = await supabase
    .from('materials')
    .select(`
      id, title, material_type, average_rating, rating_count,
      subject:subjects(name)
    `)
    .eq('department_id', assignment.department_id)
    .eq('is_active', true)
    .order('rating_count', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // For each material, get its ratings/comments
  const materialsWithComments = await Promise.all((materials || []).map(async (m: any) => {
    const { data: ratings } = await supabase
      .from('ratings')
      .select('id, score, comment, created_at, user:profiles(full_name)')
      .eq('material_id', m.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const breakdown = [5, 4, 3, 2, 1].map(star => {
      const count = ratings?.filter(r => r.score === star).length || 0;
      return Math.round((count / (ratings?.length || 1)) * 100);
    });

    const { count: flaggedCount } = await supabase
      .from('comment_reports')
      .select('id', { count: 'exact', head: true })
      .in('rating_id', (ratings || []).map(r => r.id))
      .eq('is_resolved', false);

    return {
      ...m,
      comments: ratings || [],
      ratingsBreakdown: breakdown,
      flaggedCount: flaggedCount || 0,
    };
  }));

  return res.json({ materials: materialsWithComments });
});

export default router;
