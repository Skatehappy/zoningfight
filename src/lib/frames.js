// src/lib/frames.js — client-side frame registry. All frames ship as STATIC
// bundled JSON: Vite's eager glob import inlines every frames/*.json at build
// time (no runtime fetch, no cache table, no database). Selection is a sync
// object lookup.
import { selectFrame as _select } from '../../frames/select.mjs';

const modules = import.meta.glob('../../frames/*.json', { eager: true });

export const REGISTRY = {};
for (const mod of Object.values(modules)) {
  const frame = mod.default || mod;
  if (!frame || !frame.state) continue;
  if (frame.state === 'GENERIC') { REGISTRY.GENERIC = frame; continue; }
  // key format "{ABBR}:{application_type}", e.g. "CT:special_exception"
  REGISTRY[`${frame.state}:${frame.application_type}`] = frame;
}

export function selectFrame(state, applicationType) {
  return _select(REGISTRY, state, applicationType);
}
