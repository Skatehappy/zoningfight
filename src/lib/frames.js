// src/lib/frames.js — client-side frame registry (Vite bundles the JSON).
import FL_SE from '../../frames/FL-special-exception.json';
import FL_VAR from '../../frames/FL-variance.json';
import GENERIC from '../../frames/GENERIC.json';
import { selectFrame as _select } from '../../frames/select.mjs';

export const REGISTRY = {
  'FL:special_exception': FL_SE,
  'FL:variance': FL_VAR,
  GENERIC,
};

export function selectFrame(state, applicationType) {
  return _select(REGISTRY, state, applicationType);
}
