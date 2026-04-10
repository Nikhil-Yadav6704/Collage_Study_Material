import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/api/notifications');
      return data as { notifications: any[]; unread_count: number };
    },
    refetchInterval: 60 * 1000,  // Poll every 60 seconds
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId?: string) =>
      notificationId
        ? api.patch(`/api/notifications/${notificationId}/read`)
        : api.patch('/api/notifications/mark-all-read'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
