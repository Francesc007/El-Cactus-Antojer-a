"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import { LoyaltyConfigOverview } from "@/components/panel/loyalty/LoyaltyConfigOverview";
import type { LoyaltySettingsView } from "@/lib/types";

type SettingsResponse = {
  settings: LoyaltySettingsView;
  canEdit: boolean;
};

const readOnlyFieldClass = "input-premium mt-1 read-only:bg-stone-50 read-only:text-stone-700";

export default function ConfiguracionTarjetaPage() {
  const [settings, setSettings] = useState<LoyaltySettingsView | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiRequest<SettingsResponse>("/api/loyalty/settings");
      setSettings(data.settings);
      setCanEdit(data.canEdit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la configuración.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings || !canEdit) {
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/api/loyalty/settings", {
        method: "PUT",
        body: JSON.stringify({
          visitsPerReward: Number(form.get("visitsPerReward")),
          rewardDescription: String(form.get("rewardDescription") ?? ""),
          minHoursBetweenVisits: Number(form.get("minHoursBetweenVisits")),
          birthdayMessage: String(form.get("birthdayMessage") ?? ""),
        }),
      });
      setNotice("Configuración guardada.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return <p className="text-stone-500">{error ?? "Cargando configuración…"}</p>;
  }

  return (
    <div className="space-y-4">
      <LoyaltyConfigOverview settings={settings} />
      <form onSubmit={(event) => void save(event)} className="premium-card space-y-4 p-4">
        <div>
          <p className="section-eyebrow">Tarjeta VIP</p>
          <h1 className="section-title mt-1">Configuración</h1>
          {!canEdit && (
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Vista de lectura: así la verá el dueño del negocio. Solo el dueño puede guardar cambios.
            </p>
          )}
        </div>
        <label className="block text-sm font-semibold">
          Visitas para el premio
          <input
            name="visitsPerReward"
            type="number"
            min={1}
            max={20}
            defaultValue={settings.visitsPerReward}
            readOnly={!canEdit}
            className={readOnlyFieldClass}
          />
        </label>
        <label className="block text-sm font-semibold">
          Premio
          <input
            name="rewardDescription"
            defaultValue={settings.rewardDescription}
            maxLength={120}
            readOnly={!canEdit}
            className={readOnlyFieldClass}
          />
        </label>
        <label className="block text-sm font-semibold">
          Horas mínimas entre visitas
          <input
            name="minHoursBetweenVisits"
            type="number"
            min={1}
            max={72}
            defaultValue={settings.minHoursBetweenVisits}
            readOnly={!canEdit}
            className={readOnlyFieldClass}
          />
        </label>
        <label className="block text-sm font-semibold">
          Mensaje de WhatsApp manual
          <textarea
            name="birthdayMessage"
            defaultValue={settings.birthdayMessage}
            rows={4}
            maxLength={500}
            readOnly={!canEdit}
            className={readOnlyFieldClass}
          />
        </label>
        {notice && <p className="text-sm font-semibold text-cactus-forest">{notice}</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}
        {canEdit && (
          <button type="submit" disabled={saving} className="btn-primary w-full py-3 text-base">
            {saving ? "Guardando…" : "Guardar"}
          </button>
        )}
      </form>
    </div>
  );
}
