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

export type AdminContent = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  file_type: string;
  file_size: number | null;
  category_id: string | null;
  owner_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  file_path: string;
};

export type AdminContentListResponse = {
  items: AdminContent[];
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

export async function fetchAdminContent(): Promise<AdminContentListResponse> {
  try {
    const { data } = await apiClient.get<AdminContentListResponse>("/admin/content");
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export type CreateAdminContentInput = {
  title: string;
  description?: string;
  status: string;
  categoryId?: string;
  file: File;
};

export async function createAdminContent(payload: CreateAdminContentInput): Promise<AdminContent> {
  try {
    const formData = new FormData();
    formData.append("title", payload.title);
    if (payload.description) formData.append("description", payload.description);
    formData.append("status_value", payload.status);
    if (payload.categoryId) formData.append("category_id", payload.categoryId);
    formData.append("file", payload.file);

    const { data } = await apiClient.post<AdminContent>("/admin/content", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export type UpdateAdminContentInput = {
  title?: string;
  description?: string;
  status?: string;
  categoryId?: string;
};

export async function updateAdminContent(contentId: string, payload: UpdateAdminContentInput): Promise<AdminContent> {
  try {
    const body: Record<string, unknown> = {};
    if (payload.title !== undefined) body.title = payload.title;
    if (payload.description !== undefined) body.description = payload.description;
    if (payload.status !== undefined) body.status = payload.status;
    if (payload.categoryId !== undefined) body.category_id = payload.categoryId;

    const { data } = await apiClient.patch<AdminContent>(`/admin/content/${contentId}`, body);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function archiveAdminContent(contentId: string): Promise<AdminContent> {
  try {
    const { data } = await apiClient.patch<AdminContent>(`/admin/content/${contentId}/archive`);
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
