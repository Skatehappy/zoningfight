// src/lib/validate.js — T4 input caps + total-payload guard.
//
// ORDERING RULE: all validation passes client-side BEFORE zf_reserve_code is
// called. Invalid input never touches a reservation. The App builds the list of
// {label, value, limit} entries for the active flow and calls checkPayload();
// only on {ok:true} does it reserve.

export const CAPS = {
  shortText: 200,        // addresses, district, deciding body, terminology
  longText: 1500,        // narrative textareas (what you want, requirement, hardship…)
  regulationSections: 200,
  additionalInfo: 4000,
  criterion: 400,
  evidence: 1200,
};

// Total free-text budget. The model's context is far larger; this is a sanity
// ceiling with generous headroom against a paste-bomb, not a context limit.
export const TOTAL_PAYLOAD_CAP = 30000;

export function count(value) {
  return String(value || '').length;
}

export function checkField(label, value, limit) {
  const c = count(value);
  if (c > limit) return { ok: false, code: 'INPUT_TOO_LONG', label, count: c, limit };
  return { ok: true };
}

// entries: Array<{label, value, limit}>. Returns the first violation, or a
// total-payload violation, or {ok:true}.
export function checkPayload(entries) {
  let total = 0;
  for (const e of entries || []) {
    const r = checkField(e.label, e.value, e.limit);
    if (!r.ok) return r;
    total += count(e.value);
  }
  if (total > TOTAL_PAYLOAD_CAP) {
    return { ok: false, code: 'INPUT_TOO_LONG', label: 'Total input', count: total, limit: TOTAL_PAYLOAD_CAP };
  }
  return { ok: true };
}
