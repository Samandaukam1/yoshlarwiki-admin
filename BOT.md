# Telegram bot va anketa — ishga tushirish

## 1. Supabase
Mavjud YoshlarWiki bazasida avvalgi migratsiyadan keyin `supabase/migrations/20261125182400_ariza_bot_and_post_templates.sql` faylini qoʻllang. Yangi profillar uchun `standard` rangi ishlatiladi.

## 2. Vercel (Settings → Environment Variables)
Faqat **bitta** kalit kerak:

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
1. **Botda** ikki tugma: 📝 Anketa yaratish va 📊 Statistika. Anketa yaratish → nomzod jinsi → F.I.Sh → nusxalanadigan tayyor matn (havola bilan).
2. **Nomzod** anketani toʻldiradi (qizlar — pushti, oʻgʻil bolalar — koʻk). Rasm yuklanganda foni brauzerda avtomatik olib tashlanadi.
3. Nomzod «Yuborish»ni bosishi bilan havolani yaratgan adminga botda xabar keladi: **«… anketani toʻldirdi. 💳 Toʻlov qildimi? ✅ Ha / ❌ Yoʻq»**.
4. **✅ Ha** → hammasi avtomatik: profil yaratiladi va saytda chiqadi, kanalga shablonli post ketadi, mos ariza «Nomzodga aylantirildi» boʻladi, adminga «Profil tayyor» va nomzodga forward qilinadigan chiroyli xabar keladi (WEB SAHIFA / TELEGRAM — havolalar F.I.Sh ichida).
   **❌ Yoʻq** → anketa «Toʻlanmagan» boʻlib qoladi; keyin admin panelda «Qoʻlda: toʻlov qilingan → chop etish» bosiladi.
5. **Admin panel → Anketalar → anketa:** «Maʼlumotlarni tahrirlash» va «Rasmni almashtirish» (foni aniq model bilan avtomatik kesiladi). Profil saytda boʻlsa, saqlanganda profil ham, kanaldagi post ham (rasm va matn) avtomatik yangilanadi — post havolasi oʻzgarmaydi. Buning uchun bot kanalda **«Xabarlarni tahrirlash»** huquqiga ega boʻlishi kerak.
6. **Profil rangi:** Nomzodlar → profil → «Profil rangi»: Standart / Och koʻk / Och pushti / Gold. Faqat saytdagi profil sahifasining orqa foni oʻzgaradi. Yangi profillar «Standart» boʻlib yaratiladi.

## Telegram post rasmi (shablon)
`src/assets/post/template.jpg` (1254×1254) ustiga: oʻngda nomzodning fonsiz rasmi, 1-qutida F.I.Sh, 2-qutida taʼlim, 3-qutida eng katta yutuq.
- Matnni AI emas, kod qisqartiradi: mashhur oliygohlar qisqartmasi (TATU, OʻzMU…), «talabasi», «3-kurs» kabi soʻzlar olib tashlanadi; qutiga sigʻmasa shrift kichrayadi, oxirida «…».
- Yutuq boʻlmasa `template-2.jpg` (3-qutisiz) ishlatiladi.
- Shablonni almashtirish: shu ikki faylni bir xil oʻlchamda (1254×1254) yangisiga almashtiring.

## Ariza boshqaruv bot
Admin panel → **Ariza boshqaruv bot**. Anketa botidan **alohida** bot kerak (@BotFather → /newbot).
1. Token va username → **Botni ulash**.
2. **Bot adminlari** → ism + **Telegram ID** (faqat ID orqali ishlaydi, begonaga hech narsa koʻrsatmaydi). ID’ni bilmasangiz, odam botga /start yozsin — bot ID’ni koʻrsatadi.
3. Botda: **🆕 Yangi arizalar**, **📋 Jami arizalar** (10 tadan, ⬅️ ➡️ bilan), **❌ Arizani bekor qilish** (Telegram username orqali, tasdiqlansa «Rad etildi»).

Muddati oʻtgan havolalarni har soatda tozalash (ixtiyoriy, pg_cron):
```sql
select cron.schedule('anketa-links-cleanup', '0 * * * *', 'select public.cleanup_expired_anketa_links()');
```
