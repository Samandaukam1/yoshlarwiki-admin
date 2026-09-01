"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  FolderTree,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Logo } from "./logo";
import { ThemeToggle } from "./theme";
import { signOut } from "@/app/login/actions";

const NAV = [
  { href: "/", label: "Boshqaruv paneli", icon: LayoutDashboard, exact: true },
  { href: "/arizalar", label: "Arizalar", icon: Inbox },
  { href: "/nomzodlar", label: "Nomzodlar", icon: Users },
  { href: "/kategoriyalar", label: "Kategoriyalar", icon: FolderTree },
  { href: "/media", label: "Media", icon: ImageIcon },
  { href: "/seo", label: "SEO", icon: Search },
  { href: "/portrait-prompt", label: "Nomzod rasmi prompti", icon: Sparkles },
  { href: "/sozlamalar", label: "Sozlamalar", icon: Settings },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  user,
  siteUrl,
  newApplications,
}: {
  user: { name: string; email: string; role: string };
  siteUrl: string;
  newApplications: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const nav = (
    <nav aria-label="Admin menyusi" className="flex-1 space-y-1 overflow-y-auto p-3">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] transition-colors ${
              active
                ? "bg-accent-soft font-semibold text-accent-soft-fg"
                : "font-medium text-ink-2 hover:bg-surface-hover hover:text-ink"
            }`}
          >
            <item.icon className="size-[18px] shrink-0" strokeWidth={1.8} />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.href === "/arizalar" && newApplications > 0 ? (
              <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-fg">
                {newApplications > 99 ? "99+" : newApplications}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-line p-3">
      <a
        href={siteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium text-ink-2 transition-colors hover:bg-surface-hover hover:text-ink"
      >
        <ExternalLink className="size-[18px] shrink-0" strokeWidth={1.8} />
        Saytni koʻrish
      </a>

      <div className="mt-2 flex items-center gap-3 rounded-[10px] border border-line px-3 py-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-[12px] font-bold text-accent-soft-fg">
          {user.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-ink">
            {user.name}
          </span>
          <span className="block truncate text-[11.5px] text-ink-3">
            {user.role}
          </span>
        </span>
        <ThemeToggle />
      </div>

      <form action={signOut} className="mt-2">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium text-ink-2 transition-colors hover:bg-danger-soft hover:text-danger"
        >
          <LogOut className="size-[18px] shrink-0" strokeWidth={1.8} />
          Chiqish
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Mobil sarlavha */}
      <div className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Menyuni ochish"
          aria-expanded={open}
          className="grid size-10 place-items-center rounded-[10px] border border-line text-ink"
        >
          <Menu className="size-5" strokeWidth={1.9} />
        </button>
        <Logo />
      </div>

      {/* Desktop yon panel */}
      <aside className="fixed inset-y-0 left-0 hidden w-[264px] flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-line px-5">
          <Logo />
        </div>
        {nav}
        {footer}
      </aside>

      {/* Mobil yon panel */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Menyuni yopish"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-ink/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin menyusi"
            className="absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-line bg-surface"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Yopish"
                className="grid size-9 place-items-center rounded-[10px] text-ink hover:bg-surface-hover"
              >
                <X className="size-5" />
              </button>
            </div>
            {nav}
            {footer}
          </div>
        </div>
      ) : null}
    </>
  );
}
