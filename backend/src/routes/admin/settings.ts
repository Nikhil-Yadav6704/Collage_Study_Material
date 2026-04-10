import { Router } from 'express';
import { supabase } from '../../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/requireRole';

const router = Router();

// GET /api/admin/settings/system
// Fetch global system settings (mock for now, usually in DB)
router.get('/system', requireAuth, requireAdmin, async (req, res) => {
  return res.json({
    settings: {
      maintenance: false,
      allow_signups: true,
      max_upload_size_mb: 50,
      banner_notice: null
    }
  });
});

// Fix 11B: POST /api/admin/settings/trigger-year-upgrade
// Advance all active students by one year based on admission_year
router.post('/trigger-year-upgrade', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  // Academic year starts in July (month index 6)
  const academicYearStart = currentMonth >= 6 ? currentYear : currentYear - 1;

  const { data: students } = await supabase
    .from('profiles')
    .select('id, admission_year')
    .eq('role', 'student')
    .not('admission_year', 'is', null);

  if (!students || students.length === 0) {
    return res.json({ success: true, updated: 0, message: 'No students with admission_year found' });
  }

  let updatedCount = 0;
  const updates = (students || []).map(async (student: any) => {
    const yearsElapsed = academicYearStart - student.admission_year;
    const newYear = Math.min(Math.max(yearsElapsed + 1, 1), 4).toString();
    const { error } = await supabase.from('profiles').update({ year: newYear }).eq('id', student.id);
    if (!error) updatedCount++;
  });

  await Promise.all(updates);

  await supabase.from('activity_logs').insert({
    user_id: req.user!.id,
    action: 'year_upgrade_triggered',
    entity_type: 'system',
    entity_id: null,
    metadata: { triggered_by: req.user!.id, academic_year_start: academicYearStart, students_updated: updatedCount },
  });

  return res.json({ success: true, updated: updatedCount });
});

export default router;
