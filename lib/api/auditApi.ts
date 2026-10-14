import { baseApi } from "@/lib/api/baseApi";
import type { AuditLogListParams, AuditLogsResponse } from "@/lib/types";

export const auditApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /api/audit-logs — requires AUDIT_LOG_VIEW_ALLOWED. */
    auditLogs: build.query<AuditLogsResponse, AuditLogListParams | void>({
      query: (params) => ({ url: "/audit-logs", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.auditLogs.map((log) => ({
                type: "AuditLog" as const,
                id: log.id,
              })),
              { type: "AuditLog" as const, id: "LIST" },
            ]
          : [{ type: "AuditLog" as const, id: "LIST" }],
    }),
  }),
});

export const { useAuditLogsQuery } = auditApi;

