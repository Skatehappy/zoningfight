// sims/_frames.mjs — load the frame JSONs for Node sims (the client uses
// src/lib/frames.js, which is Vite-specific).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(here, '..', 'frames', f), 'utf8'));

export const REGISTRY = {
  'FL:special_exception': load('FL-special-exception.json'),
  'FL:variance': load('FL-variance.json'),
  GENERIC: load('GENERIC.json'),
};
