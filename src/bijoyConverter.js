/**
 * High-Precision Unicode to ANSI (Bijoy / SutonnyMJ) Converter
 * Converts standard Bengali Unicode text into Bijoy / SutonnyMJ ANSI character codes
 * for seamless direct typing into Adobe Photoshop, Illustrator, InDesign, CorelDraw, and Press fonts.
 */

const mainCharMap = {
  "।": "|",
  "‘": "Ô",
  "’": "Õ",
  "“": "Ò",
  "”": "Ó",
  "্র্য": "ª¨",
  "ম্প্র": "¤cÖ",
  "র‌্য": "i¨",
  "ক্ষ্ম": "²",
  "ক্ক": "°",
  "ক্ট": "±",
  "ক্ত": "³",
  "ক্ব": "K¡",
  "স্ক্র": "¯Œ",
  "ক্র": "µ",
  "ক্ল": "K¬",
  "ক্ষ": "¶",
  "ক্স": "·",
  "গু": "¸",
  "গ্ধ": "»",
  "গ্ন": "Mœ",
  "গ্ম": "M¥",
  "গ্ল": "M­",
  "গ্রু": "Mªy",
  "ঙ্ক": "¼",
  "ঙ্ক্ষ": "•¶",
  "ঙ্খ": "•L",
  "ঙ্গ": "½",
  "ঙ্ঘ": "•N",
  "চ্ছ্ব": "”Q¡",
  "চ্চ": "”P",
  "চ্ছ": "”Q",
  "চ্ঞ": "”T",
  "জ্জ্ব": "¾¡",
  "জ্জ": "¾",
  "জ্ঝ": "À",
  "জ্ঞ": "Á",
  "জ্ব": "R¡",
  "ঞ্চ": "Â",
  "ঞ্ছ": "Ã",
  "ঞ্জ": "Ä",
  "ঞ্ঝ": "Å",
  "ট্ট": "Æ",
  "ট্ব": "U¡",
  "ট্ম": "U¥",
  "ড্ড": "Ç",
  "ণ্ট": "È",
  "ণ্ঠ": "É",
  "ন্স": "Ý",
  "ণ্ড": "Ê",
  "ন্তু": "š‘",
  "ণ্ব": "Y^",
  "ত্ত্ব": "Ë¡",
  "ত্ত": "Ë",
  "ত্থ": "Ì",
  "ত্ন": "Zœ",
  "ত্ম": "Z¥",
  "ন্ত্ব": "š—¡",
  "ত্ব": "Z¡",
  "থ্ব": "_¡",
  "দ্গ": "˜M",
  "দ্ঘ": "˜N",
  "দ্দ": "Ï",
  "দ্ধ": "×",
  "দ্ব": "Ø",
  "দ্ভ": "™¢",
  "দ্ম": "Ù",
  "দ্রু": "`ª“",
  "ধ্ব": "aŸ",
  "ধ্ম": "a¥",
  "ন্ট": "›U",
  "ন্ঠ": "Ú",
  "ন্ড": "Û",
  "ন্ত্র": "š¿",
  "ন্ত": "š—",
  "স্ত্র": "¯¿",
  "ত্র": "Î",
  "ন্থ": "š’",
  "ন্দ": "›`",
  "ন্দ্ব": "›Ø",
  "ন্ধ": "Ü",
  "ন্ন": "bœ",
  "ন্ব": "š^",
  "ন্ম": "b¥",
  "প্ট": "Þ",
  "প্ত": "ß",
  "প্ন": "cœ",
  "প্প": "à",
  "প্ল": "c­",
  "প্স": "á",
  "ফ্ল": "d¬",
  "ব্জ": "â",
  "ব্দ": "ã",
  "ব্ধ": "ä",
  "ব্ব": "eŸ",
  "ব্ল": "e­",
  "ভ্র": "å",
  "ম্ন": "gœ",
  "ম্প": "¤ú",
  "ম্ফ": "ç",
  "ম্ব": "¤^",
  "ম্ভ": "¤¢",
  "ম্ভ্র": "¤£",
  "ম্ম": "¤§",
  "ম্ল": "¤­",
  "্র": "ª",
  "রু": "i“",
  "রূ": "iƒ",
  "ল্ক": "é",
  "ল্গ": "ê",
  "ল্ট": "ë",
  "ল্ড": "ì",
  "ল্প": "í",
  "ল্ফ": "î",
  "ল্ব": "j¦",
  "ল্ম": "j¥",
  "ল্ল": "j­",
  "শু": "ï",
  "শ্চ": "ð",
  "শ্ন": "kœ",
  "শ্ব": "k¦",
  "শ্ম": "k¥",
  "শ্ল": "k­",
  "ষ্ক": "®‹",
  "ষ্ক্র": "®Œ",
  "ষ্ট": "ó",
  "ষ্ঠ": "ô",
  "ষ্ণ": "ò",
  "ষ্প": "®ú",
  "ষ্ফ": "õ",
  "ষ্ম": "®§",
  "স্ক": "¯‹",
  "স্ট": "÷",
  "স্খ": "ö",
  "স্ত": "¯—",
  "স্তু": "¯‘",
  "স্থ": "¯’",
  "স্ন": "mœ",
  "স্প": "¯ú",
  "স্ফ": "ù",
  "স্ব": "¯^",
  "স্ম": "¯§",
  "স্ল": "¯­",
  "হু": "û",
  "হ্ণ": "nè",
  "হ্ব": "nŸ",
  "হ্ন": "ý",
  "হ্ম": "þ",
  "হ্ল": "n¬",
  "হৃ": "ü",
  "র্": "©",
  "্য": "¨",
  "্": "&",
  "আ": "Av",
  "অ": "A",
  "ই": "B",
  "ঈ": "C",
  "উ": "D",
  "ঊ": "E",
  "ঋ": "F",
  "এ": "G",
  "ঐ": "H",
  "ও": "I",
  "ঔ": "J",
  "ক": "K",
  "খ": "L",
  "গ": "M",
  "ঘ": "N",
  "ঙ": "O",
  "চ": "P",
  "ছ": "Q",
  "জ": "R",
  "ঝ": "S",
  "ঞ": "T",
  "ট": "U",
  "ঠ": "V",
  "ড": "W",
  "ঢ": "X",
  "ণ": "Y",
  "ত": "Z",
  "থ": "_",
  "দ": "`",
  "ধ": "a",
  "ন": "b",
  "প": "c",
  "ফ": "d",
  "ব": "e",
  "ভ": "f",
  "ম": "g",
  "য": "h",
  "র": "i",
  "ল": "j",
  "শ": "k",
  "ষ": "l",
  "স": "m",
  "হ": "n",
  "ড়": "o",
  "ঢ়": "p",
  "য়": "q",
  "ৎ": "r",
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
  "া": "v",
  "ি": "w",
  "ী": "x",
  "ু": "y",
  "ূ": "~",
  "ৃ": "…",
  "ে": "‡",
  "ৈ": "‰",
  "ৗ": "Š",
  "ং": "s",
  "ঃ": "t",
  "ঁ": "u"
};

