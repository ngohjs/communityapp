import { useQuery } from "@tanstack/react-query";

import { AuditLogFilters, AuditLogListResponse, fetchAuditLogs } from "@/lib/api/audit";

export const auditLogsKey = (filters: AuditLogFilters) => ["audit-logs", filters] as const;

export function useAuditLogs(filters: AuditLogFilters) {
  return useQuery<AuditLogListResponse, Error>({
    queryKey: auditLogsKey(filters),
    queryFn: () => fetchAuditLogs(filters),
    placeholderData: (previous) => previous
  });
}
