"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Phone, Mail, MessageCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useApp } from "./app-store";
import { toggleFollow } from "@/lib/actions";
import { CompanyAvatar, VerifiedBadge } from "./ui/primitives";
import { CropModal, type CropData } from "./crop-modal";
import { cn, formatNumber } from "@/lib/utils";
import type { Company } from "@/lib/types";

export function CompanyProfileHeader({
  company,
  postsCount,
  followingInitial,
}: {
  company: Company;
  postsCount: number;
  followingInitial: boolean;
}) {
  const { me, toast } = useApp();
  const router = useRouter();
  const isMe = company.id === me.id;
  const [following, setFollowing] = useState(followingInitial);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropType, setCropType] = useState<"logo" | "banner">("logo");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUpload, setPendingUpload] = useState<{ url: string; file: File; type: "logo" | "banner" } | null>(null);
  const [logoUrl, setLogoUrl] = useState(company.logoUrl);
  const [bannerUrl, setBannerUrl] = useState(company.bannerUrl);
  const [saving, setSaving] = useState(false);

  const stats = [
    { label: "Volgers", value: formatNumber(company.followers) },
    { label: "Posts", value: `${postsCount}` },
    { label: "Beoordeling", value: company.rating.toFixed(1) },
  ];

  const onFollow = async () => {
    setFollowing((v) => !v);
    const res = await toggleFollow(company.id);
    if (!res.ok) setFollowing((v) => !v);
    router.refresh();
  };

  const handleFileSelect = (type: "logo" | "banner") => {
    setCropType(type);
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      toast("Ongeldig bestandstype", "Gebruik JPG, PNG of WebP.");
      return;
    }

    const maxSize = cropType === "logo" ? 10 : 20;
    if (file.size > maxSize * 1024 * 1024) {
      toast("Bestand te groot", `Maximaal ${maxSize} MB voor ${cropType === "logo" ? "logo" : "banner"}.`);
      return;
    }

    const url = URL.createObjectURL(file);
    setPendingUpload({ url, file, type: cropType });
    setCropOpen(true);
  };

  const onCropSave = async (cropData: CropData) => {
    if (!pendingUpload) return;
    setSaving(true);

    const formData = new FormData();
    formData.append("file", pendingUpload.file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.ok) {
        toast("Upload mislukt", data.error);
        setSaving(false);
        return;
      }

      if (pendingUpload.type === "logo") {
        const { updateCompanyLogo } = await import("@/lib/actions");
        const result = await updateCompanyLogo(data.url, cropData);
        if (result.ok && result.url) {
          setLogoUrl(result.url);
          toast("Logo bijgewerkt");
          setCropOpen(false);
          router.refresh();
        } else {
          toast("Opslaan mislukt", result.error);
        }
      } else {
        const { updateCompanyBanner } = await import("@/lib/actions");
        const result = await updateCompanyBanner(data.url, cropData);
        if (result.ok && result.url) {
          setBannerUrl(result.url);
          toast("Banner bijgewerkt");
          setCropOpen(false);
          router.refresh();
        } else {
          toast("Opslaan mislukt", result.error);
        }
      }
    } catch {
      toast("Upload mislukt", "Probeer het opnieuw.");
    }
    URL.revokeObjectURL(pendingUpload.url);
    setPendingUpload(null);
    setSaving(false);
  };

  const onCropCancel = () => {
    setCropOpen(false);
    if (pendingUpload) {
      URL.revokeObjectURL(pendingUpload.url);
      setPendingUpload(null);
    }
  };

  const aspectRatio = cropType === "logo" ? 1 : 16 / 5;

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFileChange}
      />

      <CropModal
        open={cropOpen}
        imageUrl={pendingUpload?.url ?? null}
        aspectRatio={aspectRatio}
        title={cropType === "logo" ? "Logo bijsnijden" : "Banner bijsnijden"}
        onCancel={onCropCancel}
        onSave={onCropSave}
        saving={saving}
      />

      <Link href="/feed" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground press">
        <ArrowLeft size={16} /> Terug
      </Link>

      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        {/* Banner */}
        <div className="relative h-[140px] w-full sm:h-[200px] lg:h-[260px]">
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt=""
              className="h-full w-full object-cover"
              style={{
                objectPosition: company.bannerCropData
                  ? `${50 + (company.bannerCropData.x / 100)}% ${50 + (company.bannerCropData.y / 100)}%`
                  : "center",
                transform: company.bannerCropData ? `scale(${company.bannerCropData.zoom})` : undefined,
              }}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-surface-2 via-surface to-surface-2 dark:from-surface-3 dark:via-surface-2 dark:to-surface-3">
              <div className="absolute inset-0 opacity-30 dark:opacity-20">
                <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-foreground/[0.04] blur-3xl dark:bg-orange-500/10" />
                <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-foreground/[0.03] blur-3xl dark:bg-orange-500/5" />
              </div>
            </div>
          )}

          {isMe && (
            <button
              onClick={() => handleFileSelect("banner")}
              className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-opacity hover:bg-black/70"
              aria-label="Bedrijfsbanner wijzigen"
            >
              <Camera size={14} />
              Banner wijzigen
            </button>
          )}
        </div>

        {/* Logo + info section */}
        <div className="px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
            {/* Logo overlapping banner */}
            <div className="relative -mt-12 sm:-mt-14">
              <div className="rounded-full bg-surface ring-4 ring-surface">
                <CompanyAvatar
                  name={company.name}
                  color={company.logoColor}
                  logoUrl={logoUrl}
                  website={company.website}
                  size={96}
                  className="ring-2 ring-background sm:h-[120px] sm:w-[120px]"
                />
              </div>
              {isMe && (
                <button
                  onClick={() => handleFileSelect("logo")}
                  className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-110"
                  aria-label="Bedrijfslogo wijzigen"
                >
                  <Camera size={14} />
                </button>
              )}
            </div>

            {/* Name + meta */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{company.name}</h1>
                {company.verified && <VerifiedBadge size={20} />}
              </div>
              <p className="mt-1 text-sm text-muted sm:text-base">
                {company.industry} · {company.city}
              </p>
            </div>
          </div>

          {company.description && (
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-foreground/90 sm:text-[17px]">
              {company.description}
            </p>
          )}

          {/* Stats */}
          <div className="mt-5 flex flex-wrap items-center gap-6 border-t border-border pt-4 text-sm">
            {stats.map((s) => (
              <div key={s.label} className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold tabular">{s.value}</span>
                <span className="text-muted">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            {isMe ? (
              <button
                onClick={() => router.push("/settings")}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-2"
              >
                Profiel bewerken
              </button>
            ) : (
              <>
                <button
                  onClick={onFollow}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
                    following
                      ? "border border-border bg-surface-2 text-foreground"
                      : "bg-foreground text-background hover:opacity-90"
                  )}
                >
                  {following ? "Volgend" : "Volgen"}
                </button>
                <button
                  onClick={() => router.push("/messages")}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-2"
                >
                  <MessageCircle size={16} /> Bericht
                </button>
              </>
            )}
            {company.phone && (
              <a
                href={`tel:${company.phone}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <Phone size={16} />
              </a>
            )}
            {company.email && (
              <a
                href={`mailto:${company.email}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <Mail size={16} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
