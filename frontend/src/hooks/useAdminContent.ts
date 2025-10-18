import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  AdminContent,
  AdminContentListResponse,
  archiveAdminContent,
  createAdminContent,
  fetchAdminContent,
  updateAdminContent
} from "@/lib/api/content";

export const adminContentKey = ["admin-content"] as const;

export function useAdminContent() {
  return useQuery<AdminContentListResponse, Error>({
    queryKey: adminContentKey,
    queryFn: fetchAdminContent,
    placeholderData: (previous) => previous
  });
}

export function useCreateAdminContentMutation() {
  const queryClient = useQueryClient();
  return useMutation<AdminContent, Error, Parameters<typeof createAdminContent>[0]>({
    mutationFn: createAdminContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminContentKey });
    }
  });
}

export function useUpdateAdminContentMutation() {
  const queryClient = useQueryClient();
  return useMutation<AdminContent, Error, { contentId: string; payload: Parameters<typeof updateAdminContent>[1] }>({
    mutationFn: ({ contentId, payload }) => updateAdminContent(contentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminContentKey });
    }
  });
}

export function useArchiveAdminContentMutation() {
  const queryClient = useQueryClient();
  return useMutation<AdminContent, Error, string>({
    mutationFn: archiveAdminContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminContentKey });
    }
  });
}
