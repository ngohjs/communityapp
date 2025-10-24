import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ContentComment,
  ContentCommentListResponse,
  ContentDetail,
  ContentDownloadResponse,
  fetchContentComments,
  fetchContentDetail,
  likeContent,
  requestDownloadToken,
  unlikeContent,
  createContentComment,
  updateContentComment,
  deleteContentComment
} from "@/lib/api/content";

export const contentDetailKey = (contentId: string) => ["content-detail", contentId] as const;
export const contentCommentsKey = (contentId: string) => ["content-comments", contentId] as const;

export function useContentDetail(contentId: string | undefined) {
  return useQuery<ContentDetail, Error>({
    queryKey: contentId ? contentDetailKey(contentId) : ["content-detail", "unknown"],
    queryFn: () => {
      if (!contentId) throw new Error("Missing content id");
      return fetchContentDetail(contentId);
    },
    enabled: Boolean(contentId),
    placeholderData: (previous) => previous
  });
}

export function useContentComments(contentId: string | undefined) {
  return useQuery<ContentCommentListResponse, Error>({
    queryKey: contentId ? contentCommentsKey(contentId) : ["content-comments", "unknown"],
    queryFn: () => {
      if (!contentId) throw new Error("Missing content id");
      return fetchContentComments(contentId);
    },
    enabled: Boolean(contentId),
    placeholderData: (previous) => previous
  });
}

export function useLikeContentMutation(contentId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!contentId) throw new Error("Missing content id");
      await likeContent(contentId);
    },
    onSuccess: (_, __, variables) => {
      if (contentId) {
        queryClient.invalidateQueries({ queryKey: contentDetailKey(contentId) });
      }
    }
  });
}

export function useUnlikeContentMutation(contentId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!contentId) throw new Error("Missing content id");
      await unlikeContent(contentId);
    },
    onSuccess: () => {
      if (contentId) {
        queryClient.invalidateQueries({ queryKey: contentDetailKey(contentId) });
      }
    }
  });
}

export function useDownloadContentMutation(contentId: string | undefined) {
  return useMutation<ContentDownloadResponse, Error>({
    mutationFn: async () => {
      if (!contentId) throw new Error("Missing content id");
      return requestDownloadToken(contentId);
    }
  });
}

export function useCreateCommentMutation(contentId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<ContentComment, Error, string>({
    mutationFn: async (body) => {
      if (!contentId) throw new Error("Missing content id");
      return createContentComment(contentId, body);
    },
    onSuccess: () => {
      if (contentId) {
        queryClient.invalidateQueries({ queryKey: contentCommentsKey(contentId) });
        queryClient.invalidateQueries({ queryKey: contentDetailKey(contentId) });
      }
    }
  });
}

export function useUpdateCommentMutation(contentId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<ContentComment, Error, { commentId: string; body: string }>({
    mutationFn: async ({ commentId, body }) => updateContentComment(commentId, body),
    onSuccess: () => {
      if (contentId) {
        queryClient.invalidateQueries({ queryKey: contentCommentsKey(contentId) });
      }
    }
  });
}

export function useDeleteCommentMutation(contentId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (commentId) => deleteContentComment(commentId),
    onSuccess: () => {
      if (contentId) {
        queryClient.invalidateQueries({ queryKey: contentCommentsKey(contentId) });
        queryClient.invalidateQueries({ queryKey: contentDetailKey(contentId) });
      }
    }
  });
}
