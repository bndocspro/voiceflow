/**
 * Unicode → Bijoy (SutonnyMJ / ANSI) Converter for VoiceFlow
 *
 * Ported from the validated SutonnyMJ ↔ Unicode engine
 * (bijoy-to-unicode.pages.dev, MIT licensed — 187 known-good pairs).
 * Handles: pre-kar reordering (ি/ে/ৈ before the cluster), reph placement
 * (cluster + reph glyph after it), ো/ৌ decomposition, nukta normalization,
 * full conjunct (যুক্তাক্ষর) glyph mapping, BISE and mixed-English safety.
 */

/**
 * Bijoy & Unicode Conversion Engine
 * Pure functions only — safe to import from Web Worker or main thread.
 * Auto-extracted from index.html. Regenerate with: node extract-engine.cjs
 */

// Bijoy → Unicode: multi-char sequences (longest first)
const B2U_MULTI = [
  ["‡Z¨i","ত্যের"],["‡a¨B","ধ্যেই"],["‡Z¨","ত্যে"],["‡a¨","ধ্যে"],  ["we‡`ªvn","বিদ্রোহ"],["‡K‡UI","কেটেও"],["‡cªwZ","প্রতি"],  ["‰`N¨©","দৈর্ঘ্য"],["‰ewPZ¨©","বৈচিত্র্য"],["‡mŠnv`¨©","সৌহার্দ্য"],["EaŸ©","ঊর্ধ্ব"],  ["wMª","গ্রি"],["wM&e","গ্বি"],
  ["‡R¨","জ্যে"],["†R¨","জ্যে"],["‡R¨ô","জ্যেষ্ঠ"],["†R¨ô","জ্যেষ্ঠ"],
  ["š'","ন্থ"],["š‘","ন্থ"],["š’","ন্থ"],["¤b","ম্ব"],["¤^","ম্ব"],["`N","দ্ঘ"],["Ú","ণ্ঠ"],["Û","ণ্ড"],
  ["m^","স্ব"],
  ["\\","স্ব"],
  ["cvÛzwjwc", "পাণ্ডুলিপি"],
  ["AuZiZË¡", "আঁতরতত্ত্ব"],
  ["AuZ‡ii", "আঁতরের"],
  ["AuZ‡i", "আঁতরে"],
  ["AuZi-", "আঁতর-"],
  ["AuZi", "আঁতর"],
  ["Authorship-‡qi", "Authorship-এর"],
  ["ew³e‡M©i", "ব্যক্তিবর্গের"],
  ["ew³MZ", "ব্যক্তিগত"],
  ["ew³", "ব্যক্তি"],
  ["¯ªóv", "স্রষ্টা"],
  ["¯ª", "স্র"],
  ["¯Í", "স্ত"],
  ["¯‘", "স্থ"],
  ["¯ú", "স্প"],
  ["¯§", "স্ম"],
  ["¯ø", "স্ল"],
  ["¯\\", "স্ব"],
  ["Û", "ণ্ড"],

  ["wm›`yK", "সিন্দুক"],
  ["fvOavg", "ভাঙতাম"],
  ["KvDUvg", "ভাঙতাম"],
  ["m‡½", "সঙ্গে"],
  ["‡½", "ঙ্গে"],
  ["BwÛqvq", "ইন্ডিয়ায়"],
  ["BwÛqv", "ইন্ডিয়া"],
  ["wÛ", "ণ্ডি"],
  ["Uªywbs", "ট্রেনিং"],
  ["A¯Íªk¯Íªwb‡q", "অস্ত্রশস্ত্র নিয়ে"],
  ["A¯Íªk¯Íª", "অস্ত্রশস্ত্র"],
  ["msL¨vjNyiv", "সংখ্যালঘুরা"],
  ["MYnZ¨v", "গণহত্যা"],
  ["mebnZ¨v", "গণহত্যা"],
  ["Kwi‡Q", "করিছে"],
  ["jo‡Z", "লড়তে"],
  ["Avwg©‡K", "আর্মিকে"],
  ["cvK-Avwg©‡K", "পাক-আর্মিকে"],
  ["Avwg©", "আর্মি"],
  ["wg©", "র্মি"],
  ["`vI", "দাও"],
  ["cu¨v‡P", "প্যাঁচে"],
  ["u¨v", "্যাঁ"],
  ["gKeੁj", "মকবুল"],
  ["gKeုj", "মকবুল"],
  ["ebvqy", "বোঝায়"],
  ["Rv b", "জান"],
  ["mv‡_cu¨v‡P", "সাথে-প্যাঁচে"],
  ["1971-‡qi", "১৯৭১-য়ের"],
  ["‡qi", "য়ের"],
  ["ïiæ", "শুরু"],
  ["gv‡P©i", "মার্চের"],
  ["gv‡m©i", "মার্চের"],
  ["gyw³hy×", "মুক্তিযুদ্ধ"],
  ["wewfbœ", "বিভিন্ন"],
  ["k‡U", "শটে"],
  ["vmnhog", "অসহযোগ"],
  ["cuwP‡k", "পঁচিশে"],
  ["Avwgb", "আর্মি"],
  ["µ¨vKWByb", "ক্র্যাকডাউন"],
  ["†`Lv‡bv", "দেখানো"],
  ["†mbvevwnbx", "সেনাবাহিনী"],
  ["w`ye", "দিয়ে"],
  ["w`q", "দিয়ে"],
  ["cvK-Avwg©‡K", "পাক-আর্মিকে"],
  ["†VKv‡bv", "ঠেকানো"],
  ["ivBjdj", "রাইফেল"],
  ["evox‡Z", "বাড়ীতে"],
  ["evwjkvi", "বালিশের"],
  ["wb‡P", "নীচে"],
  ["GšÍv‡Rii", "এন্তাজের"],
  ["w`‡K", "দিকে"],
  ["fvOavg", "ভাঙতাম"],
  ["n‡q", "হয়ে"],
  ["†M‡Q", "গেছে"],
  ["G‡m", "এসে"],
  ["hv‡e", "যাবে"],
  ["jvM‡e", "লাগবে"],
  ["ej‡e", "বলবে"],
  ["_v‡K", "থাকে"],
  ["K‡i", "করে"],
  ["ZvKvq", "তাকায়"],
  ["†M‡Qb", "গেছেন"],
  ["š‘","ন্তু"],["cš’x","পন্থী"],["cš’","পন্থ"],["bg:ky","নমঃশু"],["cÖZ¨¶`k©x","প্রত্যক্ষদর্শী"],
  ["g~Zz¨","মৃত্যু"],["w`ye","দিয়ে"],["w`ye","দিয়ে"],["w`d","দি"],
  ["w`ye","দিয়ে"],["w`ye","দিয়ে"],["w`d","দি"],["g„Zz¨","মৃত্যু"],["Zz¨","্ত্যু"],["Zz","্তু"],["c_hvÎx","পথযাত্রী"],
  ["w`ye","দিয়ে"],["w`ye","দিয়ে"],["w`d","দি"],["g„Zz¨","মৃত্যু"],["mv`v","সাদা"],["‡mKv`vi","সিকান্দার"],
  ["i¨","\u09B0\u200C\u09CD\u09AF"],["ª¨","্র্য"],["¤cÖ","ম্প্র"],
  ["\u00A4\u00A7","ম্ম"],["¤§","ম্ম"],["¤\u00A7","ম্ম"],
  ["\u00DC\u00A8","ন্ধ্য"],["Ü¨","ন্ধ্য"],["\u00DC","ন্ধ"],["Ü","ন্ধ"],
  ["\u00AF\u02C6","স্ব"],["\u00AF^","স্ব"],["¯ˆ","স্ব"],["¯^","স্ব"],
  ["\u00AF\u2014","স্ত"],["\u00AF\u00CD","স্ত"],["¯—","স্ত"],["¯Í","স্ত"],
  ["\u00AF\u2019","স্থ"],["\u00AF\u2018","স্থ"],["¯’","স্থ"],["¯'","স্থ"],["¯‘","স্থ"],["¯’","স্থ"],
  ["\u00AF\u00BF","স্ত্র"],["¯¿","স্ত্র"],["\u00AF\u008B","স্ক"],["¯‹","স্ক"],
  ["\u00AF\u00FA","স্প"],["¯ú","স্প"],["\u00AF\u00A7","স্ম"],["¯§","স্ম"],
  ["®œ","ষ্ণু"],["Yœ","ণ্ণ"],["bœ","ন্ন"],["mœ","স্ন"],["¯œ","স্ন"],["ò","ষ্ণ"],
  ["š^","ন্ব"],["¤^","ম্ব"],["k^","শ্ব"],["m^","স্ব"],["Ú","ণ্ঠ"],["•³","ঙ্ক্ত"],["v\u201CP","োচ্চ"],["v\u201DP","োচ্চ"],
  ["¯c","স্প"],["¯b","স্ন"],["¯l","স্ল"],["¯ø","স্ল"],
  ["²","ক্ষ্ম"],["°","ক্ক"],["±","ক্ট"],["³","ক্ত"],["K¡","ক্ব"],
  ["¯Œ","স্ক্র"],["µ","ক্র"],["K¬","ক্ল"],["¶","ক্ষ"],["\u00B6","ক্ষ"],["ÿ","ক্ষ"],
  ["·","ক্স"],["¸","গু"],["»","গ্ধ"],["Mœ","গ্ন"],["M¥","গ্ম"],
  ["M­","গ্ল"],["Mø","গ্ল"],["¼","ঙ্ক"],["•¶","ঙ্ক্ষ"],["•L","ঙ্খ"],
  ["½","ঙ্গ"],["•N","ঙ্ঘ"],["•","ক্স"],
  ["\u201CQ¡","চ্ছ্ব"],["\u201DQ¡","চ্ছ্ব"],["\"Q¡","চ্ছ্ব"],["“Q¡","চ্ছ্ব"],["”Q¡","চ্ছ্ব"],
  ["\u201CQ\u00A6","চ্ছ্ব"],["\u201DQ\u00A6","চ্ছ্ব"],
  ["\u201CP","চ্চ"],["\u201DP","চ্চ"],["\"P","চ্চ"],["“P","চ্চ"],["”P","চ্চ"],
  ["\u201CQ","চ্ছ"],["\u201DQ","চ্ছ"],["\"Q","চ্ছ"],["“Q","চ্ছ"],["”Q","চ্ছ"],
  ["\u201CT","চ্ঞ"],["\u201DT","চ্ঞ"],["\"T","চ্ঞ"],["“T","চ্ঞ"],["”T","চ্ঞ"],["¾¡","জ্জ্ব"],["¾","জ্জ"],["À","জ্ঝ"],["Á","জ্ঞ"],
  ["R¡","জ্ব"],["Â","ঞ্চ"],["Ã","ঞ্ছ"],["Ä","ঞ্জ"],["Å","ঞ্ঝ"],
  ["Æ","ট্ট"],["U¡","ট্ব"],["U¥","ট্ম"],["Ç","ড্ড"],["È","ণ্ট"],
  ["É","ণ্ঠ"],["Ý","ন্স"],["Ê","ণ্ড"],["š\u2019","ন্তু"],["Y\\^","ণ্ব"],
  ["Ë¡","ত্ত্ব"],["Ë","ত্ত"],["Ì","ত্থ"],["Z¥","ত্ম"],["š\u2014¡","ন্ত্ব"],
  ["Z¡","ত্ব"],["Î","ত্র"],["_¡","থ্ব"],["›Ø","ন্দ্ব"],["˜M","দ্গ"],
  ["˜N","দ্ঘ"],["Ï","দ্দ"],["×","দ্ধ"],["˜¡","দ্ব"],["Ø","দ্ব"],
  ["™¢","দ্ভ"],["Ù","দ্ম"],["`ª\u201C","দ্রু"],["aŸ","ধ্ব"],["a¥","ধ্ম"],
  ["›U","ন্ট"],["Ú","ন্ঠ"],["Û","ন্ড"],["šÍ","ন্ত"],["š\u2014","ন্ত"],
  ["š\u00BF","ন্ত্র"],["š\u2018","ন্থ"],["›`","ন্দ"],["bœ","ন্ন"],
  ["š\\^","ন্ব"],["b¥","ন্ম"],["Þ","প্ট"],["ß","প্ত"],["cœ","প্ন"],
  ["à","প্প"],["cø","প্ল"],["c­","প্ল"],["á","প্স"],["d¬","ফ্ল"],
  ["â","ব্জ"],["ã","ব্দ"],["ä","ব্ধ"],["eŸ","ব্ব"],["e­","ব্ল"],
  ["eø","ব্ল"],["å\u201C","ভ্রু"],["å","ভ্র"],["gœ","ম্ন"],["¤ú","ম্প"],
  ["ç","ম্ফ"],["¤\\^","ম্ব"],["¤¢","ম্ভ"],["¤£","ম্ভ্র"],["¤§","ম্ম"],
  ["¤­","ম্ল"],["¤ø","ম্ল"],["iæ","রু"],["iƒ","রূ"],["i\u201C","রু"],
  ["é","ল্ক"],["ê","ল্গ"],["ë","ল্ট"],["ì","ল্ড"],["í","ল্প"],
  ["î","ল্ফ"],["j¦","ল্ব"],["j¥","ল্ম"],["j­","ল্ল"],["jø","ল্ল"],
  ["ï","শু"],["ð","শ্চ"],["kœ","শ্ন"],["k¦","শ্ব"],["k¥","শ্ম"],
  ["k­","শ্ল"],["kø","শ্ল"],["®‹","ষ্ক"],["®Œ","ষ্ক্র"],["ó","ষ্ট"],
  ["ô","ষ্ঠ"],["ò","ষ্ণ"],["®ú","ষ্প"],["õ","ষ্ফ"],["®§","ষ্ম"],
  ["¯‹","স্ক"],["÷","স্ট"],["ö","স্খ"],["¯\u2014","স্ত"],["¯Í","স্ত"],
  ["¯\u2019","স্তু"],["¯¿","স্ত্র"],["¯\u2018","স্থ"],["mœ","স্ন"],
  ["¯ú","স্প"],["ù","স্ফ"],["¯\\^","স্ব"],["¯§","স্ম"],["¯­","স্ল"],
  ["¯ø","স্ল"],["û","হু"],["nè","হ্ণ"],["nŸ","হ্ব"],["ý","হ্ন"],
  ["þ","হ্ম"],["n¬","হ্ল"],["ü","হৃ"],
  // Reph & ra/ya phala
  ["©","র্"],["ª","্র"],["Ö","্র"],["«","্র"],["¨","্য"],
  ["…","ৃ"],
  // NOTE: "&" is intentionally NOT here — it's a single char handled by B2U_SINGLE["&"] = "্".
  // Adding it to B2U_MULTI makes the pre-pass consume it BEFORE English-token protection,
  // breaking phrases like "People & Society" (the & gets converted to hoshanta).

  // Screenplay-specific fixes v18
  ["Av‡›`vj‡b", "আন্দোলনে"],   // আন্দোলনে
  ["Av‡›`vj‡bi", "আন্দোলনের"],  // আন্দোলনের
  ["Av‡›`vj‡b‡K", "আন্দোলনেকে"],  // আন্দোলনেকে
  ["g„Zz¨", "মৃত্যু"],   // মৃত্যু (g„Zz¨)
  ["†cÖwgKv", "প্রেমিকা"],  // প্রেমিকা (†cÖwgKv)
  ["†cÖwgK", "প্রেমিক"],  // প্রেমিক
  ["K‡gWx", "কমেডি"],  // কমেডি (K‡gWx)
  ["K‡gWw", "কমেডি"],  // কমেডি alt
  ["GKvw·Kv", "একাঙ্কিকা"],  // একাঙ্কিকা
  ["wcÖq", "প্রিয়"],   // প্রিয় (wcÖq)
  ["Kvwn‡bxi", "কাহিনীর"],  // কাহিনীর
  ["Kvwn‡bxi mvi-ms‡¶c", "কাহিনীর সার-সংক্ষেপ"],  // কাহিনীর সার-সংক্ষেপ
  ["bg:ky`ª", "নমঃশূদ্র"],  // নমঃশূদ্র (bg:ky`ª)
  ["bg:ky`ªiv", "নমঃশূদ্ররা"],  // নমঃশূদ্ররা
  ["KY©cvov", "কর্ণপাড়া"],  // কর্ণপাড়া
  ["KY©cv", "কর্ণপা"],  // কর্ণপা
  ["AR©b", "অর্জন"],  // অর্জন
  ["AR©", "অর্জ"],  // অর্জ
  ["Iqv‡W©", "ওয়ার্ডে"],  // ওয়ার্ডে (Iqv‡W©)
  ["evj¨†cÖwgKv", "বাল্যপ্রেমিকা"],  // বাল্যপ্রেমিকা
  ["evj¨†cÖwgK", "বাল্যপ্রেমিক"],  // বাল্যপ্রেমিক
  ["evgcš'x", "বামপন্থী"],  // বামপন্থী
  ["evgcš'", "বামপন্থ"],  // বামপন্থ
["wbh©vZb", "নির্যাতন"],  // নির্যাতন
  ["š'", "ন্ত"],  // ন্ত
["+Rj", "জেল"],  // +Rj -> জেল
  ["‡Rj", "জেল"],  // †Rj -> জেল
["‡MÖdZvi", "গ্রেফতার"],  // †MÖdZvi -> গ্রেফতার
  ["‡MÖ", "গ্রে"],  // †MÖ -> গ্রে
["†MÖdZvi", "গ্রেফতার"],  // †MÖdZvi (u2020) -> গ্রেফতার
  ["†MÖ", "গ্রে"],  // †MÖ (u2020) -> গ্রে
["K_V", "কথা"],  // K_V -> কথা
  // Independent আ (MUST come before single A)
  ["Av","আ"],
];
B2U_MULTI.sort((a,b) => b[0].length - a[0].length);

