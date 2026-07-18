"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Send,
  MoreHorizontal,
  CalendarDays,
  Trophy,
  Megaphone,
  Briefcase,
  Tag,
  HelpCircle,
  BarChart3,
  Pencil,
  Trash2,
  UserPlus,
  UserCheck,
  Eye,
  FileText,
  Link2,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MediaGallery } from "@/components/media-gallery";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  isFormattedBody,
  htmlToPlainText,
  plainTextToHtml,
  sanitizeHtml,
} from "@/lib/rich-text";
import type { Post, PostComment, Company, Network, LinkPreviewData } from "@/lib/types";
import { cn, timeAgo, formatNumber } from "@/lib/utils";
import { useApp } from "./app-store";
import { toggleSave, respondToNeed, toggleLike, addComment, getComments, deletePost, updatePost, toggleFollow, recordView, extendPost } from "@/lib/actions";
import { CompanyAvatar, VerifiedBadge } from "./ui/primitives";
import { NetworkIcon } from "./network-icon";
import { POST_TYPES } from "@/lib/need-types";

/* ------------------------------------------------------------------ */
/* Double-tap-to-like hook + heart burst animation                     */
/* ------------------------------------------------------------------ */

const INTERACTIVE_SELECTOR =
  "button, a, input, textarea, select, [role='button'], [contenteditable], video, [data-no-like]";

function shouldSkipLike(e: MouseEvent | TouchEvent): boolean {
  const target = e.target as HTMLElement;
  if (!target) return true;
  if (target.closest(INTERACTIVE_SELECTOR)) return true;
  const sel = window.getSelection();
  if (sel && sel.toString().trim().length > 0) return true;
  return false;
}

function useDoubleTapLike(onLike: (x: number, y: number) => void) {
  const lastTap = useRef<number>(0);
  const lastTapTarget = useRef<HTMLElement | null>(null);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (shouldSkipLike(e.nativeEvent)) return;
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      onLike(x, y);
    },
    [onLike]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (shouldSkipLike(e.nativeEvent)) return;
      const now = Date.now();
      const target = e.currentTarget as HTMLElement;
      const touch = e.changedTouches[0];
      const rect = target.getBoundingClientRect();
      const x = touch ? touch.clientX - rect.left : rect.width / 2;
      const y = touch ? touch.clientY - rect.top : rect.height / 2;
      if (
        now - lastTap.current < 350 &&
        lastTapTarget.current === target
      ) {
        onLike(x, y);
        lastTap.current = 0;
        lastTapTarget.current = null;
      } else {
        lastTap.current = now;
        lastTapTarget.current = target;
      }
    },
    [onLike]
  );

  return { handleDoubleClick, handleTouchEnd };
}

const HEART_COLOR = "#ef4444";

const PARTICLE_DIRECTIONS = [
  { x: -40, y: -50, rotate: -25 },
  { x: 45, y: -45, rotate: 20 },
  { x: -55, y: -20, rotate: -15 },
  { x: 50, y: -25, rotate: 18 },
  { x: -25, y: -60, rotate: -10 },
  { x: 30, y: -55, rotate: 12 },
];

function HeartBurst({ x, y, id }: { x: number; y: number; id: number }) {
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const offsetX = (Math.random() - 0.5) * 30;
  const offsetY = (Math.random() - 0.5) * 20;
  const rotation = (Math.random() - 0.5) * 16;
  const px = x + offsetX;
  const py = y + offsetY;

  if (prefersReduced) {
    return (
      <motion.div
        key={id}
        className="pointer-events-none absolute z-30"
        style={{ left: px, top: py, transform: "translate(-50%, -50%)" }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 1, 0], scale: 1 }}
        transition={{ duration: 0.8, times: [0, 0.3, 1], ease: "easeOut" }}
      >
        <Heart size={72} fill={HEART_COLOR} className="text-red-500 drop-shadow-lg" />
      </motion.div>
    );
  }

  return (
    <motion.div
      key={id}
      className="pointer-events-none absolute z-30"
      style={{ left: px, top: py, transform: "translate(-50%, -50%)" }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.15, 1, 1],
        y: [0, 0, 0, -30],
        rotate: [rotation, rotation, rotation, rotation],
      }}
      transition={{
        duration: 1.0,
        times: [0, 0.15, 0.55, 1],
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Heart size={72} fill={HEART_COLOR} className="text-red-500 drop-shadow-lg" />
      {PARTICLE_DIRECTIONS.slice(0, 5).map((dir, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2"
          initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.3, 0.7, 0.4],
            x: dir.x,
            y: dir.y,
            rotate: dir.rotate,
          }}
          transition={{
            duration: 0.9,
            delay: 0.05,
            ease: "easeOut",
            times: [0, 0.2, 1],
          }}
        >
          <Heart size={18} fill={HEART_COLOR} className="text-red-400" />
        </motion.div>
      ))}
    </motion.div>
  );
}

