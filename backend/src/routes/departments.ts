import { Router } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireRole';

const router = Router();

// GET /api/departments — PUBLIC, no auth required (needed for signup form)
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name, short_name, description')
    .eq('is_active', true)
    .order('short_name');

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ departments: data });
});

// GET /api/departments/:id — PUBLIC
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('departments')
    .select(`
      id, name, short_name, description,
      subjects:subjects(id, name, semester, is_active)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Department not found' });
  return res.json({ department: data });
});

// Fix 2: PATCH /api/departments/:id/deactivate — requires actual auth + admin role
router.patch('/:id/deactivate', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('departments')
    .update({ is_active: false, updated_at: new Date() })
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

// POST /api/departments — Admin creates new department securely + 1-8 semester DB payload
router.post('/', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  let { name, short_name } = req.body;
  if (!name || !short_name) return res.status(400).json({ error: 'name and short_name required' });

  // 1. Create department DB row
  const { data: dept, error: deptError } = await supabase
    .from('departments')
    .insert({ name: name.trim(), short_name: short_name.trim().toUpperCase() })
    .select()
    .single();
    
  if (deptError) return res.status(500).json({ error: deptError.message });

  // 2. Create auto-linked Department Folder block
  const folderName = `${dept.short_name} — ${dept.name}`;
  const { data: deptFolder, error: folderError } = await supabase
    .from('folders')
    .insert({
      name: folderName,
      department_id: dept.id,
      folder_type: 'department',
      created_by: req.user!.id
    })
    .select()
    .single();

  // 3. Inject Semesters 1-8 recursively
  if (deptFolder) {
    const semestersToCreate = [];
    for (let i = 1; i <= 8; i++) {
      const suffix = ["st", "nd", "rd"][((i + 90) % 100 - 10) % 10 - 1] || "th";
      semestersToCreate.push({
        name: `${i}${suffix} Semester`,
        parent_id: deptFolder.id,
        department_id: dept.id,
        semester: i,
        folder_type: 'semester',
        created_by: req.user!.id
      });
    }
    await supabase.from('folders').insert(semestersToCreate);
  }

  return res.status(201).json({ department: dept });
});

export default router;
