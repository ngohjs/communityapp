import { FormEvent, useMemo, useState } from "react";

import { TerraAlert, TerraCard, TerraField, TerraLedgerSection, terraButtonClass } from "@/components/ui/terra";
import { useAuditLogs } from "@/hooks/useAdminAuditLogs";

const PAGE_SIZE = 50;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function AuditLogPage() {
  const [filters, setFilters] = useState({
    page: 1,
    actionType: "",
    startAt: "",
    endAt: ""
  });
  const queryFilters = useMemo(
    () => ({
      page: filters.page,
      pageSize: PAGE_SIZE,
      actionType: filters.actionType || undefined,
      startAt: filters.startAt || undefined,
      endAt: filters.endAt || undefined
    }),
    [filters]
  );

  const { data, isLoading, error, isFetching } = useAuditLogs(queryFilters);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleReset = () => {
    setFilters({ page: 1, actionType: "", startAt: "", endAt: "" });
  };

  const setPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  if (error) {
    return (
      <TerraAlert tone="danger" title="Failed to load audit logs">
        {error.message}
      </TerraAlert>
    );
  }

  return (
    <section className="flex flex-col gap-10">
      <header className="space-y-3">
        <h1 className="font-heading text-display-xl text-ink-900">Audit Log Viewer</h1>
        <p className="text-body-lg text-ink-600">
          Inspect actions captured by the backend for compliance, troubleshooting, and visibility into admin/member activity.
        </p>
      </header>

      <TerraCard title="Filter audit entries" eyebrow={<span className="terra-badge">Filters</span>}>
        <form onSubmit={handleFilterSubmit} className="grid gap-4 md:grid-cols-4">
          <TerraField label="Action type" hint="e.g. content.create">
            <input
              value={filters.actionType}
              onChange={(event) => setFilters((prev) => ({ ...prev, actionType: event.target.value }))}
              placeholder="e.g. content.create"
              className="terra-input"
            />
          </TerraField>
          <TerraField label="From date">
            <input
              type="date"
              value={filters.startAt}
              onChange={(event) => setFilters((prev) => ({ ...prev, startAt: event.target.value }))}
              className="terra-input"
            />
          </TerraField>
          <TerraField label="To date">
            <input
              type="date"
              value={filters.endAt}
              onChange={(event) => setFilters((prev) => ({ ...prev, endAt: event.target.value }))}
              className="terra-input"
            />
          </TerraField>
          <div className="flex items-end justify-end gap-3">
            <button type="button" onClick={handleReset} className={terraButtonClass("ghost")}>
              Reset
            </button>
            <button type="submit" className={terraButtonClass("primary")}>
              Apply filters
            </button>
          </div>
        </form>
      </TerraCard>

      <TerraLedgerSection
        title={isFetching ? "Refreshing results…" : data ? `${data.total} entries found` : "Audit results"}
        description="Audit logs surface actor, action, metadata, and timestamps."
      >
        {isLoading || !data ? (
          <div className="terra-card">Loading audit logs…</div>
        ) : data.items.length === 0 ? (
          <TerraAlert tone="info">No audit log entries match the selected filters.</TerraAlert>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-body-sm text-ink-500">
              <span>Page {filters.page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, (filters.page ?? 1) - 1))}
                  disabled={(filters.page ?? 1) <= 1}
                  className={terraButtonClass("ghost") + " px-4 py-2 text-xs"}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, (filters.page ?? 1) + 1))}
                  disabled={(filters.page ?? 1) >= totalPages}
                  className={terraButtonClass("ghost") + " px-4 py-2 text-xs"}
                >
                  Next
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[rgba(46,59,69,0.12)] bg-surface-raised shadow-sm">
              <table className="min-w-full divide-y divide-[rgba(46,59,69,0.14)] text-left text-sm text-ink-700">
                <thead className="bg-[rgba(46,59,69,0.04)] text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Timestamp</th>
                    <th className="px-5 py-3 font-semibold">Action</th>
                    <th className="px-5 py-3 font-semibold">Target</th>
                    <th className="px-5 py-3 font-semibold">Actor</th>
                    <th className="px-5 py-3 font-semibold">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(46,59,69,0.08)]">
                  {data.items.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-5 py-3 align-top text-body-sm text-ink-500">{formatDate(entry.created_at)}</td>
                      <td className="px-5 py-3 align-top">
                        <div className="font-heading text-display-md text-ink-900">{entry.action_type}</div>
                        <div className="text-body-sm text-ink-500">{entry.target_type}</div>
                      </td>
                      <td className="px-5 py-3 align-top text-body-sm text-ink-600">{entry.target_id ?? "—"}</td>
                      <td className="px-5 py-3 align-top text-body-sm text-ink-600">
                        {entry.actor
                          ? entry.actor.email ?? `${entry.actor.first_name ?? ""} ${entry.actor.last_name ?? ""}`.trim()
                          : "System"}
                      </td>
                      <td className="px-5 py-3 align-top text-body-sm text-ink-600">
                        {entry.metadata && Object.keys(entry.metadata).length > 0 ? (
                          <pre className="whitespace-pre-wrap rounded-md bg-[rgba(46,59,69,0.05)] px-3 py-2 text-xs text-ink-600">
                            {JSON.stringify(entry.metadata, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-ink-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </TerraLedgerSection>
    </section>
  );
}