function isBanglaPreKar(c) {
  return c === 'ি' || c === 'ৈ' || c === 'ে';
}

function isBanglaPostKar(c) {
  return c === 'া' || c === 'ো' || c === 'ৌ' || c === 'ৗ' || c === 'ু' || c === 'ূ' || c === 'ী' || c === 'ৃ';
}

function isBanglaBanjonborno(c) {
  return 'কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়ৎংঃঁ'.includes(c);
}

function isBanglaHalant(c) {
  return c === '্';
}

/**
 * Re-arranges Unicode pre-kars (ি, ে, ৈ) to the front of consonants/conjuncts
 * and moves Ref (র + ্) to after the consonant/cluster according to Bijoy keyboard rules.
 */
function reArrangeUnicodeText(str) {
  let cY = 0;
  for (let i = 0; i < str.length; ++i) {
    if (i < str.length && isBanglaPreKar(str[i])) {
      let j = 1;
      while (isBanglaBanjonborno(str[i - j])) {
        if (i - j < 0) break;
        if (i - j <= cY) break;
        if (isBanglaHalant(str[i - j - 1])) {
          j += 2;
        } else {
          break;
        }
      }
      const R = str.substring(0, i - j) + str[i] + str.substring(i - j, i) + str.substring(i + 1);
      str = R;
      cY = i + 1;
      continue;
    }

    if (
      i < str.length - 1 &&
      isBanglaHalant(str[i]) &&
      str[i - 1] === 'র' &&
      !isBanglaHalant(str[i - 2])
    ) {
      let j = 1;
      let aZ = 0;
      while (true) {
        if (isBanglaBanjonborno(str[i + j]) && isBanglaHalant(str[i + j + 1])) {
          j += 2;
        } else if (isBanglaBanjonborno(str[i + j]) && isBanglaPreKar(str[i + j + 1])) {
          aZ = 1;
          break;
        } else {
          break;
        }
      }
      const R =
        str.substring(0, i - 1) +
        str.substring(i + j + 1, i + j + aZ + 1) +
        str.substring(i + 1, i + j + 1) +
        str[i - 1] +
        str[i] +
        str.substring(i + j + aZ + 1);
      str = R;
      i += j + aZ;
      cY = i + 1;
      continue;
    }
  }
  return str;
}

/**
 * Converts any standard Unicode Bengali string to Bijoy (SutonnyMJ / ANSI)
 * @param {string} text Unicode Bengali text
 * @returns {string} Bijoy (ANSI) encoded string
 */
export function unicodeToBijoy(text) {
  if (!text) return '';

  // 1. Separate composite kars: ো -> ে + া, ৌ -> ে + ৗ
  let s = text.replace(/ো/g, 'ো').replace(/ৌ/g, 'ৌ');

  // 2. Positional re-arrangement (pre-kars & refs)
  s = reArrangeUnicodeText(s);

  // 3. Match and substitute glyphs from multi-character to single character
  const keys = Object.keys(mainCharMap).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (s.includes(k)) {
      s = s.split(k).join(mainCharMap[k]);
    }
  }

  return s;
}

/**
 * Check if the text contains Bengali characters
 */
export function isBanglaText(text) {
  return /[\u0980-\u09FF]/.test(text);
}
