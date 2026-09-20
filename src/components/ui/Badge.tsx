import { categoryStyle } from "@/lib/format";
import { IconCheck, IconClock, IconX } from "../icons";

const BASE =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap";

export function StatusBadge({ status }: { status: "pending" | "completed" | "voided" }) {
  if (status === "pending") {
    return (
      <span className={`${BASE} bg-amber-soft text-amber`}>
        <IconClock size={11} /> Pending
      </span>
    );
  }
  if (status === "voided") {
    return (
      <span className={`${BASE} bg-line-soft text-ink-faint`}>
        <IconX size={11} /> Voided
      </span>
    );
  }
  return (
    <span className={`${BASE} bg-good-soft text-good`}>
      <IconCheck size={11} /> Completed
    </span>
  );
}

export function CategoryPill({ category }: { category: string }) {
  return (
    <span className={`${BASE} ${categoryStyle(category)}`}>{category}</span>
  );
}

export function TypeBadge({ type }: { type: "checking" | "savings" }) {
  return type === "savings" ? (
    <span className={`${BASE} bg-brand-soft text-brand-deep`}>Savings</span>
  ) : (
    <span className={`${BASE} bg-line-soft text-ink-soft`}>Checking</span>
  );
}