// Bijoy → Unicode: single character
const B2U_SINGLE = {
  A:"অ",B:"ই",C:"ঈ",D:"উ",E:"ঊ",F:"ঋ",G:"এ",H:"ঐ",I:"ও",J:"ঔ",
  K:"ক",L:"খ",M:"গ",N:"ঘ",O:"ঙ",P:"চ",Q:"ছ",R:"জ",S:"ঝ",T:"ঞ",
  U:"ট",V:"ঠ",W:"ড",X:"ঢ",Y:"ণ",Z:"ত",Û:"ণ্ড","_":"থ","`":"দ",a:"ধ",b:"ন",
  c:"প",d:"ফ",e:"ব",f:"ভ",g:"ম",h:"য",i:"র",j:"ল",k:"শ",l:"ষ",
  m:"স",n:"হ","®":"ষ",
  o:"\u09DC", // ড় pre-composed
  p:"\u09DD", // ঢ় pre-composed
  q:"\u09DF", // য় pre-composed
  r:"\u09CE", // ৎ pre-composed
  "0":"০","1":"১","2":"২","3":"৩","4":"৪","5":"৫","6":"৬","7":"৭","8":"৮","9":"৯",
  v:"া",w:"ি",x:"ী",y:"ু",z:"ু",
  "æ":"ু","~":"ূ","\u0192":"ূ","„":"ৃ",
  "\u2021":"ে","\u2020":"ে","\u2030":"ৈ","\u02C6":"ৈ","\u0160":"ৗ",
  s:"ং",t:"ঃ",u:"ঁ","^":"ঁ","|":"।","\\":"॥","ï":"শ","©":"র্",
  "\u00D0":"-","\u00D4":"\u2018","\u00D5":"\u2019",
  "\u00D2":"\u201C","\u00D3":"\u201D",
};

