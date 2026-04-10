import { Router } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { r2Service } from '../services/r2Service';

const router = Router();

// GET /api/materials
// List materials for current user (scoped by dept + year)
// Query params: type, semester, subject_id, search, sort, page, limit
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const {
    type, semester, subject_id, search, folder_id,
    sort = 'newest', page = '1', limit = '24'
  } = req.query;

  const pageNum = parseInt(page as string) || 1;
  const limitNum = Math.min(parseInt(limit as string) || 24, 100);
  const offset = (pageNum - 1) * limitNum;

  const user = req.user!;
  let query = supabase
    .from('materials')
    .select(`
      id, title, description, material_type, semester, year_restriction,
      file_key, file_name, file_size_bytes, external_url, url_domain,
      folder_id,
      download_count, average_rating, rating_count, is_from_request,
      created_at, uploaded_by,
      subject:subjects(id, name),
      department:departments(id, short_name, name),
      uploader:profiles!uploaded_by(id, full_name),
      folder:folders(id, name)
    `, { count: 'exact' })
    .eq('is_active', true);

  // Scope: students see only their dept, moderators see all in dept
  if (user.role === 'student') {
    query = query.eq('department_id', user.department_id!);
    // Students can access materials from all years in their department
  } else if (user.role === 'moderator') {
    // Get moderator's assigned dept
    const { data: assignment } = await supabase
      .from('moderator_assignments')
      .select('department_id')
      .eq('user_id', user.id)
      .single();
    if (assignment) query = query.eq('department_id', assignment.department_id);
  }
  // Admins: no scope restriction

  if (type) query = query.eq('material_type', type);
  if (semester) query = query.eq('semester', semester);
  if (subject_id) query = query.eq('subject_id', subject_id);
  if (folder_id) query = query.eq('folder_id', folder_id as string);

  // Smart search using full-text search vector
  if (search) {
    query = query.textSearch('search_vector', search as string, {
      type: 'websearch',
      config: 'english',
    });
  }

  // Sort
  if (sort === 'newest') query = query.order('created_at', { ascending: false });
  else if (sort === 'top_rated') query = query.order('average_rating', { ascending: false });
  else if (sort === 'most_downloaded') query = query.order('download_count', { ascending: false });

  const { data, error, count } = await query.range(offset, offset + limitNum - 1);

  if (error) return res.status(500).json({ error: error.message });

  return res.json({
    materials: data,
    pagination: {
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil((count || 0) / limitNum),
    },
  });
});

// GET /api/materials/:id/download
// Returns a signed R2 URL for file download
// Logs the download
router.get('/:id/download', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  const { data: material } = await supabase
    .from('materials')
    .select('id, file_key, file_name, external_url, department_id, year_restriction')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (!material) return res.status(404).json({ error: 'Material not found' });

  // Scope check for students
  const user = req.user!;
  if (user.role === 'student') {
    if (material.department_id !== user.department_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  // If it's an external URL (YouTube, Drive), just increment counter and return URL
  if (material.external_url) {
    await supabase.rpc('increment_download_count', { material_id: id });

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'view_external',
      entity_type: 'material',
      entity_id: id,
      metadata: { department_id: material.department_id },
    });

    return res.json({ url: material.external_url, type: 'external' });
  }

  // Generate signed R2 URL (valid for 15 minutes)
  const signedUrl = await r2Service.getSignedDownloadUrl(material.file_key!, 900);

  // Increment download count
  await supabase.rpc('increment_download_count', { material_id: id });

  // Log download
  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'download',
    entity_type: 'material',
    entity_id: id,
    metadata: { department_id: material.department_id, material_type: 'file' },
  });

  return res.json({ url: signedUrl, filename: material.file_name, type: 'file' });
});

// PATCH /api/materials/:id — update metadata (mod/admin)
router.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { title, subject_id, material_type, year_restriction, description } = req.body;
  const user = req.user!;

  // Moderators can only edit their own uploads
  if (user.role === 'moderator') {
    const { data: material } = await supabase
      .from('materials')
      .select('uploaded_by, department_id')
      .eq('id', id)
      .single();

    if (!material || material.uploaded_by !== user.id) {
      return res.status(403).json({ error: 'You can only edit your own uploads' });
    }
  } else if (user.role === 'student') {
    return res.status(403).json({ error: 'Students cannot edit materials' });
  }

  const { data, error } = await supabase
    .from('materials')
    .update({ title, subject_id, material_type, year_restriction, description, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ material: data });
});

// DELETE /api/materials/:id
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const user = req.user!;

  const { data: material } = await supabase
    .from('materials')
    .select('uploaded_by, file_key, department_id')
    .eq('id', id)
    .single();

  if (!material) return res.status(404).json({ error: 'Not found' });

  if (user.role === 'moderator' && material.uploaded_by !== user.id) {
    return res.status(403).json({ error: 'You can only delete your own uploads' });
  }
  if (user.role === 'student') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  // Delete from R2 if has a file
  if (material.file_key) {
    await r2Service.deleteFile(material.file_key);
  }

  // Soft delete (is_active = false)
  await supabase.from('materials').update({ is_active: false }).eq('id', id);

  await supabase.from('activity_logs').insert({
    user_id: user.id, action: 'delete_material', entity_type: 'material', entity_id: id,
    metadata: { department_id: material.department_id },
  });

  return res.json({ success: true });
});

// PATCH /api/materials/:id/tags — update tags on a material (mod/admin only)
router.patch('/:id/tags', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { tags } = req.body as { tags: string[] };
  const user = req.user!;

  if (user.role === 'student') return res.status(403).json({ error: 'Students cannot tag materials' });
  if (!Array.isArray(tags)) return res.status(400).json({ error: 'tags must be array' });

  const { error } = await supabase
    .from('materials')
    .update({ tags: tags.map(t => t.toLowerCase().trim()), updated_at: new Date() })
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

export default router;
