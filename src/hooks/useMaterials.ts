import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialService, MaterialFilters } from '../services/materialService';

export function useMaterials(filters: MaterialFilters = {}) {
  return useQuery({
    queryKey: ['materials', filters],
    queryFn: () => materialService.list(filters),
  });
}

export function useDownloadMaterial() {
  return useMutation({
    mutationFn: (materialId: string) => materialService.getDownloadUrl(materialId),
    onSuccess: (data) => {
      // Open in new tab
      window.open(data.url, '_blank', 'noopener');
    },
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) =>
      materialService.update(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => materialService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}
