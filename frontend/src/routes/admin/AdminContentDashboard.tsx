import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useContentCategories } from "@/hooks/useContentLibrary";
import {
  useAdminContent,
  useArchiveAdminContentMutation,
  useCreateAdminContentMutation,
  useUpdateAdminContentMutation
} from "@/hooks/useAdminContent";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" }
];

const FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...STATUS_OPTIONS
];

export default function AdminContentDashboard() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useAdminContent();
  const categoriesQuery = useContentCategories();
  const createMutation = useCreateAdminContentMutation();
  const updateMutation = useUpdateAdminContentMutation();
  const archiveMutation = useArchiveAdminContentMutation();

  const [statusFilter, setStatusFilter] = useState("all");
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    status: "draft",
    categoryId: "",
    file: null as File | null
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState({
    title: "",
    description: "",
    status: "draft",
    categoryId: ""
  });

  const categoryOptions = categoriesQuery.data?.items ?? [];
  const categoryMap = useMemo(() => {
    return new Map(categoryOptions.map((category) => [category.id, category.name]));
  }, [categoryOptions]);

  const filteredItems = useMemo(() => {
    if (!data) return [];
    if (statusFilter === "all") return data.items;
    return data.items.filter((item) => item.status === statusFilter);
  }, [data, statusFilter]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setCreateForm((prev) => ({ ...prev, file }));
  };

  const handleCreateContent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createForm.title.trim() || !createForm.file) return;

    createMutation.mutate(
      {
        title: createForm.title.trim(),
        description: createForm.description.trim() || undefined,
        status: createForm.status,
        categoryId: createForm.categoryId || undefined,
        file: createForm.file
      },
      {
        onSuccess: () => {
          setCreateForm({ title: "", description: "", status: "draft", categoryId: "", file: null });
        }
      }
    );
  };

  const startEditing = (contentId: string) => {
    if (!data) return;
    const content = data.items.find((item) => item.id === contentId);
    if (!content) return;
    setEditingId(contentId);
    setEditingForm({
      title: content.title,
      description: content.description ?? "",
      status: content.status,
      categoryId: content.category_id ?? ""
    });
  };

  const handleEditChange = (field: keyof typeof editingForm, value: string) => {
    setEditingForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateContent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) return;
    updateMutation.mutate(
      {
        contentId: editingId,
        payload: {
          title: editingForm.title.trim(),
          description: editingForm.description.trim(),
          status: editingForm.status,
          categoryId: editingForm.categoryId || undefined
        }
      },
      {
        onSuccess: () => {
          setEditingId(null);
        }
      }
    );
  };

  const handleArchive = (contentId: string) => {
    if (!window.confirm("Archive this content?")) return;
    archiveMutation.mutate(contentId);
  };

  if (error) {
    return (
      <section className="rounded-3xl border border-red-500/40 bg-red-500/10 p-10 text-center text-sm text-red-200">
        Failed to load admin content: {error.message}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Admin Content Dashboard</h1>
        <p className="text-sm text-slate-400">
          Publish new resources and manage existing content. Archived items remain accessible to admins but are
          hidden from members.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-900/40">
        <form onSubmit={handleCreateContent} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold text-white">Upload new content</h2>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-300">Title *</span>
            <input
              value={createForm.title}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
              required
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-300">Description</span>
            <textarea
              value={createForm.description}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-300">Status</span>
            <select
              value={createForm.status}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-300">Category</span>
            <select
              value={createForm.categoryId}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, categoryId: event.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            >
              <option value="">Uncategorized</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-300">File *</span>
            <input
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.mp4"
              onChange={handleFileChange}
              required
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40 file:mr-4 file:rounded-md file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-foreground hover:file:bg-indigo-500"
            />
          </label>
          <div className="flex items-end justify-end md:col-span-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-lg transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createMutation.isPending ? "Uploading…" : "Upload content"}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Content inventory</h2>
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            >
              {FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        {isLoading || !data ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-300">
            Loading content…
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-300">
            No content matches the selected filters.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                      <p className="text-sm text-slate-400">{item.description ?? "No description provided."}</p>
                      <dl className="grid gap-3 text-xs text-slate-400 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <dt className="uppercase tracking-wide text-slate-500">Status</dt>
                          <dd className="text-sm text-slate-200">{item.status}</dd>
                        </div>
                        <div>
                          <dt className="uppercase tracking-wide text-slate-500">Category</dt>
                          <dd className="text-sm text-slate-200">
                            {item.category_id ? categoryMap.get(item.category_id) ?? "Uncategorized" : "Uncategorized"}
                          </dd>
                        </div>
                        <div>
                          <dt className="uppercase tracking-wide text-slate-500">Updated</dt>
                          <dd className="text-sm text-slate-200">{new Date(item.updated_at).toLocaleString()}</dd>
                        </div>
                        <div>
                          <dt className="uppercase tracking-wide text-slate-500">File</dt>
                          <dd className="text-sm text-slate-200">{item.file_type.toUpperCase()}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(item.id)}
                        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-white"
                      >
                        Edit metadata
                      </button>
                      {item.status !== "archived" && (
                        <button
                          type="button"
                          onClick={() => handleArchive(item.id)}
                          disabled={archiveMutation.isPending}
                          className="rounded-lg border border-red-500 px-3 py-2 text-xs font-semibold text-red-300 hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <form onSubmit={handleUpdateContent} className="mt-4 grid gap-4 md:grid-cols-2">
                      <input type="hidden" value={editingId ?? ""} />
                      <label className="flex flex-col gap-2 text-sm">
                        <span className="text-slate-300">Title</span>
                        <input
                          value={editingForm.title}
                          onChange={(event) => handleEditChange("title", event.target.value)}
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm">
                        <span className="text-slate-300">Description</span>
                        <textarea
                          value={editingForm.description}
                          onChange={(event) => handleEditChange("description", event.target.value)}
                          rows={3}
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm">
                        <span className="text-slate-300">Status</span>
                        <select
                          value={editingForm.status}
                          onChange={(event) => handleEditChange("status", event.target.value)}
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-2 text-sm">
                        <span className="text-slate-300">Category</span>
                        <select
                          value={editingForm.categoryId}
                          onChange={(event) => handleEditChange("categoryId", event.target.value)}
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
                        >
                          <option value="">Uncategorized</option>
                          {categoryOptions.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="flex items-center justify-end gap-3 md:col-span-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updateMutation.isPending}
                          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-lg transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updateMutation.isPending ? "Saving…" : "Save changes"}
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
