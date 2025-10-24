import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { CONTENT_PAGE_SIZE, useContentCategories, useContentLibrary } from "@/hooks/useContentLibrary";
import { ContentSummary } from "@/lib/api/content";

const FILE_TYPE_OPTIONS = [
  { value: "", label: "All file types" },
  { value: "pdf", label: "PDF" },
  { value: "ppt", label: "PowerPoint" },
  { value: "pptx", label: "PowerPoint (PPTX)" },
  { value: "doc", label: "Word" },
  { value: "docx", label: "Word (DOCX)" },
  { value: "png", label: "Image (PNG)" },
  { value: "jpg", label: "Image (JPG)" },
  { value: "mp4", label: "Video (MP4)" }
];

function safeNumber(value: string | null, defaultValue: number) {
  if (!value) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? defaultValue : parsed;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function ContentCard({ item, categoryName }: { item: ContentSummary; categoryName?: string }) {
  return (
    <article className="flex h-full flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm shadow-slate-900/40 transition hover:border-slate-700">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
            {item.file_type.toUpperCase()}
          </span>
        </div>
        {item.description ? (
          <p className="text-sm text-slate-400 line-clamp-3">{item.description}</p>
        ) : (
          <p className="text-sm text-slate-500">No description provided.</p>
        )}
        <dl className="grid grid-cols-2 gap-3 text-xs text-slate-400">
          <div>
            <dt className="uppercase tracking-wide text-slate-500">Category</dt>
            <dd className="text-sm text-slate-200">{categoryName ?? "Uncategorized"}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide text-slate-500">Updated</dt>
            <dd className="text-sm text-slate-200">{formatDate(item.updated_at)}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide text-slate-500">Likes</dt>
            <dd className="text-sm text-slate-200">{item.likes_count}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide text-slate-500">Comments</dt>
            <dd className="text-sm text-slate-200">{item.comments_count}</dd>
          </div>
        </dl>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-500">Published {formatDate(item.published_at)}</span>
        <Link
          to={`/content/${item.id}`}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
        >
          View details
        </Link>
      </div>
    </article>
  );
}

export default function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = safeNumber(searchParams.get("page"), 1);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");

  const filters = useMemo(
    () => ({
      page: pageParam,
      search: searchParams.get("search") ?? undefined,
      categoryId: searchParams.get("category") ?? undefined,
      contentType: searchParams.get("type") ?? undefined,
      uploadedAfter: searchParams.get("after") ?? undefined,
      uploadedBefore: searchParams.get("before") ?? undefined
    }),
    [pageParam, searchParams]
  );

  const { data, isLoading, error, isFetching } = useContentLibrary(filters);
  const categoriesQuery = useContentCategories();
  const categoryMap = useMemo(() => {
    if (!categoriesQuery.data) return new Map<string, string>();
    return new Map(categoriesQuery.data.items.map((category) => [category.id, category.name]));
  }, [categoriesQuery.data]);

  const totalRecords = data?.total ?? 0;
  const pageSize = data?.page_size ?? CONTENT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const items = data?.items ?? [];

  const resetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setSearchInput("");
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      next.set("search", searchInput.trim());
    } else {
      next.delete("search");
    }
    next.delete("page");
    setSearchParams(next, { replace: true });
  };

  const setPage = (page: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page));
    setSearchParams(next, { replace: true });
  };

  return (
    <section className="flex min-h-[70vh] flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Content Library</h1>
        <p className="text-sm text-slate-400">
          Browse the latest resources from the community. Use filters to find the materials most relevant to you.
        </p>
      </header>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-900/40">
        <form onSubmit={handleSearchSubmit} className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2 flex flex-col gap-2">
            <label htmlFor="search" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Keyword
            </label>
            <input
              id="search"
              name="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by title or description"
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
            <select
              value={filters.categoryId ?? ""}
              onChange={(event) => {
                const value = event.target.value || undefined;
                const next = new URLSearchParams(searchParams);
                if (value) {
                  next.set("category", value);
                } else {
                  next.delete("category");
                }
                next.delete("page");
                setSearchParams(next, { replace: true });
              }}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            >
              <option value="">All categories</option>
              {categoriesQuery.data?.items.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">File type</label>
            <select
              value={filters.contentType ?? ""}
              onChange={(event) => {
                const value = event.target.value || undefined;
                const next = new URLSearchParams(searchParams);
                if (value) {
                  next.set("type", value);
                } else {
                  next.delete("type");
                }
                next.delete("page");
                setSearchParams(next, { replace: true });
              }}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            >
              {FILE_TYPE_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Uploaded after</label>
              <input
                type="date"
                value={filters.uploadedAfter ?? ""}
                onChange={(event) => {
                  const value = event.target.value || undefined;
                  const next = new URLSearchParams(searchParams);
                  if (value) {
                    next.set("after", value);
                  } else {
                    next.delete("after");
                  }
                  next.delete("page");
                  setSearchParams(next, { replace: true });
                }}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Uploaded before</label>
              <input
                type="date"
                value={filters.uploadedBefore ?? ""}
                onChange={(event) => {
                  const value = event.target.value || undefined;
                  const next = new URLSearchParams(searchParams);
                  if (value) {
                    next.set("before", value);
                  } else {
                    next.delete("before");
                  }
                  next.delete("page");
                  setSearchParams(next, { replace: true });
                }}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
              />
            </div>
          </div>

          <div className="flex items-end justify-end gap-3 md:col-span-2">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              Reset
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-lg shadow-brand/30 transition hover:bg-indigo-500"
            >
              Apply filters
            </button>
          </div>
        </form>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-10 text-sm text-red-200">
          Failed to load content: {error.message}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>{isFetching ? "Refreshing results…" : `${totalRecords} items found`}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, pageParam - 1))}
                disabled={pageParam <= 1}
                className="rounded-md border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {pageParam} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, pageParam + 1))}
                disabled={pageParam >= totalPages}
                className="rounded-md border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

          {isLoading || !data ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-300">
              Loading content library…
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-300">
              <p>No content matches your filters yet.</p>
              <p className="mt-2 text-xs text-slate-500">
                Admins can upload new resources from the admin dashboard.
              </p>
              <Link
                to="/admin/content"
                className="mt-4 inline-flex rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
              >
                Go to admin content dashboard
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item: ContentSummary) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  categoryName={item.category_id ? categoryMap.get(item.category_id) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
