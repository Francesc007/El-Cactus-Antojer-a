"use client";

type ReviewImageDialogProps = {
  open: boolean;
  src: string | null;
  name: string;
  onClose: () => void;
};

export function ReviewImageDialog({ open, src, name, onClose }: ReviewImageDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Captura de ${name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-cactus-charcoal/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-3 shadow-premium"
        onClick={(event) => event.stopPropagation()}
      >
        {src ? (
          // URL firmada de corta duración; no pasa por el optimizador.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`Captura enviada por ${name}`} className="mx-auto max-h-[80vh] w-auto max-w-full rounded-xl" />
        ) : (
          <p className="p-6 text-center text-sm text-stone-500">No se pudo mostrar la captura.</p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl border-2 border-cactus-forest/35 bg-white px-4 py-3 text-sm font-semibold text-cactus-forest"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
