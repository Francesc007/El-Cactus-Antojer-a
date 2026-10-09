type LoadingSpinnerProps = {
  label: string;
  className?: string;
};

export function LoadingSpinner({ label, className = "" }: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-10 ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="relative h-11 w-11" aria-hidden>
        <span className="absolute inset-0 rounded-full border-[3px] border-cactus-sand" />
        <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-r-cactus-sunset border-t-cactus-forest" />
      </span>
      <span className="sr-only">{label}</span>
    </div>
  );
}
