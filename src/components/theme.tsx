"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "yw-theme";

/**
 * Gidratsiyadan oldin ishlaydigan skript: noto'g'ri mavzu bilan
 * bir lahzalik "miltillash"ning oldini oladi.
 */
export const themeInitScript = `(function(){try{
var s=localStorage.getItem('${STORAGE_KEY}');
var d=window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', s==='dark'||s==='light'?s:(d?'dark':'light'));
}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

/* ------------------------------------------------------------------ */
/* Mavzu tashqi holat sifatida: manba — <html data-theme> atributi     */
/* ------------------------------------------------------------------ */

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  const observer = new MutationObserver(emit);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  // Foydalanuvchi tanlov qilmagan bo'lsa, OS mavzusini kuzatamiz.
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMediaChange = (event: MediaQueryListEvent) => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (stored === "dark" || stored === "light") return;
    document.documentElement.setAttribute(
      "data-theme",
      event.matches ? "dark" : "light",
    );
  };
  media.addEventListener("change", onMediaChange);

  return () => {
    listeners.delete(listener);
    observer.disconnect();
    media.removeEventListener("change", onMediaChange);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

/** Serverda mavzu noma'lum — skript uni brauzerda o'rnatadi. */
function getServerSnapshot(): Theme {
  return "light";
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Shaxsiy rejimda localStorage bloklangan bo'lishi mumkin — muhim emas.
    }
    emit();
  }, []);

  const toggle = useCallback(() => {
    setTheme(getSnapshot() === "dark" ? "light" : "dark");
  }, [setTheme]);

  return { theme, setTheme, toggle };
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Kunduzgi rejim" : "Tungi rejim"}
      title={isDark ? "Kunduzgi rejim" : "Tungi rejim"}
      className={`grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-hover hover:text-ink ${className}`}
    >
      {/* Ikkala ikonka ham chiziladi; ko'rinadigani CSS orqali tanlanadi,
          shuning uchun gidratsiyada nomuvofiqlik bo'lmaydi. */}
      <Sun
        className="hidden size-[18px] dark:block"
        strokeWidth={1.9}
        aria-hidden
      />
      <Moon
        className="size-[18px] dark:hidden"
        strokeWidth={1.9}
        aria-hidden
      />
    </button>
  );
}
