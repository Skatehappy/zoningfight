// stripMarkdown (display + PDF text) and the spelled-out figure check in the numeric lint.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripMarkdown } from '../src/lib/stripMarkdown.js';
import { lintNumbers, normalizeFigures, wordsToNumber } from '../api/_numlint.js';

const MD = '# RE: Special Exception\n\n**Dear Board,**\n\nThis is *very* important, __bold__ and _soft_ text.\n\n* item one\n* item **two**\n+ item three\n\n| Criterion | Evidence |\n|---|---|\n| Hardship | Narrow lot |\n| Unique | Steep slope |\n\n---\n\n```\ncode here\n```\nSincerely, [Rob](http://x.com)';

test('stripMarkdown removes headings, bold, italics, bullets, tables, rules, fences, links', () => {
  const out = stripMarkdown(MD);
  assert.doesNotMatch(out, /[#*|`]|__|---|\]\(/);
  assert.match(out, /^RE: Special Exception/);
  assert.match(out, /Dear Board,/);
  assert.match(out, /- item one\n- item two\n- item three/);
  assert.match(out, /Criterion: Hardship; Evidence: Narrow lot/);
  assert.match(out, /Criterion: Unique; Evidence: Steep slope/);
  assert.match(out, /code here/);
  assert.match(out, /Rob \(http:\/\/x\.com\)/);
});

test('stripMarkdown leaves plain letters, [DATE], snake_case, 3*4 and numbered lines untouched', () => {
  const plain = 'Dear Board,\n\n[DATE]\n\n1. First point (see exhibit_a)\n2. Second point: 3*4 = 12\n\n- plain hyphen item\n\nSincerely,\nOwner';
  assert.equal(stripMarkdown(plain), plain);
  assert.equal(stripMarkdown(''), '');
  assert.equal(stripMarkdown(null), '');
});

test('stripMarkdown handles CRLF and unmatched markers', () => {
  assert.equal(stripMarkdown('**Dear Board\r\nThanks**'), 'Dear Board\nThanks');
  assert.doesNotMatch(stripMarkdown('a **b'), /\*/);
});

test('the PDF and display paths both call stripMarkdown', async () => {
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /return stripMarkdown\(\(await res\.json\(\)\)\.text\)/);
  assert.match(src, /stripMarkdown\(text\)\.replace\(\/\\\[DATE\\\]\/g, today\)/);
});

test('plain-text rule is appended to every generate request', async () => {
  const { PLAIN_TEXT_RULE } = await import('../api/generate.js');
  assert.match(PLAIN_TEXT_RULE, /plain text only/i);
  assert.match(PLAIN_TEXT_RULE, /markdown/i);
});

test('wordsToNumber', () => {
  assert.equal(wordsToNumber('thirty'), 30);
  assert.equal(wordsToNumber('thirty-six'), 36);
  assert.equal(wordsToNumber('one hundred'), 100);
  assert.equal(wordsToNumber('five hundred'), 500);
  assert.equal(wordsToNumber('one hundred twenty-five'), 125);
  assert.equal(wordsToNumber('two thousand'), 2000);
  assert.equal(wordsToNumber('banana'), null);
});

test('normalizeFigures covers spelled-out and parenthetical forms', () => {
  const cases = [
    ['thirty (30) days', '30 days'], ['thirty days', '30 days'], ['thirty-six days', '36 days'], ['30 (thirty) days', '30 days'],
    ['ten percent', '10%'], ['ten percent (10%)', '10%'], ['five hundred dollars', '$500'], ['five hundred dollars ($500)', '$500'],
    ['500 dollars', '$500'], ['one hundred days', '100 days'], ['ninety-nine percent', '99%'], ['sixty-day', '60 days'],
  ];
  for (const [i, o] of cases) assert.equal(normalizeFigures(i), o, i);
  assert.equal(normalizeFigures('within six months'), 'within six months', 'months/years are deliberately not normalised');
  assert.equal(normalizeFigures('one of the owners'), 'one of the owners');
});

test('CAUGHT: spelled-out unverified figures are flagged and stripped like their digit forms', () => {
  const t = (sentence, abbr) => lintNumbers(`Intro sentence stays. ${sentence} Closing sentence stays.`, abbr, '');
  const cases = [
    ['You must appeal to the Board of Adjustment within thirty (30) days.', 'AZ'],
    ['You must appeal to the Board of Adjustment within thirty days.', 'AZ'],
    ['An appeal to the Board of Adjustment must be filed within 30 (thirty) days.', 'AZ'],
    ['A petition under Article 78 must be filed within sixty days.', 'NY'],
    ['The penalty is a fine of five hundred dollars per violation.', 'GA'],
    ['The filing fee is five hundred dollars ($500).', 'TX'],
    ['The application fee is two hundred fifty dollars.', 'FL'],
    ['The small claims limit is ten thousand dollars.', 'OH'],
  ];
  for (const [s, ab] of cases) {
    const r = lintNumbers(`Intro sentence stays. ${s} Closing sentence stays.`, ab, '');
    assert.equal(r.ok, false, s);
    assert.doesNotMatch(r.stripped, /thirty|sixty|dollars|\d/, s);
    assert.match(r.stripped, /Intro sentence stays\./); assert.match(r.stripped, /Closing sentence stays\./);
  }
  assert.ok(t('You must appeal to the Board of Adjustment within 30 days.', 'AZ').ok === false, 'digit form still caught');
});

test('NOT CAUGHT: user-supplied figures (any spelling), verified content, and non-figure prose', () => {
  const ok = (text, abbr, user = '') => assert.equal(lintNumbers(text, abbr, user).ok, true, text);
  const s = 'You must appeal to the Board of Adjustment within thirty (30) days.';
  ok(s, 'AZ', 'My hearing notice says I have 30 days to appeal.');
  ok('You must appeal to the Board of Adjustment within 30 days.', 'AZ', 'The deadline is thirty days.');
  ok('You must appeal to the Board of Adjustment within thirty days.', 'AZ', 'deadline: thirty (30) days');
  ok('Please respond within thirty (30) days.', 'GA');                       // not a stale class: prompt-mandated response deadline
  ok('We seek a variance of ten percent from the setback.', 'GA');
  ok('Fines up to $250/day for first violation apply under Fla. Stat. 162.09.', 'FL');   // verified (ALLOW)
  ok('We ask for a decision within six months.', 'GA');
  ok('One of the owners and one hundred neighbors support this request.', 'GA');
});
