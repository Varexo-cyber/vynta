"use client";

import {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import {
  X,
  ImagePlus,
  Check,
  Globe,
  MapPin,
  Map as MapIcon,
  Building2,
  FileText,
  Loader2,
  Link2,
  GripVertical,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { POST_TYPES, POST_TYPE_ORDER } from "@/lib/need-types";
import type { PostType, LinkPreviewData, PostAttachment, Post, Network } from "@/lib/types";
import { useApp } from "./app-store";
import {
  createPost,
  fetchLinkPreview,
  saveDraft,
  getDrafts,
  deleteDraft,
} from "@/lib/actions";
import { Button } from "./ui/primitives";
import { cn } from "@/lib/utils";
import { PostCard } from "./need-card";
import { RichTextEditor } from "./rich-text-editor";
import { htmlToPlainText, isFormattedBody } from "@/lib/rich-text";
import type { Draft } from "@/lib/types";

export function CreatePostModal() {
  const { createOpen, setCreateOpen, createType, setCreateType, myNetworks, networks, toast, me, draftToLoad, setDraftToLoad } = useApp();
  const router = useRouter();

  const [type, setType] = useState<PostType | null>(createType);
  const [body, setBody] = useState("");
  const [quantity, setQuantity] = useState("");
  const [budget, setBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const [expiresDays, setExpiresDays] = useState<number | null>(7);
  const [previewMode, setPreviewMode] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [showRestore, setShowRestore] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<Draft | null>(null);
  const [draftToastShown, setDraftToastShown] = useState(false);
  const [previewBaseTime] = useState(() => Date.now());
  const publishedRef = useRef(false);

  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const [uploadQueue, setUploadQueue] = useState(0);
  const uploading = uploadQueue > 0;
  const bodyText = useMemo(() => htmlToPlainText(body), [body]);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [linkPreview, setLinkPreview] = useState<LinkPreviewData | null>(null);
  const [fetchingLink, setFetchingLink] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const connectedByType = useMemo(() => {
    const map = new Map<string, Network>();
    for (const n of myNetworks) map.set(n.type, n);
    return map;
  }, [myNetworks]);

  const primaryIndustryNet = useMemo(() => {
    return myNetworks.find((n) => n.type === "industry" && n.name === me.industry) ?? connectedByType.get("industry");
  }, [myNetworks, connectedByType, me.industry]);

  const defaultSelected = useMemo(() => {
    return [
      connectedByType.get("municipality")?.id,
      connectedByType.get("province")?.id,
      primaryIndustryNet?.id,
    ].filter((id): id is string => !!id);
  }, [connectedByType, primaryIndustryNet]);

  const displayedSelected = touched ? selected : defaultSelected;

  const extraIndustryNetworks = useMemo(() => {
    const selectedIds = new Set(displayedSelected);
    return networks.filter((n) => n.type === "industry" && !selectedIds.has(n.id));
  }, [networks, displayedSelected]);

  const previewPost: Post = useMemo(
    () => ({
      id: "preview",
      companyId: me.id,
      type: type ?? "update",
      body: bodyText.trim() ? body.trim() : "Hier komt je tekst…",
      quantity: quantity || undefined,
      budget: budget || undefined,
      attachments,
      imageUrl: attachments.find((a) => a.type === "image")?.url,
      videoUrl: attachments.find((a) => a.type === "video")?.url,
      documentUrl: attachments.find((a) => a.type === "document")?.url,
      networks: displayedSelected,
      status: "open",
      reactions: 0,
      comments: 0,
      views: 0,
      saved: false,
      liked: false,
      createdAt: new Date(previewBaseTime).toISOString(),
      expiresAt:
        expiresDays == null
          ? new Date("2999-12-31T00:00:00Z").toISOString()
          : new Date(previewBaseTime + expiresDays * 86400000).toISOString(),
      linkUrl: linkPreview?.url,
      linkData: linkPreview || undefined,
    }),
    [me.id, type, body, bodyText, quantity, budget, attachments, displayedSelected, expiresDays, linkPreview, previewBaseTime]
  );

  const reset = () => {
    setType(null);
    setBody("");
    setQuantity("");
    setBudget("");
    setSelected([]);
    setTouched(false);
    setExpiresDays(7);
    setAttachments([]);
    setUploadQueue(0);
    setLinkUrl(null);
    setLinkPreview(null);
    setFetchingLink(false);
    setPreviewMode(false);
    setDraftId(null);
    setShowRestore(false);
    setPendingDraft(null);
    setDraftToastShown(false);
  };

  const loadDraft = useCallback((draft: Draft) => {
    const d = draft.data;
    const draftBody = d.body ?? "";
    setType(d.type ?? null);
    setBody(isFormattedBody(draftBody) ? htmlToPlainText(draftBody) : draftBody);
    setQuantity(d.quantity ?? "");
    setBudget(d.budget ?? "");
    setSelected(d.networkIds ?? []);
    setTouched(!!d.networkIds && d.networkIds.length > 0);
    setAttachments(d.attachments ?? []);
    setLinkUrl(d.linkUrl ?? null);
    setLinkPreview(d.linkData ?? null);
    setExpiresDays(d.expiresDays ?? 7);
    setDraftId(draft.id);
    setShowRestore(false);
    setPendingDraft(null);
    setDraftToastShown(true);
  }, []);

  useEffect(() => {
    if (!createOpen) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setShowRestore(false);
      if (draftToLoad) {
        loadDraft(draftToLoad);
        setDraftToLoad(null);
        return;
      }
      getDrafts().then((drafts) => {
        if (!cancelled && drafts.length > 0) {
          setPendingDraft(drafts[0]);
          setShowRestore(true);
        }
      });
    });
    return () => { cancelled = true; };
  }, [createOpen, draftToLoad, setDraftToLoad, loadDraft]);

  useEffect(() => {
    if (!createOpen) return;
    const hasContent = bodyText.trim() || attachments.length > 0;
    if (!hasContent) {
      if (draftId) {
        deleteDraft(draftId).then(() => setDraftId(null));
      }
      return;
    }
    const timer = setTimeout(async () => {
      const res = await saveDraft({
        type: type ?? undefined,
        body,
        quantity,
        budget,
        networkIds: displayedSelected,
        attachments,
        linkUrl: linkPreview?.url,
        linkData: linkPreview || undefined,
        expiresDays,
      });
      if (res.ok && res.id) setDraftId(res.id);
      if (!draftToastShown) {
        toast("Bericht opgeslagen in concepten", "Je kunt het later verder bewerken in je account.");
        setDraftToastShown(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [
    body,
    type,
    quantity,
    budget,
    attachments,
    displayedSelected,
    linkPreview,
    expiresDays,
    createOpen,
    draftId,
    draftToastShown,
    toast,
    bodyText,
  ]);

  const extractFirstUrl = useCallback((text: string) => {
    const match = text.match(/https?:\/\/[^\s<>"'`)\]]+/i);
    return match ? match[0] : null;
  }, []);

  const counts = useMemo(() => {
    return attachments.reduce(
      (acc, a) => {
        acc[a.type]++;
        return acc;
      },
      { image: 0, video: 0, document: 0 } as Record<PostAttachment["type"], number>
    );
  }, [attachments]);

  const canAdd = useCallback(
    (type: PostAttachment["type"]) => {
      const limits = { image: 5, video: 3, document: 5 };
      return counts[type] < limits[type];
    },
    [counts]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      setUploadQueue((q) => q + 1);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: form, credentials: "same-origin" });
        const text = await res.text();
        let data: {
          ok?: boolean;
          error?: string;
          url?: string;
          type?: PostAttachment["type"];
          name?: string;
          mimeType?: string;
          width?: number;
          height?: number;
        };
        try {
          data = JSON.parse(text) as typeof data;
        } catch {
          console.error("[upload] Non-JSON response, status:", res.status, "body:", text.slice(0, 200));
          if (res.status === 404) {
            toast("Upload mislukt", "De uploadfunctie is niet bereikbaar (404).");
          } else if (res.status === 413) {
            toast("Upload mislukt", "Het bestand is te groot voor de server.");
          } else if (res.status >= 500) {
            toast("Upload mislukt", "De server kon het bestand niet verwerken. Probeer een kleiner bestand.");
          } else {
            toast("Upload mislukt", `Onverwachte reactie van server (${res.status}).`);
          }
          return;
        }
        if (res.ok && data.ok && data.url && data.type && data.name) {
          const uploaded = { url: data.url, type: data.type, name: data.name };
          setAttachments((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              url: uploaded.url,
              type: uploaded.type,
              filename: uploaded.name,
              position: prev.length,
              mimeType: data.mimeType,
              width: data.width,
              height: data.height,
            },
          ]);
        } else {
          const errMsg = data.error || "Probeer een ander bestand.";
          if (res.status === 401) {
            toast("Sessie verlopen", "Je sessie is verlopen. Log opnieuw in.");
          } else if (res.status === 413) {
            toast("Bestand te groot", errMsg);
          } else if (res.status === 415) {
            toast("Niet toegestaan", errMsg);
          } else {
            toast("Upload mislukt", errMsg);
          }
        }
      } catch (err) {
        console.error("[upload] Network error:", err);
        toast("Upload mislukt", "De uploadfunctie is niet bereikbaar. Controleer je verbinding.");
      } finally {
        setUploadQueue((q) => Math.max(0, q - 1));
      }
    },
    [toast]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      for (const file of files) {
        const typeMap: Record<string, PostAttachment["type"]> = {
          image: "image",
          video: "video",
        };
        const category: PostAttachment["type"] = typeMap[file.type.split("/")[0]] ?? "document";
        if (!canAdd(category)) {
          toast("Limiet bereikt", `Je kunt maximaal 5 foto's, 3 video's en 5 documenten toevoegen.`);
          continue;
        }
        uploadFile(file);
      }
      if (e.target) e.target.value = "";
    },
    [uploadFile, canAdd, toast]
  );

  const updateLinkPreview = useCallback((url: string | null) => {
    if (!url) {
      setLinkUrl(null);
      setLinkPreview(null);
      return;
    }
    if (url === linkUrl) return;
    setLinkUrl(url);
    setFetchingLink(true);
    fetchLinkPreview(url)
      .then((res) => {
        if (res.ok && res.preview) setLinkPreview(res.preview);
        else setLinkPreview(null);
      })
      .catch(() => setLinkPreview(null))
      .finally(() => setFetchingLink(false));
  }, [linkUrl]);

  const handleBodyChange = (text: string) => {
    setBody(text);
    updateLinkPreview(extractFirstUrl(text));
  };

  const close = () => {
    if (!publishedRef.current) {
      const hasContent = bodyText.trim() || attachments.length > 0;
      if (hasContent) {
        saveDraft({
          type: type ?? undefined,
          body,
          quantity,
          budget,
          networkIds: displayedSelected,
          attachments,
          linkUrl: linkPreview?.url,
          linkData: linkPreview || undefined,
          expiresDays,
        });
      } else if (draftId) {
        deleteDraft(draftId);
      }
    }
    setCreateOpen(false);
    setTimeout(() => {
      reset();
      setCreateType(null);
      publishedRef.current = false;
    }, 250);
  };
  const canPublish = type && bodyText.trim().length > 3 && displayedSelected.length > 0;

  const publish = async () => {
    if (!canPublish || !type || submitting) return;
    setSubmitting(true);
    const res = await createPost({
      type,
      body: body.trim(),
      quantity,
      budget,
      networkIds: displayedSelected,
      expiresDays,
      attachments,
      linkUrl: linkPreview?.url,
      linkData: linkPreview || undefined,
    });
    setSubmitting(false);
    if (res.ok) {
      toast("Je post staat live", "Zichtbaar voor de gekozen netwerken.");
      publishedRef.current = true;
      if (draftId) deleteDraft(draftId);
      close();
      router.refresh();
    } else {
      toast("Kon niet plaatsen", res.error);
    }
  };

  const toggleNetwork = (id: string) => {
    setTouched(true);
    setSelected((s) => {
      const base = touched ? s : displayedSelected;
      return base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
    });
  };

  const networkIcon = (type: string) => {
    if (type === "national") return <Globe size={14} />;
    if (type === "province") return <MapIcon size={14} />;
    if (type === "municipality") return <MapPin size={14} />;
    return <Building2 size={14} />;
  };


  return (
    <AnimatePresence>
      {createOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
          <motion.div
            initial={{ y: "100%", opacity: 0.5, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:max-w-xl sm:rounded-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-lg font-semibold tracking-tight">Nieuwe post</h2>
              <button
                onClick={close}
                className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 press"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative flex-1 overflow-y-auto px-6 py-2">
              {/* Type picker */}
              <div
                className="flex w-full min-w-0 flex-wrap gap-2 pb-2 box-border"
                role="radiogroup"
                aria-label="Categorie"
              >
                {POST_TYPE_ORDER.map((t) => {
                  const meta = POST_TYPES[t];
                  const Icon = meta.icon;
                  const active = type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setType(t)}
                      data-tour-id={`post-type-${t}`}
                      className={cn(
                        "flex min-h-[40px] shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2",
                        active
                          ? "bg-foreground text-background ring-1 ring-inset ring-orange-400/70"
                          : "border border-border bg-surface-2 text-foreground hover:border-border-strong hover:bg-surface-3"
                      )}
                    >
                      <Icon size={15} className={active ? "text-background" : "text-muted"} strokeWidth={1.8} />
                      {meta.label}
                    </button>
                  );
                })}
              </div>

              {showRestore && pendingDraft && (
                <div className="mt-4 rounded-2xl border border-border bg-surface-2 p-4">
                  <p className="text-sm font-medium">Je hebt een opgeslagen concept.</p>
                  <p className="text-xs text-muted">
                    Laatst bewerkt: {new Date(pendingDraft.updatedAt).toLocaleString("nl-NL")}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => loadDraft(pendingDraft)}
                      className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-colors hover:opacity-90"
                    >
                      Herstellen
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (pendingDraft) deleteDraft(pendingDraft.id);
                        setShowRestore(false);
                        setPendingDraft(null);
                      }}
                      className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface-3"
                    >
                      Verwijderen
                    </button>
                  </div>
                </div>
              )}

              {/* Compose */}
              <div className="mt-4" data-tour-id="post-body">
                <RichTextEditor
                  value={body}
                  onChange={handleBodyChange}
                  placeholder={
                    type ? POST_TYPES[type].placeholder : "Waar heb je hulp bij?"
                  }
                />
              </div>

              {/* Optional details */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Aantal (optioneel)"
                  className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-border-strong"
                />
                <input
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Budget / prijs (optioneel)"
                  className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-border-strong"
                />
              </div>

              <input
                type="file"
                ref={fileRef}
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                onChange={onFileChange}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                data-tour-id="post-media"
                className="mt-3 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground press disabled:opacity-50"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                {uploading ? "Uploaden…" : "Foto, video of document toevoegen"}
              </button>

              {/* Media preview */}
              {attachments.length > 0 && (
                <div className="mt-3">
                  <p className="mb-2 text-xs text-muted">
                    {attachments.length} bijlage{attachments.length === 1 ? "" : "n"} · sleep om volgorde te wijzigen
                  </p>
                  <Reorder.Group
                    axis="y"
                    values={attachments}
                    onReorder={setAttachments}
                    as="div"
                    className="flex flex-col gap-2"
                  >
                    {attachments.map((a, idx) => (
                      <Reorder.Item
                        key={a.id ?? a.url}
                        value={a}
                        as="div"
                        className="rounded-xl border border-border bg-surface-2 p-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="cursor-grab text-muted">
                            <GripVertical size={18} />
                          </span>
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                            {a.type === "image" && (
                              <img src={a.url.startsWith("/uploads/") ? a.url.replace("/uploads/", "/api/uploads/") : a.url} alt="" className="h-full w-full object-cover" />
                            )}
                            {a.type === "video" && (
                              <video src={a.url.startsWith("/uploads/") ? a.url.replace("/uploads/", "/api/uploads/") : a.url} preload="metadata" muted playsInline className="h-full w-full object-cover" />
                            )}
                            {a.type === "document" && (
                              <div className="grid h-full w-full place-items-center text-muted">
                                <FileText size={18} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold">
                              {idx === 0 ? "Primair" : `#${idx + 1}`}
                            </p>
                            <p className="truncate text-xs text-muted">{a.filename}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setAttachments((prev) => prev.filter((x) => x.id !== a.id))
                            }
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                </div>
              )}

              {/* Link preview */}
              {(fetchingLink || linkPreview) && (
                <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface-2">
                  {fetchingLink && !linkPreview && (
                    <div className="flex items-center gap-3 p-4 text-sm text-muted">
                      <Loader2 size={18} className="animate-spin" />
                      <span>Linkvoorbeeld ophalen…</span>
                    </div>
                  )}
                  {linkPreview && (
                    <a
                      href={linkPreview.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-start gap-3 p-3 transition-colors hover:bg-surface-3"
                    >
                      {linkPreview.image ? (
                        <img
                          src={linkPreview.image}
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
                          {linkPreview.provider || "Link"}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-sm font-semibold group-hover:underline">
                          {linkPreview.title || linkPreview.url}
                        </p>
                        {linkPreview.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{linkPreview.description}</p>
                        )}
                      </div>
                    </a>
                  )}
                </div>
              )}

              {/* Networks */}
              <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-muted">
                Wie wil je bereiken?
              </p>
              <div className="flex flex-wrap gap-2" data-tour-id="post-networks">
                {[
                  { key: "municipality", label: "Mijn gemeente" },
                  { key: "province", label: "Mijn provincie" },
                  { key: "industry", label: "Mijn branche" },
                  { key: "national", label: "Heel Nederland" },
                ].map(({ key, label }) => {
                  const n = connectedByType.get(key);
                  if (!n) return null;
                  const active = displayedSelected.includes(n.id);
                  return (
                    <button
                      key={n.id}
                      onClick={() => toggleNetwork(n.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-all press",
                        active
                          ? "bg-foreground text-background"
                          : "border border-border bg-transparent text-muted hover:border-border-strong hover:text-foreground"
                      )}
                    >
                      {networkIcon(n.type)}
                      {label}
                      {active && <Check size={14} />}
                    </button>
                  );
                })}
              </div>

              {/* Extra industries */}
              {extraIndustryNetworks.length > 0 && (
                <>
                  <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted">
                    Extra branche toevoegen
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {extraIndustryNetworks.map((n) => {
                      const active = displayedSelected.includes(n.id);
                      return (
                        <button
                          key={n.id}
                          onClick={() => toggleNetwork(n.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-all press",
                            active
                              ? "bg-foreground text-background"
                              : "border border-border bg-transparent text-muted hover:border-border-strong hover:text-foreground"
                          )}
                        >
                          {networkIcon(n.type)}
                          {n.name}
                          {active && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Expiry */}
              <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-muted">
                Open houden voor
              </p>
              <div className="flex flex-wrap gap-2">
                {([7, 14, 30, null] as (number | null)[]).map((d) => (
                  <button
                    key={d ?? "unlimited"}
                    onClick={() => setExpiresDays(d)}
                    className={cn(
                      "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all press",
                      expiresDays === d
                        ? "bg-foreground text-background"
                        : "border border-border bg-transparent text-muted hover:border-border-strong hover:text-foreground"
                    )}
                  >
                    {d === null ? "Onbeperkt" : `${d} dagen`}
                  </button>
                ))}
              </div>
            </div>

            {previewMode && (
              <div className="absolute inset-x-0 top-0 bottom-0 z-10 overflow-y-auto bg-surface px-6 py-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-muted">
                    Voorbeeld van je post
                  </p>
                  <button
                    type="button"
                    onClick={() => setPreviewMode(false)}
                    className="rounded-full px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-2"
                  >
                    Terug naar bewerken
                  </button>
                </div>
                <div className="pointer-events-none pb-4">
                  <PostCard post={previewPost} preview index={0} />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
              <p className="text-xs text-muted">
                Zichtbaar in {displayedSelected.length} {displayedSelected.length === 1 ? "netwerk" : "netwerken"}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setPreviewMode((v) => !v)}
                  disabled={!type}
                  size="md"
                  variant="ghost"
                >
                  {previewMode ? "Bewerken" : "Preview"}
                </Button>
                <Button onClick={publish} disabled={!canPublish || submitting} size="md" variant="accent" data-tour-id="post-submit">
                  {submitting ? "Bezig…" : "Plaatsen"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** @deprecated use CreatePostModal */
export const CreateNeedModal = CreatePostModal;
