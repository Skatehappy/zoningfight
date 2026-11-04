// stripMarkdown — turns model output that slipped into markdown into plain letter text.
// Applied to every letter before it is shown, copied, emailed or written to the PDF.
// Handles: code fences, # headings, **bold** / __bold__, *italic* / _italic_, `inline code`, "- " / "* " / "+ " bullets
// (to a plain "- "), > quotes, horizontal rules, [text](url) links, and pipe tables (rows become "a | b" lines or
// "Header: value" lines; the |---| separator row is dropped). Underscores inside words (snake_case) and "*" used
// as a multiplication or footnote sign are left alone. Pure, no I/O.
export function stripMarkdown(input) {
  let t = String(input ?? '').replace(/\r\n?/g, '\n');
  // code fences: keep the inner text, drop the fence lines
  t = t.replace(/^[ \t]*(```|~~~)[^\n]*\n([\s\S]*?)^[ \t]*\1[ \t]*$/gm, (m, f, body) => body.replace(/\n$/, ''));
  t = t.replace(/^[ \t]*(```|~~~)[^\n]*$/gm, '');

  // pipe tables
  const lines = t.split('\n');
  const out = [];
  const isSep = l => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l) && l.includes('-') && (l.includes('|') || /^\s*:?-{3,}/.test(l)) && /\|/.test(l);
  const isRow = l => /^\s*\|.*\|\s*$/.test(l) || (/\|/.test(l) && /^\s*[^|\n]+\|[^|\n]+/.test(l));
  const cells = l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (isRow(l) && lines[i + 1] !== undefined && isSep(lines[i + 1])) {
      const head = cells(l);
      i += 2;
      for (; i < lines.length && isRow(lines[i]) && !isSep(lines[i]); i++) {
        const row = cells(lines[i]);
        out.push(row.every(c => !c) ? '' : head.some(h => h) && row.length === head.length
          ? row.map((c, k) => head[k] ? `${head[k]}: ${c}` : c).filter(Boolean).join('; ')
          : row.filter(Boolean).join(' | '));
      }
      i--;
      continue;
    }
    if (isSep(l)) continue;
    out.push(l);
  }
  t = out.join('\n');

  t = t.replace(/^[ \t]{0,3}#{1,6}[ \t]+(.*?)[ \t]*#*[ \t]*$/gm, '$1');            // headings
  t = t.replace(/^[ \t]*([-*_])([ \t]*\1){2,}[ \t]*$/gm, '');                          // horizontal rules
  t = t.replace(/^([ \t]*)[*+•][ \t]+/gm, '$1- ');                                      // bullets to "-"
  t = t.replace(/^[ \t]*>[ \t]?/gm, '');                                               // quotes
  t = t.replace(/!?\[([^\]\n]+)\]\(([^)\s]+)[^)]*\)/g, (m, txt, url) => (txt === url ? txt : `${txt} (${url})`));
  t = t.replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '$2');                               // bold
  t = t.replace(/(^|[^\w*])\*(?=[^\s*])([^*\n]*?[^\s*])\*(?![\w*])/g, '$1$2');          // *italic*
  t = t.replace(/(^|[^\w])_(?=[^\s_])([^_\n]*?[^\s_])_(?![\w])/g, '$1$2');              // _italic_
  t = t.replace(/`([^`\n]+)`/g, '$1');                                                  // inline code
  t = t.replace(/\*\*|__/g, '');                                                       // stray unmatched bold markers
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}
