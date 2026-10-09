"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  buildCalendarDays,
  formatMonthYear,
  formatPickerDate,
  monthFromDateStr,
  shiftMonth,
  WEEKDAY_LABELS_ES,
} from "@/lib/date-picker";

type DatePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  disabled = false,
  className = "",
  placeholder = "Selecciona una fecha",
}: DatePickerProps) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const rootRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const [{ year, monthIndex }, setView] = useState(() => monthFromDateStr(value));

  useEffect(() => {
    setView(monthFromDateStr(value));
  }, [value]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }

    function updatePosition() {
      const trigger = rootRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewTop = viewport?.offsetTop ?? 0;
      const viewHeight = viewport?.height ?? window.innerHeight;
      const viewBottom = viewTop + viewHeight;
      const margin = 12;
      const width = Math.min(Math.max(rect.width, 280), window.innerWidth - margin * 2);
      const left = Math.min(Math.max(margin, rect.left), window.innerWidth - width - margin);
      const spaceBelow = Math.max(0, viewBottom - rect.bottom - margin);
      const spaceAbove = Math.max(0, rect.top - viewTop - margin);
      const needed = calendarRef.current?.scrollHeight ?? 380;
      const placeBelow = spaceBelow >= needed || spaceBelow >= spaceAbove;
      const room = placeBelow ? spaceBelow : spaceAbove;
      const maxHeight = Math.max(1, Math.min(needed, room));
      const unclampedTop = placeBelow ? rect.bottom + 8 : rect.top - 8 - maxHeight;
      const top = Math.min(
        Math.max(viewTop + margin, unclampedTop),
        Math.max(viewTop + margin, viewBottom - margin - maxHeight)
      );

      setMenuPos((current) => {
        if (
          current &&
          current.top === Math.round(top) &&
          current.left === Math.round(left) &&
          current.width === Math.round(width) &&
          current.maxHeight === Math.round(maxHeight)
        ) {
          return current;
        }
        return {
          top: Math.round(top),
          left: Math.round(left),
          width: Math.round(width),
          maxHeight: Math.round(maxHeight),
        };
      });
    }

    updatePosition();
    const frame = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.visualViewport?.addEventListener("resize", updatePosition);
    window.visualViewport?.addEventListener("scroll", updatePosition);
    function handleScroll(event: Event) {
      if (calendarRef.current?.contains(event.target as Node)) return;
      updatePosition();
    }
    document.addEventListener("scroll", handleScroll, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.visualViewport?.removeEventListener("resize", updatePosition);
      window.visualViewport?.removeEventListener("scroll", updatePosition);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, year, monthIndex]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || calendarRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const days = buildCalendarDays(year, monthIndex, value || "", min, max);

  function handleSelect(dateStr: string) {
    onChange(dateStr);
    setOpen(false);
  }

  const calendar =
    open && menuPos ? (
      <div
        ref={calendarRef}
        role="dialog"
        aria-label="Calendario"
        style={{
          position: "fixed",
          top: menuPos.top,
          left: menuPos.left,
          width: menuPos.width,
          maxHeight: menuPos.maxHeight,
          zIndex: 80,
        }}
        className="overflow-y-auto overscroll-contain rounded-2xl border-2 border-cactus-forest/25 bg-white p-4 shadow-xl ring-1 ring-cactus-lime/20"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label="Mes anterior"
            onClick={() => setView((current) => shiftMonth(current.year, current.monthIndex, -1))}
            className="rounded-lg border border-cactus-sand px-3 py-1.5 text-sm font-bold text-cactus-forest transition hover:bg-cactus-cream"
          >
            ‹
          </button>
          <p className="font-display text-base font-bold text-cactus-charcoal">
            {formatMonthYear(year, monthIndex)}
          </p>
          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() => setView((current) => shiftMonth(current.year, current.monthIndex, 1))}
            className="rounded-lg border border-cactus-sand px-3 py-1.5 text-sm font-bold text-cactus-forest transition hover:bg-cactus-cream"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_LABELS_ES.map((label) => (
            <div
              key={label}
              className="py-1 text-[11px] font-bold uppercase tracking-wide text-cactus-sunset"
            >
              {label}
            </div>
          ))}

          {days.map((day) => {
            const selected = day.isSelected;
            const muted = !day.inMonth || day.disabled;

            return (
              <button
                key={day.dateStr}
                type="button"
                disabled={day.disabled}
                aria-label={formatPickerDate(day.dateStr)}
                aria-pressed={selected}
                onClick={() => handleSelect(day.dateStr)}
                className={[
                  "rounded-xl py-2 text-sm font-semibold transition",
                  selected
                    ? "bg-cactus-forest text-white shadow-sm"
                    : day.isToday
                      ? "border border-cactus-lime/70 bg-cactus-lime/15 text-cactus-forest"
                      : "text-stone-700 hover:bg-cactus-cream",
                  muted && !selected ? "opacity-35" : "",
                  day.disabled ? "cursor-not-allowed hover:bg-transparent" : "",
                ].join(" ")}
              >
                {day.day}
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={inputId}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
        className="input-premium flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-base" aria-hidden>
            📅
          </span>
          <span className={value ? "truncate text-stone-900" : "truncate text-stone-400"}>
            {value ? formatPickerDate(value) : placeholder}
          </span>
        </span>
        <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-cactus-forest">
          {open ? "Cerrar" : "Elegir"}
        </span>
      </button>

      {calendar ? createPortal(calendar, document.body) : null}
    </div>
  );
}
