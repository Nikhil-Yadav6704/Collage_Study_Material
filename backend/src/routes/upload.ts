import { Router } from 'express';
import multer from 'multer';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireModerator } from '../middleware/requireRole';
import { requireOwnDept } from '../middleware/requireDept';
import { r2Service } from '../services/r2Service';
import { supabase } from '../config/supabase';
import { uploadLimiter } from '../middleware/rateLimiter';
import { z } from 'zod';
import { subjectService } from '../services/subjectService';
import { folderService } from '../services/folderService';

const router = Router();

// Multer: store in memory, limit 50MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg', 'image/png', 'image/gif',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

const uploadMaterialSchema = z.object({
  title: z.string().min(3).max(200),
  department_id: z.string().uuid(),
  subject_id: z.string().min(1),
  semester: z.coerce.number().int().min(1).max(8),
  material_type: z.enum(['notes', 'teacher_notes', 'pyq', 'youtube', 'student_notes', 'book', 'ai_notes']),
  year_restriction: z.enum(['1', '2', '3', '4']),
  tags: z.string().optional(),
  description: z.string().max(500).optional(),
  external_url: z.string().url().optional(),
  folder_id: z.string().uuid().optional(),
});

// POST /api/upload/material — moderator/admin upload
router.post(
  '/material',
  requireAuth,
  requireModerator,
  uploadLimiter,
  requireOwnDept('department_id'),
  upload.single('file'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = uploadMaterialSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const data = parsed.data;
    const file = req.file;

    if (!file && !data.external_url) {
      return res.status(400).json({ error: 'Either a file or external URL is required' });
    }

    let file_key: string | null = null;
    let file_name: string | null = null;
    let file_size_bytes: number | null = null;
    let url_domain: string | null = null;

    if (file) {
      file_key = await r2Service.uploadFile(file.buffer, file.originalname, file.mimetype, 'materials');
      file_name = file.originalname;
      file_size_bytes = file.size;
    }

    if (data.external_url) {
      try {
        url_domain = new URL(data.external_url).hostname;
      } catch { /* invalid URL caught by zod */ }
    }

    let finalSubjectId = data.subject_id;
    let finalFolderId = data.folder_id;
    try {
      const subject = await subjectService.getOrCreateSubject(data.department_id, data.semester, data.subject_id);
      finalSubjectId = subject.id;

      finalFolderId = await folderService.getOrCreateFolderHierarchy(
        data.department_id,
        data.semester,
        finalSubjectId,
        subject.name,
        data.material_type,
        req.user!.id
      );
    } catch (err) {
      console.error("Hierarchy generation failed:", err);
    }

    const { data: material, error } = await supabase
      .from('materials')
      .insert({
        title: data.title,
        description: data.description || null,
        material_type: data.material_type,
        subject_id: finalSubjectId,
        department_id: data.department_id,
        semester: data.semester,
        year_restriction: data.year_restriction,
        folder_id: finalFolderId || null,
        file_key,
        file_name,
        file_size_bytes,
        external_url: data.external_url || null,
        url_domain,
        uploaded_by: req.user!.id,
      })
      .select()
      .single();

    if (error) {
      // Clean up R2 file if DB insert fails
      if (file_key) await r2Service.deleteFile(file_key);
      return res.status(500).json({ error: error.message });
    }

    // Save aliases if provided
    if (data.tags) {
      try {
        const tags: string[] = JSON.parse(data.tags);
        if (tags.length > 0) {
          await supabase.from('subject_aliases').upsert(
            tags.map(alias => ({ subject_id: data.subject_id, alias, created_by: req.user!.id })),
            { onConflict: 'subject_id,alias', ignoreDuplicates: true }
          );
        }
      } catch (e) {
        console.error('Failed to parse tags:', e);
      }
    }

    await supabase.from('activity_logs').insert({
      user_id: req.user!.id,
      action: 'upload_material',
      entity_type: 'material',
      entity_id: material.id,
      metadata: { department_id: data.department_id, material_type: data.material_type },
    });

    return res.status(201).json({ material, message: 'Uploaded and live.' });
  }
);

// POST /api/upload/request-file — student upload for a request (goes to temp bucket)
router.post(
  '/request-file',
  requireAuth,
  uploadLimiter,
  upload.single('file'),
  async (req: AuthenticatedRequest, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file provided' });

    const file_key = await r2Service.uploadFile(file.buffer, file.originalname, file.mimetype, 'request-temp');

    return res.json({
      file_key,
      file_name: file.originalname,
      file_size_bytes: file.size,
      mime_type: file.mimetype,
    });
  }
);

export default router;
