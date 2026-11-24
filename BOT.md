# Telegram bot va anketa — ishga tushirish

## 1. Supabase
Mavjud YoshlarWiki bazasida `supabase/migrations/20261124190000_telegram_bot_anketa.sql` migratsiyasini SQL Editor orqali ishga tushiring.

## 2. Vercel (Settings → Environment Variables)
Bot va anketa uchun serverdagi quyidagi maxfiy kalit kerak:

| Kalit | Qiymat |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → **secret** kalit (`sb_secret_…`) |

Supabase URL va publishable kalit `src/lib/config.ts` ichida yozilgan. Admin panel manzili Vercel'dan avtomatik olinadi.
Ixtiyoriy: `ANTHROPIC_API_KEY` (AI imlo tuzatish), `NEXT_PUBLIC_ADMIN_URL` (o'z domeningiz bo'lsa).

## 3. Botni ulash
1. @BotFather → `/newbot` → token oling.
2. Admin panel → **Telegram bot** → token va username → **Botni ulash** (webhook avtomatik oʻrnatiladi).
3. **Telegram adminlar** → ism + `@username` qoʻshing (istalgancha). Ular botga kirib **/start** bosadi.

## Kanal
Admin panel → **Telegram bot** → «Telegram kanal va post havolalari»: kanal (`https://t.me/kanal`), Instagram, Telegram va ariza uchun sayt havolasi. Botni kanalga **admin** qiling (xabar yuborish huquqi bilan).

## Jarayon
1. **Botda** faqat ikki tugma: 📝 Anketa yaratish va 📊 Statistika. Anketa yaratish → nomzod jinsi → F.I.Sh → nusxalanadigan tayyor matn (havola bilan).
2. **Nomzod** anketani toʻldiradi (qizlar — pushti, oʻgʻil bolalar — koʻk). Rasm yuklanganda foni brauzerda avtomatik olib tashlanadi, oq fonli post rasmi ham tayyorlanadi.
3. **Admin panel → Anketalar** — har 5 soniyada oʻzi yangilanadi. Yuborilgan anketa haqida botga xabar ketmaydi.
4. **Tasdiqlash** → profil (qoralama, rangi jinsga qarab). **Tekshirish** → faqat havolani yaratgan adminga: nomzod username’i, telefoni, «chat» tugmasi, ✅ Ha / ❌ Yoʻq. «Ha» → toʻlov avtomatik belgilanadi.
5. **Saytda chiqarish** → profil saytda + kanalga oq fonli rasm va chiroyli matnli post (ostida Instagram | Telegram havolalari) → yaratgan adminga: F.I.Sh, tg username, profil havolasi, post havolasi. Panelda ham «Profil tayyor» kartasi va nusxalash tugmalari.
6. **Nomzodlar → profil → Profil rangi:** och koʻk / och pushti / gold.

Muddati oʻtgan havolalarni har soatda tozalash (ixtiyoriy, pg_cron):
```sql
select cron.schedule('anketa-links-cleanup', '0 * * * *', 'select public.cleanup_expired_anketa_links()');
```
