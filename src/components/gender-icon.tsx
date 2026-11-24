/**
 * Erkak / Ayol SVG belgilari (♂ / ♀).
 * Erkak — ko'k, ayol — pushti (anketa ranglari bilan bir xil).
 */
export function GenderIcon({
  gender,
  className = "size-4",
  colored = true,
}: {
  gender: "erkak" | "ayol";
  className?: string;
  colored?: boolean;
}) {
  const color = colored ? (gender === "ayol" ? "#ec4899" : "#0050fa") : "currentColor";
  const label = gender === "ayol" ? "Ayol" : "Erkak";

  if (gender === "ayol") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" className={className} role="img" aria-label={label}>
        <title>{label}</title>
        <circle cx="12" cy="9" r="5.5" />
        <path d="M12 14.5V22M8.5 18.5h7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className} role="img" aria-label={label}>
      <title>{label}</title>
      <circle cx="10" cy="14" r="5.5" />
      <path d="M14 10 20.5 3.5M15 3.5h5.5V9" />
    </svg>
  );
}

/** Ikonka + yozuv ko'rinishidagi yorliq. */
export function GenderBadge({ gender }: { gender: "erkak" | "ayol" }) {
  const ayol = gender === "ayol";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[12px] font-semibold ${
        ayol ? "bg-[#fdf2f8] text-[#db2777] dark:bg-[#3b0a26] dark:text-[#f9a8d4]" : "bg-accent-soft text-accent-soft-fg"
      }`}
    >
      <GenderIcon gender={gender} className="size-3.5" colored={false} />
      {ayol ? "Ayol" : "Erkak"}
    </span>
  );
}
