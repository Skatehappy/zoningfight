// sims/_assert.mjs — tiny assertion helpers. Each sim exits nonzero on failure.
export function ok(cond, msg) {
  if (!cond) {
    console.error(`  FAIL: ${msg}`);
    process.exitCode = 1;
    throw new Error(msg);
  }
  console.log(`  ok: ${msg}`);
}

export function eq(actual, expected, msg) {
  ok(actual === expected, `${msg} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

export function pass(name) {
  console.log(`PASS ${name}`);
}
