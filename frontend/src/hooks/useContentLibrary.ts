import { useQuery } from "@tanstack/react-query";

import {
  ContentCategoryListResponse,
  ContentListResponse,
  fetchContentCategories,
  fetchContentList
} from "@/lib/api/content";

const DEFAULT_PAGE_SIZE = 12;

export type ContentLibraryFilters = {
  page?: number;
  search?: string;
  categoryId?: string;
  contentType?: string;
  uploadedAfter?: string;
  uploadedBefore?: string;
};

export function useContentLibrary(filters: ContentLibraryFilters) {
  return useQuery<ContentListResponse, Error>({
    queryKey: ["content", filters],
    queryFn: () =>
      fetchContentList({
        page: filters.page,
        pageSize: DEFAULT_PAGE_SIZE,
        search: filters.search,
        categoryId: filters.categoryId,
        contentType: filters.contentType,
        uploadedAfter: filters.uploadedAfter,
        uploadedBefore: filters.uploadedBefore
      }),
    placeholderData: (previous) => previous
  });
}

export function useContentCategories() {
  return useQuery<ContentCategoryListResponse, Error>({
    queryKey: ["content-categories"],
    queryFn: fetchContentCategories
  });
}

export const CONTENT_PAGE_SIZE = DEFAULT_PAGE_SIZE;
