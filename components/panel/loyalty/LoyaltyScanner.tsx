"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { LoyaltyPhoto } from "@/components/loyalty/LoyaltyPhoto";
import { StampRow } from "@/components/loyalty/StampRow";
import { ApiRequestError, apiRequest } from "@/lib/api-client";
import { memberCodeFromScan } from "@/lib/loyalty";
import type { LoyaltyListItem, LoyaltyMemberDetail, LoyaltyPreview, LoyaltyVisitSource } from "@/lib/types";

function asPreview(member: LoyaltyMemberDetail): LoyaltyPreview {
  return {
    id: member.id,
    fullName: member.fullName,
    folio: member.folio,
    photoUrl: member.photoUrl,
    currentVisits: member.currentVisits,
    visitsPerReward: member.visitsPerReward,
    rewardDescription: member.rewardDescription,
    rewardAvailable: member.rewardAvailable,
    visitsUntilReward: member.visitsUntilReward,
    tooSoon: member.tooSoon,
    minHours: member.minHours,
    status: member.status,
  };
}

export function LoyaltyScanner() {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<LoyaltyListItem[]>([]);
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [preview, setPreview] = useState<LoyaltyPreview | null>(null);
  const [source, setSource] = useState<LoyaltyVisitSource>("scan");
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  const refresh = useCallback(async (memberId: string) => {
    const data = await apiRequest<{ member: LoyaltyMemberDetail }>(`/api/loyalty/members/${memberId}`);
    return asPreview(data.member);
  }, []);

  const loadPreview = useCallback(async (url: string) => {
    setLoading(true);
    setActionError(null);
    setNotice(null);
    try {
      const data = await apiRequest<{ preview: LoyaltyPreview }>(url);
      setPreview(data.preview);
      setScanning(false);
    } catch (err) {
      setPreview(null);
      setScanning(true);
      setActionError(err instanceof Error ? err.message : "No se encontró la tarjeta.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!scanning) {
      return;
    }

    let stopped = false;
    let handled = false;
    let scanner: { stop: () => Promise<void>; isScanning: boolean } | null = null;

    async function start() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (stopped) {
          return;
        }
        const instance = new Html5Qrcode("loyalty-qr-reader");
        scanner = instance;
        await instance.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            if (handled) {
              return;
            }
            const code = memberCodeFromScan(decodedText);
            if (!code) {
              setScanError("Ese QR no es una tarjeta VIP de El Cactus.");
              return;
            }
            handled = true;
            setSource("scan");
            setScanning(false);
            void loadPreview(`/api/loyalty/preview?code=${code}`);
          },
          () => undefined
        );
      } catch {
        if (!stopped) {
          setCameraMessage(
            "El celular no dejó usar la cámara. Busca al cliente por nombre, teléfono o folio."
          );
        }
      }
    }

    void start();

    return () => {
      stopped = true;
      if (scanner?.isScanning) {
        void scanner.stop().catch(() => undefined);
      }
    };
  }, [loadPreview, scanning]);

  async function openMember(memberId: string) {
    setLoading(true);
    setActionError(null);
    setNotice(null);
    try {
      const data = await apiRequest<{ member: LoyaltyMemberDetail }>(`/api/loyalty/members/${memberId}`);
      setMatches([]);
      setPreview(asPreview(data.member));
      setScanning(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se encontró la tarjeta.");
    } finally {
      setLoading(false);
    }
  }

  async function searchCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim();
    if (!nextQuery) {
      return;
    }
    setSource("manual");
    setLoading(true);
    setActionError(null);
    setNotice(null);
    setScanError(null);
    try {
      const data = await apiRequest<{ members: LoyaltyListItem[] }>(
        `/api/loyalty/members?q=${encodeURIComponent(nextQuery)}`
      );
      if (data.members.length === 0) {
        setMatches([]);
        setPreview(null);
        setActionError("No encontramos a ese cliente. Revisa el nombre, el teléfono o el folio.");
        return;
      }
      if (data.members.length === 1) {
        await openMember(data.members[0].id);
        return;
      }
      setPreview(null);
      setMatches(data.members);
      setScanning(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo buscar al cliente.");
    } finally {
      setLoading(false);
    }
  }

  async function registerVisit(force: boolean) {
    if (!preview) {
      return;
    }
    setLoading(true);
    setActionError(null);
    try {
      await apiRequest(`/api/loyalty/members/${preview.id}/visits`, {
        method: "POST",
        body: JSON.stringify({ source, force }),
      });
      setNotice(force ? "Visita registrada de todos modos." : "Visita registrada.");
      setPreview(await refresh(preview.id));
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === "VISIT_TOO_SOON") {
        setPreview({ ...preview, tooSoon: true });
      }
      setActionError(err instanceof Error ? err.message : "No se pudo registrar la visita.");
    } finally {
      setLoading(false);
    }
  }

  async function redeem() {
    if (!preview) {
      return;
    }
    setLoading(true);
    setActionError(null);
    try {
      await apiRequest(`/api/loyalty/members/${preview.id}/redeem`, { method: "POST" });
      setNotice("Premio canjeado.");
      setPreview(await refresh(preview.id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo canjear el premio.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="section-eyebrow">Tarjeta VIP</p>
      <h1 className="section-title mt-1">Escanear</h1>
      <p className="mt-1 text-sm text-stone-600">
        Leer el código no registra la visita. Si no se puede escanear, busca por nombre, teléfono o folio y confirma a la persona.
      </p>

      <form className="mt-4 flex gap-2" onSubmit={(event) => void searchCustomer(event)}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nombre, teléfono o folio"
          className="input-premium"
        />
        <button type="submit" className="rounded-xl bg-cactus-forest px-4 py-3 text-sm font-bold text-white">
          Buscar
        </button>
      </form>

      {cameraMessage && (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{cameraMessage}</p>
      )}
      {scanError && <p className="mt-3 text-sm text-red-700">{scanError}</p>}
      {actionError && <p className="mt-3 text-sm text-red-700">{actionError}</p>}
      {notice && <p className="mt-3 text-sm font-semibold text-cactus-forest">{notice}</p>}

      {scanning && matches.length === 0 && (
        <div id="loyalty-qr-reader" className="premium-card mt-4 min-h-60 overflow-hidden" />
      )}
      {loading && <p className="mt-4 text-stone-500">Cargando…</p>}

      {matches.length > 1 && !preview && (
        <ul className="mt-4 space-y-2">
          {matches.map((member) => (
            <li key={member.id}>
              <button
                type="button"
                onClick={() => void openMember(member.id)}
                className="premium-card flex w-full items-center gap-3 p-3 text-left"
              >
                <LoyaltyPhoto src={member.photoUrl} name={member.fullName} size="xs" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-cactus-charcoal">
                    {member.fullName}
                  </span>
                  <span className="block font-mono text-xs text-stone-500">Folio {member.folio}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {preview && (
        <section className="premium-card mt-4 p-4 text-center">
          <div className="flex justify-center">
            <LoyaltyPhoto
              src={preview.photoUrl}
              name={preview.fullName}
              progress={preview.currentVisits}
              size="lg"
            />
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold text-cactus-charcoal">{preview.fullName}</h2>
          <p className="font-mono text-sm text-stone-500">Folio {preview.folio}</p>
          <p className="mt-2 text-sm text-stone-600">
            {preview.currentVisits} de {preview.visitsPerReward} visitas
          </p>
          <div className="mt-4">
            <StampRow current={preview.currentVisits} total={preview.visitsPerReward} />
          </div>
          {preview.rewardAvailable && (
            <p className="mt-3 text-sm font-semibold text-cactus-forest">
              Premio disponible: {preview.rewardDescription}
            </p>
          )}
          {preview.status === "inactive" && (
            <p className="mt-3 text-sm text-red-700">Esta tarjeta está inactiva.</p>
          )}
          {preview.tooSoon && preview.status === "active" && (
            <p className="mt-3 text-sm text-amber-900">
              La última visita fue hace menos de {preview.minHours} horas.
            </p>
          )}
          <div className="mt-4 flex flex-col gap-2">
            {preview.status === "active" && (
              <button
                type="button"
                disabled={loading}
                onClick={() => void registerVisit(preview.tooSoon)}
                className="btn-primary w-full py-3 text-base"
              >
                {preview.tooSoon ? "Registrar de todos modos" : "Registrar visita"}
              </button>
            )}
            {preview.status === "active" && preview.rewardAvailable && (
              <button
                type="button"
                disabled={loading}
                onClick={() => void redeem()}
                className="btn-secondary w-full py-3 text-base"
              >
                Canjear premio
              </button>
            )}
            <button
              type="button"
              className="rounded-xl border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-600"
              onClick={() => {
                setPreview(null);
                setMatches([]);
                setNotice(null);
                setActionError(null);
                setScanning(true);
              }}
            >
              Escanear otra
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
