"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateCompany } from "@/lib/actions";
import { INDUSTRIES, PROVINCES } from "@/lib/constants";
import { useApp } from "./app-store";
import { Button } from "./ui/primitives";
import { cn } from "@/lib/utils";

export function CompanyEditModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { me, toast } = useApp();
  const router = useRouter();

  const [name, setName] = useState(me.name);
  const [industry, setIndustry] = useState(me.industry);
  const [description, setDescription] = useState(me.description ?? "");
  const [website, setWebsite] = useState(me.website ?? "");
  const [phone, setPhone] = useState(me.phone ?? "");
  const [address, setAddress] = useState(me.address ?? "");
  const [postcode, setPostcode] = useState(me.postcode ?? "");
  const [city, setCity] = useState(me.city ?? "");
  const [province, setProvince] = useState(me.province ?? "");
  const [kvkNumber, setKvkNumber] = useState(me.kvkNumber ?? "");
  const [vatNumber, setVatNumber] = useState(me.vatNumber ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (saving) return;
    if (!name.trim()) {
      toast("Bedrijfsnaam is verplicht");
      return;
    }
    setSaving(true);
    const res = await updateCompany({
      companyName: name,
      industry,
      description: description.trim() || undefined,
      website: website.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      postcode: postcode.trim() || undefined,
      city: city.trim() || undefined,
      province: province || undefined,
      kvkNumber: kvkNumber.trim() || undefined,
      vatNumber: vatNumber.trim() || undefined,
    });
    setSaving(false);
    if (res.ok) {
      toast("Bedrijfsgegevens opgeslagen");
      onClose();
      router.refresh();
    } else {
      toast("Opslaan mislukt", res.error);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-surface-2/40 px-3.5 py-2.5 text-[15px] outline-none transition-colors placeholder:text-muted focus:border-border-strong focus:bg-surface";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: "100%", opacity: 0.5, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:max-w-xl sm:rounded-3xl"
          >
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-lg font-semibold tracking-tight">Bedrijfsgegevens</h2>
              <button
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-2 pb-6">
              <Field label="Bedrijfsnaam">
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Bedrijfsnaam" />
              </Field>

              <Field label="Sector">
                <div className="no-scrollbar flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                  {INDUSTRIES.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setIndustry(opt)}
                      className={cn(
                        "rounded-full px-3.5 py-2 text-sm font-semibold transition-all active:scale-95",
                        industry === opt ? "bg-foreground text-background shadow-sm" : "bg-surface-2/70 text-muted hover:bg-surface-3 hover:text-foreground"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Omschrijving">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className={cn(inputClass, "resize-none")}
                  placeholder="Waar staat je bedrijf voor?"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Telefoon">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="06…" />
                </Field>
                <Field label="Website">
                  <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} placeholder="https://" />
                </Field>
              </div>

              <Field label="Adres">
                <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="Straat en huisnummer" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Postcode">
                  <input value={postcode} onChange={(e) => setPostcode(e.target.value)} className={inputClass} placeholder="1234 AB" />
                </Field>
                <Field label="Plaats">
                  <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="Plaats" />
                </Field>
              </div>

              <Field label="Provincie">
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Kies een provincie</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="KVK (optioneel)">
                  <input value={kvkNumber} onChange={(e) => setKvkNumber(e.target.value)} className={inputClass} placeholder="KVK-nummer" />
                </Field>
                <Field label="BTW (optioneel)">
                  <input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} className={inputClass} placeholder="BTW-nummer" />
                </Field>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <Button onClick={onClose} variant="secondary" size="md">Annuleren</Button>
              <Button onClick={save} disabled={saving} variant="accent" size="md">
                {saving ? "Opslaan…" : "Opslaan"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</label>
      {children}
    </div>
  );
}
