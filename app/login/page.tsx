"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { loginSchema } from "@/lib/validation/schemas";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/panel";
  const presetError = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState<string | null>(
    presetError === "forbidden"
      ? "Tu usuario no tiene acceso al panel."
      : presetError === "unconfigured"
        ? "Falta configurar Supabase en este entorno."
        : null
  );
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createBrowserSupabaseClient();
    const resetting = params.get("reset") === "1";
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session && resetting) {
        setHasSession(true);
        return;
      }
      if (data.session && !presetError) {
        router.replace(next.startsWith("/panel") ? next : "/panel");
      }
    });
  }, [next, params, presetError, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError("Revisa el correo y usa una contraseña de al menos 8 caracteres.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setError("Supabase no está configurado.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: signError } = await supabase.auth.signInWithPassword(parsed.data);
      if (signError) {
        setError("No se pudo iniciar sesión. Verifica tus datos.");
        return;
      }
      router.replace(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleRecovery() {
    setError(null);
    if (!email.includes("@")) {
      setError("Escribe tu correo para recuperar el acceso.");
      return;
    }
    if (!isSupabaseConfigured()) {
      setError("Supabase no está configurado.");
      return;
    }
    const supabase = createBrowserSupabaseClient();
    const origin = window.location.origin;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/login?reset=1")}`,
    });
    if (resetError) {
      setError("No se pudo enviar el correo de recuperación.");
      return;
    }
    setInfo("Si el correo existe, recibirás un enlace de recuperación.");
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        setError("No se pudo actualizar la contraseña.");
        return;
      }
      router.replace(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (hasSession) {
    return (
      <main className="mesh-warm flex min-h-screen items-center justify-center px-4">
        <form
          onSubmit={handleUpdatePassword}
          className="premium-card w-full max-w-md space-y-4 border-2 border-cactus-forest/40 p-6 ring-1 ring-cactus-lime/30"
        >
          <div className="flex flex-col items-center text-center">
            <span className="mb-4 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1 shadow-sm ring-2 ring-cactus-forest/50">
              <Image
                src="/logo.png"
                alt="El Cactus Antojería"
                width={72}
                height={72}
                className="scale-110 object-contain"
              />
            </span>
            <p className="section-eyebrow">Personal</p>
            <h1 className="section-title">Nueva contraseña</h1>
          </div>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div>
            <label htmlFor="new-password" className="text-sm font-semibold">
              Contraseña nueva
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="input-premium mt-1"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-secondary w-full py-3 text-sm">
            {loading ? "Guardando…" : "Guardar y entrar"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mesh-warm flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="premium-card w-full max-w-md space-y-4 border-2 border-cactus-forest/40 p-6 ring-1 ring-cactus-lime/30"
      >
        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1 shadow-sm ring-2 ring-cactus-forest/50">
            <Image
              src="/logo.png"
              alt="El Cactus Antojería"
              width={72}
              height={72}
              className="scale-110 object-contain"
            />
          </span>
          <p className="section-eyebrow">Personal</p>
          <h1 className="section-title">Entrar al panel</h1>
          <p className="mt-2 text-sm text-stone-600">
            Acceso exclusivo para el equipo de El Cactus Antojería.
          </p>
        </div>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {info && <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">{info}</p>}
        <div>
          <label htmlFor="email" className="text-sm font-semibold">
            Correo
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-premium mt-1"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-semibold">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="input-premium mt-1"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-secondary w-full py-3 text-sm">
          {loading ? "Entrando…" : "Entrar"}
        </button>
        <button
          type="button"
          onClick={handleRecovery}
          className="w-full text-sm font-semibold text-cactus-forest"
        >
          Recuperar acceso
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="mesh-warm min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
