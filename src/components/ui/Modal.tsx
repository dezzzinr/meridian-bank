"use client";

import { useEffect, type ReactNode } from "react";
import { IconX } from "../icons";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxW = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxW?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="animate-fade absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-rise relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-card shadow-2xl shadow-ink/20 sm:rounded-2xl ${maxW}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line-soft px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-[13px] text-ink-soft">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-faint transition hover:bg-paper hover:text-ink"
            aria-label="Close dialog"
          >
            <IconX size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
