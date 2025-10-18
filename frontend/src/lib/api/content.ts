import { apiClient, toApiError } from "@/lib/api/client";

export type ContentSummary = {
  id: string;
  title: string;
  description: string | null;
  file_type: string;
  file_size: number | null;
  category_id: string | null;
  category_name: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
  likes_count: number;
  comments_count: number;
};

export type ContentDetail = ContentSummary & {
  status: string;
  liked_by_me: boolean;
  owner_name: string | null;
};

export type ContentDownloadResponse = {
  token: string;
  expires_in: number;
};

export type ContentComment = {
  id: string;
  content_id: string;
  author_id: string | null;
  body: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ContentCommentListResponse = {
  items: ContentComment[];
};

export type ContentListResponse = {
  items: ContentSummary[];
  total: number;
  page: number;
  page_size: number;
};

export type ContentCategory = {
  id: string;
  name: string;
  description: string | null;
};

export type ContentCategoryListResponse = {
  items: ContentCategory[];
};

export type ContentListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  contentType?: string;
  uploadedAfter?: string;
  uploadedBefore?: string;
};

export async function fetchContentList(params: ContentListParams = {}): Promise<ContentListResponse> {
  try {
    const { data } = await apiClient.get<ContentListResponse>("/content", {
      params: {
        page: params.page,
        page_size: params.pageSize,
        search: params.search || undefined,
        category_id: params.categoryId || undefined,
        content_type: params.contentType || undefined,
        uploaded_after: params.uploadedAfter || undefined,
        uploaded_before: params.uploadedBefore || undefined,
      },
    });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function fetchContentCategories(): Promise<ContentCategoryListResponse> {
  try {
    const { data } = await apiClient.get<ContentCategoryListResponse>("/content/categories");
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function fetchContentDetail(contentId: string): Promise<ContentDetail> {
  try {
    const { data } = await apiClient.get<ContentDetail>(`/content/${contentId}`);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function requestDownloadToken(contentId: string): Promise<ContentDownloadResponse> {
  try {
    const { data } = await apiClient.post<ContentDownloadResponse>(`/content/${contentId}/download`);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function likeContent(contentId: string): Promise<void> {
  try {
    await apiClient.post(`/content/${contentId}/likes`);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function unlikeContent(contentId: string): Promise<void> {
  try {
    await apiClient.delete(`/content/${contentId}/likes`);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function fetchContentComments(contentId: string): Promise<ContentCommentListResponse> {
  try {
    const { data } = await apiClient.get<ContentCommentListResponse>(`/content/${contentId}/comments`);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function createContentComment(contentId: string, body: string): Promise<ContentComment> {
  try {
    const { data } = await apiClient.post<ContentComment>(`/content/${contentId}/comments`, { body });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function updateContentComment(commentId: string, body: string): Promise<ContentComment> {
  try {
    const { data } = await apiClient.patch<ContentComment>(`/content/comments/${commentId}`, { body });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function deleteContentComment(commentId: string): Promise<void> {
  try {
    await apiClient.delete(`/content/comments/${commentId}`);
  } catch (error) {
    throw toApiError(error);
  }
}
