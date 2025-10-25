import { ChangeEvent, FormEvent, useMemo, useState } from "react";

import {
  useAdminContent,
  useArchiveAdminContentMutation,
  useCreateAdminContentMutation,
  useUpdateAdminContentMutation
} from "@/hooks/useAdminContent";
import { useContentCategories } from "@/hooks/useContentLibrary";
import { TerraAlert, TerraCard, TerraField, TerraLedgerSection, terraButtonClass } from "@/components/ui/terra";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" }
];

const FILTER_OPTIONS = [{ value: "all", label: "All statuses" }, ...STATUS_OPTIONS];

export default function AdminContentDashboard() {
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
  const categoryMap = useMemo(() => new Map(categoryOptions.map((category) => [category.id, category.name])), [categoryOptions]);

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
      <TerraAlert tone="danger" title="Failed to load admin content">
        {error.message}
      </TerraAlert>
    );
  }

  return (
    <section className="flex flex-col gap-10">
      <header className="space-y-3">
        <h1 className="font-heading text-display-xl text-ink-900">Admin Content Dashboard</h1>
        <p className="text-body-lg text-ink-600">
          Publish new resources and manage existing content. Archived items remain accessible to admins but are hidden from members.
        </p>
      </header>

      <TerraCard title="Upload new content" eyebrow={<span className="terra-badge">Create</span>}>
        <form onSubmit={handleCreateContent} className="grid gap-4 md:grid-cols-2">
          <TerraField label="Title *">
            <input
              value={createForm.title}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
              required
              className="terra-input"
            />
          </TerraField>
          <TerraField label="Description">
            <textarea
              value={createForm.description}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              className="terra-textarea"
            />
          </TerraField>
          <TerraField label="Status">
            <select
              value={createForm.status}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value }))}
              className="terra-select"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </TerraField>
          <TerraField label="Category">
            <select
              value={createForm.categoryId}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, categoryId: event.target.value }))}
              className="terra-select"
            >
              <option value="">Uncategorized</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </TerraField>
          <TerraField label="File *" hint="200MB max. Supports PDF, PPT, DOCX, PNG, MP4">
            <input
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.mp4"
              onChange={handleFileChange}
              required
              className="terra-field file:mr-4 file:rounded-full file:border-0 file:bg-[rgba(180,106,85,0.9)] file:px-5 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[rgba(180,106,85,0.75)]"
            />
          </TerraField>
          <div className="flex items-end justify-end md:col-span-2">
            <button type="submit" disabled={createMutation.isPending} className={terraButtonClass("primary")}>
              {createMutation.isPending ? "Uploading…" : "Upload content"}
            </button>
          </div>
        </form>
      </TerraCard>

      <TerraLedgerSection
        title="Content inventory"
        description="Adjust filters to review drafts, published items, and archived library entries"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-body-sm text-ink-600">{isLoading ? "Loading inventory…" : `${filteredItems.length} records`}</div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="terra-select max-w-xs"
          >
            {FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 space-y-4">
          {filteredItems.length === 0 ? (
            <TerraAlert tone="info">No content available in this state yet.</TerraAlert>
          ) : (
            filteredItems.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <TerraCard
                  key={item.id}
                  title={item.title}
                  eyebrow={<span className="terra-badge">Status: {item.status}</span>}
                  footer={
                    <div className="flex items-center justify-between text-body-sm text-ink-500">
                      <span>Updated {formatDate(item.updated_at)}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleArchive(item.id)}
                          className={terraButtonClass("ghost") + " text-xs px-4 py-2"}
                        >
                          Archive
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditing(item.id)}
                          className={terraButtonClass("primary") + " text-xs px-4 py-2"}
                        >
                          Edit metadata
                        </button>
                      </div>
                    </div>
                  }
                >
                  {isEditing ? (
                    <form onSubmit={handleUpdateContent} className="grid gap-4 md:grid-cols-2">
                      <TerraField label="Title">
                        <input
                          value={editingForm.title}
                          onChange={(event) => handleEditChange("title", event.target.value)}
                          className="terra-input"
                        />
                      </TerraField>
                      <TerraField label="Description">
                        <textarea
                          value={editingForm.description}
                          onChange={(event) => handleEditChange("description", event.target.value)}
                          className="terra-textarea"
                        />
                      </TerraField>
                      <TerraField label="Status">
                        <select
                          value={editingForm.status}
                          onChange={(event) => handleEditChange("status", event.target.value)}
                          className="terra-select"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </TerraField>
                      <TerraField label="Category">
                        <select
                          value={editingForm.categoryId}
                          onChange={(event) => handleEditChange("categoryId", event.target.value)}
                          className="terra-select"
                        >
                          <option value="">Uncategorized</option>
                          {categoryOptions.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </TerraField>
                      <div className="flex gap-2 md:col-span-2">
                        <button type="submit" className={terraButtonClass("primary") + " px-4 py-2 text-xs"}>
                          Save changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className={terraButtonClass("ghost") + " px-4 py-2 text-xs"}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <dl className="grid gap-4 text-body-sm text-ink-600 sm:grid-cols-2">
                      <div>
                        <dt className="terra-field-label">Category</dt>
                        <dd className="text-ink-900">{item.category_id ? categoryMap.get(item.category_id) : "Uncategorized"}</dd>
                      </div>
                      <div>
                        <dt className="terra-field-label">File</dt>
                        <dd className="text-ink-900">{item.file_type.toUpperCase()}</dd>
                      </div>
                    </dl>
                  )}
                </TerraCard>
              );
            })
          )}
        </div>
      </TerraLedgerSection>
    </section>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}
