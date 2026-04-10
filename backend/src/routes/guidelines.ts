import { Router } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireModerator } from '../middleware/requireRole';

const router = Router();

// GET /api/guidelines — get all guidelines filtered by department/semester
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { department_id, semester } = req.query;
  const user = req.user!;

  let query = supabase
    .from('study_guidelines')
    .select('*')
    .order('updated_at', { ascending: false });

  if (department_id) {
    query = query.eq('department_id', department_id);
  } else if (user.role === 'student' && user.department_id) {
    query = query.eq('department_id', user.department_id);
  }

  if (semester) {
    query = query.eq('semester', semester);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ guidelines: data });
});

// GET /api/guidelines/:subject_id — get guideline for a specific subject
router.get('/:subject_id', requireAuth, async (req, res) => {
  const { subject_id } = req.params;
  const { data, error } = await supabase
    .from('study_guidelines')
    .select('*')
    .eq('subject_id', subject_id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
    return res.status(500).json({ error: error.message });
  }

  return res.json({ guideline: data || null });
});

// POST /api/guidelines — create or update guideline
router.post('/', requireAuth, requireModerator, async (req: AuthenticatedRequest, res) => {
  const { subject_id, content, status } = req.body;
  const user = req.user!;

  // Get the subject's department
  const { data: subject } = await supabase
    .from('subjects').select('department_id').eq('id', subject_id).single();
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  // Moderators can only write guidelines for their assigned department
  if (user.role === 'moderator') {
    const { data: assignment } = await supabase
      .from('moderator_assignments').select('department_id').eq('user_id', user.id).single();
    if (!assignment || assignment.department_id !== subject.department_id) {
      return res.status(403).json({ error: 'You can only write guidelines for your assigned department' });
    }
  }

  const { data: existing } = await supabase
    .from('study_guidelines').select('id').eq('subject_id', subject_id).single();

  if (existing) {
    const { error } = await supabase.from('study_guidelines')
      .update({ content, status, last_edited_by: user.id, updated_at: new Date() })
      .eq('id', existing.id);
    if (error) return res.status(500).json({ error: error.message });
  } else {
    const { error } = await supabase.from('study_guidelines').insert({
      subject_id, content, status,
      department_id: subject.department_id,
      written_by: user.id,
    });
    if (error) return res.status(500).json({ error: error.message });
  }
  return res.json({ success: true });
});

// PATCH /api/guidelines/:subject_id/publish — toggle draft/published
router.patch('/:subject_id/publish', requireAuth, requireModerator, async (req: AuthenticatedRequest, res) => {
  const { subject_id } = req.params;
  const { publish } = req.body;
  const user = req.user!;

  // Dept ownership check for moderators
  if (user.role === 'moderator') {
    const { data: subject } = await supabase
      .from('subjects').select('department_id').eq('id', subject_id).single();
    const { data: assignment } = await supabase
      .from('moderator_assignments').select('department_id').eq('user_id', user.id).single();
    if (!assignment || subject?.department_id !== assignment.department_id) {
      return res.status(403).json({ error: 'Cannot publish guidelines outside your department' });
    }
  }

  const newStatus = publish ? 'published' : 'draft';
  const { error } = await supabase.from('study_guidelines')
    .update({
      status: newStatus,
      updated_at: new Date(),
      published_at: publish ? new Date() : null,
    })
    .eq('subject_id', subject_id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

export default router;
