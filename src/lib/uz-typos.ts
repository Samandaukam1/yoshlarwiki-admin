/**
 * O'zbek tilidagi harf xatolarini lug'at asosida tuzatish.
 *
 * Tuzatiladi: harflar joyi almashgan ("univesritet"), bitta harf tushib
 * qolgan ("univrsitet"), ortiqcha ("universittet") yoki noto'g'ri
 * ("universitit") so'zlar. Qo'shimchalar saqlanadi: "univesritetida" →
 * "universitetida".
 *
 * Xavfsizlik: faqat 5+ harfli o'zak, faqat bitta tahrir masofasi va faqat
 * bitta aniq nomzod bo'lsa almashtiriladi; gap o'rtasidagi katta harfli
 * so'zlar (ism, nom) tegilmaydi.
 */

const WORDS = `
universitet institut akademiya kollej litsey maktab fakultet kafedra talaba talabasi magistr magistratura
bakalavr bakalavriat doktorantura aspirant oʻqituvchi ustoz professor dotsent oʻquvchi bitiruvchi bitirgan
yoʻnalish yoʻnalishi mutaxassis mutaxassislik mutaxassisligi dasturchi dasturlash dastur dasturiy injiniring
muhandis muhandislik iqtisodiyot iqtisodchi huquqshunos huquqshunoslik huquq jurnalist jurnalistika shifokor
tibbiyot pedagog pedagogika psixologiya psixolog filologiya filolog tarjimon tarjima dizayner dizayn marketing
marketolog menejer menejment rahbar rahbari rahbarlik asoschi asoschisi hammuassis direktor direktori
prezident rais raisi raislik koordinator koordinatori volontyor volontyorlik faol faollik faoliyat faoliyati
tajriba tajribasi yutuq yutuqlar yutuqlari gʻolib gʻolibi gʻoliblik sovrindor sovrindori tanlov tanlovi
olimpiada olimpiadasi musobaqa musobaqasi chempion chempioni chempionat chempionati mukofot mukofoti medal
medali nishon nishoni diplom diplomi sertifikat sertifikati grant granti stipendiya stipendiyasi loyiha loyihasi
startap tashkilot tashkiloti kompaniya kompaniyasi markaz markazi vazirlik vazirligi agentlik agentligi
qoʻmita qoʻmitasi jamgʻarma jamgʻarmasi xalqaro respublika respublikasi viloyat viloyati tuman tumani
shahar shahri qishloq qishlogʻi mahalla mahallasi davlat davlati hukumat hukumati yoshlar yoshlari ittifoq
ittifoqi ishtirokchi ishtirokchisi ishtirok konferensiya konferensiyasi forum forumi festival festivali
seminar seminari trening treningi kurslar hakaton hakatoni jamoa jamoasi aʼzo aʼzosi aʼzolik muallif muallifi
kitob kitobi maqola maqolalar maqolasi ilmiy tadqiqot tadqiqotchi tadqiqotlar ixtiro ixtirosi patent
innovatsiya innovatsion texnologiya texnologiyalar texnologiyalari axborot raqamli sunʼiy intellekt
robototexnika matematika matematik fizika kimyo biologiya tarix geografiya informatika ingliz nemis koreys
xitoy fransuz tili tillari bilaman sport sportchi futbol kurash shaxmat shaxmatchi musiqa musiqachi sanʼat
rassom aktyor qoʻshiqchi yozuvchi shoir bloger blogger kontent ijtimoiy tarmoq tarmoqlar tarmogʻi
hozirda paytda birinchi ikkinchi uchinchi oʻrinni egallagan egalladim qoʻlga kiritgan kiritdim
tamomlaganman tamomlagan tamomlayapman oʻqiyman oʻqiydi oʻqimoqdaman oʻqiyapman ishlayman ishlaydi
ishlaganman ishlagan ishlayapman tugʻilganman tugʻilgan qatnashganman qatnashgan qatnashdim yaratganman
yaratgan yaratdim boshqaraman boshqargan boshqarmoqdaman rivojlantirish rivojlanish yordam berish
oʻrgatish oʻrganish oʻrganganman qiziqish qiziqishlarim qiziqaman maqsad maqsadim maqsadi orzu orzuim
kelajak kelajakda muvaffaqiyat muvaffaqiyatli natija natijalar natijasida million davomida mobaynida
haqida orqali tomonidan hamda shuningdek chunki sababli hozirgi zamonaviy professional mustaqil
oʻzbekiston toshkent samarqand buxoro andijon fargʻona namangan navoiy jizzax xorazm qashqadaryo
surxondaryo sirdaryo qoraqalpogʻiston nukus termiz qarshi guliston urganch margʻilon chirchiq olmaliq
angren bekobod qoʻqon xonobod denov shahrisabz kattaqoʻrgʻon
`;

