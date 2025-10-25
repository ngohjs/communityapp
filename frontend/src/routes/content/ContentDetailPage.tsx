import { FormEvent, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { TerraAlert, TerraCard, TerraField, TerraLedgerSection, terraButtonClass } from "@/components/ui/terra";
import { useContentCategories } from "@/hooks/useContentLibrary";
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
      <TerraAlert tone="danger" title="Invalid content identifier">
        The requested content item could not be loaded.
      </TerraAlert>
    );
  }

  if (detailQuery.isLoading) {
    return <TerraCard title="Loading">Loading content details…</TerraCard>;
  }

  if (detailQuery.error || !detailQuery.data) {
    return (
      <TerraAlert tone="danger" title="Failed to load content">
        {detailQuery.error?.message ?? "unknown error"}
      </TerraAlert>
    );
  }

  const detail = detailQuery.data;
  const comments = commentsQuery.data?.items ?? [];
  const categoryName =
    detail.category_name ?? (detail.category_id ? categoryMap.get(detail.category_id) ?? "–" : "Uncategorized");

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
    updateCommentMutation.mutate(
      { commentId: editingCommentId, body: editingCommentBody.trim() },
      {
        onSuccess: () => {
          setEditingCommentId(null);
          setEditingCommentBody("");
        }
      }
    );
  };

  const handleDeleteComment = (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    deleteCommentMutation.mutate(commentId);
  };

  return (
    <section className="flex flex-col gap-8">
      <Link to="/content" className={terraButtonClass("ghost") + " w-fit px-6"}>
        ← Back to library
      </Link>

      <TerraCard title={detail.title} eyebrow={<span className="terra-badge">{categoryName}</span>}>
        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <p className="text-body-lg text-ink-700">{detail.description ?? "No description provided."}</p>
            <dl className="grid gap-4 text-body-sm text-ink-600 sm:grid-cols-2">
              <div>
                <dt className="terra-field-label">File type</dt>
                <dd className="text-ink-900">{detail.file_type.toUpperCase()}</dd>
              </div>
              <div>
                <dt className="terra-field-label">File size</dt>
                <dd className="text-ink-900">
                  {detail.file_size ? `${(detail.file_size / (1024 * 1024)).toFixed(2)} MB` : "—"}
                </dd>
              </div>
              <div>
                <dt className="terra-field-label">Published</dt>
                <dd className="text-ink-900">{formatDate(detail.published_at)}</dd>
              </div>
              <div>
                <dt className="terra-field-label">Updated</dt>
                <dd className="text-ink-900">{formatDate(detail.updated_at)}</dd>
              </div>
              <div>
                <dt className="terra-field-label">Uploader</dt>
                <dd className="text-ink-900">{detail.owner_name ?? "—"}</dd>
              </div>
            </dl>
          </div>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleLikeToggle}
              disabled={likeMutation.isPending || unlikeMutation.isPending}
              className={terraButtonClass("ghost")}
            >
              {detail.liked_by_me ? "Unlike" : "Like"} ({detail.likes_count})
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloadMutation.isPending}
              className={terraButtonClass("primary")}
            >
              {downloadMutation.isPending ? "Preparing download…" : "Download"}
            </button>
          </div>
        </div>
      </TerraCard>

      <TerraLedgerSection title={`Comments (${detail.comments_count})`} description="Newest at bottom">
        <form onSubmit={handleCreateComment} className="flex flex-col gap-3">
          <TerraField label="Add a comment" htmlFor="new-comment">
            <textarea
              id="new-comment"
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              placeholder="Share your thoughts or tips…"
              className="terra-textarea min-h-[100px]"
              maxLength={1000}
            />
          </TerraField>
          <div className="flex justify-end gap-3 text-sm">
            <button
              type="submit"
              disabled={createCommentMutation.isPending || !newComment.trim()}
              className={terraButtonClass("primary")}
            >
              {createCommentMutation.isPending ? "Posting…" : "Post comment"}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {comments.length === 0 ? (
            <TerraAlert tone="info">No comments yet. Be the first to share your insights!</TerraAlert>
          ) : (
            comments.map((comment) => {
              const isAuthor = user?.id && comment.author_id === user.id;
              const isEditing = editingCommentId === comment.id;
              return (
                <TerraCard key={comment.id} title={`Posted ${formatDate(comment.created_at)}`}>
                  {isEditing ? (
                    <form onSubmit={handleUpdateComment} className="flex flex-col gap-3">
                      <textarea
                        value={editingCommentBody}
                        onChange={(event) => setEditingCommentBody(event.target.value)}
                        className="terra-textarea min-h-[90px]"
                        maxLength={1000}
                      />
                      <div className="flex gap-2">
                        <button type="submit" className={terraButtonClass("primary") + " text-xs px-4 py-2"}>
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditingComment("", "")}
                          className={terraButtonClass("ghost") + " text-xs px-4 py-2"}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-body-sm text-ink-700">{comment.body}</p>
                  )}

                  {isAuthor ? (
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => startEditingComment(comment.id, comment.body)}
                        className={terraButtonClass("ghost") + " text-xs px-4 py-2"}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        className={terraButtonClass("primary") + " text-xs px-4 py-2"}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </TerraCard>
              );
            })
          )}
        </div>
      </TerraLedgerSection>
    </section>
  );
}
