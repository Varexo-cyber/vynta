"use client";

import { useState, useEffect } from "react";
import { Plus, X, Trash2, Zap, MapPin, Target, Bell, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addCompanyService,
  deleteCompanyService,
  addServiceArea,
  deleteServiceArea,
  updateOpportunityPreferences,
} from "@/lib/opportunity-actions";
import type { ServiceCategory, CompanyService, CompanyServiceArea, CompanyOpportunityPreferences } from "@/lib/types";

export function OpportunitySettings({
  categories,
  services,
  serviceAreas,
  preferences,
}: {
  categories: ServiceCategory[];
  services: CompanyService[];
  serviceAreas: CompanyServiceArea[];
  preferences: CompanyOpportunityPreferences;
}) {
  const [showAddService, setShowAddService] = useState(false);
  const [selectedCat, setSelectedCat] = useState("");
  const [keywords, setKeywords] = useState("");
  const [prefs, setPrefs] = useState(preferences);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const level0 = categories.filter((c) => c.level === 0);
  const level1 = categories.filter((c) => c.level === 1);
  const level2 = categories.filter((c) => c.level === 2);

  const childMap = new Map<string, ServiceCategory[]>();
  for (const c of categories) {
    if (c.parentId) {
      const arr = childMap.get(c.parentId) ?? [];
      arr.push(c);
      childMap.set(c.parentId, arr);
    }
  }

  const handleAddService = async () => {
    if (!selectedCat && !keywords.trim()) return;
    const kw = keywords.trim()
      ? keywords.split(",").map((k) => k.trim()).filter(Boolean)
      : [];
    const result = await addCompanyService(selectedCat || null, kw);
    if (result.ok) {
      setShowAddService(false);
      setSelectedCat("");
      setKeywords("");
      window.location.reload();
    }
  };

  const handleDeleteService = async (id: string) => {
    await deleteCompanyService(id);
    window.location.reload();
  };

  const handleAddArea = async () => {
    const result = await addServiceArea({ areaType: "radius", radiusKm: 50, country: "Nederland" });
    if (result.ok) window.location.reload();
  };

  const handleDeleteArea = async (id: string) => {
    await deleteServiceArea(id);
    window.location.reload();
  };

  const updatePref = async (field: string, value: unknown) => {
    setSaving(true);
    const input: Record<string, unknown> = { [field]: value };
    const result = await updateOpportunityPreferences(input as Parameters<typeof updateOpportunityPreferences>[0]);
    setSaving(false);
    if (result.ok) {
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Services */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-muted" />
            <h3 className="text-sm font-bold">Jouw diensten</h3>
          </div>
          <button
            onClick={() => setShowAddService(!showAddService)}
            className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
          >
            <Plus size={12} /> Toevoegen
          </button>
        </div>

        {showAddService && (
          <div className="mb-3 rounded-xl border border-border bg-surface p-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase text-muted">Categorie</label>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none"
            >
              <option value="">Kies een categorie...</option>
              {level0.map((c) => (
                <optgroup key={c.id} label={c.name}>
                  {(childMap.get(c.id) ?? []).map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                      {(childMap.get(sub.id) ?? []).length > 0 &&
                        ` — ${(childMap.get(sub.id) ?? []).map((s) => s.name).join(", ")}`}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-muted">
              Zoekwoorden (optioneel, komma-gescheiden)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="bijv. CNC, aluminium, verspaning"
              className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddService}
                className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
              >
                Opslaan
              </button>
              <button
                onClick={() => setShowAddService(false)}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}

        {services.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
            Nog geen diensten toegevoegd. Voeg diensten toe om relevante kansen te ontvangen.
          </p>
        ) : (
          <div className="space-y-2">
            {services.map((s) => {
              const cat = categories.find((c) => c.id === s.categoryId);
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{cat?.name ?? "Algemene dienst"}</p>
                    {s.keywords.length > 0 && (
                      <p className="text-xs text-muted">{s.keywords.join(", ")}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteService(s.id)}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Service Areas */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-muted" />
            <h3 className="text-sm font-bold">Werkgebied</h3>
          </div>
          <button
            onClick={handleAddArea}
            className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
          >
            <Plus size={12} /> Toevoegen
          </button>
        </div>

        {serviceAreas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
            Standaard 50 km radius. Voeg specifieke gebieden toe voor betere matching.
          </p>
        ) : (
          <div className="space-y-2">
            {serviceAreas.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {a.municipality ?? a.province ?? `${a.radiusKm ?? 50} km radius`}
                  </p>
                  <p className="text-xs text-muted">{a.country}</p>
                </div>
                <button
                  onClick={() => handleDeleteArea(a.id)}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preferences */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Zap size={18} className="text-muted" />
          <h3 className="text-sm font-bold">Voorkeuren</h3>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
          {/* Availability */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-muted">Beschikbaarheid</label>
            <select
              value={prefs.availabilityStatus}
              onChange={(e) => {
                const v = e.target.value as typeof prefs.availabilityStatus;
                setPrefs({ ...prefs, availabilityStatus: v });
                updatePref("availabilityStatus", v);
              }}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none"
            >
              <option value="available">Beschikbaar</option>
              <option value="limited">Beperkt beschikbaar</option>
              <option value="urgent_only">Alleen spoed</option>
              <option value="unavailable">Niet beschikbaar</option>
            </select>
          </div>

          {/* Max distance */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-muted">
              Maximale afstand: {prefs.maxDistanceKm} km
            </label>
            <input
              type="range"
              min={5}
              max={300}
              step={5}
              value={prefs.maxDistanceKm}
              onChange={(e) => setPrefs({ ...prefs, maxDistanceKm: Number(e.target.value) })}
              onMouseUp={(e) => updatePref("maxDistanceKm", Number((e.target as HTMLInputElement).value))}
              className="w-full accent-foreground"
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-2">
            <PrefToggle
              label="Accepteer spoedopdrachten"
              checked={prefs.acceptsUrgent}
              onChange={(v) => { setPrefs({ ...prefs, acceptsUrgent: v }); updatePref("acceptsUrgent", v); }}
            />
            <PrefToggle
              label="Accepteer zakelijke aanvragen"
              checked={prefs.acceptsBusiness}
              onChange={(v) => { setPrefs({ ...prefs, acceptsBusiness: v }); updatePref("acceptsBusiness", v); }}
            />
            <PrefToggle
              label="Accepteer terugkerende opdrachten"
              checked={prefs.acceptsRecurring}
              onChange={(v) => { setPrefs({ ...prefs, acceptsRecurring: v }); updatePref("acceptsRecurring", v); }}
            />
          </div>
        </div>
      </div>

      {/* Notification settings */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Bell size={18} className="text-muted" />
          <h3 className="text-sm font-bold">Notificaties</h3>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-muted">Frequentie</label>
            <select
              value={prefs.notificationFrequency}
              onChange={(e) => {
                const v = e.target.value as typeof prefs.notificationFrequency;
                setPrefs({ ...prefs, notificationFrequency: v });
                updatePref("notificationFrequency", v);
              }}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none"
            >
              <option value="instant">Direct</option>
              <option value="hourly">Elk uur</option>
              <option value="twice_daily">2x per dag</option>
              <option value="daily">Dagelijks</option>
              <option value="urgent_only">Alleen spoed</option>
              <option value="paused">Gepauzeerd</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-muted">
              Max notificaties per dag: {prefs.maxNotificationsPerDay}
            </label>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={prefs.maxNotificationsPerDay}
              onChange={(e) => setPrefs({ ...prefs, maxNotificationsPerDay: Number(e.target.value) })}
              onMouseUp={(e) => updatePref("maxNotificationsPerDay", Number((e.target as HTMLInputElement).value))}
              className="w-full accent-foreground"
            />
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock size={14} className="text-muted" />
            <span className="text-muted">Stille uren: {prefs.quietHoursStart} – {prefs.quietHoursEnd}</span>
          </div>
        </div>
      </div>

      {savedMsg && (
        <p className="text-xs text-green-600 dark:text-green-500">✓ Opgeslagen</p>
      )}
    </div>
  );
}

function PrefToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-foreground" : "bg-surface-2"
        )}
      >
        <span className={cn(
          "absolute top-1 h-4 w-4 rounded-full bg-background shadow transition-all",
          checked ? "left-6" : "left-1"
        )} />
      </button>
    </div>
  );
}
