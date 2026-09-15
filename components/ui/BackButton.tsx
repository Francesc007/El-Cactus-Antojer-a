"use client";

import { useRouter } from "next/navigation";
import { isSafeReturnPath } from "@/lib/privacy-link";

type BackButtonProps = {
  from?: string;
  fallbackHref?: string;
  label?: string;
  className?: string;
};

export function BackButton({
  from,
  fallbackHref = "/",
  label = "Volver",
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  function handleClick() {
    if (from && isSafeReturnPath(from)) {
      router.push(from);
      return;
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1 text-sm font-semibold text-cactus-forest transition hover:text-cactus-forest-dark ${className}`}
    >
      ← {label}
    </button>
  );
}
