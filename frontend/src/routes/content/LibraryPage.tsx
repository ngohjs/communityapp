import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { TerraCard, TerraField, TerraLedgerSection, terraButtonClass } from "@/components/ui/terra";
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
    <div className="terra-ledger-section flex h-full flex-col justify-between gap-5">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-heading text-display-md text-ink-900">{item.title}</h3>
            <p className="text-body-sm text-ink-500">Published {formatDate(item.published_at)}</p>
          </div>
          <span className="terra-badge bg-[rgba(46,59,69,0.12)] text-ink-700">
            {item.file_type.toUpperCase()}
          </span>
        </div>
        {item.description ? (
          <p className="text-body-sm text-ink-700 line-clamp-3">{item.description}</p>
        ) : (
          <p className="text-body-sm text-ink-300">No description provided.</p>
        )}
        <dl className="grid gap-4 text-body-sm text-ink-600 sm:grid-cols-2">
          <div>
            <dt className="terra-field-label text-[0.65rem] tracking-[0.2em]">Category</dt>
            <dd className="text-ink-900">{categoryName ?? "Uncategorized"}</dd>
          </div>
          <div>
            <dt className="terra-field-label text-[0.65rem] tracking-[0.2em]">Updated</dt>
            <dd className="text-ink-900">{formatDate(item.updated_at)}</dd>
          </div>
          <div>
            <dt className="terra-field-label text-[0.65rem] tracking-[0.2em]">Likes</dt>
            <dd className="text-ink-900">{item.likes_count}</dd>
          </div>
          <div>
            <dt className="terra-field-label text-[0.65rem] tracking-[0.2em]">Comments</dt>
            <dd className="text-ink-900">{item.comments_count}</dd>
          </div>
        </dl>
      </div>
      <div className="flex items-center justify-between">
        <Link to={`/content/${item.id}`} className={terraButtonClass("ghost") + " text-sm"}>
          View details
        </Link>
      </div>
    </div>
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
      <header className="space-y-3">
        <h1 className="font-heading text-display-xl text-ink-900">Content Library</h1>
        <p className="text-body-lg text-ink-600">
          Browse the latest resources from the community. Use filters to zoom into collateral that matters for your
          pipeline reviews.
        </p>
      </header>

      <TerraCard title="Refine results" eyebrow={<span className="terra-badge">Filters</span>}>
        <form onSubmit={handleSearchSubmit} className="grid gap-5 md:grid-cols-4">
          <div className="md:col-span-2">
            <TerraField label="Keyword" htmlFor="search" hint="Search by title or description">
              <input
                id="search"
                name="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by title or description"
                className="terra-input"
              />
            </TerraField>
          </div>

          <TerraField label="Category">
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
              className="terra-select"
            >
              <option value="">All categories</option>
              {categoriesQuery.data?.items.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </TerraField>

          <TerraField label="File type">
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
              className="terra-select"
            >
              {FILE_TYPE_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </TerraField>

          <div className="md:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TerraField label="Uploaded after">
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
                className="terra-input terra-date"
              />
            </TerraField>
            <TerraField label="Uploaded before">
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
                className="terra-input terra-date"
              />
            </TerraField>
          </div>

          <div className="flex items-end justify-end gap-3 md:col-span-2">
            <button type="button" onClick={resetFilters} className={terraButtonClass("ghost")}>
              Reset
            </button>
            <button type="submit" className={terraButtonClass("primary")}>
              Apply filters
            </button>
          </div>
        </form>
      </TerraCard>

      {error ? (
        <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-10 text-sm text-red-200">
          Failed to load content: {error.message}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-body-sm text-ink-600">
            <span>{isFetching ? "Refreshing results…" : `${totalRecords} items found`}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, pageParam - 1))}
                disabled={pageParam <= 1}
                className={terraButtonClass("ghost") + " px-4 py-2 text-xs"}
              >
                Previous
              </button>
              <span className="text-data-xs text-ink-500 uppercase tracking-[0.18em]">
                Page {pageParam} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, pageParam + 1))}
                disabled={pageParam >= totalPages}
                className={terraButtonClass("ghost") + " px-4 py-2 text-xs"}
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
            <div className="terra-ledger-section text-center text-body-sm text-ink-600">
              <p>No content matches your filters yet.</p>
              <p className="mt-2 text-body-sm text-ink-500">
                Admins can upload new resources from the admin dashboard.
              </p>
              <Link to="/admin/content" className={terraButtonClass("primary") + " mt-4 inline-flex text-xs"}>
                Go to admin content dashboard
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