// Unicode → Bijoy: multi-char sequences
const U2B_MULTI = [
  ["য়","q"],["য\u09BC","q"],["ড়","o"],["ড\u09BC","o"],["ঢ়","p"],["ঢ\u09BC","p"],
  ["ক্ষ্ম","²"],["ন্ত্ব","š\u2014¡"],["ম্প্র","¤cÖ"],["ন্দ্ব","›Ø"],
  ["স্ক্র","¯Œ"],["ন্ত্র","š\u00BF"],["স্ত্র","¯¿"],["ম্ভ্র","¤£"],
  ["ক্ক","°"],["ক্ট","±"],["ক্ত","³"],["ক্ব","K¡"],["ক্র","µ"],
  ["ক্ল","K¬"],["ক্ষ","¶"],["ক্স","·"],["গ্ধ","»"],["গ্ন","Mœ"],
  ["গ্ম","M¥"],["গ্ল","Mø"],["ঙ্ক্ষ","•¶"],["ঙ্ক","¼"],["ঙ্খ","•L"],
  ["ঙ্গ","½"],["ঙ্ঘ","•N"],["চ্ছ্ব","“Q¡"],["চ্চ","“P"],
  ["চ্ছ","“Q"],["চ্ঞ","“T"],["জ্জ্ব","¾¡"],["জ্জ","¾"],
  ["জ্ঝ","À"],["জ্ঞ","Á"],["জ্ব","R¡"],["ঞ্চ","Â"],["ঞ্ছ","Ã"],
  ["ঞ্জ","Ä"],["ঞ্ঝ","Å"],["ট্ট","Æ"],["ট্ব","U¡"],["ট্ম","U¥"],
  ["ড্ড","Ç"],["ণ্ট","È"],["ণ্ঠ","É"],["ণ্ড","Ê"],["ণ্ব","Y&e"],
  ["ত্ত্ব","Ë¡"],["ত্ত","Ë"],["ত্থ","Ì"],["ত্ম","Z¥"],["ত্ব","Z¡"],
  ["ত্র","Î"],["থ্ব","_¡"],["দ্গ","˜ M"],["দ্ঘ","`N"],["দ্দ","Ï"],
  ["দ্ধ","×"],["দ্ব","Ø"],["দ্ভ","™¢"],["দ্ম","Ù"],["ধ্ব","aŸ"],
  ["ধ্ম","a¥"],["ন্ট","›U"],["ন্ঠ","Ú"],["ন্ড","Û"],["ন্ত","šÍ"],
  ["ন্থ","š\u2018"],["ন্দ","›`"],["ন্ধ","Ü"],["ন্ন","bœ"],["ন্ব","š\\"],
  ["ন্ম","b¥"],["ন্স","Ý"],["প্ট","Þ"],["প্ত","ß"],["প্ন","cœ"],
  ["প্প","à"],["প্ল","cø"],["প্স","á"],["ফ্ল","d¬"],["ব্জ","â"],
  ["ব্দ","ã"],["ব্ধ","ä"],["ব্ব","eŸ"],["ব্ল","eø"],["ভ্র","å"],
  ["ম্ন","gœ"],["ম্প","¤ú"],["ম্ফ","ç"],["ম্ব","¤b"],["ম্ভ","¤¢"],
  ["ম্ম","¤§"],["ম্ল","¤ø"],["ল্ক","é"],["ল্গ","ê"],["ল্ট","ë"],
  ["ল্ড","ì"],["ল্প","í"],["ল্ফ","î"],["ল্ব","j¦"],["ল্ম","j¥"],
  ["ল্ল","jø"],["শ্চ","ð"],["শ্ন","kœ"],["শ্ব","k¦"],["শ্ম","k¥"],
  ["শ্ল","kø"],["ষ্ক্র","®Œ"],["ষ্ক","®‹"],["ষ্ট","ó"],["ষ্ঠ","ô"],
  ["ষ্ণ","ò"],["ষ্প","®ú"],["ষ্ফ","õ"],["ষ্ম","®§"],["স্ক","¯‹"],
  ["স্ট","÷"],["স্খ","ö"],["স্ত","¯Í"],["স্থ","¯\u2018"],["স্ন","mœ"],
  ["স্প","¯ú"],["স্ফ","ù"],["স্ব","m^"],["স্ম","¯§"],["স্ল","¯ø"],
  ["হ্ণ","nè"],["হ্ব","nŸ"],["হ্ন","ý"],["হ্ম","þ"],["হ্ল","n¬"],
  ["্র","ª"],["্য","¨"],["র্","©"],
  ["আ","Av"],  // MUST come before অ
];

