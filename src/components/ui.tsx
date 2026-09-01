import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Tugmalar                                                           */
/* ------------------------------------------------------------------ */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover",
  secondary:
    "border border-line bg-surface text-ink hover:bg-surface-hover hover:border-line-strong",
  ghost: "text-ink-2 hover:bg-surface-hover hover:text-ink",
  danger: "border border-line bg-surface text-danger hover:bg-danger-soft",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-[14px]",
};

export function btn(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = "",
) {
  return `inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return (
    <Link href={href} className={btn(variant, size, className)}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Sahifa sarlavhasi                                                  */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[24px] font-bold tracking-[-0.02em] text-ink lg:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-[14px] text-ink-2">{description}</p>
        ) : null}
      </div>
      {children ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {children}
        </div>
      ) : null}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Karta / panel                                                      */
/* ------------------------------------------------------------------ */

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`rounded-card border border-line bg-surface ${
        padded ? "p-5" : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function CardTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-[15px] font-bold text-ink">{children}</h2>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Statistika kartasi                                                 */
/* ------------------------------------------------------------------ */

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
}) {
  const body = (
    <>
      <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-soft-fg">
        <Icon className="size-[19px]" strokeWidth={1.8} />
      </span>
      <p className="mt-4 text-[26px] font-bold leading-none tracking-[-0.02em] text-ink tabular-nums">
        {value}
      </p>
      <p className="mt-1.5 text-[13px] text-ink-2">{label}</p>
      {hint ? <p className="mt-0.5 text-[12px] text-ink-3">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group rounded-card border border-line bg-surface p-5 transition-all hover:border-line-strong hover:shadow-yw"
      >
        {body}
        <span className="mt-3 flex items-center gap-1 text-[12px] font-medium text-accent-text">
          Batafsil
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    );
  }

  return (
    <div className="rounded-card border border-line bg-surface p-5">{body}</div>
  );
}

/* ------------------------------------------------------------------ */
/* Yorliqlar                                                          */
/* ------------------------------------------------------------------ */

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-2",
  info: "bg-accent-soft text-accent-soft-fg",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-1 text-[12px] font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Bo'sh holat                                                        */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-accent-soft text-accent-soft-fg">
        <Icon className="size-6" strokeWidth={1.7} />
      </span>
      <h3 className="mt-4 text-[16px] font-bold text-ink">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-ink-2">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Forma elementlari                                                  */
/* ------------------------------------------------------------------ */

export const inputClass =
  "h-11 w-full rounded-[10px] border border-line bg-surface px-3.5 text-[14px] text-ink outline-none transition-colors focus:border-accent-text placeholder:text-ink-3";

export const textareaClass =
  "w-full rounded-[10px] border border-line bg-surface px-3.5 py-3 text-[14px] leading-relaxed text-ink outline-none transition-colors focus:border-accent-text placeholder:text-ink-3";

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-semibold text-ink"
      >
        {label}
      </label>
      {hint ? <p className="mt-1 text-[12px] text-ink-3">{hint}</p> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Jadval                                                             */
/* ------------------------------------------------------------------ */

export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface">
      <table className="w-full min-w-[720px] border-collapse text-left">
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={`border-b border-line px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-ink-3 ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`border-b border-line px-4 py-3 text-[13.5px] text-ink-2 ${className}`}>
      {children}
    </td>
  );
}

/* ------------------------------------------------------------------ */
/* Sanani formatlash                                                  */
/* ------------------------------------------------------------------ */

export function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
