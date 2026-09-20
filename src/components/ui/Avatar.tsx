import { avatarTone, initials } from "@/lib/format";

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const cls =
    size === "sm"
      ? "h-8 w-8 text-[11px]"
      : size === "lg"
        ? "h-11 w-11 text-sm"
        : "h-9 w-9 text-xs";
  return (
    <div
      className={`flex shrink-0 select-none items-center justify-center rounded-full font-display font-semibold ${cls} ${avatarTone(name)}`}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
