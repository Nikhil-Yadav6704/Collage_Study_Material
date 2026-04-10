import api from '../lib/api';

export interface Material {
  id: string;
  title: string;
  description: string | null;
  material_type: string;
  semester: number;
  year_restriction: string;
  file_key: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  external_url: string | null;
  url_domain: string | null;
  folder_id: string | null;
  download_count: number;
  average_rating: number | null;
  rating_count: number;
  created_at: string;
  subject: { id: string; name: string };
  department: { id: string; short_name: string; name: string };
  uploader: { id: string; full_name: string };
  folder?: { id: string; name: string } | null;
}

export interface MaterialFilters {
  type?: string;
  semester?: number;
  subject_id?: string;
  search?: string;
  sort?: 'newest' | 'top_rated' | 'most_downloaded';
  page?: number;
  limit?: number;
}

export const materialService = {
  async list(filters: MaterialFilters = {}) {
    const { data } = await api.get('/api/materials', { params: filters });
    return data as { materials: Material[]; pagination: { total: number; page: number; pages: number } };
  },

  async getDownloadUrl(materialId: string): Promise<{ url: string; filename?: string; type: 'file' | 'external' }> {
    const { data } = await api.get(`/api/materials/${materialId}/download`);
    return data;
  },

  async update(materialId: string, updates: Partial<Material>) {
    const { data } = await api.patch(`/api/materials/${materialId}`, updates);
    return data.material as Material;
  },

  async delete(materialId: string) {
    await api.delete(`/api/materials/${materialId}`);
  },
};
