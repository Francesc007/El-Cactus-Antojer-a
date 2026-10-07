"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiRequestError, apiRequest } from "@/lib/api-client";
import { BIRTHDAY_TEMPLATE_TEXT, BIRTHDAY_WEEKLY_TEMPLATE_TEXT } from "@/lib/loyalty";
import type { LoyaltySettingsView } from "@/lib/types";

type SettingsResponse = {
  settings: LoyaltySettingsView;
  provider: "wa_me" | "whatsapp_cloud";
};

export default function ConfiguracionTarjetaPage() {
  const [settings, setSettings] = useState<LoyaltySettingsView | null>(null);
  const [provider, setProvider] = useState<"wa_me" | "whatsapp_cloud">("wa_me");
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiRequest<SettingsResponse>("/api/loyalty/settings");
      setSettings(data.settings);
      setProvider(data.provider);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 403) {
        setForbidden(true);
        return;
      }
      setError(err instanceof Error ? err.message : "No se pudo cargar la configuración.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) {
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

  if (forbidden) {
    return <p className="text-stone-600">Solo el dueño puede cambiar la tarjeta VIP.</p>;
  }
  if (!settings) {
    return <p className="text-stone-500">{error ?? "Cargando configuración…"}</p>;
  }

  return (
    <form onSubmit={(event) => void save(event)} className="premium-card space-y-4 p-4">
      <div>
        <p className="section-eyebrow">Tarjeta VIP</p>
        <h1 className="section-title mt-1">Configuración</h1>
      </div>
      <label className="block text-sm font-semibold">
        Visitas para el premio
        <input
          name="visitsPerReward"
          type="number"
          min={1}
          max={20}
          defaultValue={settings.visitsPerReward}
          className="input-premium mt-1"
        />
      </label>
      <label className="block text-sm font-semibold">
        Premio
        <input
          name="rewardDescription"
          defaultValue={settings.rewardDescription}
          maxLength={120}
          className="input-premium mt-1"
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
          className="input-premium mt-1"
        />
      </label>
      <label className="block text-sm font-semibold">
        Mensaje de WhatsApp manual
        <textarea
          name="birthdayMessage"
          defaultValue={settings.birthdayMessage}
          rows={4}
          maxLength={500}
          className="input-premium mt-1"
        />
      </label>
      <p className="text-sm leading-relaxed text-stone-600">
        {provider === "wa_me"
          ? "Este texto es el que se abre en WhatsApp. Escribe {{1}} donde quieras el primer nombre. Si no lo pones, el saludo lo agrega solo."
          : "El cumpleaños automático sale con la plantilla aprobada en Meta, no con este texto. Este texto sigue usándose si el envío es manual."}
      </p>
      <div className="rounded-xl bg-stone-50 p-3 text-sm leading-relaxed text-stone-600">
        <p className="font-semibold text-stone-700">Texto sugerido para Meta, categoría Marketing</p>
        <p className="mt-1">{BIRTHDAY_TEMPLATE_TEXT}</p>
        <p className="mt-2">{BIRTHDAY_WEEKLY_TEMPLATE_TEXT}</p>
      </div>
      {notice && <p className="text-sm font-semibold text-cactus-forest">{notice}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary w-full py-3 text-base">
        {saving ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
