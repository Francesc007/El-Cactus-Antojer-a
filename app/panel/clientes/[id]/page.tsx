"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoyaltyPhoto } from "@/components/loyalty/LoyaltyPhoto";
import { StampRow } from "@/components/loyalty/StampRow";
import { ConfirmDialog } from "@/components/panel/ConfirmDialog";
import { ApiRequestError, apiFormRequest, apiRequest } from "@/lib/api-client";
import { firstName, LOYALTY_PHOTO_MAX_BYTES } from "@/lib/loyalty";
import { formatLoyaltyCardWhatsAppMessage } from "@/lib/loyalty-card-share";
import { buildWhatsAppSendUrl } from "@/lib/reservation-whatsapp-message";
import type { LoyaltyMemberDetail, UserRole } from "@/lib/types";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function ClienteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [member, setMember] = useState<LoyaltyMemberDetail | null>(null);
  const [role, setRole] = useState<UserRole>("staff");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ member: LoyaltyMemberDetail; viewerRole: UserRole }>(
        `/api/loyalty/members/${params.id}`
      );
      setMember(data.member);
      setRole(data.viewerRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir la tarjeta.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function withdrawConsent() {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/api/loyalty/members/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ marketingConsent: false }),
      });
      setNotice("El cliente ya no recibirá mensajes.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo quitar el consentimiento.");
    } finally {
      setBusy(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member) {
      return;
    }
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const year = String(form.get("birthYear") ?? "").trim();
    try {
      await apiRequest(`/api/loyalty/members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          fullName: String(form.get("fullName") ?? ""),
          phone: String(form.get("phone") ?? ""),
          birthDay: Number(form.get("birthDay")),
          birthMonth: Number(form.get("birthMonth")),
          birthYear: year.length === 0 ? null : Number(year),
          status: String(form.get("status")),
          marketingConsent: form.get("marketingConsent") === "yes",
        }),
      });
      setNotice("Datos actualizados.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  async function changePhoto(file: File | null) {
    if (!file || !member) {
      return;
    }
    if (file.size > LOYALTY_PHOTO_MAX_BYTES) {
      setError("La foto debe pesar menos de 2 MB.");
      return;
    }
    const form = new FormData();
    form.set("photo", file);
    setBusy(true);
    setError(null);
    try {
      await apiFormRequest(`/api/loyalty/members/${member.id}/photo`, form);
      setNotice("Foto actualizada.");
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo cambiar la foto.");
    } finally {
      setBusy(false);
    }
  }

  async function voidVisit() {
    if (!voidingId) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/api/loyalty/members/${params.id}/visits/${voidingId}/void`, {
        method: "POST",
        body: JSON.stringify({ reason: voidReason }),
      });
      setVoidingId(null);
      setVoidReason("");
      setNotice("Visita anulada.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo anular la visita.");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember() {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/api/loyalty/members/${params.id}`, { method: "DELETE" });
      router.replace("/panel/clientes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la tarjeta.");
      setBusy(false);
    }
  }

  if (loading && !member) {
    return <p className="text-stone-500">Cargando tarjeta…</p>;
  }
  if (!member) {
    return <p className="text-red-700">{error ?? "No encontramos esa tarjeta."}</p>;
  }

  const owner = role === "owner";

  return (
    <div className="space-y-4">
      <section className="premium-card p-4">
        <div className="flex items-center gap-3">
          <LoyaltyPhoto src={member.photoUrl} name={member.fullName} progress={member.currentVisits} size="lg" />
          <div>
            <h1 className="font-display text-2xl font-bold text-cactus-charcoal">{member.fullName}</h1>
            <p className="font-mono text-sm text-stone-500">Folio {member.folio}</p>
            <p className="text-sm text-stone-600">
              {member.status === "inactive" ? "Inactiva · " : ""}
              {member.currentVisits} de {member.visitsPerReward}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <StampRow current={member.currentVisits} total={member.visitsPerReward} />
        </div>
        <button
          type="button"
          onClick={() => {
            const message = formatLoyaltyCardWhatsAppMessage(firstName(member.fullName), member.cardUrl);
            window.open(buildWhatsAppSendUrl(member.phone, message), "_blank", "noopener,noreferrer");
          }}
          className="mt-4 w-full rounded-xl bg-cactus-forest px-4 py-3 text-sm font-bold text-white"
        >
          Reenviar tarjeta por WhatsApp
        </button>
        {member.rewardAvailable && (
          <p className="mt-3 text-sm font-semibold text-cactus-forest">
            Premio disponible: {member.rewardDescription}
          </p>
        )}
        <p className="mt-2 text-sm text-stone-600">
          {member.marketingConsent
            ? "Acepta mensajes de cumpleaños y promociones."
            : "No recibe mensajes."}
        </p>
        {member.marketingConsent && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void withdrawConsent()}
            className="mt-3 text-sm font-semibold text-cactus-sunset"
          >
            Dejar de enviar mensajes
          </button>
        )}
      </section>

      {notice && <p className="text-sm font-semibold text-cactus-forest">{notice}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      <section className="premium-card p-4">
        <h2 className="font-display text-lg font-bold">Visitas</h2>
        {member.visits.length === 0 && <p className="mt-2 text-sm text-stone-500">Todavía no hay visitas.</p>}
        <ul className="mt-3 space-y-3">
          {member.visits.map((visit) => (
            <li key={visit.id} className="border-b border-stone-100 pb-3 text-sm last:border-0">
              <p className={visit.voided ? "text-stone-400 line-through" : "font-semibold"}>
                {visit.visitedAtLabel} · {visit.source === "scan" ? "Escáner" : "Manual"}
              </p>
              {visit.voided && <p className="text-stone-500">Anulada: {visit.voidReason}</p>}
              {owner && !visit.voided && (
                <button
                  type="button"
                  className="mt-1 text-sm font-semibold text-red-700"
                  onClick={() => {
                    setVoidingId(visit.id);
                    setVoidReason("");
                  }}
                >
                  Anular
                </button>
              )}
              {voidingId === visit.id && (
                <div className="mt-2 flex gap-2">
                  <input
                    value={voidReason}
                    onChange={(event) => setVoidReason(event.target.value)}
                    placeholder="Motivo"
                    className="input-premium"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void voidVisit()}
                    className="rounded-xl bg-red-600 px-3 text-sm font-bold text-white"
                  >
                    Confirmar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
        {member.redemptions.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold">Canjes</h3>
            <ul className="mt-2 space-y-1 text-sm text-stone-600">
              {member.redemptions.map((redemption) => (
                <li key={redemption.id}>
                  {redemption.redeemedAtLabel} · {redemption.visitsConsumed} visitas
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {owner && (
        <form
          key={`${member.fullName}-${member.phone}-${member.status}-${member.marketingConsent}`}
          onSubmit={(event) => void save(event)}
          className="premium-card space-y-3 p-4"
        >
          <h2 className="font-display text-lg font-bold">Datos</h2>
          <label className="block text-sm font-semibold">
            Nombre
            <input name="fullName" defaultValue={member.fullName} className="input-premium mt-1" />
          </label>
          <label className="block text-sm font-semibold">
            Teléfono
            <input name="phone" defaultValue={member.phone} className="input-premium mt-1" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold">
              Día
              <input name="birthDay" type="number" min={1} max={31} defaultValue={member.birthDay} className="input-premium mt-1" />
            </label>
            <label className="block text-sm font-semibold">
              Mes
              <select name="birthMonth" defaultValue={member.birthMonth} className="input-premium mt-1">
                {MONTHS.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Año
            <input
              name="birthYear"
              inputMode="numeric"
              defaultValue={member.birthYear ?? ""}
              placeholder="Opcional"
              className="input-premium mt-1"
            />
          </label>
          <label className="block text-sm font-semibold">
            Estado
            <select name="status" defaultValue={member.status} className="input-premium mt-1">
              <option value="active">Activa</option>
              <option value="inactive">Inactiva</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="marketingConsent" value="yes" defaultChecked={member.marketingConsent} />
            Puede recibir mensajes
          </label>
          <label className="block text-sm font-semibold">
            Cambiar foto
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mt-1 block w-full text-sm"
              onChange={(event) => void changePhoto(event.target.files?.[0] ?? null)}
            />
          </label>
          <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-base">
            Guardar datos
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmDelete(true)}
            className="w-full rounded-xl border border-red-300 px-4 py-3 text-sm font-bold text-red-700"
          >
            Eliminar tarjeta y foto
          </button>
        </form>
      )}

      <ConfirmDialog
        open={confirmDelete}
        tone="danger"
        title="Eliminar esta tarjeta"
        description="Se borra la ficha, las visitas, los canjes, los avisos de cumpleaños y la foto. No se puede deshacer."
        confirmLabel="Eliminar"
        loading={busy}
        error={error}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void removeMember()}
      />
    </div>
  );
}
