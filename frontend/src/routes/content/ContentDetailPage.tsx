import { FormEvent, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  useContentCategories
} from "@/hooks/useContentLibrary";
import {
  contentCommentsKey,
  contentDetailKey,
  useContentComments,
  useContentDetail,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useDownloadContentMutation,
  useLikeContentMutation,
  useUnlikeContentMutation,
  useUpdateCommentMutation
} from "@/hooks/useContentDetail";
import { useAuth } from "@/providers/AuthProvider";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export default function ContentDetailPage() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const detailQuery = useContentDetail(contentId);
  const commentsQuery = useContentComments(contentId);
  const categoriesQuery = useContentCategories();

  const likeMutation = useLikeContentMutation(contentId);
  const unlikeMutation = useUnlikeContentMutation(contentId);
  const downloadMutation = useDownloadContentMutation(contentId);
  const createCommentMutation = useCreateCommentMutation(contentId);
  const updateCommentMutation = useUpdateCommentMutation(contentId);
  const deleteCommentMutation = useDeleteCommentMutation(contentId);

  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");

  const categoryMap = useMemo(() => {
    if (!categoriesQuery.data) return new Map<string, string>();
    return new Map(categoriesQuery.data.items.map((category) => [category.id, category.name]));
  }, [categoriesQuery.data]);

  if (!contentId) {
    return (
      <section className="rounded-3xl border border-red-500/40 bg-red-500/10 p-10 text-center text-sm text-red-200">
        Invalid content identifier.
      </section>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-300">
        Loading content details…
      </section>
    );
  }

  if (detailQuery.error || !detailQuery.data) {
    return (
      <section className="rounded-3xl border border-red-500/40 bg-red-500/10 p-10 text-center text-sm text-red-200">
        Failed to load content: {detailQuery.error?.message ?? "unknown error"}
      </section>
    );
  }

  const detail = detailQuery.data;
  const comments = commentsQuery.data?.items ?? [];
  const categoryName = detail.category_name ?? (detail.category_id ? categoryMap.get(detail.category_id) ?? "–" : "Uncategorized");

  const handleLikeToggle = () => {
    if (detail.liked_by_me) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  const handleDownload = () => {
    downloadMutation.mutate(undefined, {
      onSuccess: ({ token }) => {
        const baseUrl =
          import.meta.env.VITE_DOWNLOAD_BASE_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
        window.open(`${baseUrl}/content/${contentId}/download?token=${token}`, "_blank");
      }
    });
  };

  const handleCreateComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newComment.trim()) return;
    createCommentMutation.mutate(newComment.trim(), {
      onSuccess: () => {
        setNewComment("");
      }
    });
  };

  const startEditingComment = (commentId: string, body: string) => {
    setEditingCommentId(commentId);
    setEditingCommentBody(body);
  };

  const handleUpdateComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCommentId) return;
    updateCommentMutation.mutate({ commentId: editingCommentId, body: editingCommentBody.trim() }, {
      onSuccess: () => {
        setEditingCommentId(null);
        setEditingCommentBody("");
      }
    });
  };

  const handleDeleteComment = (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    deleteCommentMutation.mutate(commentId);
  };

  return (
    <section className="flex flex-col gap-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex w-fit rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
      >
        ← Back
      </button>

      <header className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg shadow-slate-900/40">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-white">{detail.title}</h1>
            <p className="text-sm text-slate-400">{detail.description ?? "No description provided."}</p>
            <dl className="grid gap-3 text-xs text-slate-400 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="uppercase tracking-wide text-slate-500">Category</dt>
                <dd className="text-sm text-slate-200">{categoryName}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide text-slate-500">File type</dt>
                <dd className="text-sm text-slate-200">{detail.file_type.toUpperCase()}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide text-slate-500">File size</dt>
                <dd className="text-sm text-slate-200">
                  {detail.file_size ? `${(detail.file_size / (1024 * 1024)).toFixed(2)} MB` : "—"}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide text-slate-500">Published</dt>
                <dd className="text-sm text-slate-200">{formatDate(detail.published_at)}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide text-slate-500">Updated</dt>
                <dd className="text-sm text-slate-200">{formatDate(detail.updated_at)}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide text-slate-500">Uploader</dt>
                <dd className="text-sm text-slate-200">{detail.owner_name ?? "—"}</dd>
              </div>
            </dl>
          </div>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleLikeToggle}
              disabled={likeMutation.isPending || unlikeMutation.isPending}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {detail.liked_by_me ? "Unlike" : "Like"} ({detail.likes_count})
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloadMutation.isPending}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-lg shadow-brand/30 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloadMutation.isPending ? "Preparing download…" : "Download"}
            </button>
          </div>
        </div>
      </header>

      <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Comments ({detail.comments_count})</h2>
          <span className="text-xs text-slate-500">Newest at bottom</span>
        </header>

        <form onSubmit={handleCreateComment} className="flex flex-col gap-3">
          <label htmlFor="new-comment" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Add a comment
          </label>
          <textarea
            id="new-comment"
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            placeholder="Share your thoughts or tips…"
            className="min-h-[80px] rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            maxLength={1000}
          />
          <div className="flex justify-end gap-3 text-sm">
            <button
              type="submit"
              disabled={createCommentMutation.isPending || !newComment.trim()}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-lg transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createCommentMutation.isPending ? "Posting…" : "Post comment"}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-300">
              No comments yet. Be the first to share your insights!
            </p>
          ) : (
            comments.map((comment) => {
              const isAuthor = comment.author_id && user?.id === comment.author_id;
              const isEditing = editingCommentId === comment.id;
              return (
                <article key={comment.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
                  <header className="mb-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Posted {formatDate(comment.created_at)}</span>
                    {isAuthor && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditingComment(comment.id, comment.body)}
                          className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="rounded border border-red-500 px-2 py-1 text-xs text-red-300 hover:border-red-400 hover:text-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </header>
                  {isEditing ? (
                    <form onSubmit={handleUpdateComment} className="space-y-3">
                      <textarea
                        value={editingCommentBody}
                        onChange={(event) => setEditingCommentBody(event.target.value)}
                        className="min-h-[60px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingCommentBody("");
                          }}
                          className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-slate-500 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updateCommentMutation.isPending || !editingCommentBody.trim()}
                          className="rounded bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updateCommentMutation.isPending ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm text-slate-200">{comment.body}</p>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </section>
  );
}