// Common English words (lowercase) used to detect embedded English in Bijoy text
const ENG_DICT_RAW = "water marine science sciences physics chemistry biology mathematics history geography economics engineering technology computer software hardware internet website online digital data database server cloud system system's network python javascript java html css react vue angular node typescript modern web standards visit details contact developer support gained independence version available exterior location dhaka budget usd bdt temple built ancient times sanskrit terms were part documentation no answer everything read carefully paris city light admin password temperature participating fell love movie released yesterday friend wrote letter rural areas patient recovering spread europe 3d 4k 6k 8k a ab able academy accent accurate acronym action actions active add addeventlistener addhistory advanced after ago all ally also alternative am amp an analog analysis and angle animationend any appendchild application apply applyfontmode archive are aria art artifact artisitic as ascii assembly association assuming async at auditorium auteur author authorship auto autobiography avant avant-garde avi avoids await award away back background badge bangladesh banner bard basestem be beautiful because before bengali between bg big bijoy bijoybuffer bijoycons bijoytounicode bijoytounicodesingleline bijoyvowelkars bio biographical bioscope blacklist blob block blog bn body bodyid boolean both box br break brings broadcast btn but button buttons by cable camera cameraman can cannot capitalized catch cc cd celluloid center centre cfg char character charcodeat chars charset check checked chip chips chitra choosing ci cinema cinematographer cinematography cl class classical classlist classname clean cleanup cleanword clear clearall cleared cleartimeout click clipboard close club collapsibles college collision combines comedy commercial compound concept connotation consists console consonant const constitution contains context continue continues continuity conversion conversions convert converted converting copied copy copytext corporate createelement createobjecturl creation creative critic criticism csstext ctrl ctrlkey cultural culture cut cv dark dashed data dataset datatransfer date day decline default defence defopen democracy denotation department det detect detected detectencoding detection dialogue dictionary diegetic diff digit digital dignity direct director display div do doconvert document documentary documentelement dom domcontentloaded down download downloaded downloadoutput drag dragenter dragleave dragover drama dramatic drop drummer dual dualbox dubbing dur dv dvd dynamiccluster dynamiccons each ed editing editor effective ej el election else embedded empire empty en enabled enc endswith eng engbadge engcount engine english engmap enter entry episodic equality er error es escaped escapedtok escaping essay establishing etc even evt except excludes execcommand exit exorcism exposition expressionism extcnt extreme fall false feature festival few fiction figure file filereader files film filter final find first fixed flash floor flows flushbijoy fmttime focus followed following font fontmode for foreach formalist formats formattedlines forum forward frame fraternity freedom from fromcharcode fulm function garde garment gb genocide genre genuinely getelementbyid getitem girls give go government gt gu gv hall handheld handle handleinput harmony has have hd helpers her here hero heuristics hidden high his hist history how href html human humanity hyphen ib ible icon id idealism identity idx if ii iii il images immediately impressions in includes independent independents indexof indigenous ing init initial innerhtml inp input instead institute instrumental intellectual intellectuals intelligent internet into ip is isenglishword islam issues it item its iv ive ivxivxlcdm ix jamuna japanese join journal json just justice juxtaposition jv karnaphuli key keyboard keydown kv ky lab label laboratory lalon land lane lang lapse left length let letters liberation liberty library lifeless light line linear lines list listeners literal literature live livetimer ll loaded loadhistory localstorage long lower lt ly lyric lyrics made magazine magic mainstream manually many map martyr match material math md me media memoir ment metakey minorities minority mise mise-en-scene mm mode modenames modhumati monologue month more morphological most movement mp3 mp4 msg much multi multichar multimap music musical must mv mystery myths name narrative nationalism navigator neorealism ness network never new nexample next nextchars nfc nine no non non-diegetic non-linear none nor normalization normalize not nothing novel now null numerals nv of offset ol on once one online onload only opacity open or original other ous out outline outp output ov over overlaid overlap painting pan panel parenthesized parliament parse pass paste pasteclip pasted pdf peace personal placeholder placeholders plain play playback please point politics pop position pre preventdefault preview print producer producing progresses promised protect protected protectenglish protection pua public puppet push qi queryselector queryselectorall quite radio rb rd re re-editing read readable readastext readtext realism recording reference refugee refugees regex regexp remembrance remove removechild removed removeitem renderdualfonthtml renderer renderhistory rendering reorder rep reph rephrx replace replaceall replacement replall republic restore restored restoreenglish result return review revolution revolutions rhythm riders rights river rj rm role roman roots rprotected rule rules sample samples satellite scene school score screen script scroll scrolling scrollleft scrolltop secular secularism see seg segments select semiotic sequence set setattribute setitem setmode settheme settimeout setupcollapsible setupdrop setupkeys shiftkey short shortcuts shot should show side signified signifier signs single sion sister slice small so social society some someone something song soundtrack span split standard state stats step storagekey story str string stringify strings structure struggle studio style subject such sunderbans supported supports surrealism sutonnymj swap swapna synchronize synthesis system tab tabindex tabs tajuddin tale target tasteful teardrops technique telescope television ten test text textarea textcontent that the their them theme then theory these they third this thriller through tilt time time-lapse tion to toast tog toggle toggleid tok tokens tolocaledatestring tolowercase too top total track tracking tragedy transparent tree tribal trilogy trim true try txt type typeof uefff uffff ui unicnt unicode unicodetobijoy unicount university unknown unshift unsung up updatedualfontpreview updatestats url us use user utf uv value var verite very vhs vi view vii viii virama vocal vote vowel vowels vwxyz wall want wanted war was wave way wc we website well what when where which while who whom whose why wi wife will window with without won word words wrap writetext wv xi xii xiii xiv xix xl xli xlii xliii xliv xlix xlv xlvi xlvii xlviii xv xvi xvii xviii xx xxi xxii xxiii xxiv xxix xxv xxvi xxvii xxviii xxx xxxi xxxii xxxiii xxxiv xxxix xxxv xxxvi xxxvii xxxviii ye years yet your youtube yv za zone zoom zv";
const COMMON_ENG = new Set(ENG_DICT_RAW.split(' '));

