import { Router } from 'express';
import { supabase } from '../../config/supabase';
import { requireAuth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/requireRole';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/analytics/overview
// Returns flat fields that AdminDashboard stat cards expect:
//   total_users, online_users, total_materials, pending_requests
// ─────────────────────────────────────────────────────────────────
router.get('/overview', requireAuth, requireAdmin, async (req, res) => {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const [
    { count: total_users },
    { count: online_users },
    { count: total_materials },
    { count: pending_upload_requests },
    { count: pending_mod_requests },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .gte('last_active_at', fifteenMinutesAgo),
    supabase.from('materials').select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase.from('upload_requests').select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('moderator_requests').select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  return res.json({
    total_users: total_users || 0,
    online_users: online_users || 0,
    total_materials: total_materials || 0,
    // Combined count so dashboard's "Awaiting Review" card makes sense
    pending_requests: (pending_upload_requests || 0) + (pending_mod_requests || 0),
    // Breakdown useful for Request Center badge
    pending_upload_requests: pending_upload_requests || 0,
    pending_mod_requests: pending_mod_requests || 0,
  });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/analytics/materials-by-department
// Returns [{ department: "CSE", material_count: 120 }, ...]
// ─────────────────────────────────────────────────────────────────
router.get('/materials-by-department', requireAuth, requireAdmin, async (req, res) => {
  // Aggregate via a direct query since v_materials_per_department may not exist
  const { data, error } = await supabase
    .from('materials')
    .select('department:departments(short_name)')
    .eq('is_active', true);

  if (error) return res.status(500).json({ error: error.message });

  // Count per department
  const counts: Record<string, number> = {};
  (data || []).forEach((m: any) => {
    const dept = m.department?.short_name || 'Unknown';
    counts[dept] = (counts[dept] || 0) + 1;
  });

  const result = Object.entries(counts)
    .map(([department, material_count]) => ({ department, material_count }))
    .sort((a, b) => b.material_count - a.material_count);

  return res.json({ data: result });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/analytics/daily-active-users
// Returns last 30 days of activity as [{ day: "2024-...", active_users: N }]
// ─────────────────────────────────────────────────────────────────
router.get('/daily-active-users', requireAuth, requireAdmin, async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('activity_logs')
    .select('user_id, created_at')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  // Group by day and count unique users
  const dayMap: Record<string, Set<string>> = {};
  (data || []).forEach((log: any) => {
    const day = new Date(log.created_at).toISOString().split('T')[0];
    if (!dayMap[day]) dayMap[day] = new Set();
    if (log.user_id) dayMap[day].add(log.user_id);
  });

  const result = Object.entries(dayMap)
    .map(([day, users]) => ({ day, active_users: users.size }))
    .sort((a, b) => a.day.localeCompare(b.day));

  return res.json({ data: result });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/analytics/top-rated-materials
// Returns top 10 materials by average rating
// ─────────────────────────────────────────────────────────────────
router.get('/top-rated-materials', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('materials')
    .select(`
      id, title, material_type, download_count, average_rating, rating_count,
      department:departments(short_name, name)
    `)
    .eq('is_active', true)
    .gte('rating_count', 1)
    .order('average_rating', { ascending: false })
    .limit(10);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data: data || [] });
});

export default router;
