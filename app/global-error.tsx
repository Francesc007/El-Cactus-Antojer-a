"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <main className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold">Error del sistema</h1>
            <button type="button" onClick={reset} className="mt-4 underline">
              Reintentar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
