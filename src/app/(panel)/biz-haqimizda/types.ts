/**
 * Saytdagi "Biz haqimizda" sahifasining tahrirlanadigan matni.
 * `site_settings` jadvalida `about` kaliti ostida (is_public = true) saqlanadi.
 *
 * Bu turning nusxasi sayt repoda ham bor:
 * yoshlarwiki-user/src/lib/about.ts — maydon qo'shilsa, ikkalasi ham yangilansin.
 */
export type AboutContent = {
  /** Sahifa boshidagi umumiy ma'lumot. Bo'sh qator — yangi xatboshi. */
  intro: string;
  fee_enabled: boolean;
  fee_title: string;
  /** Faqat raqamlar, masalan "150000". Bo'sh bo'lsa narx ko'rsatilmaydi. */
  fee_amount: string;
  fee_currency: string;
  /** Narx yonidagi belgi, masalan "bir martalik". */
  fee_period: string;
  fee_description: string;
  rules_title: string;
  rules: string[];
};

export const DEFAULT_ABOUT: AboutContent = {
  intro:
    "YoshlarWiki — Oʻzbekiston yoshlari haqidagi ochiq ensiklopediya. Biz turli sohalarda faoliyat yuritayotgan iqtidorli, faol va tashabbuskor yoshlar haqidagi maʼlumotlarni bir joyda jamlaymiz, tartibga solamiz va ularni keng jamoatchilikka tanitamiz.",
  fee_enabled: true,
  fee_title: "Badal toʻlovi",
  fee_amount: "",
  fee_currency: "soʻm",
  fee_period: "bir martalik",
  fee_description:
    "Profilni tayyorlash, tahrir qilish va ensiklopediyada eʼlon qilish xizmati uchun badal toʻlovi mavjud. Toʻlov tartibi haqida tahririyat arizangizni koʻrib chiqqach siz bilan bogʻlanib batafsil maʼlumot beradi.",
  rules_title: "Qoidalar",
  rules: [
    "Arizada faqat haqiqiy va tekshirilishi mumkin boʻlgan maʼlumotlar koʻrsatiladi.",
    "Har bir profil eʼlon qilinishidan oldin tahririyat tekshiruvidan oʻtadi.",
    "Badal toʻlovi profilni tayyorlash va joylash xizmati uchun olinadi.",
    "Notoʻgʻri yoki chalgʻituvchi maʼlumot aniqlansa, profil olib tashlanadi.",
  ],
};

export function withDefaults(stored: Partial<AboutContent> | null): AboutContent {
  if (!stored) return DEFAULT_ABOUT;
  return {
    ...DEFAULT_ABOUT,
    ...Object.fromEntries(
      Object.entries(stored).filter(([, value]) => value !== null && value !== undefined),
    ),
    rules: Array.isArray(stored.rules) ? stored.rules : DEFAULT_ABOUT.rules,
  };
}

/** "150000" → "150 000". */
export function formatAmount(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
