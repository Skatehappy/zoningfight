// api/_open-acts.js - public-records act vs open-meetings act, per supported state (Edge-safe, pure, no I/O).
// A records request in a letter must cite the state's PUBLIC-RECORDS act; the OPEN-MEETINGS act is only for meeting
// notice / agenda / hearing-access / executive-session issues. Root cause of the live defect: the verified set for
// Georgia carried only O.C.G.A. 50-14-1 (Open Meetings Act) in this area, so the model used it for a records request.
// Every `keys` entry MUST exist in the verified citation set for that state (tests/open-acts.test.js enforces it);
// the log rows are in VERIFICATION_LOG-SEO-CONTENT.md ("Open records and open meetings acts", verified_on 2026-11-04).
import { citations } from './_cites.js';
import { sentencesOf } from './_citelint.js';

export const OPEN_ACTS = {
  GA: { records: { name: 'Georgia Open Records Act', cite: 'O.C.G.A. § 50-18-70 et seq.', keys: ['S:50-18-70', 'S:50-18-71'] },
        meetings: { name: 'Georgia Open Meetings Act', cite: 'O.C.G.A. § 50-14-1 et seq.', keys: ['S:50-14-1'] } },
  CA: { records: { name: 'California Public Records Act', cite: 'Cal. Gov. Code § 7920.000 et seq. (response time: § 7922.535)', keys: ['S:7920.000', 'S:7922.535'] },
        meetings: { name: 'Ralph M. Brown Act', cite: 'Cal. Gov. Code § 54950 et seq. (§ 54953)', keys: ['S:54950', 'S:54953'] } },
  TX: { records: { name: 'Texas Public Information Act', cite: "Tex. Gov't Code Chapter 552 (§ 552.221)", keys: ['CH:552', 'S:552.221'] },
        meetings: { name: 'Texas Open Meetings Act', cite: "Tex. Gov't Code Chapter 551 (§ 551.002)", keys: ['CH:551', 'S:551.002'] } },
  FL: { records: { name: 'Florida Public Records Act', cite: 'Fla. Stat. Chapter 119 (§ 119.07)', keys: ['CH:119', 'S:119.07'] },
        meetings: { name: 'Florida Government in the Sunshine Law', cite: 'Fla. Stat. § 286.011', keys: ['S:286.011'] } },
  NY: { records: { name: 'New York Freedom of Information Law', cite: 'N.Y. Public Officers Law § 87 and § 89 (Article 6)', keys: ['S:87', 'S:89'] },
        meetings: { name: 'New York Open Meetings Law', cite: 'N.Y. Public Officers Law § 103 (Article 7)', keys: ['S:103'] } },
  IL: { records: { name: 'Illinois Freedom of Information Act', cite: '5 ILCS 140/3', keys: ['S:5ILCS140/3'] },
        meetings: { name: 'Illinois Open Meetings Act', cite: '5 ILCS 120/2', keys: ['S:5ILCS120/2'] } },
  PA: { records: { name: 'Pennsylvania Right-to-Know Law', cite: '65 P.S. § 67.901', keys: ['S:67.901'] },
        meetings: { name: 'Pennsylvania Sunshine Act', cite: '65 Pa.C.S. § 704', keys: ['S:704'] } },
  OH: { records: { name: 'Ohio Public Records Act', cite: 'Ohio R.C. 149.43', keys: ['S:149.43'] },
        meetings: { name: 'Ohio Open Meetings Act', cite: 'Ohio R.C. 121.22', keys: ['S:121.22'] } },
  NC: { records: { name: 'North Carolina Public Records Act', cite: 'N.C. Gen. Stat. § 132-1 and § 132-6', keys: ['S:132-1', 'S:132-6'] },
        meetings: { name: 'North Carolina Open Meetings Law', cite: 'N.C. Gen. Stat. § 143-318.10', keys: ['S:143-318.10'] } },
  AZ: { records: { name: 'Arizona Public Records Law', cite: 'A.R.S. § 39-121 et seq.', keys: ['S:39-121'] },
        meetings: { name: 'Arizona Open Meeting Law', cite: 'A.R.S. § 38-431.01', keys: ['S:38-431.01'] } },
};

// System-prompt block appended server-side (the client cannot remove it).
export function openActsRule(abbr) {
  const a = OPEN_ACTS[abbr];
  const general = 'PUBLIC RECORDS vs OPEN MEETINGS (mandatory): A request for records, documents or copies must rest on the state public-records act, never on the state open-meetings act. Cite the open-meetings act only for open-meetings issues such as meeting notice, agendas, public access to a meeting or hearing, or executive sessions.';
  if (!a) return '\n\n' + general;
  return '\n\n' + general + ` For this state: a records request cites the ${a.records.name} (${a.records.cite}); the ${a.meetings.name} (${a.meetings.cite}) is for open-meetings issues only, never as the authority for a records request. Cite only what the verified list allows.`;
}

const ACT_NAMES = /\b(?:open[\s-]+meetings?[\s-]+(?:act|law)|sunshine[\s-]+(?:act|law)|government in the sunshine|brown act|open meeting law)\b/gi;
const MEETING_WORDS = /\b(?:meetings?|hearings?|agendas?|executive sessions?|closed sessions?|quorum)\b/i;
const RECORDS_REQUEST = /\b(?:(?:request(?:s|ed|ing)?|demand|seek|produce|provide|inspect(?:ion)?|copies|copy)\b[^.;]{0,90}\b(?:records?|documents?|files?|correspondence|communications|emails?)|(?:records?|documents?|copies)\b[^.;]{0,90}\b(?:request|produce|inspect)|open records|public records|freedom of information|foia|right[\s-]to[\s-]know|public information act)\b/i;

// Flags a sentence that is a records request AND cites the state's open-meetings act while not being about a meeting.
export function lintRecordsMeetings(text, abbr) {
  const a = OPEN_ACTS[abbr];
  const none = { ok: true, bad: [], strip: t => t };
  if (!a) return none;
  const meet = new Set(a.meetings.keys);
  const rec = new Set(a.records.keys);
  const isBad = s => {
    if (!RECORDS_REQUEST.test(s)) return false;
    if (MEETING_WORDS.test(s.replace(ACT_NAMES, ' '))) return false;     // about a meeting: the meetings act may apply
    const ks = [...citations(s)].map(([k]) => k);
    return ks.some(k => meet.has(k)) && !ks.some(k => rec.has(k));
  };
  const bad = [];
  for (const line of String(text).split('\n')) for (const s of sentencesOf(line)) if (isBad(s)) bad.push(`${a.meetings.cite} used for a records request (cite the ${a.records.name}, ${a.records.cite}, instead)`);
  if (!bad.length) return none;
  const strip = t => String(t).split('\n').map(line => isBadLine(line) ? sentencesOf(line).filter(s => !isBad(s)).join('').trimEnd() : line).join('\n');
  const isBadLine = line => sentencesOf(line).some(isBad);
  return { ok: false, bad, strip };
}
