import Link from "next/link";

import { YoshlarWikiLogo } from "../../components/brand/YoshlarWikiLogo";

/**
 * Admin panel logotipi — YoshlarWiki gorizontal logotipi + "admin" belgisi.
 * Sidebar/mobil sarlavha uchun `size="md"`, login sahifasi uchun `size="lg"`.
 */
export function Logo({
  href = "/",
  size = "md",
  priority = false,
}: {
  href?: string;
  size?: "md" | "lg";
  priority?: boolean;
}) {
  const height = size === "lg" ? "h-10" : "h-8";

  return (
    <Link
      href={href}
      aria-label="YoshlarWiki admin — bosh sahifa"
      className="inline-flex shrink-0 items-center gap-2"
    >
      <YoshlarWikiLogo
        variant="horizontal"
        alt=""
        priority={priority}
        className={`${height} w-auto`}
      />
      <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-soft-fg">
        admin
      </span>
    </Link>
  );
}
