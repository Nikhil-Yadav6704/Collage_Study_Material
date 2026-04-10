import { Router } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireModerator } from '../middleware/requireRole';
import { r2Service } from '../services/r2Service';
import { notificationService } from '../services/notificationService';
import { subjectService } from '../services/subjectService';
import { folderService } from '../services/folderService';

const router = Router();

// POST /api/upload-requests
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const {
    title, material_type, subject_id, department_id,
    semester, year_restriction, student_note,
    file_key, file_name, file_size_bytes, external_url
  } = req.body;

  if (!file_key && !external_url) {
    return res.status(400).json({ error: 'File or link required' });
  }

  const { data, error } = await supabase
    .from('upload_requests')
    .insert({
      submitted_by: req.user!.id,
      title, material_type, subject_id, department_id,
      semester, year_restriction, student_note,
      file_key: file_key || null,
      file_name: file_name || null,
      file_size_bytes: file_size_bytes || null,
      external_url: external_url || null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Notify department moderators
  const { data: mods } = await supabase
    .from('moderator_assignments')
    .select('user_id')
    .eq('department_id', department_id);

  for (const mod of mods || []) {
    await notificationService.create(
      mod.user_id,
      'new_student_request',
      'New upload request',
      `A student submitted "${title}" for review.`,
      { request_id: data.id }
    );
  }

  return res.status(201).json({ request: data });
});

// GET /api/upload-requests
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { status, page = '1', limit = '20' } = req.query;
  const user = req.user!;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  let query = supabase
    .from('upload_requests')
    .select(`
      *,
      submitter:profiles!submitted_by(id, full_name, roll_number, department_id),
      subject:subjects(name),
      reviewer:profiles!reviewed_by(id, full_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (user.role === 'student') {
    query = query.eq('submitted_by', user.id);
  } else if (user.role === 'moderator') {
    // Mods see requests for their department
    const { data: assignment } = await supabase
      .from('moderator_assignments').select('department_id').eq('user_id', user.id).single();
    if (assignment) query = query.eq('department_id', assignment.department_id);
  }

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query.range(offset, offset + parseInt(limit as string) - 1);
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ requests: data, total: count });
});

// PATCH /api/upload-requests/:id/review — mod/admin action
// Fix 4: Save correct enum value ('approved'/'rejected')
// Fix 9: DB insert BEFORE R2 move (transactional safety)
router.patch('/:id/review', requireAuth, requireModerator, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const {
    action, rejection_reason, review_note,
    title, subject_id, year_restriction, material_type
  } = req.body;

  const { data: request } = await supabase
    .from('upload_requests')
    .select('*')
    .eq('id', id)
    .eq('status', 'pending')
    .single();

  if (!request) return res.status(404).json({ error: 'Request not found or already reviewed' });

  if (req.user!.role === 'moderator') {
    const { data: assignment } = await supabase
      .from('moderator_assignments')
      .select('department_id')
      .eq('user_id', req.user!.id)
      .single();
    if (!assignment || assignment.department_id !== request.department_id) {
      return res.status(403).json({
        error: 'You can only review requests from your assigned department'
      });
    }
  }

  if (action === 'approve' || action === 'approve_with_edits') {
    let finalSubjectId = action === 'approve_with_edits' ? subject_id : request.subject_id;
    let finalFolderId: string | undefined;

    try {
      const subject = await subjectService.getOrCreateSubject(
        request.department_id,
        request.semester,
        finalSubjectId
      );
      finalSubjectId = subject.id;

      finalFolderId = await folderService.getOrCreateFolderHierarchy(
        request.department_id,
        request.semester,
        finalSubjectId,
        subject.name,
        action === 'approve_with_edits' ? material_type : request.material_type,
        req.user!.id
      );
    } catch (err) {
      console.error("Hierarchy generation failed:", err);
    }

    // Fix 9: STEP 1 — Create the material DB record FIRST (using temp file key)
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .insert({
        title: action === 'approve_with_edits' ? title : request.title,
        material_type: action === 'approve_with_edits' ? material_type : request.material_type,
        subject_id: finalSubjectId,
        department_id: request.department_id,
        semester: request.semester,
        folder_id: finalFolderId || null,
        year_restriction: action === 'approve_with_edits' ? year_restriction : request.year_restriction,
        file_key: request.file_key, // temp path for now
        file_name: request.file_name,
        file_size_bytes: request.file_size_bytes,
        external_url: request.external_url || null,
        uploaded_by: req.user!.id,
        is_from_request: true,
        source_request_id: request.id,
      })
      .select()
      .single();

    if (materialError) {
      return res.status(500).json({ error: `Failed to create material: ${materialError.message}` });
    }

    // Fix 9: STEP 2 — Move file in R2 ONLY after DB record exists
    let new_file_key = request.file_key;
    if (request.file_key?.startsWith('request-temp/')) {
      try {
        new_file_key = await r2Service.moveFile(request.file_key, 'materials');
        // Update material with final file key
        await supabase.from('materials')
          .update({ file_key: new_file_key })
          .eq('id', material.id);
      } catch (r2Error) {
        // R2 move failed — material record exists but points to temp path
        // Log for manual cleanup; don't fail the whole approval
        console.error('R2 move failed, material points to temp path:', r2Error);
      }
    }

    // Fix 4: STEP 3 — Update request with correct enum value 'approved' (not 'approve')
    await supabase.from('upload_requests').update({
      status: 'approved', // Fix 4: was incorrectly saving `action` ("approve"/"approve_with_edits")
      reviewed_by: req.user!.id,
      reviewed_at: new Date(),
      review_note: review_note || null,
      file_key: new_file_key,
      resulting_material_id: material.id,
    }).eq('id', id);

    // STEP 4: Notify student
    await notificationService.create(
      request.submitted_by,
      'upload_request_decision',
      'Upload request approved!',
      action === 'approve_with_edits'
        ? `Your request "${request.title}" was approved with some adjustments.`
        : `Your request "${request.title}" was approved and is now live!`,
      { request_id: id, material_id: material.id }
    );

    return res.json({ success: true, material });

  } else if (action === 'reject') {
    await supabase.from('upload_requests').update({
      status: 'rejected',
      reviewed_by: req.user!.id,
      reviewed_at: new Date(),
      rejection_reason: rejection_reason || null,
    }).eq('id', id);

    // Delete temp file if exists
    if (request.file_key?.startsWith('request-temp/')) {
      await r2Service.deleteFile(request.file_key);
    }

    // Notify student
    await notificationService.create(
      request.submitted_by,
      'upload_request_decision',
      'Upload request rejected',
      rejection_reason
        ? `Your request "${request.title}" was rejected. Reason: ${rejection_reason}`
        : `Your request "${request.title}" was not approved at this time.`,
      { request_id: id }
    );

    return res.json({ success: true });
  }

  return res.status(400).json({ error: 'Invalid action' });
});

export default router;