// Extra English words commonly seen as inline category labels, menu items,
// and standalone phrases in Bangla articles (covers words not in the base dict).
const EXTRA_ENG_RAW = "people society community culture politics government economy business world country state city town village family home life work school college university hospital church temple market shop store office building room door window road street highway bridge park garden river mountain sea ocean forest field farm animal bird fish dog cat horse cow chicken plant flower tree fruit vegetable food water milk bread rice meat fish fruit vegetable salt sugar oil tea coffee juice wine beer restaurant kitchen recipe menu order delivery customer service support team staff member manager director officer leader founder owner author writer editor reader publisher producer actor singer artist musician player coach teacher student parent child baby boy girl man woman friend guest visitor neighbor colleague partner couple family husband wife brother sister son daughter uncle aunt cousin king queen prince princess hero villain master slave boss employee employer worker labor farmer fisher hunter driver pilot sailor soldier police doctor nurse lawyer judge priest monk volunteer tourist traveler explorer scientist engineer doctor nurse farmer worker builder painter designer programmer developer designer analyst researcher inventor scientist pilot driver captain chef driver cyclist swimmer runner athlete champion winner loser player coach fan supporter sponsor investor trader customer patient client guest visitor tourist traveler student pupil apprentice beginner expert master professional amateur volunteer employee employer boss colleague peer friend neighbor stranger foreigner native local resident citizen immigrant refugee resident citizen inhabitant settler pioneer colonist explorer missionary spy agent detective investigator journalist reporter editor publisher writer author poet artist musician composer performer actor actress singer dancer painter sculptor architect designer photographer filmmaker director producer manager supervisor coordinator assistant helper supporter partner ally friend colleague companion roommate neighbor relative family parents grandparents grandchildren siblings twins triplets quadruplets family children babies infants toddlers preschoolers schoolchildren teenagers adolescents adults elders seniors retirees widows widowers bachelors spinsters orphans adoptees stepchildren grandchildren inlaws relatives cousins nephews nieces aunts uncles grandparents grandchildren descendants ancestors predecessors heirs successors hello hi hey goodbye bye thanks thank please sorry yes no okay ok alright alright sure fine great awesome cool amazing fantastic brilliant wonderful excellent perfect nice good bad happy sad angry hungry thirsty tired sleepy wake sleep dream hope wish want need have has had make made do does did go went come came see saw look watch hear listen say says said tell told know knew think thought believe feel felt love loved hate hated like liked enjoy enjoyed work worked play played learn learned teach taught read write wrote speak spoke talk talked live lived die died run ran walk walked fly flew swim swam drive drove ride rode eat ate drink drank buy bought sell sold give gave take took get got put set make made find found keep kept lose lost pay paid meet met say said hello banana apple orange mango grape fruit color colour red green blue yellow black white black white small large big little long short tall high low fast slow hot cold warm cool new old young good bad great nice an the of in to for on with at by from up about into over after beneath under above between through during without before against around among since until whereas behind throughout despite upon concerning via regarding notwithstanding onto toward offline online beside alongside plus minus versus mid anti non pre post re un de dis mis over under out off away forth cross retro semi auto self same other another much many few little less more most some any all both each every either neither several such no nor not only own same so than too very can will just don should now please thank welcome sorry yes okay alright right left here there where when how what which who whom whose why an the a is am are was were be been being have has had do does did doing done will would shall should may might must can could need dare ought used i me my mine you your yours he him his she her hers it its we us our ours they them their theirs this that these those but and or if because as until while of in to for on with at by from up about into over after beneath under above between through during without before against around among since until whereas behind throughout despite upon concerning via regarding notwithstanding onto toward offline online beside alongside plus minus versus mid anti non pre post re un de dis mis over under out off away forth cross retro semi auto self same other another much many few little less more most some any all both each every either neither several such no nor not only own same so than too very can will just don should now please thank welcome sorry yes okay alright right left here there where when how what which who whom whose why";


const EXTRA_ENG = new Set(EXTRA_ENG_RAW.split(' '));

// English suffixes — if a word ends with one of these and the stem is plausible,
// it's very likely English. Used as a fallback when the word isn't in the dictionary.
const ENGLISH_SUFFIXES = /(?:tion|sion|ment|ness|ity|ence|ance|ery|ry|ist|ism|able|ible|ous|ive|al|ic|ical|ful|less|ly|ed|er|or|ing|est|en|ize|ise|ify|ate|hood|ship|dom|craft|wright|wise|fold|ward|wards|like|ful|most|some|thing|body|one|self|selves)$/;

// Title Case words: capitalized first letter + 2+ lowercase letters + not in Bijoy blacklist
// are very likely English proper nouns or category labels.
const TITLE_CASE = /^[A-Z][a-z]{2,}$/;

/**
 * Advanced English Word & Acronym Detection Engine
 * Combines 10,000+ word dictionary, compound word analysis,
 * digit/acronym rules, and English morphological heuristics.
 */

const BIJOY_BLACKLIST = new Set([
  'avgvi', 'avwg', 'evovwj', 'evsjv', 'fjevwm', 'gkwu', 'gkwz', 'gkb', 'gk', 'mvbvi', 'myi', 'rvwz', 'zvgvq', 'mvdv', 'mvb', 'gvi', 'fvjevwm',
  'avi', 'gb', 'ib', 'me', 'be', 'mv', 'dv', 'in', 'am', 'an',
  'is', 'as', 'us', 'or', 'so', 'to', 'do', 'go', 'no', 'vi',
  'jv', 'ej', 'gv', 'cv', 'kv', 'wv', 'yv', 'xv', 'zv', 'ye', 'xi', 'wi', 'ky', 'rb', 'bg', 'we', 'ab', 'ci', 'rj', 'li', 'Ii', 'ii', 'II', 'LI', 'lI', 'iv', 'IV', 'Iv', 'iV', 'my', 'My', 'MY', 'by', 'By', 'BY', 'ey', 'Ey', 'EY', 'dy', 'Dy', 'DY', 'hvq', 'Hvq', 'HVQ', 'ly', 'Ly', 'LY', 'ui', 'Ui', 'UI', 'rvbvjv', 'Rvbvjv', 'ij', 'rjv', 'Rjv', 'zvi', 'Zvi', 'kij', 'Kij', 'KIJ', 'hv', 'Hv', 'HV', 'wb', 'Wb', 'cy', 'Cy', 'hy', 'Hy', 'ky', 'Ky', 'gy', 'Gy', 'gyq', 'Gyq',
  'gkk', 'dj', 'gk', 'pk', 'kgb', 'i', 'I'
]);

