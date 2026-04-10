import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

const bookmarkService = {
  list: async () => (await api.get('/api/bookmarks')).data.bookmarks,
  add: async (material_id: string) => api.post('/api/bookmarks', { material_id }),
  remove: async (material_id: string) => api.delete(`/api/bookmarks/${material_id}`),
};

export function useBookmarks() {
  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: bookmarkService.list,
  });
}

export function useToggleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ materialId, isBookmarked }: { materialId: string; isBookmarked: boolean }) => {
      // Toggle logic handled by the bookmark POST route in backend (toggles if already exists)
      await api.post('/api/bookmarks', { material_id: materialId });
    },
    // Optimistic update
    onMutate: async ({ materialId, isBookmarked }) => {
      await qc.cancelQueries({ queryKey: ['bookmarks'] });
      const previous = qc.getQueryData(['bookmarks']);
      // Optimistically update
      qc.setQueryData(['bookmarks'], (old: any[]) =>
        isBookmarked
          ? old.filter((b: any) => b.material_id !== materialId)
          : [...(old || []), { material_id: materialId }]
      );
      return { previous };
    },
    onError: (err, _, context) => {
      qc.setQueryData(['bookmarks'], context?.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}
