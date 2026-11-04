// api/_complete.js — one Anthropic Messages call that never hands back a truncated reply (Edge-safe: no node: imports).
// stop_reason "max_tokens" means the reply was cut off. The call is retried ONCE with the next, higher limit in
// `limits`; if that is also cut off the result is { ok: false, truncated: true } and no partial text is returned,
// so callers can never parse or send half an output.
// The endpoint URL is passed in by the handler (which has already passed verifyLicense): auth-gate rule - no helper
// module names the Anthropic host itself.
//
// Time budget (opts): every request must finish well inside the platform limit, so
//   opts.deadline    absolute ms timestamp: each fetch is aborted at this instant -> { ok:false, timedOut:true }
//   opts.retryBefore absolute ms timestamp: a truncation retry (a second, larger call) only starts if the first
//                    reply arrived before it; otherwise the result is the same as a failed retry (truncated).
export async function callComplete(url, apiKey, buildBody, limits, opts = {}) {
  const { deadline = Infinity, retryBefore = Infinity } = opts;
  for (let i = 0; i < limits.length; i++) {
    const left = deadline - Date.now();
    if (left <= 500) return { ok: false, timedOut: true, err: 'No time left for a model call', attempts: i };
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify(buildBody(limits[i])),
        signal: Number.isFinite(left) ? AbortSignal.timeout(left) : undefined,
      });
      if (!response.ok) return { ok: false, status: response.status, err: await response.text() };
      var data = await response.json();
    } catch (e) {
      if (e && (e.name === 'TimeoutError' || e.name === 'AbortError')) return { ok: false, timedOut: true, err: 'Model call exceeded its time budget', attempts: i + 1 };
      return { ok: false, err: String(e && e.message || e), attempts: i + 1 };
    }
    if (data.stop_reason === 'max_tokens') {
      if (i < limits.length - 1 && Date.now() < retryBefore) continue;
      return { ok: false, truncated: true, err: 'Model reply was cut off at the token limit', stop: data.stop_reason, attempts: i + 1 };
    }
    // Extract the text block by type, not by position (adaptive thinking can put a "thinking" block first).
    const text = data.content?.find(b => b.type === 'text')?.text;
    if (!text) return { ok: false, err: `No text block in API response (stop_reason: ${data.stop_reason || 'unknown'})`, stop: data.stop_reason };
    return { ok: true, text, stop: data.stop_reason, attempts: i + 1 };
  }
  return { ok: false, err: 'no token limits given' };
}
