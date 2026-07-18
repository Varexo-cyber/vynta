"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2, Upload, Loader2 } from "lucide-react";
import { useApp } from "./app-store";
import { CompanyAvatar } from "./ui/primitives";
import { CropModal, type CropData } from "./crop-modal";
import {
  updateCompanyLogo,
  updateCompanyBanner,
  deleteCompanyLogo,
  deleteCompanyBanner,
} from "@/lib/actions";
import { cn } from "@/lib/utils";

export function CompanyBrandingSettings() {
  const { me, toast } = useApp();
  const router = useRouter();
  const [cropOpen, setCropOpen] = useState(false);
  const [cropType, setCropType] = useState<"logo" | "banner">("logo");
  const [pendingUpload, setPendingUpload] = useState<{ url: string; file: File; type: "logo" | "banner" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<"logo" | "banner" | null>(null);
  const [logoUrl, setLogoUrl] = useState(me.logoUrl);
  const [bannerUrl, setBannerUrl] = useState(me.bannerUrl);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (type: "logo" | "banner") => {
    setCropType(type);
    (type === "logo" ? logoInputRef : bannerInputRef).current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      toast("Ongeldig bestandstype", "Gebruik JPG, PNG of WebP.");
      return;
    }

    const maxSize = type === "logo" ? 10 : 20;
    if (file.size > maxSize * 1024 * 1024) {
      toast("Bestand te groot", `Maximaal ${maxSize} MB voor ${type === "logo" ? "logo" : "banner"}.`);
      return;
    }

    const url = URL.createObjectURL(file);
    setPendingUpload({ url, file, type });
    setCropOpen(true);
  };

  const onCropSave = async (cropData: CropData) => {
    if (!pendingUpload) return;
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("file", pendingUpload.file);

      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "same-origin" });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch {
        toast("Upload mislukt", `Server reactie ongeldig (${res.status}).`);
        setSaving(false);
        return;
      }
      if (!data.ok) {
        toast("Upload mislukt", data.error || "Onbekende fout.");
        setSaving(false);
        return;
      }

      if (pendingUpload.type === "logo") {
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

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    if (confirmDelete === "logo") {
      const result = await deleteCompanyLogo();
      if (result.ok) {
        setLogoUrl(undefined);
        toast("Logo verwijderd");
        router.refresh();
      } else {
        toast("Verwijderen mislukt", result.error);
      }
    } else {
      const result = await deleteCompanyBanner();
      if (result.ok) {
        setBannerUrl(undefined);
        toast("Banner verwijderd");
        router.refresh();
      } else {
        toast("Verwijderen mislukt", result.error);
      }
    }
    setConfirmDelete(null);
    setSaving(false);
  };

  const aspectRatio = cropType === "logo" ? 1 : 16 / 5;

  return (
    <div className="mt-6">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">Bedrijfsuitstraling</p>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {/* Logo section */}
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-4">
            <CompanyAvatar
              name={me.name}
              color={me.logoColor}
              logoUrl={logoUrl}
              website={me.website}
              size={64}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">Bedrijfslogo</p>
              <p className="text-sm text-muted">Vierkant, minimaal 400×400px</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFileSelect("logo")}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-semibold transition-colors hover:bg-surface-2 disabled:opacity-50"
              >
                <Upload size={14} />
                {logoUrl ? "Vervangen" : "Uploaden"}
              </button>
              {logoUrl && (
                <button
                  onClick={() => setConfirmDelete("logo")}
                  disabled={saving}
                  className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                  aria-label="Logo verwijderen"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Banner section */}
        <div className="p-4">
          <div className="flex flex-col gap-3">
            <div className="relative h-[80px] w-full overflow-hidden rounded-xl bg-surface-2">
              {bannerUrl ? (
                <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                  Geen banner ingesteld
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold">Bedrijfsbanner</p>
                <p className="text-sm text-muted">Breed, minimaal 1600×500px</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFileSelect("banner")}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-semibold transition-colors hover:bg-surface-2 disabled:opacity-50"
                >
                  <Upload size={14} />
                  {bannerUrl ? "Vervangen" : "Uploaden"}
                </button>
                  {bannerUrl && (
                  <button
                    onClick={() => setConfirmDelete("banner")}
                    disabled={saving}
                    className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                    aria-label="Banner verwijderen"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => onFileChange(e, "logo")}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => onFileChange(e, "banner")}
      />

      {/* Crop modal */}
      <CropModal
        open={cropOpen}
        imageUrl={pendingUpload?.url ?? null}
        aspectRatio={aspectRatio}
        title={cropType === "logo" ? "Logo bijsnijden" : "Banner bijsnijden"}
        onCancel={onCropCancel}
        onSave={onCropSave}
        saving={saving}
      />

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <h3 className="text-lg font-semibold">
              {confirmDelete === "logo" ? "Bedrijfslogo verwijderen?" : "Bedrijfsbanner verwijderen?"}
            </h3>
            <p className="mt-2 text-sm text-muted">
              {confirmDelete === "logo"
                ? "Vynta toont daarna de initialen van je bedrijf."
                : "De standaardachtergrond wordt opnieuw gebruikt."}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface-2"
              >
                Annuleren
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
