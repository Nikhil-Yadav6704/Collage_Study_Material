import { Router } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireRole';

const router = Router();

// GET /api/subjects
// Returns subjects, filtered by department (default: current student's dept)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { department_id, semester, search } = req.query;
  const user = req.user!;

  // Include aliases and department in the SELECT query
  let query = supabase
    .from('subjects')
    .select(`
      id, name, department_id, semester,
      aliases:subject_aliases(alias),
      department:departments(id, name, short_name)
    `)
    .order('name');

  if (department_id) {
    query = query.eq('department_id', department_id);
  } else if (user.role === 'student' && user.department_id) {
    query = query.eq('department_id', user.department_id);
  }

  if (semester) {
    query = query.eq('semester', semester);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Flatten aliases to string array for cleaner response
  const subjectsWithAliases = (data || []).map((s: any) => ({
    ...s,
    aliases: s.aliases?.map((a: any) => a.alias) || [],
    department: s.department,
  }));

  return res.json({ subjects: subjectsWithAliases });
});

// PATCH /api/subjects/:id/aliases
// Updates/replaces all aliases for a subject
router.patch('/:id/aliases', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { aliases } = req.body as { aliases: string[] };

  if (!Array.isArray(aliases)) {
    return res.status(400).json({ error: 'aliases must be an array of strings' });
  }

  // Delete all existing aliases for this subject
  await supabase
    .from('subject_aliases')
    .delete()
    .eq('subject_id', id);

  // Insert new aliases (if any)
  if (aliases.length > 0) {
    const { error } = await supabase
      .from('subject_aliases')
      .insert(
        aliases.map(alias => ({
          subject_id: id,
          alias: alias.toLowerCase().trim(),
          created_by: req.user!.id,
        }))
      );
    if (error) return res.status(500).json({ error: error.message });
  }

  return res.json({ success: true, count: aliases.length });
});

export default router;