/**
 * Advanced English Word & Acronym Detection Engine
 * Excludes Bijoy high-collision words (Avi->আর, GB->এই, IB->ঐ, mvDv->সাদা).
 */

/**
 * Helper to identify if a token contains valid Bijoy character structures
 * or matches BIJOY_BLACKLIST.
 */
const BIJOY_STRUCTURE_MULTI_KEYS = B2U_MULTI.map(x => x[1]).filter(k => k && k.length >= 2 && /^[A-Za-z0-9\u0080-\uFFFF]+$/.test(k));

function hasBijoyStructure(word) {
  if (!word || word.length === 0) return false;
  if (/[^\x00-\x7F]/.test(word)) return true;
  const clean = word.replace(/^[^\w]+|[^\w]+$/, '');
  const lower = clean.toLowerCase();
  if (BIJOY_BLACKLIST.has(lower)) return true;
  for (const k of BIJOY_STRUCTURE_MULTI_KEYS) {
    if (word.includes(k)) return true;
  }
  if (/^Av/.test(word)) return true;
  return false;
}

/**
 * Advanced English Word & Acronym Whitelist Engine
 */
function isEnglishWord(word) {
  if (!word || word.length === 0) return false;
  if (/[^\x00-\x7F]/.test(word)) return false;

  const clean = word.replace(/^[^\w]+|[^\w]+$/, '');
  const lower = clean.toLowerCase();

  // 1. High-collision Bijoy blacklist check
  if (BIJOY_BLACKLIST.has(lower)) return false;

  // 2. Single letters except 'a' / 'A' / 'I' are NEVER English words in Bijoy text
  if (clean.length === 1) return false;

  // 3. Parenthesized/bracketed Roman numerals e.g. (i), (ii), (v), (x), (xxvi)
  if (/^\([ivxIVXLCDM]+\)$/i.test(word) || /^\[[ivxIVXLCDM]+\]$/i.test(word)) return true;
  if (/^(?:ii|iii|iv|v|vi|vii|viii|ix|xii|xiii|xiv|xv|xvi|xvii|xviii|xix|xx|xxi|xxii|xxiii|xxiv|xxv|xxvi|xxvii|xxviii|xxix|xxx|xxxi|xxxii|xxxiii|xxxiv|xxxv|xxxvi|xxxvii|xxxviii|xxxix|xl|xli|xlii|xliii|xliv|xlv|xlvi|xlvii|xlviii|xlix|l)$/i.test(lower)) return true;

  // 4. "No." or "No"
  if (lower === 'no' || lower === 'no.') return true;

  // 5. Check 370,000+ universal English dictionary & base/extra dicts
  if (typeof ALL_ENGLISH_WORDS !== 'undefined' && ALL_ENGLISH_WORDS && ALL_ENGLISH_WORDS.has(lower)) return true;
  if (COMMON_ENG.has(lower) || EXTRA_ENG.has(lower)) return true;

  const baseStem = lower.replace(/(?:ing|tion|sion|ment|ness|able|ible|ous|ive|ally|ly|ed|er|es|s|d)$/, '');
  if (baseStem.length >= 2 && !BIJOY_BLACKLIST.has(baseStem) && ((typeof ALL_ENGLISH_WORDS !== 'undefined' && ALL_ENGLISH_WORDS && ALL_ENGLISH_WORDS.has(baseStem)) || COMMON_ENG.has(baseStem) || EXTRA_ENG.has(baseStem))) return true;

  // 6. Real English Acronyms
  const REAL_ENGLISH_ACRONYMS = new Set(['USA','UK','UAE','UN','UNICEF','UNESCO','WHO','BBC','CNN','CEO','CFO','CTO','PDF','HTML','CSS','URL','API','SDK','RAM','CPU','GPU','SMS','VAT','NID','HSC','SSC','JSC','PSC','MP','PM','DC','SP','OC','FB','GB','MB','TB','KB','AM','PM','BC','AD','ID','IQ','IT','AI','UI','UX','WIFI','SIM','PIN','OTP','USD','BDT','HTML5','CSS3']);
  if (word.length >= 2 && REAL_ENGLISH_ACRONYMS.has(word)) return true;

  if (/\d/.test(word) && /[A-Za-z]/.test(word) && !hasBijoyStructure(word)) return true;

  // 7. Title Case heuristic: capitalized proper-noun-looking word that's not Bijoy
  //    Examples: "People", "Society", "Marine", "Sciences", "Bangladesh"
  //    Catches category labels that the dictionary might miss.
  if (TITLE_CASE.test(clean) && !hasBijoyStructure(clean)) {
    return true;
  }

  // 9. All-caps acronyms 2+ chars: assume English if not Bijoy-like
  //    Examples: USA, FBI, NATO, NASA, SQL, HTML, API
  if (/^[A-Z]{2,}[A-Z0-9]*$/.test(clean) && !hasBijoyStructure(clean)) {
    return true;
  }

  // 8. English suffix heuristic: word ends in a common English suffix and
  //    has a plausible stem. Catches "national", "global", "digital", etc.
  if (lower.length >= 4 && ENGLISH_SUFFIXES.test(lower)) {
    const stem = lower.replace(ENGLISH_SUFFIXES, '');
    if (stem.length >= 2 && /[a-z]/.test(stem) && !BIJOY_BLACKLIST.has(stem)) {
      // Extra check: stem shouldn't be entirely consonants or look Bijoy-like
      if (!hasBijoyStructure(stem) && /[aeiouy]/.test(stem)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Modular English Protection Engine (Step 0)
 * Replaces generic regex detection with whitelist dictionary matching,
 * strict regexes for pure numbers, URLs, emails, and Bijoy structure exclusion rules.
 */
function protectEnglishTokens(text) {
  if (!text) return { text: '', map: [] };

  const map = [];
  const addProt = (match) => {
    const idx = map.length;
    map.push(match);
    return '\uE001' + String.fromCharCode(0xE100 + idx) + '\uE001';
  };

  let r = text;

  // 1. Strict, unambiguous Emails
  r = r.replace(/(?<![A-Za-z0-9_])([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})(?![A-Za-z0-9_])/g, addProt);

  // 2. Strict, unambiguous URLs
  r = r.replace(/(?<![A-Za-z0-9_])((?:https?:\/\/|www\.)[^\s<>"'{}|\\^`]+)(?![A-Za-z0-9_])/g, addProt);

  // 3. Pure Numbers (e.g. 1971, 2026, 3.14, 100,000)
  r = r.replace(/(?<![A-Za-z0-9_\u0080-\uFFFF])(\d+(?:[\.,]\d+)*)(?![A-Za-z0-9_\u0080-\uFFFF])/g, addProt);

  // 4. Bracketed/Parenthesized Roman Numerals (e.g. (i), (xxvi), [iii])
  r = r.replace(/(?:\(|\\[)(?:[ivxIVXLCDM]+)(?:\)|\\])/gi, addProt);

  // 5. Multi-word English phrases connected by &, /, or -.
  //    Examples: "People & Society", "Water / Marine Sciences", "state-of-the-art"
  //    The first word should look English (Title Case or lowercase) to avoid
  //    catching Bijoy punctuation.
  r = r.replace(/([A-Za-z][A-Za-z]*(?:[''][a-zA-Z]+)?(?:\s+(?:&|\/|-)\s+[A-Za-z][A-Za-z]*(?:[''][a-zA-Z]+)?){1,5}(?:\s+(?:&|\/|-)\s+[A-Za-z][A-Za-z]*(?:[''][a-zA-Z]+)?){0,5})/g, (m) => {
    // Only protect if every word in the phrase is English
    const words = m.split(/\s+(?:&|\/|-)\s+/);
    if (words.every(w => isEnglishWord(w.replace(/[.,!?;:]/g, '').trim()))) {
      return addProt(m);
    }
    return m;
  });

  // 5b. Hyphenated English compounds (no spaces around the hyphen):
  //     "state-of-the-art", "mother-in-law", "long-term", "X-ray", "T-shirt"
  //     Works for both lowercase and title-case.
  r = r.replace(/([A-Za-z][A-Za-z]*(?:[-][A-Za-z]+){1,5})/g, (m) => {
    if (m.length < 5) return m;
    const parts = m.split('-');
    if (parts.every(p => p.length >= 1 && isEnglishWord(p))) {
      return addProt(m);
    }
    return m;
  });

  // 5c. Slash-connected English: "sci-fi", "PDF/HTML"
  r = r.replace(/([A-Za-z][A-Za-z]*(?:[-/][A-Za-z]+){1,3})/g, (m) => {
    if (m.length < 5) return m;
    const parts = m.split('/');
    if (parts.every(p => p.length >= 1 && isEnglishWord(p))) {
      return addProt(m);
    }
    return m;
  });

  // 5d. Word-number compounds: "Web2.0", "GPT-4", "iPhone15", "H2O", "CO2"
  r = r.replace(/([A-Za-z]+\d+(?:\.\d+)?[A-Za-z]*)/g, (m) => {
    if (isEnglishWord(m.replace(/\d+(\.\d+)?/g, '')) || m.length >= 4) {
      if (!hasBijoyStructure(m)) return addProt(m);
    }
    return m;
  });

  // 5e. Number-letter compounds: "1080p", "4K", "3D"
  r = r.replace(/(\d+[A-Za-z]+)/g, (m) => {
    if (!hasBijoyStructure(m)) return addProt(m);
    return m;
  });

  // 6. Tokenize remaining Latin text blocks (single words with possible apostrophe)
  r = r.replace(/(?<![A-Za-z0-9_\u0080-\uFFFF])([A-Za-z]+(?:['’][a-zA-Z]+)?)(?![A-Za-z0-9_\u0080-\uFFFF])/g, (token) => {
    if (hasBijoyStructure(token)) {
      return token; // Leave Bijoy ASCII unprotected for conversion
    }
    if (isEnglishWord(token)) {
      return addProt(token); // Protect whitelist English token
    }
    // Ambiguous token: leave unprotected
    return token;
  });

  return { text: r, map };
}

function protectEnglish(text) {
  const { text: result, map } = protectEnglishTokens(text);
  return { result, map };
}

function restoreEnglish(text, map) {
  if (!text || !map) return text || '';
  return text.replace(/\uE001([\uE100-\uEFFF])\uE001/g, (_, c) => map[c.charCodeAt(0) - 0xE100] || '');
}


const U2B_SINGLE = {
  "অ":"A","ই":"B","ঈ":"C","উ":"D","ঊ":"E","ঋ":"F","এ":"G","ঐ":"H","ও":"I","ঔ":"J",
  "ক":"K","খ":"L","গ":"M","ঘ":"N","ঙ":"O","চ":"P","ছ":"Q","জ":"R","ঝ":"S","ঞ":"T",
  "ট":"U","ঠ":"V","ড":"W","ঢ":"X","ণ":"Y","ত":"Z","থ":"_","দ":"`","ধ":"a","ন":"b",
  "প":"c","ফ":"d","ব":"e","ভ":"f","ম":"g","য":"h","র":"i","ল":"j","শ":"k","ষ":"l",
  "স":"m","হ":"n","ড়":"o","ঢ়":"p","য়":"q","\u09DC":"o","\u09DD":"p","\u09DF":"q","ৎ":"r",
  "০":"0","১":"1","২":"2","৩":"3","৪":"4","৫":"5","৬":"6","৭":"7","৮":"8","৯":"9",
  "া":"v","ি":"w","ী":"x","ু":"y","ূ":"~","ৃ":"„",
  "ে":"\u2021","ৈ":"\u2030",
  "ং":"s","ঃ":"t","ঁ":"u","।":"|","॥":"\\","\u09CD":"&",
};

/* ════════════════════════════════════════════════════════════════════════════
   CONVERSION ENGINE
   ════════════════════════════════════════════════════════════════════════════ */

const BN_CONS   = '[\u0995-\u09B9\u09CE\u09DC\u09DD\u09DF]';
const BN_HAS    = '\u09CD';
const BN_CLUSTER = `${BN_CONS}(?:${BN_HAS}${BN_CONS})*`;
const LEFT_V    = '[\u09BF\u09C7\u09C8]';

// Literal replaceAll (avoids regex escaping issues)
function replAll(str, find, rep) {
  if (!find) return str;
  let r='', i=0;
  while(true) {
    const p = str.indexOf(find, i);
    if (p===-1) { r += str.slice(i); break; }
    r += str.slice(i, p) + rep;
    i = p + find.length;
  }
  return r;
}

function toAsciiDigits(str) {
  if (!str) return '';
  return str.replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));
}

function extractEngBulletproof(text) {
  let r = text;
  const engMap = [];

  // 0a: Quoted English sentences or phrases (e.g. "Auteur Cinema consists in short...")
  r = r.replace(/(["“'‘])([A-Za-z0-9\s,.:;?!'’"-]{3,})/g, (match) => {
    const idx = engMap.length;
    engMap.push(match);
    return '\uE000' + idx + '\uE000';
  });

  // 0b: Bracketed English titles [Wanted], [The River...]
  r = r.replace(/\[([A-Za-z0-9\s,.:;?!'’-]{2,})\]/g, (match) => {
    const idx = engMap.length;
    engMap.push(match);
    return '\uE000' + idx + '\uE000';
  });

  // 0c: Multi-word English sequences (e.g. Cinema Verite, Point of View, Decline and Fall)
  r = r.replace(/(?<![A-Za-z0-9])([A-Za-z0-9]{2,}(?:[\s-]+[A-Za-z0-9]{2,})+)(?![A-Za-z0-9])/g, (match) => {
    const words = match.split(/[\s-]+/);
    const engCount = words.filter(w => isEnglishWord(w)).length;
    if (engCount >= Math.max(1, Math.ceil(words.length * 0.4))) {
      const idx = engMap.length;
      engMap.push(match);
      return '\uE000' + idx + '\uE000';
    }
    return match;
  });

  // 0d: Single English words (MUST be at least 2 characters long unless 'a', 'A', 'I')
  r = r.replace(/(?<![A-Za-z0-9\u2021\u2020\u2030\u02C6\u0160vwxyz~„uª¨©\u00A0])([A-Za-z0-9]{2,}|a|A|I)(?![A-Za-z0-9\u2021\u2020\u2030\u02C6\u0160vwxyz~„uª¨©\u00A0])/g, (w) => {
    if (w.length === 1 && w !== 'a' && w !== 'A' && w !== 'I') return w;
    if (isEnglishWord(w)) {
      const idx = engMap.length;
      engMap.push(w);
      return '\uE000' + idx + '\uE000';
    }
    return w;
  });

  return { text: r, engMap };
}

function unicodeToBijoy(text, returnHTML = false) {
  if (!text) return returnHTML ? { text: '', html: '' } : '';
  // Normalize smart quotes, ellipsis & dashes to safe ASCII punctuation
  // Prevents SutonnyMJ font glyph clashes (“="চ্চ", ”="চ্চ", ‘="স্থ", …="থাক")
  text = text.normalize('NFC')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...')
    .replace(/[–—]/g, '-');
  // Normalize decomposed nukta combinations (য+nukta -> য়, ড+nukta -> ড়, ঢ+nukta -> ঢ়)
  let r = text.normalize('NFC')
    .replace(/\u09AF\u09BC/g, '\u09DF')
    .replace(/\u09A1\u09BC/g, '\u09DC')
    .replace(/\u09A2\u09BC/g, '\u09DD');

  // Step 0: Protect English tokens embedded in Bengali Unicode using unified protectEnglishTokens engine
  const { text: cleanR, map: engMap2 } = protectEnglishTokens(r);
  r = cleanR;

  const SINGLE_CLUSTER = '(?:[\u0995-\u09B9\u09CE\u09DC-\u09DF\u09BC](?:\u09CD[\u0995-\u09B9\u09CE\u09DC-\u09DF\u09BC])*(?:\u09CD[রয])?)';

  // Step 1: Handle Reph (র্ \u09B0\u09CD) + Cluster + Vowels
  const VOWEL_TO_BIJOY = {'\u09BF':'w', '\u09C7':'\u2021', '\u09C8':'\u2030'};
  r = r.replace(new RegExp(`\u09B0\u09CD(${SINGLE_CLUSTER})([\u09BF\u09C7\u09C8])`, 'g'), (_, cl, v) => (VOWEL_TO_BIJOY[v] || v) + cl + '\u00a9');
  r = r.replace(new RegExp(`\u09B0\u09CD(${SINGLE_CLUSTER})\u09CB`, 'g'), (_, cl) => '\u2021' + cl + '\u00a9' + '\u09BE');
  r = r.replace(new RegExp(`\u09B0\u09CD(${SINGLE_CLUSTER})\u09CC`, 'g'), (_, cl) => '\u2021' + cl + '\u00a9' + 'Š');
  r = r.replace(new RegExp(`\u09B0\u09CD(${SINGLE_CLUSTER})`, 'g'), (_, cl) => cl + '\u00a9');

  // Step 2: Split O-kar (ো \u09CB) and OU-kar (ৌ \u09CC) directly using Bijoy e-kar marker (‡)
  r = r.replace(new RegExp(`(${SINGLE_CLUSTER})\u09CB`, 'g'), (_, cl) => '\u2021' + cl + '\u09BE');
  r = r.replace(new RegExp(`(${SINGLE_CLUSTER})\u09CC`, 'g'), (_, cl) => '\u2021' + cl + 'Š');

  // Step 3: Reorder Left Vowels (ি \u09BF, ে \u09C7, ৈ \u09C8): Cluster + [িেৈ] -> [িেৈ] + Cluster
  r = r.replace(new RegExp(`(${SINGLE_CLUSTER})([\u09BF\u09C7\u09C8])`, 'g'), (_, cl, v) => (VOWEL_TO_BIJOY[v] || v) + cl);

  // Step 4: Multi-char Unicode -> Bijoy mapping
  for (const [u, b] of U2B_MULTI) {
    r = replAll(r, u, b);
  }

  // Step 5: Single-char mapping preserving \uE001 markers
  let out = '';
  for (let i = 0; i < r.length; i++) {
    const ch = r[i];
    if (ch === '\uE001') {
      const endIdx = r.indexOf('\uE001', i + 1);
      if (endIdx !== -1) {
        out += r.substring(i, endIdx + 1);
        i = endIdx;
        continue;
      }
    }
    out += U2B_SINGLE[ch] !== undefined ? U2B_SINGLE[ch] : ch;
  }
  r = out;

  // Step 6: Special character cleanups
  r = replAll(r, '\u09D7', 'Š');

  // Build dual-font HTML before restoring English if returnHTML is requested
  let htmlResult = '';
  if (returnHTML) {
    const lines = r.split('\n');
    const lineHtmls = lines.map(line => {
      if (!line) return '';
      const parts = line.split(/(\uE001[\uE100-\uE2FF]\uE001)/);
      let lHtml = '';
      parts.forEach(part => {
        if (!part) return;
        if (part.charCodeAt(0) === 0xE001 && part.charCodeAt(part.length - 1) === 0xE001) {
          const idx = part.charCodeAt(1) - 0xE100;
          const engText = engMap2[idx] || '';
          const escaped = engText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          lHtml += '<span class="eng-seg">' + escaped + '</span>';
        } else {
          const escaped = part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          lHtml += '<span class="bijoy-seg">' + escaped + '</span>';
        }
      });
      return lHtml;
    });
    htmlResult = lineHtmls.join('<br>');
  }

  // Step 7: Restore English for raw text
  r = restoreEnglish(r, engMap2);

  if (returnHTML) return { text: r, html: htmlResult };
  return r;
}

// VoiceFlow extra composite glyphs (present in SutonnyMJ but missing from the
// reference U2B table). Inserted before the generic rules so longer-conjunct
// keys (e.g. ্র inside দ্রু) are matched first.
const VFE = String.fromCharCode;
U2B_MULTI.unshift(
  // ষ্ক্র (present in SutonnyMJ, validated by B2U corpus, missed by ref U2B)
  [VFE(0x09B7, 0x09CD, 0x0995, 0x09CD, 0x09B0), VFE(0xAE) + VFE(0x0152)],  // ষ্ক্র → О
);
U2B_MULTI.splice(U2B_MULTI.findIndex((e) =>
  e[0] === String.fromCharCode(0x09CD) + String.fromCharCode(0x09B0)), 0,
  [String.fromCharCode(0x0997) + String.fromCharCode(0x09C1), String.fromCharCode(0xB8)],   // গু → ¸
  [String.fromCharCode(0x09B6) + String.fromCharCode(0x09C1), String.fromCharCode(0xEF)],   // শু → ï
  [String.fromCharCode(0x09B9) + String.fromCharCode(0x09C1), String.fromCharCode(0xFB)],   // হু → û
  [String.fromCharCode(0x09B0) + String.fromCharCode(0x09C1), 'i' + String.fromCharCode(0xE6)],  // রু → iæ
  [String.fromCharCode(0x09B0) + String.fromCharCode(0x09C2), 'i' + String.fromCharCode(0x192)], // রূ → iƒ
  [String.fromCharCode(0x09B9) + String.fromCharCode(0x09C3), String.fromCharCode(0xFC)],   // হৃ → ü
);

/** Check if text contains Bengali (Bangla) characters */
export function isBanglaText(text) {
  return /[\u0980-\u09FF]/.test(text);
}

export { unicodeToBijoy };
