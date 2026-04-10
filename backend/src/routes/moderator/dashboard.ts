import { Router } from 'express';
import { supabase } from '../../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { requireModerator } from '../../middleware/requireRole';

const router = Router();

// GET /api/moderator/dashboard/stats
// Quick stats for the moderator dashboard scoped to their department
router.get('/stats', requireAuth, requireModerator, async (req: AuthenticatedRequest, res) => {
  // Get the moderator's department assignment
  const { data: assignment } = await supabase
    .from('moderator_assignments').select('department_id').eq('user_id', req.user!.id).single();

  if (!assignment) {
    return res.status(403).json({ error: 'No department assignment found for this moderator' });
  }

  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  const [
    { count: totalMaterials },
    { count: pendingRequests },
    { count: newThisWeek },
    { count: myUploads },
    { data: subjectsInDept },
    { data: recentUploads }
  ] = await Promise.all([
    supabase.from('materials').select('*', { count: 'exact', head: true }).eq('department_id', assignment.department_id).eq('is_active', true),
    supabase.from('upload_requests').select('*', { count: 'exact', head: true }).eq('department_id', assignment.department_id).eq('status', 'pending'),
    supabase.from('materials').select('*', { count: 'exact', head: true }).eq('department_id', assignment.department_id).gte('created_at', lastWeek.toISOString()),
    supabase.from('materials').select('*', { count: 'exact', head: true }).eq('uploader_id', req.user!.id),
    supabase.from('subjects').select('id').eq('department_id', assignment.department_id),
    supabase.from('materials').select('id, title, created_at').eq('department_id', assignment.department_id).order('created_at', { ascending: false }).limit(5)
  ]);

  // Missing guidelines: subjects in dept with no published guideline
  const subjectIds = subjectsInDept?.map(s => s.id) || [];
  let guidelinesCount = 0;
  if (subjectIds.length > 0) {
    const { count } = await supabase.from('study_guidelines').select('*', { count: 'exact', head: true }).in('subject_id', subjectIds);
    guidelinesCount = count || 0;
  }

  // Flagged feedback: unresolved comment_reports in this dept (via material join)
  const { count: flaggedCount } = await supabase
    .from('comment_reports')
    .select('id, materials!inner(department_id)', { count: 'exact', head: true })
    .eq('status', 'pending')
    .eq('materials.department_id', assignment.department_id);

  return res.json({
    materials_count: totalMaterials || 0,
    pending_count: pendingRequests || 0,
    new_this_week: newThisWeek || 0,
    flagged_feedback: flaggedCount || 0,
    missing_guidelines: Math.max(0, subjectIds.length - guidelinesCount),
    my_uploads: myUploads || 0,
    recent_uploads: recentUploads || [],
  });
});

// GET /api/moderator/dashboard/pending-count
// Returns pending upload request count for this moderator's assigned department.
// Uses requireModerator — safe for moderators, never returns 401 to cause auto-logout.
router.get('/pending-count', requireAuth, requireModerator, async (req: AuthenticatedRequest, res) => {
  const { data: assignment } = await supabase
    .from('moderator_assignments')
    .select('department_id')
    .eq('user_id', req.user!.id)
    .single();

  if (!assignment) return res.json({ count: 0 });

  const { count, error } = await supabase
    .from('upload_requests')
    .select('*', { count: 'exact', head: true })
    .eq('department_id', assignment.department_id)
    .eq('status', 'pending');

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ count: count || 0 });
});

export default router;
