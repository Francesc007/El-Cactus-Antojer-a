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
        className="rounded-2xl border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
      >
        Deja tu reseña
      </button>
      {open && <ReviewModal initialIdentifier={identifier} onClose={() => setOpen(false)} />}
    </>
  );
}
