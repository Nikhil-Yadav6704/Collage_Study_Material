import api from '../lib/api';

export const uploadService = {
  // For moderators: upload a material directly
  async uploadMaterial(formData: FormData): Promise<{ material: any }> {
    const { data } = await api.post('/api/upload/material', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // For students: upload a file for a request (two-step: first upload file, then submit request)
  async uploadRequestFile(file: File): Promise<{
    file_key: string; file_name: string; file_size_bytes: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/api/upload/request-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // For students: submit the full request after uploading file
  async submitUploadRequest(requestData: {
    title: string;
    material_type: string;
    subject_id: string;
    department_id: string;
    semester: number;
    year_restriction: string;
    student_note?: string;
    file_key?: string;
    file_name?: string;
    file_size_bytes?: number;
    external_url?: string;
  }) {
    const { data } = await api.post('/api/upload-requests', requestData);
    return data;
  },
};