/** Atoqli otlar — har doim katta harf bilan. */
const PROPER = new Set(
  `oʻzbekiston toshkent samarqand buxoro andijon fargʻona namangan navoiy jizzax xorazm qashqadaryo
   surxondaryo sirdaryo qoraqalpogʻiston nukus termiz qarshi guliston urganch margʻilon chirchiq olmaliq
   angren bekobod qoʻqon xonobod denov shahrisabz kattaqoʻrgʻon`.split(/\s+/).filter(Boolean),
);

const DICT = new Set(WORDS.split(/\s+/).filter(Boolean));
const LONG = [...DICT].filter((w) => [...w].length >= 5);

/* Ot qo'shimchalari: [ko'plik] + [egalik] + [kelishik] */
const PLURAL = ["", "lar"];
const POSSESSIVE = ["", "im", "ing", "i", "si", "imiz", "ingiz", "miz", "ngiz", "m", "ng", "lari"];
const CASE = ["", "ni", "ning", "ga", "da", "dan", "dagi", "gacha", "ka", "qa", "day", "dek", "ham", "dir", "mi"];
const EXTRA = ["lik", "chi", "likka", "likda", "likni", "ligi", "ligini", "ligida", "dagi", "dan", "lardan", "larda"];

const SUFFIXES = new Set<string>(EXTRA);
for (const p of PLURAL) for (const s of POSSESSIVE) for (const c of CASE) SUFFIXES.add(p + s + c);
const SUFFIX_LIST = [...SUFFIXES].sort((a, b) => b.length - a.length);

/** Optimal String Alignment masofasi (transpozitsiya = 1), chegaraga yetsa to'xtaydi. */
function osa(a: string[], b: string[], limit = 1): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  const rows: number[][] = [];
  for (let i = 0; i <= a.length; i += 1) rows.push([i]);
  for (let j = 1; j <= b.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, rows[i - 2][j - 2] + 1);
      }
      rows[i][j] = v;
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > limit) return limit + 1;
  }
  return rows[a.length][b.length];
}

function isKnown(word: string): boolean {
  if (DICT.has(word)) return true;
  for (const suf of SUFFIX_LIST) {
    if (suf && word.endsWith(suf)) {
      const stem = word.slice(0, -suf.length);
      if (stem.length >= 2 && DICT.has(stem)) return true;
    }
  }
  return false;
}

function correctWord(word: string): string | null {
  if (isKnown(word)) return null;
  const found = new Set<string>();

  for (const suf of SUFFIX_LIST) {
    if (suf && !word.endsWith(suf)) continue;
    const stem = suf ? word.slice(0, -suf.length) : word;
    const chars = [...stem];
    if (chars.length < 5) continue;
    for (const w of LONG) {
      const wc = [...w];
      if (Math.abs(wc.length - chars.length) > 1) continue;
      if (osa(chars, wc) === 1) found.add(w + suf);
    }
  }

  return found.size === 1 ? [...found][0] : null;
}

/**
 * Matndagi harf xatolarini tuzatadi. Havolalar va @username'lar tegilmaydi
 * (chaqiruvchi ularni oldindan himoyalaydi).
 */
export function fixTypos(text: string): string {
  return text.replace(/[A-Za-zʻʼ]+/g, (token, offset: number, whole: string) => {
    const lower = token.toLowerCase();
    if ([...lower].length < 5) return token;

    const isCapital = token[0] !== token[0].toLowerCase();
    if (isCapital) {
      // Gap boshidagi so'z emas — ism yoki nom bo'lishi mumkin: faqat atoqli otlar lug'atidan tuzatamiz.
      const before = whole.slice(0, offset).trimEnd();
      const sentenceStart = before === "" || /[.!?\n]$/.test(before);
      if (!sentenceStart) {
        const fixed = correctWord(lower);
        if (!fixed || !PROPER.has(fixed)) return token;
      }
    }

    const fixed = correctWord(lower);
    if (!fixed) return token;
    if (PROPER.has(fixed) || isCapital) return fixed[0].toUpperCase() + fixed.slice(1);
    return fixed;
  });
}
