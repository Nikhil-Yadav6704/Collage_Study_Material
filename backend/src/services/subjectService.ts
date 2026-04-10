import { supabase } from '../config/supabase';

export const subjectService = {
  async getOrCreateSubject(department_id: string, semester: number, subjectStr: string): Promise<{id: string, name: string}> {
    // If it's a valid UUID, look it up to return id and name
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subjectStr);
    
    if (isUUID) {
      const { data } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('id', subjectStr)
        .single();
      if (data) return data;
    }

    // Check if subject by same name exists in dept/sem
    const { data: existing } = await supabase
      .from('subjects')
      .select('id, name')
      .ilike('name', subjectStr.trim())
      .eq('department_id', department_id)
      .eq('semester', semester)
      .single();

    if (existing) return existing;

    // Create new subject
    const { data: newSubject, error } = await supabase
      .from('subjects')
      .insert({
        name: subjectStr.trim(),
        department_id,
        semester,
      })
      .select('id, name')
      .single();
      
    if (error) throw new Error(`Failed to create subject: ${error.message}`);
    return newSubject!;
  }
};
