// scripts/templates/enrichment.js — ZoningFight (zoning / land-use domain)
// SEO Phase 2: injects verified, state-specific zoning sections BELOW the existing
// page content, driven by scripts/data/state-data.json so prose reflects each
// state's actual framework (a home-rule enabling act reads differently from a
// state with statewide ADU preemption). Ported from the shared hoafight pattern.

function esc(s){ if(s==null) return ''; return String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function has(v){ if(v==null) return false; const s=String(v).trim(); return s!=='' && s.toLowerCase()!=='null' && s.toLowerCase()!=='n/a'; }
function clean(s){ return String(s==null?'':s).trim().replace(/\s+/g,' ').replace(/\.+$/,''); }
function sent(s){ const t=clean(s); return t?t+'.':''; }
function article(w){ return /^[aeiou]/i.test(String(w).trim())?'an':'a'; }

// dispute slug -> which fields to foreground in "Your Options"
const TOPIC_EMPHASIS = {
  'zoning-variance-appeal-letter':   ['variance_process','appeal_process'],
  'zoning-decision-appeal':          ['appeal_process','variance_process'],
  'special-use-permit-appeal':       ['special_use_permits','appeal_process'],
  'setback-variance-request':        ['variance_process','special_use_permits'],
  'conditional-use-permit-denial':   ['special_use_permits','appeal_process'],
  'zoning-board-hearing-objection':  ['appeal_process','special_use_permits'],
  'spot-zoning-challenge':           ['appeal_process','nonconforming_use_rules'],
  'nonconforming-use-letter':        ['nonconforming_use_rules','variance_process'],
  'zoning-code-violation-defense':   ['nonconforming_use_rules','appeal_process'],
  'rezoning-application-letter':     ['appeal_process','special_use_permits'],
};
const RIGHTS = [
  ['variance_process','Variances'],
  ['appeal_process','Appealing a denial'],
  ['special_use_permits','Special / conditional use'],
  ['nonconforming_use_rules','Nonconforming (grandfathered) uses'],
  ['adu_rules','Accessory dwelling units (ADUs)'],
  ['home_business_rules','Home businesses'],
];

function overviewProse(state,d){
  const st=d.zoning_enabling_statute||{};
  const paras=[];
  if(has(st.name)){
    paras.push(`Zoning in ${state} is carried out by cities and counties under the ${st.name}${has(st.citation)?` (${st.citation})`:''}. ${has(d.primary_land_use_law)?sent(d.primary_land_use_law):'The enabling act sets the framework; the detailed rules live in each municipality’s zoning ordinance.'}`);
  } else {
    paras.push(`${state} delegates zoning to local governments; the specific rules that affect your property live in your city or county zoning ordinance rather than a single statewide code.${has(d.primary_land_use_law)?' '+sent(d.primary_land_use_law):''}`);
  }
  const rb=d.regulatory_body||'';
  if(/local|municipal|no state|none/i.test(rb)){
    paras.push(`There is no state zoning regulator that overturns a local decision for you — ${has(d.complaint_process)?sent(d.complaint_process):'you challenge a denial through the local board and then the courts'} Citing the right provision and deadline is what makes a written appeal effective.`);
  } else if(has(rb)){
    paras.push(`${sent(rb)}${has(d.complaint_process)?' '+sent(d.complaint_process):''}`);
  }
  if(has(d.recent_reform) && !/^(no|none)\b/i.test(d.recent_reform)){
    paras.push(`A recent change to watch: ${sent(d.recent_reform)}`);
  }
  return paras;
}

export function renderEnrichmentSections(state, dispute, d){
  if(!d) return '';
  const S=state.name;
  const overview=overviewProse(S,d).map(p=>`      <p>${esc(p)}</p>`).join('\n');

  const emph=TOPIC_EMPHASIS[dispute.slug]||RIGHTS.map(r=>r[0]);
  const order=[...emph, ...RIGHTS.map(r=>r[0]).filter(k=>!emph.includes(k))];
  const labelOf=Object.fromEntries(RIGHTS);
  const rights=order.map(k=>{ const v=d[k]; if(!has(v)) return ''; return `      <p><strong>${esc(labelOf[k])}:</strong> ${esc(sent(v))}</p>`; }).filter(Boolean).join('\n');

  const appealBody=has(d.appeal_process)?esc(sent(d.appeal_process)):`${esc(S)} zoning appeals run through the local board of adjustment/zoning board, then to state court by writ — a written objection citing the ordinance and the record is the first step.`;
  const complaintExtra=has(d.complaint_process)?`      <p>${esc(sent(d.complaint_process))}</p>`:'';

  const issues=Array.isArray(d.common_disputes)?d.common_disputes.filter(has):[];
  const issuesList=issues.length?`      <ul>\n${issues.map(i=>`        <li>${esc(i)}</li>`).join('\n')}\n      </ul>`:`      <p>The most common ${esc(S)} zoning disputes involve variances, use permits, and enforcement of the local ordinance.</p>`;

  const feats=Array.isArray(d.unique_features)?d.unique_features.filter(has):[];
  const featBlock=feats.length?`    <section class="enrich-section">
      <h2>${esc(S)} Zoning Provisions Worth Knowing</h2>
      <ul>\n${feats.slice(0,4).map(f=>`        <li>${esc(f)}</li>`).join('\n')}\n      </ul>
    </section>`:'';

  return `
  <div class="enrich">
    <section class="enrich-section">
      <h2>${esc(S)} Zoning &amp; Land Use Law Overview</h2>
${overview}
    </section>
    <section class="enrich-section">
      <h2>Your Options in ${esc(S)}</h2>
${rights}
    </section>
    <section class="enrich-section">
      <h2>How to Appeal a Zoning Decision in ${esc(S)}</h2>
      <p>${appealBody}</p>
${complaintExtra}
    </section>
    <section class="enrich-section">
      <h2>Common Zoning Disputes in ${esc(S)}</h2>
${issuesList}
    </section>
${featBlock}
  </div>`;
}

export function dataFaqs(state, d){
  if(!d) return [];
  const S=state.name; const out=[];
  if(has(d.appeal_process)) out.push({q:`How do I appeal a zoning decision in ${S}?`, a:sent(d.appeal_process)});
  if(has(d.variance_process)) out.push({q:`Who grants a zoning variance in ${S}?`, a:sent(d.variance_process)});
  if(has(d.adu_rules)) out.push({q:`Does ${S} have a statewide ADU (accessory dwelling unit) law?`, a:sent(d.adu_rules)});
  else if(has(d.nonconforming_use_rules)) out.push({q:`Are nonconforming uses grandfathered in ${S}?`, a:sent(d.nonconforming_use_rules)});
  return out.slice(0,3);
}

export function stateLawSnapshot(stateName, d){
  if(!d) return '';
  return overviewProse(stateName,d)[0]||'';
}

export function stateTeaser(state, d){
  if(!d) return '';
  const st=d.zoning_enabling_statute||{};
  if(has(st.name)) return `Zoning under ${st.name}${has(st.citation)?` (${st.citation})`:''}`;
  return `Zoning is administered locally; appeals run through the municipal board then state court`;
}
