import Link from "next/link";

import { YoshlarWikiLogo } from "../../components/brand/YoshlarWikiLogo";

/**
 * Admin panel logotipi. Sidebar/mobil sarlavhaning tepasida (`size="md"`)
 * ixcham kvadrat "short" belgi ko'rsatiladi — tor panelga yaxshi sig'adi;
 * login sahifasida (`size="lg"`) esa to'liq gorizontal logotip.
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
  const isLg = size === "lg";
  const height = isLg ? "h-10" : "h-8";

  return (
    <Link
      href={href}
      aria-label="YoshlarWiki admin — bosh sahifa"
      className="inline-flex shrink-0 items-center gap-2"
    >
      <YoshlarWikiLogo
        variant={isLg ? "horizontal" : "short"}
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
