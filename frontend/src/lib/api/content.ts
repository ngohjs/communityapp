import { apiClient, toApiError } from "@/lib/api/client";

export type ContentSummary = {
  id: string;
  title: string;
  description: string | null;
  file_type: string;
  file_size: number | null;
  category_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
  likes_count: number;
  comments_count: number;
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
