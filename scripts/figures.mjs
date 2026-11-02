// scripts/figures.mjs - dollar / percent / day figure extraction (gate A15 strict mode).
// A figure is normalized to  $N  |  N%  |  N day
// ("30-day", "30 days", "thirty days", "10 to 15 days" -> "30 day", "30 day", "30 day", "10 day"+"15 day").
const ONES = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100 };
const WORD = '(?:' + Object.keys(ONES).sort((a, b) => b.length - a.length).join('|') + ')';
const MOD = '(?:(?:calendar|business|working|consecutive)[- ])?';
const SPELLED = new RegExp(String.raw`\b(${WORD}(?:[- ]${WORD})?)[- ]${MOD}days?\b`, 'gi');
const RANGE = new RegExp(String.raw`\b(\d+)\s?(?:to|or|and|-|–|—)\s?(\d+)[- ]${MOD}days?\b`, 'gi');
const num = w => { const p = w.toLowerCase().split(/[- ]/).map(x => ONES[x]); return p.length === 2 && p[1] < 10 && p[0] >= 20 ? p[0] + p[1] : p.reduce((a, b) => a + b, 0); };

export function figures(text) {
  const out = new Map(), t = String(text).replace(/&#0?39;/g, "'").replace(/&amp;/g, '&');
  const add = (norm, raw) => { if (!out.has(norm)) out.set(norm, raw.trim().slice(0, 40)); };
  for (const m of t.matchAll(/\$\s?(\d[\d,]*(?:\.\d+)?)(\s?(?:million|thousand|billion)\b)?/gi)) add('$' + m[1].replace(/,/g, '').replace(/\.0+$/, '') + (m[2] ? m[2].trim().toLowerCase() : ''), m[0]);
  for (const m of t.matchAll(/(\d+(?:\.\d+)?)\s?(?:%|percent\b|per cent\b)/gi)) add(m[1] + '%', m[0]);
  for (const m of t.matchAll(new RegExp(String.raw`\b(\d+)[- ]${MOD}days?\b`, 'gi'))) add(m[1] + ' day', m[0]);
  for (const m of t.matchAll(/\b(\d+)(?:st|nd|rd|th) day\b/gi)) add(m[1] + ' day', m[0]);   // "20th day"
  for (const m of t.matchAll(SPELLED)) add(num(m[1]) + ' day', m[0]);
  for (const m of t.matchAll(RANGE)) { add(m[1] + ' day', m[0]); add(m[2] + ' day', m[0]); }
  return out;
}
