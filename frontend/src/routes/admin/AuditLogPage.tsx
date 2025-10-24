import { FormEvent, useMemo, useState } from "react";

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
      <section className="rounded-3xl border border-red-500/40 bg-red-500/10 p-10 text-center text-sm text-red-200">
        Failed to load audit logs: {error.message}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Audit Log Viewer</h1>
        <p className="text-sm text-slate-400">
          Inspect actions captured by the backend for compliance, troubleshooting, and visibility into admin/member activity.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-900/40">
        <form onSubmit={handleFilterSubmit} className="grid gap-4 md:grid-cols-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-300">Action type</span>
            <input
              value={filters.actionType}
              onChange={(event) => setFilters((prev) => ({ ...prev, actionType: event.target.value }))}
              placeholder="e.g. content.create"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-300">From date</span>
            <input
              type="date"
              value={filters.startAt}
              onChange={(event) => setFilters((prev) => ({ ...prev, startAt: event.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-300">To date</span>
            <input
              type="date"
              value={filters.endAt}
              onChange={(event) => setFilters((prev) => ({ ...prev, endAt: event.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            />
          </label>
          <div className="flex items-end justify-end gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
            >
              Reset
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-lg hover:bg-indigo-500"
            >
              Apply filters
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <header className="flex items-center justify-between text-sm text-slate-400">
          <span>{isFetching ? "Refreshing results…" : data ? `${data.total} entries found` : ""}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, (filters.page ?? 1) - 1))}
              disabled={(filters.page ?? 1) <= 1}
              className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">
              Page {filters.page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, (filters.page ?? 1) + 1))}
              disabled={(filters.page ?? 1) >= totalPages}
              className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </header>

        {isLoading || !data ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-300">
            Loading audit logs…
          </div>
        ) : data.items.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-300">
            No audit log entries match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-300">Timestamp</th>
                  <th className="px-4 py-3 font-semibold text-slate-300">Action</th>
                  <th className="px-4 py-3 font-semibold text-slate-300">Target</th>
                  <th className="px-4 py-3 font-semibold text-slate-300">Actor</th>
                  <th className="px-4 py-3 font-semibold text-slate-300">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.items.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 align-top text-xs text-slate-400">{formatDate(entry.created_at)}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-white">{entry.action_type}</div>
                      <div className="text-xs text-slate-400">{entry.target_type}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-300">{entry.target_id ?? "—"}</td>
                    <td className="px-4 py-3 align-top text-xs text-slate-300">
                      {entry.actor
                        ? entry.actor.email ?? `${entry.actor.first_name ?? ""} ${entry.actor.last_name ?? ""}`.trim()
                        : "System"}
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-300">
                      {entry.metadata && Object.keys(entry.metadata).length > 0 ? (
                        <pre className="whitespace-pre-wrap text-xs text-slate-400">
                          {JSON.stringify(entry.metadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
