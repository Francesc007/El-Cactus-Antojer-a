"use client";

import { useState } from "react";
import { ReviewModal, storedReviewIdentifier } from "@/components/reviews/ReviewModal";

export function ReviewButton() {
  const [open, setOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");

  function handleOpen() {
    setIdentifier(storedReviewIdentifier());
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="w-full rounded-2xl border border-cactus-sun/80 bg-cactus-sun/20 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-cactus-sun/30 md:w-auto md:py-4"
      >
        Deja tu reseña
      </button>
      {open && <ReviewModal initialIdentifier={identifier} onClose={() => setOpen(false)} />}
    </>
  );
}
