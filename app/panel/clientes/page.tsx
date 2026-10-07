"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LoyaltyPhoto } from "@/components/loyalty/LoyaltyPhoto";
import { apiRequest } from "@/lib/api-client";
import type { LoyaltyListItem } from "@/lib/types";

function displayPhone(phone: string): string {
  const local = phone.startsWith("52") && phone.length === 12 ? phone.slice(2) : phone;
  if (local.length !== 10) {
    return local;
  }
  return `${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}`;
}

export default function ClientesPage() {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<LoyaltyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ members: LoyaltyListItem[] }>(
        `/api/loyalty/members?q=${encodeURIComponent(nextQuery)}`
      );
      setMembers(data.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la lista.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("");
  }, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-eyebrow">Tarjeta VIP</p>
          <h1 className="section-title mt-1">Clientes</h1>
        </div>
        <Link href="/panel/clientes/escanear" className="btn-secondary px-4 py-2 text-sm">
          Escanear tarjeta
        </Link>
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void load(query);
        }}
      >
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

      {loading && <p className="mt-6 text-stone-500">Cargando clientes…</p>}
      {error && <p className="mt-6 text-red-700">{error}</p>}

      {!loading && !error && members.length === 0 && (
        <p className="mt-6 text-stone-500">No hay clientes con esa búsqueda.</p>
      )}

      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {members.map((member) => (
          <li key={member.id} className="min-w-0">
            <Link
              href={`/panel/clientes/${member.id}`}
              className="premium-card flex h-full flex-col items-center gap-2 p-3 text-center transition hover:ring-2 hover:ring-cactus-lime/40"
            >
              <LoyaltyPhoto
                src={null}
                name={member.fullName}
                progress={member.currentVisits}
                size="xs"
                initialOnly
              />
              <div className="min-w-0 w-full">
                <p className="truncate text-sm font-semibold text-cactus-charcoal">{member.fullName}</p>
                <p className="mt-0.5 font-mono text-[11px] font-bold tracking-wide text-stone-500">
                  {member.folio}
                </p>
                <p className="mt-1 truncate text-xs text-stone-600">{displayPhone(member.phone)}</p>
                <p className="mt-1.5 text-[11px] font-semibold leading-snug text-cactus-forest">
                  {member.status === "inactive" ? (
                    <span className="text-stone-400">Inactiva</span>
                  ) : member.rewardAvailable ? (
                    "Premio listo"
                  ) : (
                    `${member.currentVisits}/${member.visitsPerReward} visitas`
                  )}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
