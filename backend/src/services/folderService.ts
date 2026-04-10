import { supabase } from '../config/supabase';

export const folderService = {
  async getOrCreateFolderHierarchy(
    department_id: string,
    semester: number,
    subject_id: string,
    subject_name: string,
    material_type: string,
    userId: string
  ): Promise<string> {
    const materialTypeLabels: Record<string, string> = {
      notes: "Notes", teacher_notes: "Teacher's Notes", pyq: "PYQ",
      youtube: "YouTube", student_notes: "Student's Notes", book: "Book", ai_notes: "AI Notes"
    };
    const materialTypeLabel = materialTypeLabels[material_type] || "Notes";

    // 1. Get Dept Folder
    const { data: deptFolder } = await supabase
      .from('folders')
      .select('id')
      .eq('department_id', department_id)
      .eq('folder_type', 'department')
      .is('parent_id', null)
      .single();

    if (!deptFolder) throw new Error("Department root folder not found");

    // 2. Get or Create Semester Folder
    let { data: semFolder } = await supabase
      .from('folders')
      .select('id')
      .eq('parent_id', deptFolder.id)
      .eq('semester', semester)
      .eq('folder_type', 'semester')
      .single();

    if (!semFolder) {
      const suffix = ["st", "nd", "rd"][((semester + 90) % 100 - 10) % 10 - 1] || "th";
      const semName = `${semester}${suffix} Semester`;
      const { data: newSem } = await supabase
        .from('folders')
        .insert({
          name: semName,
          parent_id: deptFolder.id,
          department_id: department_id,
          semester: semester,
          folder_type: 'semester',
          created_by: userId
        })
        .select('id')
        .single();
      if (!newSem) throw new Error("Failed to create semester folder");
      semFolder = newSem;
    }

    // 3. Get or Create Subject Folder
    let { data: subFolder } = await supabase
      .from('folders')
      .select('id')
      .eq('parent_id', semFolder.id)
      .eq('subject_id', subject_id)
      .single();

    if (!subFolder) {
      const { data: newSub } = await supabase
        .from('folders')
        .insert({
          name: subject_name,
          parent_id: semFolder.id,
          department_id: department_id,
          semester: semester,
          subject_id: subject_id,
          folder_type: 'subject',
          created_by: userId
        })
        .select('id')
        .single();
      if (!newSub) throw new Error("Failed to create subject folder");
      subFolder = newSub;
    }

    // 4. Get or Create Material Type Folder
    let { data: typeFolder } = await supabase
      .from('folders')
      .select('id')
      .eq('parent_id', subFolder.id)
      .eq('type_key', material_type)
      .single();

    if (!typeFolder) {
      const { data: newType } = await supabase
        .from('folders')
        .insert({
          name: materialTypeLabel,
          parent_id: subFolder.id,
          department_id: department_id,
          semester: semester,
          subject_id: subject_id,
          folder_type: 'material_type',
          type_key: material_type,
          created_by: userId
        })
        .select('id')
        .single();
      if (!newType) throw new Error("Failed to create material type folder");
      typeFolder = newType;
    }

    return typeFolder.id;
  }
};
