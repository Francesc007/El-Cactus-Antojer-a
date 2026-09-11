"use client";

import { useEffect } from "react";

type ToastProps = {
  message: string;
  onClose: () => void;
  duration?: number;
};

export function Toast({ message, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 max-w-sm -translate-x-1/2 rounded-xl bg-cactus-forest px-5 py-4 text-sm font-semibold text-white shadow-lg"
    >
      {message}
    </div>
  );
}
