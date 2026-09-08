// src/lib/errors.js — T3 error taxonomy (single source of truth, client side).
//
// HARD RULE: no error state may contain the words "purchase", "buy", or
// "checkout". Buying a second code is NEVER presented as the remedy for a
// failure. Gate B7 statically enforces this against the strings below.
//
// Every failure that is NOT a definitive code-state problem must reassure the
// buyer their code has not been used, because the original outage led a
// customer to buy a second code as the perceived fix.

export const SUPPORT_EMAIL = 'support@zoningfight.com';

// Codes whose message should surface a support link.
const WITH_SUPPORT = new Set(['CODE_CONSUMED', 'CODE_INVALID']);

const MESSAGES = {
  TRANSIENT:
    'Temporary problem on our end. Your code has not been used. Please try again.',
  CODE_IN_USE:
    'This code is in use in another window. Wait 15 minutes, or finish in the other window.',
  CODE_CONSUMED:
    'This code has already generated a letter. Contact support if that is not right.',
  CODE_INVALID:
    'That code is not recognized. Check for typos.',
};

// INPUT_TOO_LONG / INPUT_INVALID name the offending field.
export function inputTooLong(fieldLabel, count, limit) {
  return {
    code: 'INPUT_TOO_LONG',
    message: `${fieldLabel} is too long — ${count} of ${limit} characters. Please shorten it. Your code has not been used.`,
    showSupport: false,
  };
}

export function inputInvalid(fieldLabel, detail) {
  return {
    code: 'INPUT_INVALID',
    message: `${fieldLabel} needs attention${detail ? ` — ${detail}` : ''}. Your code has not been used.`,
    showSupport: false,
  };
}

// Map a code (from a RedeemError or API errorCode) to a display object.
export function errorFor(code) {
  const message = MESSAGES[code] || MESSAGES.TRANSIENT;
  return { code: MESSAGES[code] ? code : 'TRANSIENT', message, showSupport: WITH_SUPPORT.has(code) };
}

// Thrown by the redemption layer; carries a taxonomy code.
export class RedeemError extends Error {
  constructor(code, detail) {
    super(code);
    this.code = code;
    this.detail = detail;
  }
}
