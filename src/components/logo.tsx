import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="YoshlarWiki admin — bosh sahifa"
      className="inline-flex items-center gap-2"
    >
      <span className="size-2 rounded-full bg-accent-text" aria-hidden />
      <span className="text-[19px] font-extrabold leading-none tracking-[-0.02em]">
        <span className="text-accent-text">yoshlar</span>
        <span className="text-ink">wiki</span>
      </span>
      <span className="ml-1 rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-soft-fg">
        admin
      </span>
    </Link>
  );
}
