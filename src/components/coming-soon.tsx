import { Hammer, type LucideIcon } from "lucide-react";

import { ButtonLink, PageHeader } from "./ui";

/**
 * Hali qurilmagan admin bo'limlari uchun aniq holat.
 * Yon paneldagi havola 404 bermasligi va bo'lim holati ochiq
 * ko'rinishi uchun ishlatiladi.
 */
export function ComingSoon({
  title,
  description,
  icon: Icon = Hammer,
  planned,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  planned: string[];
}) {
  return (
    <>
      <PageHeader title={title} description={description} />

      <div className="mt-8 rounded-card border border-dashed border-line-strong bg-surface p-8">
        <span className="grid size-12 place-items-center rounded-xl bg-warning-soft text-warning">
          <Icon className="size-6" strokeWidth={1.7} />
        </span>

        <h2 className="mt-4 text-[17px] font-bold text-ink">
          Bu boʻlim hali tayyor emas
        </h2>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-2">
          Maʼlumotlar bazasi, RLS siyosatlari va RPC funksiyalari bu boʻlim
          uchun allaqachon tayyor — interfeys qismi qurilmoqda.
        </p>

        <h3 className="mt-6 text-[13px] font-semibold text-ink">
          Rejalashtirilgan imkoniyatlar
        </h3>
        <ul className="mt-2.5 space-y-2">
          {planned.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-[13.5px] text-ink-2"
            >
              <span
                aria-hidden
                className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent-text"
              />
              {item}
            </li>
          ))}
        </ul>

        <ButtonLink href="/" variant="secondary" size="sm" className="mt-7">
          Boshqaruv paneliga qaytish
        </ButtonLink>
      </div>
    </>
  );
}
