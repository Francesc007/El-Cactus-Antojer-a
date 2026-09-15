"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mesh-warm flex min-h-screen items-center justify-center px-4">
      <div className="premium-card max-w-md p-6 text-center">
        <h1 className="section-title">Algo salió mal</h1>
        <p className="mt-2 text-sm text-stone-600">
          Intenta de nuevo. Si el problema continúa, avisa al personal.
        </p>
        <button type="button" onClick={reset} className="btn-secondary mt-6 px-5 py-2 text-sm">
          Reintentar
        </button>
      </div>
    </main>
  );
}