function HeartBurstLayer({
  hearts,
}: {
  hearts: { id: number; x: number; y: number }[];
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <AnimatePresence>
        {hearts.map((h) => (
          <HeartBurst key={h.id} id={h.id} x={h.x} y={h.y} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export function PostCard({
  post,
  index = 0,
  preview = false,
}: {
  post: Post;
  index?: number;
  preview?: boolean;
}) {
  const { me, companyById, networkById, toast } = useApp();
  const router = useRouter();
  const company = companyById(post.companyId);
  const meta = POST_TYPES[post.type];
  const isMine = post.companyId === me.id;
  const hasMedia =
    post.attachments.length > 0 || !!(post.imageUrl || post.videoUrl);

  const [saved, setSaved] = useState(!!post.saved);
  const [liked, setLiked] = useState(!!post.liked);
  const [likes, setLikes] = useState(post.reactions);
  const [comments, setComments] = useState(post.comments);
  const [commentDraft, setCommentDraft] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [commentList, setCommentList] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replying, setReplying] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(
    isFormattedBody(post.body) ? htmlToPlainText(post.body) : post.body
  );
  const [editQty, setEditQty] = useState(post.quantity ?? "");
  const [editBudget, setEditBudget] = useState(post.budget ?? "");
  const [editLoading, setEditLoading] = useState(false);
  const [viewRecorded, setViewRecorded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const heartIdRef = useRef(0);

  useEffect(() => {
    if (preview || isMine || viewRecorded) return;
    const el = document.getElementById(`post-${post.id}`);
    if (!el) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            timer = setTimeout(() => {
              recordView(post.id);
              setViewRecorded(true);
            }, 1500);
          } else if (timer) {
            clearTimeout(timer);
            timer = null;
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [post.id, isMine, viewRecorded, preview]);

  const postNetworks = post.networks
    .map((id) => networkById(id))
    .filter((n): n is NonNullable<typeof n> => !!n);

  if (!company) return null;

  const onLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikes((v) => (next ? v + 1 : Math.max(0, v - 1)));
    if (next) setLikeAnim(true);
    const res = await toggleLike(post.id);
    if (!res.ok) {
      setLiked(!next);
      setLikes((v) => (!next ? v + 1 : Math.max(0, v - 1)));
    }
    setTimeout(() => setLikeAnim(false), 300);
    router.refresh();
  };

  const onDoubleLike = useCallback((x: number, y: number) => {
    const id = ++heartIdRef.current;
    setHearts((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1200);

    if (liked) return;
    setLiked(true);
    setLikes((v) => v + 1);
    setLikeAnim(true);
    toggleLike(post.id).then((res) => {
      if (!res.ok) {
        setLiked(false);
        setLikes((v) => Math.max(0, v - 1));
      }
    });
    setTimeout(() => setLikeAnim(false), 300);
    router.refresh();
  }, [liked, post.id]);

  const { handleDoubleClick, handleTouchEnd } = useDoubleTapLike(onDoubleLike);

  const onSave = async () => {
    setSaved((s) => !s);
    await toggleSave(post.id);
    router.refresh();
  };

  const onShare = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/company/${post.companyId}`);
    toast("Link gekopieerd", "Deel deze post met je netwerk.");
  };

  const onMessage = async () => {
    setReplying(true);
    const res = await respondToNeed(post.id);
    if (res.ok && res.conversationId) {
      router.push(`/messages/${res.conversationId}`);
    } else {
      toast("Kon geen bericht starten", res.error);
      setReplying(false);
    }
  };

  const onDelete = async () => {
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await deletePost(post.id);
      if (!res.ok) {
        setDeleteError(res.error || "Verwijderen is niet gelukt. Probeer het opnieuw.");
        setDeleteLoading(false);
      } else {
        setShowDeleteModal(false);
        setDeleteLoading(false);
        toast("Post verwijderd", "");
        router.refresh();
      }
    } catch {
      setDeleteError("Verwijderen is niet gelukt. Probeer het opnieuw.");
      setDeleteLoading(false);
    }
  };

  const onEdit = async () => {
    if (!editBody.trim()) return;
    setEditLoading(true);
    const res = await updatePost(post.id, {
      body: editBody,
      quantity: editQty || undefined,
      budget: editBudget || undefined,
    });
    setEditLoading(false);
    if (!res.ok) toast("Bewerken mislukt", res.error);
    else {
      setEditing(false);
      router.refresh();
    }
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const list = await getComments(post.id);
      setCommentList(list);
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next) loadComments();
  };

  const onComment = async () => {
    if (!commentDraft.trim()) return;
    const body = commentDraft.trim();
    setCommentDraft("");
    setComments((c) => c + 1);
    const res = await addComment(post.id, body);
    if (!res.ok) {
      setCommentDraft(body);
      setComments((c) => Math.max(0, c - 1));
    } else {
      await loadComments();
    }
    router.refresh();
  };

  const Layout =
    post.type === "poll"
      ? PollPost
      : post.type === "question"
      ? QuestionPost
      : post.type === "hiring"
      ? JobPost
      : post.type === "event"
      ? EventPost
      : post.type === "milestone" || post.type === "announcement"
      ? MilestonePost
      : post.type === "offer" || post.type === "selling" || post.type === "capacity"
      ? ProductPost
      : hasMedia
      ? MediaPost
      : TextPost;

  return (
    <motion.article
      id={`post-${post.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.25), ease: [0.22, 1, 0.36, 1] }}
      className="relative py-5"
      onDoubleClick={handleDoubleClick}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mx-auto w-full max-w-[720px]">
      {editing ? (
        <div>
          <PostHeader post={post} company={company} meta={meta} postNetworks={postNetworks} />
          <RichTextEditor
            value={editBody}
            onChange={setEditBody}
            placeholder="Bewerk je bericht…"
            className="mt-2"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={editQty}
              onChange={(e) => setEditQty(e.target.value)}
              placeholder="Hoeveelheid"
              className="rounded-2xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-border-strong"
            />
            <input
              value={editBudget}
              onChange={(e) => setEditBudget(e.target.value)}
              placeholder="Budget / prijs"
              className="rounded-2xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-border-strong"
            />
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface-2"
            >
              Annuleren
            </button>
            <button
              onClick={onEdit}
              disabled={!editBody.trim() || editLoading}
              className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-50"
            >
              {editLoading ? "Opslaan…" : "Opslaan"}
            </button>
          </div>
        </div>
      ) : (
        <Layout
          post={post}
          company={company}
          meta={meta}
          postNetworks={postNetworks}
          onEdit={() => setEditing(true)}
          onDelete={onDelete}
        />
      )}

      {!editing && post.attachments.length > 0 && (
        <MediaGallery attachments={post.attachments} onDoubleLike={onDoubleLike} />
      )}

      {!editing && post.linkUrl && post.linkData && (
        <LinkPreviewCard preview={post.linkData} />
      )}

      <EngagementBar
        liked={liked}
        likes={likes}
        likeAnim={likeAnim}
        comments={comments}
        views={post.views}
        saved={saved}
        replying={replying}
        isMine={isMine}
        showComments={showComments}
        hideMessage={post.type === "offer" && !isMine}
        onLike={onLike}
        onSave={onSave}
        onShare={onShare}
        onMessage={onMessage}
        onToggleComments={toggleComments}
      />

      {!isMine && post.type === "offer" && (
        <OfferCTA onMessage={onMessage} replying={replying} />
      )}

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-4">
              {loadingComments && commentList.length === 0 && (
                <p className="text-sm text-muted">Reacties laden…</p>
              )}
              {commentList.map((c) => (
                <div key={c.id} className="flex items-start gap-3">
                  <Link href={`/company/${c.companyId}`} className="shrink-0">
                    <CompanyAvatar name={c.companyName} color={c.logoColor} size={38} />
                  </Link>
                  <div className="min-w-0 flex-1 rounded-2xl bg-surface-2 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/company/${c.companyId}`} className="text-[15px] font-semibold hover:underline">
                        {c.companyName}
                      </Link>
                      <span className="text-xs text-muted">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-[16px] leading-relaxed text-foreground/90">{c.body}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 focus-within:border-border-strong">
                <CompanyAvatar name={me.name} color={me.logoColor} size={34} />
                <input
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onComment()}
                  placeholder="Schrijf een reactie…"
                  className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
                />
                <button
                  onClick={onComment}
                  disabled={!commentDraft.trim()}
                  className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background transition-all disabled:opacity-40 press"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      <HeartBurstLayer hearts={hearts} />

      <DeleteConfirmModal
        open={showDeleteModal}
        loading={deleteLoading}
        error={deleteError}
        onCancel={() => { setShowDeleteModal(false); setDeleteError(null); }}
        onConfirm={confirmDelete}
      />
    </motion.article>
  );
}

/* ------------------------------------------------------------------ */
/* Delete confirmation modal                                          */
/* ------------------------------------------------------------------ */

function DeleteConfirmModal({
  open,
  loading,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => cancelRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      clearTimeout(t);
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4"
      onClick={() => { if (!loading) onCancel(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm rounded-3xl border border-border bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold tracking-tight">Post verwijderen?</h3>
        <p className="mt-2 text-sm text-muted">
          Weet je zeker dat je deze post wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
        </p>

        {error && (
          <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={loading}
            className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 disabled:opacity-50"
          >
            Annuleren
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {loading ? "Verwijderen…" : "Post verwijderen"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Follow button on every post                                      */
/* ------------------------------------------------------------------ */

function FollowButton({ companyId }: { companyId: string }) {
  const { followingIds, toast } = useApp();
  const router = useRouter();
  const [following, setFollowing] = useState(followingIds.has(companyId));

  const handle = async () => {
    const next = !following;
    setFollowing(next);
    const res = await toggleFollow(companyId);
    if (!res.ok) {
      setFollowing(!next);
      toast("Volgen mislukt", res.error);
    }
    router.refresh();
  };

  return (
    <button
      onClick={handle}
      className={cn(
        "ml-1 flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
        following
          ? "border-border bg-surface-2 text-foreground"
          : "border-orange-500/40 bg-orange-500/10 text-orange-600 hover:bg-orange-500/15"
      )}
    >
      {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
      {following ? "Gevolgd" : "Volgen"}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Post layouts                                                       */
/* ------------------------------------------------------------------ */

function PostHeader({
  post,
  company,
  meta,
  postNetworks,
  extra,
  onEdit,
  onDelete,
}: {
  post: Post;
  company: Company;
  meta: (typeof POST_TYPES)[Post["type"]];
  postNetworks: Network[];
  extra?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const { me, toast } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [extending, setExtending] = useState(false);
  const [extendLoading, setExtendLoading] = useState(false);
  const isMine = post.companyId === me.id;

  const onExtend = async (days: number | null) => {
    setExtendLoading(true);
    const res = await extendPost(post.id, days);
    setExtendLoading(false);
    setExtending(false);
    setMenuOpen(false);
    if (res.ok) {
      toast("Post verlengd", days == null ? "Onbeperkt zichtbaar." : `Nog ${days} dagen zichtbaar.`);
    } else {
      toast("Verlengen mislukt", res.error);
    }
  };

  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-4">
        <Link href={`/company/${company.id}`} className="shrink-0">
          <CompanyAvatar
            name={company.name}
            color={company.logoColor}
            logoUrl={company.logoUrl}
            website={company.website}
            size={58}
          />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/company/${company.id}`}
              className="truncate text-[18px] font-semibold hover:underline"
            >
              {company.name}
            </Link>
            {company.verified && <VerifiedBadge size={17} />}
            {!isMine && <FollowButton companyId={company.id} />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[15px] text-muted">
            <span className="font-medium text-foreground">
              {meta.label}
            </span>
            <span>·</span>
            <span>{timeAgo(post.createdAt)}</span>
            {postNetworks.length > 0 && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Eye size={13} />
                  Zichtbaar in{" "}
                  {postNetworks.slice(0, 2).map((n, i) => (
                    <span key={n.id} className="inline-flex items-center gap-1">
                      <NetworkIcon kind={n.type} size={13} />
                      {n.name}
                      {i < Math.min(postNetworks.length, 2) - 1 && ", "}
                    </span>
                  ))}
                  {postNetworks.length > 2 && (
                    <span className="text-muted">+{postNetworks.length - 2}</span>
                  )}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="relative flex items-center gap-1">
        {extra}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-full p-2 text-subtle transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <MoreHorizontal size={20} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-2xl border border-border bg-surface p-1 shadow-lg">
            {extending ? (
              <div className="flex flex-col gap-1 p-1">
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted">Verlengen</p>
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    disabled={extendLoading}
                    onClick={() => onExtend(d)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-surface-2 disabled:opacity-50"
                  >
                    <span>{d} dagen</span>
                    {extendLoading && <span className="h-2 w-2 rounded-full bg-muted" />}
                  </button>
                ))}
                <button
                  disabled={extendLoading}
                  onClick={() => onExtend(null)}
                  className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-surface-2 disabled:opacity-50"
                >
                  Onbeperkt
                </button>
                <button
                  disabled={extendLoading}
                  onClick={() => setExtending(false)}
                  className="mt-1 flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-muted transition-colors hover:bg-surface-2 disabled:opacity-50"
                >
                  Annuleren
                </button>
              </div>
            ) : (
              <>
                {isMine && (
                  <button
                    onClick={() => setExtending(true)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-surface-2"
                  >
                    <CalendarDays size={16} /> Verlengen
                  </button>
                )}
                {isMine && onEdit && (
                  <button
                    onClick={() => { setMenuOpen(false); onEdit(); }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-surface-2"
                  >
                    <Pencil size={16} /> Bewerken
                  </button>
                )}
                {isMine && onDelete && (
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 size={16} /> Verwijderen
                  </button>
                )}
                {!isMine && (
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-muted transition-colors hover:bg-surface-2"
                  >
                    Meer opties binnenkort
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TextPost({
  post,
  company,
  meta,
  postNetworks,
  onEdit,
  onDelete,
}: {
  post: Post;
  company: Company;
  meta: (typeof POST_TYPES)[Post["type"]];
  postNetworks: Network[];
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const short = post.body.length < 140;
  return (
    <div>
      <PostHeader post={post} company={company} meta={meta} postNetworks={postNetworks} onEdit={onEdit} onDelete={onDelete} />
      <ExpandableCaption
        body={post.body}
        className={cn(short ? "text-[21px] leading-snug" : "text-[18px] leading-relaxed")}
      />
      {(post.quantity || post.budget) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.quantity && <Chip label={post.quantity} />}
          {post.budget && <Chip label={post.budget} accent />}
        </div>
      )}
    </div>
  );
}

const BUSINESS_PHOTOS = [
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=675&fit=crop",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=675&fit=crop",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=675&fit=crop",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=675&fit=crop",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=675&fit=crop",
];

function mediaImage(post: Post) {
  return post.imageUrl || BUSINESS_PHOTOS[post.id.charCodeAt(0) % BUSINESS_PHOTOS.length];
}

function MediaPost({
  post,
  company,
  meta,
  postNetworks,
  onEdit,
  onDelete,
}: {
  post: Post;
  company: Company;
  meta: (typeof POST_TYPES)[Post["type"]];
  postNetworks: Network[];
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const image = mediaImage(post);
  const showOwnMedia = post.attachments.length === 0 && (post.imageUrl || post.videoUrl);
  return (
    <div>
      <PostHeader post={post} company={company} meta={meta} postNetworks={postNetworks} onEdit={onEdit} onDelete={onDelete} />
      {post.body && (
        <ExpandableCaption body={post.body} className="mb-2" />
      )}
      {showOwnMedia && (post.videoUrl ? (
        <div className="mx-auto mt-4 w-fit max-w-full overflow-hidden rounded-2xl">
          <video
            src={post.videoUrl}
            controls
            poster={post.imageUrl || undefined}
            preload="metadata"
            playsInline
            className="h-auto max-h-[80vh] w-auto max-w-full"
          />
        </div>
      ) : (
        <div className="mx-auto mt-4 w-fit max-w-full overflow-hidden rounded-2xl">
          <img
            src={image}
            alt=""
            loading="lazy"
            className="h-auto max-h-[80vh] w-auto max-w-full"
          />
        </div>
      ))}
    </div>
  );
}

function JobPost({
  post,
  company,
  meta,
  postNetworks,
  onEdit,
  onDelete,
}: {
  post: Post;
  company: Company;
  meta: (typeof POST_TYPES)[Post["type"]];
  postNetworks: Network[];
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const formattedBody = isFormattedBody(post.body);
  const [title, ...descParts] = formattedBody ? [] : post.body.trim().split("\n");
  const hasExplicitTitle = !formattedBody && descParts.length > 0 && title.length < 90;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="absolute left-0 top-0 h-full w-1.5 bg-foreground/10" />
      <div className="absolute right-4 top-4 hidden sm:block">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-muted">
          <Briefcase size={24} strokeWidth={1.8} />
        </span>
      </div>
      <PostHeader post={post} company={company} meta={meta} postNetworks={postNetworks} onEdit={onEdit} onDelete={onDelete} />
      <div className="relative">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted">
          <Briefcase size={12} strokeWidth={1.8} />
          Vacature
        </div>
        <h3 className="text-[22px] font-bold tracking-tight">
          {hasExplicitTitle ? title : "We zoeken versterking"}
        </h3>
        <RichTextBody
          body={hasExplicitTitle ? descParts.join("\n") : post.body}
          className="mt-3 text-[17px] leading-relaxed text-foreground/85"
        />
        <div className="mt-5 flex flex-wrap gap-2">
          {post.quantity && <Chip label={post.quantity} />}
          {post.budget && <Chip label={post.budget} accent />}
        </div>
      </div>
    </div>
  );
}

function EventPost({
  post,
  company,
  meta,
  postNetworks,
  onEdit,
  onDelete,
}: {
  post: Post;
  company: Company;
  meta: (typeof POST_TYPES)[Post["type"]];
  postNetworks: Network[];
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <PostHeader post={post} company={company} meta={meta} postNetworks={postNetworks} onEdit={onEdit} onDelete={onDelete} />
      <div className="flex items-start gap-4">
        <div className="flex shrink-0 flex-col items-center rounded-2xl border border-border bg-surface-2 px-4 py-3 text-center text-muted">
          <CalendarDays size={24} strokeWidth={1.8} className="mb-1" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Event</span>
        </div>
        <div>
          <RichTextBody
            body={post.body}
            className={cn("text-foreground/95", post.body.length < 120 ? "text-[21px] leading-snug" : "text-[18px] leading-relaxed")}
          />
          {(post.quantity || post.budget) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.quantity && <Chip label={post.quantity} />}
              {post.budget && <Chip label={post.budget} accent />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MilestonePost({
  post,
  company,
  meta,
  postNetworks,
  onEdit,
  onDelete,
}: {
  post: Post;
  company: Company;
  meta: (typeof POST_TYPES)[Post["type"]];
  postNetworks: Network[];
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const Icon = post.type === "milestone" ? Trophy : Megaphone;
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-2 p-6">
      <PostHeader
        post={post}
        company={company}
        meta={meta}
        postNetworks={postNetworks}
        onEdit={onEdit}
        onDelete={onDelete}
        extra={
          <span className="grid h-11 w-11 place-items-center rounded-full bg-surface-2 text-muted">
            <Icon size={22} strokeWidth={1.8} />
          </span>
        }
      />
      <RichTextBody
        body={post.body}
        className={cn("text-foreground/95", post.body.length < 120 ? "text-[24px] leading-snug" : "text-[20px] leading-relaxed")}
      />
    </div>
  );
}

function ProductPost({
  post,
  company,
  meta,
  postNetworks,
  onEdit,
  onDelete,
}: {
  post: Post;
  company: Company;
  meta: (typeof POST_TYPES)[Post["type"]];
  postNetworks: Network[];
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const fallbackImage = post.imageUrl && post.attachments.length === 0 ? mediaImage(post) : undefined;
  return (
    <div className="rounded-2xl border border-border/60 bg-surface p-4">
      <PostHeader post={post} company={company} meta={meta} postNetworks={postNetworks} onEdit={onEdit} onDelete={onDelete} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {fallbackImage && (
          <div className="w-fit shrink-0 overflow-hidden rounded-xl sm:w-40">
            <img src={fallbackImage} alt="" className="h-auto max-h-40 w-auto max-w-full" loading="lazy" />
          </div>
        )}
        <div className="flex-1">
          <ExpandableCaption body={post.body} />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {post.quantity && <Chip label={post.quantity} icon={<Tag size={14} />} />}
            {post.budget && <Chip label={post.budget} accent icon={<Tag size={14} />} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionPost({
  post,
  company,
  meta,
  postNetworks,
  onEdit,
  onDelete,
}: {
  post: Post;
  company: Company;
  meta: (typeof POST_TYPES)[Post["type"]];
  postNetworks: Network[];
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface p-4">
      <PostHeader post={post} company={company} meta={meta} postNetworks={postNetworks} onEdit={onEdit} onDelete={onDelete} />
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-muted">
          <HelpCircle size={24} strokeWidth={1.8} />
        </span>
        <div>
          <RichTextBody
            body={post.body}
            className={cn("text-foreground/95", post.body.length < 120 ? "text-[21px] leading-snug" : "text-[18px] leading-relaxed")}
          />
          {(post.quantity || post.budget) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.quantity && <Chip label={post.quantity} />}
              {post.budget && <Chip label={post.budget} accent />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PollPost({
  post,
  company,
  meta,
  postNetworks,
  onEdit,
  onDelete,
}: {
  post: Post;
  company: Company;
  meta: (typeof POST_TYPES)[Post["type"]];
  postNetworks: Network[];
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const options = ["Ja, zeker", "Nee, nog niet", "Misschien later"];
  return (
    <div className="max-w-3xl rounded-2xl border border-border bg-surface p-5">
      <PostHeader post={post} company={company} meta={meta} postNetworks={postNetworks} onEdit={onEdit} onDelete={onDelete} />
      <RichTextBody
        body={post.body}
        className="mb-4 text-[18px] leading-relaxed text-foreground/95"
      />
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => (
          <button
            key={opt}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3 text-left transition-colors hover:border-border-strong hover:bg-surface-3"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-border text-xs font-semibold text-muted">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="text-[16px] font-medium">{opt}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm text-muted">
        <BarChart3 size={16} />
        <span>{post.reactions + 12} stemmen · 3 opties</span>
      </div>
    </div>
  );
}

const RICH_TEXT_STYLES =
  "[&_a]:text-brand hover:[&_a]:underline [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:last:mb-0 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:last:mb-0 [&_blockquote]:mb-3 [&_blockquote]:last:mb-0 [&_blockquote]:border-l-4 [&_blockquote]:border-brand/30 [&_blockquote]:pl-3 [&_blockquote]:italic [&_p]:mb-3 [&_p]:last:mb-0";

function RichTextBody({ body, className }: { body: string; className?: string }) {
  const html = isFormattedBody(body) ? sanitizeHtml(body) : plainTextToHtml(body);
  return (
    <div
      className={cn(RICH_TEXT_STYLES, className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function ExpandableCaption({ body, className }: { body: string; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const html = isFormattedBody(body) ? sanitizeHtml(body) : plainTextToHtml(body);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const measure = () => setNeedsCollapse(el.scrollHeight > el.clientHeight + 1);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [html]);

  return (
    <div className={className}>
      <div
        ref={textRef}
        className={cn(
          RICH_TEXT_STYLES,
          "text-[17px] leading-relaxed text-foreground/90",
          !expanded && needsCollapse && "line-clamp-5"
        )}
        style={!expanded && needsCollapse ? { WebkitMaskImage: "linear-gradient(to bottom, #000 70%, transparent 100%)" } : undefined}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {needsCollapse && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-sm font-medium text-brand/70 transition-colors hover:text-brand"
        >
          {expanded ? "Minder weergeven" : "Meer weergeven"}
        </button>
      )}
    </div>
  );
}

function OfferCTA({ onMessage, replying }: { onMessage: () => void; replying: boolean }) {
  return (
    <div className="mt-4">
      <button
        onClick={onMessage}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-[15px] font-semibold text-background transition-all hover:opacity-90 press sm:w-auto"
      >
        <Send size={20} />
        {replying ? "Bericht wordt verstuurd…" : "Stuur bericht"}
      </button>
    </div>
  );
}

function LinkPreviewCard({ preview }: { preview: LinkPreviewData }) {
  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noreferrer"
      className="mt-3 flex items-start gap-3 overflow-hidden rounded-2xl border border-border bg-surface-2 p-3 transition-colors hover:bg-surface-3"
    >
      {preview.image ? (
        <img
          src={preview.image}
          alt=""
          className="h-20 w-20 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-surface text-muted">
          <Link2 size={28} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted">
          {preview.provider || "Link"}
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm font-semibold hover:underline">
          {preview.title || preview.url}
        </p>
        {preview.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{preview.description}</p>
        )}
      </div>
    </a>
  );
}

function Chip({ label, accent, icon }: { label: string; accent?: boolean; icon?: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[15px] font-semibold",
        accent ? "bg-foreground text-background" : "bg-surface-2 text-foreground"
      )}
    >
      {icon}
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Engagement                                                         */
/* ------------------------------------------------------------------ */

function EngagementBar({
  liked,
  likes,
  likeAnim,
  comments,
  views,
  saved,
  replying,
  isMine,
  showComments,
  hideMessage,
  onLike,
  onSave,
  onShare,
  onMessage,
  onToggleComments,
}: {
  liked: boolean;
  likes: number;
  likeAnim: boolean;
  comments: number;
  views: number;
  saved: boolean;
  replying: boolean;
  isMine: boolean;
  showComments: boolean;
  hideMessage?: boolean;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onMessage: () => void;
  onToggleComments: () => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between">
      <div className="flex items-center gap-1">
        <EngageButton
          active={liked}
          onClick={onLike}
          icon={
            <Heart
              size={24}
              className={cn("transition-colors duration-200", liked && "fill-red-500 text-red-500", likeAnim && "animate-like")}
            />
          }
          label={formatNumber(likes)}
          activeColor={liked ? "text-red-500" : undefined}
        />
        <EngageButton
          active={showComments}
          onClick={onToggleComments}
          icon={<MessageCircle size={24} />}
          label={formatNumber(comments)}
        />
        <EngageButton onClick={onShare} icon={<Share2 size={22} />} label="Delen" />
      </div>
      <div className="flex items-center gap-1">
        <div className="inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-[15px] font-semibold text-muted">
          <Eye size={22} />
          <span className="tabular">{formatNumber(views)} weergaven</span>
        </div>
        {!isMine && !hideMessage && <EngageButton onClick={onMessage} icon={<Send size={22} />} label={replying ? "Bezig…" : "Bericht"} />}
        <EngageButton
          active={saved}
          onClick={onSave}
          icon={<Bookmark size={22} className={cn("transition-colors duration-200", saved && "fill-foreground text-foreground")} />}
          label={saved ? "Opgeslagen" : "Opslaan"}
        />
      </div>
    </div>
  );
}

function EngageButton({
  active,
  onClick,
  icon,
  label,
  activeColor,
}: {
  active?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  activeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-full px-3.5 text-[15px] font-semibold transition-all duration-200 press",
        active
          ? cn("bg-surface-2", activeColor || "text-foreground")
          : "text-muted hover:bg-surface-2 hover:text-foreground"
      )}
    >
      {icon}
      {label && <span className="tabular">{label}</span>}
    </button>
  );
}
