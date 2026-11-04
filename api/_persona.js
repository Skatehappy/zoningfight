// api/_persona.js - "no attorney voice" lint + shared rule text (Edge-safe, pure, no I/O).
// ZoningFight letters are written and SIGNED BY THE USER in their own name. The generator must never speak as
// an attorney, counsel, law firm or representative. USER_SIGNS_RULE is appended server-side to every letter
// prompt; findPersona() is run on every generated letter, review, assertive version and checklist item.
export const USER_SIGNS_RULE = 'SIGNATURE RULE (mandatory): The letter is written and signed by the applicant/owner in their own name ([Your Name]). Never describe the writer as an attorney, counsel, law firm or representative and never sign for a client. Write in the first person as the owner or applicant and close with a plain signature block for [Your Name].';

// Fold case, curly quotes, nbsp and runs of whitespace (spaces, tabs, newlines) so spacing variants cannot slip past.
export const fold = s => String(s || '').toLowerCase()
  .replace(/[‘’‛′]/g, "'").replace(/[“”″]/g, '"')
  .replace(/[  -​ 　]/g, ' ').replace(/\s+/g, ' ');

// "attorney for" / "counsel for" are banned as a signature or self-description, but NOT inside ordinary advice such as
// "consult an attorney for advice" or "a zoning attorney for help": the word before them excludes those.
const ADVICE_BEFORE = 'an?|the|your|my|our|any|this|that|licensed|qualified|local|competent|experienced|private|zoning|land[- ]use|real[- ]estate|municipal|city|county|town|village|board|opposing|consult|consulting|retain|retaining|hire|hiring|seek|seeking|with|legal|own|outside|independent|contact|call|find|ask|get|need|talk to|speak to|speak with';
const forBan = word => new RegExp(String.raw`(?<!\b(?:${ADVICE_BEFORE})\s)\b${word}\s+for\b`);

export const PERSONA_PATTERNS = [
  { phrase: 'Attorney for', re: forBan('attorneys?') },
  { phrase: 'Esq.', re: /\besq(?![a-z])\.?/ },
  { phrase: 'Esquire', re: /\besquire\b/ },
  { phrase: 'counsel for', re: forBan('counsel') },
  { phrase: 'on behalf of my client', re: /\bon\s+behalf\s+of\s+(?:my|our)\s+clients?\b/ },
  { phrase: 'this firm represents', re: /\bthis\s+(?:law\s+)?firm\s+(?:represents|is\s+counsel|has\s+been\s+retained)\b/ },
  { phrase: 'my client', re: /\b(?:my|our)\s+clients?\b/ },
  { phrase: 'attorney at law', re: /\battorneys?[\s-]+at[\s-]+law\b/ },
  { phrase: 'law office of', re: /\blaw\s+offices?\s+of\b/ },
];

// -> array of banned phrases found (as labelled above), [] when clean.
export function findPersona(text) {
  const t = fold(text);
  const hits = PERSONA_PATTERNS.filter(p => p.re.test(t)).map(p => p.phrase);
  // A signature line that starts with it is always a hit, whatever precedes it (a closing line such as "The Attorney for the Owner").
  const raw = String(text || '').replace(/[  -​]/g, ' ');
  if (!hits.includes('Attorney for') && /^[ \t]*(?:the[ \t]+)?attorneys?[ \t]+for\b/im.test(raw)) hits.push('Attorney for');
  if (!hits.includes('counsel for') && /^[ \t]*(?:the[ \t]+)?counsel[ \t]+for\b/im.test(raw)) hits.push('counsel for');
  return hits;
}
