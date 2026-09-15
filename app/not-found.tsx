import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mesh-warm flex min-h-screen items-center justify-center px-4">
      <div className="premium-card max-w-md p-6 text-center">
        <h1 className="section-title">Página no encontrada</h1>
        <Link href="/" className="btn-secondary mt-6 inline-flex px-5 py-2 text-sm">
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
