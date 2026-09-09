// src/lib/hosts.js — guided-retrieval host lookup (T5).
import HOSTS from "../../hosts/code-hosts.json";
import { stateAbbr } from "../../frames/select.mjs";

export function slugify(s) {
  return String(s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

// Returns a verified landing URL for (state, municipality), or null. Never
// constructs or guesses a URL — only returns registry entries verified to
// resolve 200.
export function lookupHost(state, municipality) {
  const st = stateAbbr(state);
  const slug = slugify(municipality);
  const entry = HOSTS?.[st]?.[slug];
  return entry && entry.landing_url ? { ...entry, state: st, slug } : null;
}

// The copyable fallback search string when no verified host exists.
export function searchString(state, municipality) {
  const m = String(municipality || "").trim() || "your municipality";
  const s = String(state || "").trim() || "your state";
  return `${m} ${s} land development code special exception criteria`;
}
