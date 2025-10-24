import { apiClient, toApiError } from "@/lib/api/client";

export type AuditLogActor = {
  id: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
};

export type AuditLogEntry = {
  id: string;
  action_type: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor: AuditLogActor | null;
};

export type AuditLogListResponse = {
  items: AuditLogEntry[];
  page: number;
  page_size: number;
  total: number;
};

export type AuditLogFilters = {
  page?: number;
  pageSize?: number;
  actionType?: string;
  startAt?: string;
  endAt?: string;
};

export async function fetchAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogListResponse> {
  try {
    const { data } = await apiClient.get<AuditLogListResponse>("/admin/audit/logs", {
      params: {
        page: filters.page,
        page_size: filters.pageSize,
        action_type: filters.actionType || undefined,
        start_at: filters.startAt || undefined,
        end_at: filters.endAt || undefined
      }
    });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}
