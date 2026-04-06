import { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";

// ─── Config ──────────────────────────────────────────────────────────────────
// Replace these with your actual EmailJS credentials
const EMAILJS_SERVICE_ID  = "YOUR_EMAILJS_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_EMAILJS_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY  = "YOUR_EMAILJS_PUBLIC_KEY";

// API base — empty string means same domain (Vercel routes /api/*)
const API_BASE = "";

// ─── Constants ───────────────────────────────────────────────────────────────
const STEPS = ["Intro", "Property", "Variance", "Hardship", "Criteria", "Generate", "Letter"];

const SAMPLE_LETTER = `[DATE]

Members of the Zoning Board of Appeals
Town of Westbrook, Connecticut

Re: Application for Area Variance — 142 Harbor View Road, Westbrook, CT 06498

Dear Members of the Zoning Board of Appeals:

The applicant respectfully requests an area variance of 4.3 feet from the required 25-foot front yard setback established under §8.2 of the Westbrook Zoning Regulations, reducing the effective setback to 20.7 feet along the northerly lot line. This relief is the minimum necessary to accommodate a 12-foot by 16-foot single-story residential addition.

I. Special Conditions Peculiar to the Property

The subject parcel presents geometric constraints not shared by neighboring properties. The lot was created by the 1961 subdivision of the original Harbor View Estate and contains an irregular triangular configuration resulting from the intersection of Harbor View Road and the former railroad right-of-way. This configuration reduces the effective buildable area by approximately 31% compared to standard rectangular lots within the R-20 district...

II. Hardship Not Self-Created

The nonconforming setback condition originates from the original 1961 subdivision layout, predating the current owners' acquisition of the property in 2018. No action by the applicant created or exacerbated the geometric constraints described above...`;

const TIPS = [
  { icon: "📐", title: "Be specific with measurements", body: "Boards respond to exact numbers. \"4.3 feet\" is far stronger than \"a few feet.\"" },
  { icon: "🏚️", title: "Focus on the property, not yourself", body: "The hardship must relate to the land's physical characteristics, not your personal needs." },
  { icon: "⚖️", title: "Minimum variance wins", body: "Always show you're asking for the least relief possible. Boards approve conservative requests." },
  { icon: "🤝", title: "Address objections first", body: "Anticipate neighbor concerns and address them proactively. It signals good faith." },
];

const USE_VARIANCE_WARNING = "Use variances are significantly harder to obtain than area variances and often require showing the property cannot earn a reasonable return under current zoning. Consider consulting a land use attorney.";

const stepFields = {
  Property: [
    { key: "address",    label: "Full Property Address",           type: "text",     placeholder: "123 Main St, Anytown, CT 06000",    required: true },
    { key: "zone",       label: "Zoning District",                 type: "text",     placeholder: "e.g. R-20, R-40, B-1",              required: true, helper: "Find on your property tax bill, town GIS map, or call your zoning office." },
    { key: "state",      label: "State",                           type: "text",     placeholder: "e.g. Connecticut",                  required: true },
    { key: "lotSize",    label: "Approximate Lot Size",            type: "text",     placeholder: "e.g. 0.45 acres or 19,600 sq ft" },
    { key: "yearBuilt",  label: "Year Structure Built",            type: "text",     placeholder: "e.g. 1962" },
    { key: "ownerSince", label: "Current Owner Since",             type: "text",     placeholder: "e.g. 2019" },
  ],
  Variance: [
    { key: "varianceType",   label: "Type of Variance",                       type: "select",   required: true,  options: ["Area/Dimensional Variance","Use Variance","Special Exception"], helper: "Area variances (setbacks, height, coverage) are most common and easiest to obtain." },
    { key: "whatRequested",  label: "What Specifically Are You Asking For?",  type: "textarea", required: true,  placeholder: "e.g. Reduce front setback from required 25 feet to 20.7 feet to allow construction of a 12×16 single-story addition" },
    { key: "measurements",   label: "Exact Measurements Involved",            type: "textarea", required: true,  placeholder: "Required setback: 25 ft\nProposed setback: 20.7 ft\nRelief requested: 4.3 ft\nAddition size: 12 ft × 16 ft", helper: "More numbers = stronger application. Include required amount, proposed amount, and the difference." },
  ],
  Hardship: [
    { key: "whyNeeded",      label: "Why Do You Need This? (Plain English)",          type: "textarea", required: true,  placeholder: "Just describe your situation naturally. The AI converts it into proper legal language.\n\ne.g. We want to add a bedroom. The back yard has a steep drop and the septic system is in the way." },
    { key: "propertyUnique", label: "What Makes Your Lot or Property Unique?",        type: "textarea", placeholder: "e.g. Irregular triangular shape, steep slope, proximity to wetlands, narrow frontage..." },
    { key: "preExisting",    label: "Did the Hardship Condition Exist When You Bought?", type: "select", required: true, options: ["Yes — condition fully predates my ownership","Partially — some conditions existed before","No — condition arose after I purchased","Not applicable"] },
    { key: "alternatives",   label: "Alternatives You Considered and Why They Won't Work", type: "textarea", placeholder: "e.g. Rear addition infeasible due to septic system location and grade change exceeding 15%..." },
  ],
  Criteria: [
    { key: "localCriteria",    label: "Paste Your Town's Variance Evaluation Criteria", type: "textarea", rows: 7, required: true, placeholder: "Copy from your variance application form or town zoning regulations.\n\nExample:\n1. Special conditions and circumstances peculiar to the land or structure...\n2. Literal interpretation would deprive the applicant of rights enjoyed by other properties...\n3. Hardship was not self-created...", helper: "Call your town's zoning office and ask for the variance evaluation criteria — they'll email them." },
    { key: "neighborConcerns", label: "Neighbor Concerns to Address Proactively (optional)", type: "textarea", placeholder: "e.g. Neighbor to the north may raise concerns about reduced light..." },
    { key: "precedents",       label: "Similar Variances Granted Nearby (optional)", type: "textarea", placeholder: "e.g. 47 Elm Street received a similar 5-foot front setback variance in 2021 (ZBA Case #21-14)..." },
  ],
};

const requiredFields = {
  Property: ["address","zone","state"],
  Variance: ["varianceType","whatRequested","measurements"],
  Hardship: ["whyNeeded","preExisting"],
  Criteria: ["localCriteria"],
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const colors = {
  paper:      "#faf7f2",
  paperWarm:  "#f5f0e8",
  paperDark:  "#ede8de",
  white:      "#ffffff",
  ink:        "#1a1208",
  inkLight:   "#4a3f30",
  inkMuted:   "#7a6e5e",
  inkFaint:   "#a89e8e",
  gold:       "#b8860b",
  goldLight:  "#d4a017",
  border:     "#d8d0c0",
  borderLight:"#ede8de",
  green:      "#1a5c2a",
  red:        "#8b1a1a",
  errorBg:    "#fff0f0",
  errorBorder:"#ffcccc",
  errorText:  "#cc2222",
};

const inputStyle = (focused) => ({
  width: "100%",
  padding: "13px 16px",
  background: colors.white,
  border: `1px solid ${focused ? colors.goldLight : colors.border}`,
  borderRadius: "8px",
  color: colors.ink,
  fontSize: "15px",
  fontFamily: "'Source Serif 4', Georgia, serif",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
});

const btnStyle = (active) => ({
  background: active ? `linear-gradient(135deg, ${colors.goldLight}, #8b6010)` : colors.paperDark,
  border: "none",
  color: active ? "#fff8e8" : colors.inkFaint,
  padding: "13px 28px",
  borderRadius: "6px",
  cursor: active ? "pointer" : "default",
  fontSize: "15px",
  fontWeight: active ? "700" : "400",
  fontFamily: "'Source Serif 4', Georgia, serif",
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  boxShadow: active ? "0 2px 12px rgba(184,134,11,0.3)" : "none",
});

// ─── Sub-components ───────────────────────────────────────────────────────────
function Tooltip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: "6px" }}>
      <span onClick={() => setOpen(o => !o)} style={{ cursor: "pointer", color: colors.goldLight, fontSize: "12px", border: `1px solid ${colors.goldLight}`, borderRadius: "50%", width: "16px", height: "16px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>?</span>
      {open && (
        <div style={{ position: "absolute", left: "22px", top: "-4px", width: "240px", zIndex: 20, background: colors.white, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "12px 14px", fontSize: "13px", color: colors.inkLight, lineHeight: "1.6", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
          {text}
          <div onClick={() => setOpen(false)} style={{ marginTop: "8px", color: colors.goldLight, cursor: "pointer", fontSize: "11px" }}>Close ×</div>
        </div>
      )}
    </span>
  );
}

function Field({ field, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: "4px" }}>
      <label style={{ display: "block", marginBottom: "7px", fontSize: "13px", color: colors.inkMuted, letterSpacing: "0.03em" }}>
        {field.label}
        {field.required && <span style={{ color: colors.goldLight, marginLeft: "4px" }}>*</span>}
        {field.helper && <Tooltip text={field.helper} />}
      </label>
      {field.type === "select" ? (
        <select value={value || ""} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...inputStyle(focused), cursor: "pointer" }}>
          <option value="">Select...</option>
          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : field.type === "textarea" ? (
        <textarea value={value || ""} onChange={e => onChange(e.target.value)} placeholder={field.placeholder}
          rows={field.rows || 4} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...inputStyle(focused), resize: "vertical", lineHeight: "1.7", minHeight: `${(field.rows || 4) * 28}px` }} />
      ) : (
        <input type="text" value={value || ""} onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={inputStyle(focused)} />
      )}
    </div>
  );
}

function Spinner() {
  return <span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,248,232,0.3)", borderTopColor: "#fff8e8", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function ZoningFight() {
  const [step, setStep]             = useState(0);
  const [formData, setFormData]     = useState({});
  const [accessCode, setAccessCode] = useState("");
  const [codeValid, setCodeValid]   = useState(false);
  const [codeError, setCodeError]   = useState("");
  const [email, setEmail]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [letter, setLetter]         = useState("");
  const [altLetter, setAltLetter]   = useState("");
  const [activeTab, setActiveTab]   = useState("standard");
  const [checklist, setChecklist]   = useState([]);
  const [copied, setCopied]         = useState(false);
  const [emailSent, setEmailSent]   = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [error, setError]           = useState("");
  const [showSample, setShowSample] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Read access code from URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setAccessCode(code.toUpperCase());
      verifyCode(code.toUpperCase(), true);
    }
  }, []);

  // Restore form from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("zf_form");
      if (saved) setFormData(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem("zf_form", JSON.stringify(formData)); } catch {}
  }, [formData]);

  const handleChange = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const isStepValid = (stepName) => {
    const req = requiredFields[stepName] || [];
    return req.every(k => formData[k]?.trim());
  };

  // Verify access code against Edge Function
  const verifyCode = async (code, silent = false) => {
    if (!code?.trim()) { setCodeError("Please enter your access code."); return; }
    setCodeError("");
    try {
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessCode: code,
          systemPrompt: "Respond with only the word: VALID",
          userPrompt: "Access check",
        }),
      });
      if (res.status === 401) {
        if (!silent) setCodeError("Invalid access code. Check your Payhip receipt email.");
        setCodeValid(false);
      } else {
        setCodeValid(true);
        if (!silent) setStep(1);
      }
    } catch {
      if (!silent) setCodeError("Could not verify code. Check your internet connection.");
    }
  };

  // Call Edge Function for letter generation
  const callAPI = async (systemPrompt, userPrompt, reviewMode = false, draftLetter = "") => {
    const res = await fetch(`${API_BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessCode, systemPrompt, userPrompt, reviewMode, draftLetter }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Generation failed");
    }
    const data = await res.json();
    return data.text;
  };

  const systemPrompt = `You are an expert land use attorney with 20 years writing successful zoning variance applications. Write compelling, legally precise variance narratives that maximize approval probability.

Rules:
- Address EVERY local criterion explicitly with its own labeled section header (e.g. "I. Special Conditions Peculiar to the Property")
- Use specific measurements — never vague language
- Hardship must relate to the PROPERTY not the owner's desires — use passive construction
- Reference "minimum variance necessary" explicitly
- Preemptively address likely neighbor objections
- No emotional language — only physical and legal facts
- 650-900 words total
- Format: formal letter to "Members of the Zoning Board of Appeals" with [DATE] placeholder and signature block
- Output ONLY the letter, no preamble or commentary`;

  const buildPrompt = (tone = "standard") => {
    const base = `
PROPERTY:
- Address: ${formData.address}
- Zone: ${formData.zone}
- Lot Size: ${formData.lotSize || "not specified"}
- Year Built: ${formData.yearBuilt || "not specified"}
- Owner Since: ${formData.ownerSince || "not specified"}
- State: ${formData.state}

VARIANCE:
- Type: ${formData.varianceType || "Area/Dimensional Variance"}
- Request: ${formData.whatRequested}
- Measurements: ${formData.measurements}

HARDSHIP:
- Situation: ${formData.whyNeeded}
- Property Uniqueness: ${formData.propertyUnique || "not specified"}
- Pre-existing condition: ${formData.preExisting}
- Alternatives considered: ${formData.alternatives || "not specified"}

LOCAL CRITERIA TO ADDRESS (each one explicitly):
${formData.localCriteria}

NEIGHBOR CONCERNS: ${formData.neighborConcerns || "none specified"}
PRECEDENTS: ${formData.precedents || "none specified"}`;

    if (tone === "assertive") {
      return `Write a MORE ASSERTIVE and DETAILED variance letter for this situation. Use stronger, more confident language, more technical specificity, and a more forceful framing while remaining entirely professional. Different wording and structure from a standard version:\n${base}`;
    }
    return `Write a STANDARD PROFESSIONAL variance letter for this situation:\n${base}`;
  };

  const generateLetter = async () => {
    setLoading(true);
    setError("");
    setLetter("");
    setAltLetter("");
    setChecklist([]);

    try {
      // Pass 1: Draft standard letter
      setLoadingMsg("Drafting your letter...");
      const draft = await callAPI(systemPrompt, buildPrompt("standard"));

      // Pass 2: Quality review
      setLoadingMsg("Running quality review...");
      const reviewed = await callAPI("", "", true, draft);
      setLetter(reviewed);

      // Pass 3: Assertive version
      setLoadingMsg("Generating alternative version...");
      const alt = await callAPI(systemPrompt, buildPrompt("assertive"));
      setAltLetter(alt);

      // Pass 4: Checklist
      setLoadingMsg("Building submission checklist...");
      const clRes = await fetch(`${API_BASE}/api/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessCode,
          address: formData.address,
          state: formData.state,
          varianceType: formData.varianceType,
          letterExcerpt: reviewed.substring(0, 300),
        }),
      });
      if (clRes.ok) {
        const clData = await clRes.json();
        setChecklist(clData.checklist || []);
      }

      setStep(STEPS.indexOf("Letter"));
      setRetryCount(0);

    } catch (e) {
      const n = retryCount + 1;
      setRetryCount(n);
      setError(n < 3
        ? `Generation failed: ${e.message}. Please try again.`
        : "Multiple failures. Try refreshing the page or contact support.");
    }

    setLoading(false);
    setLoadingMsg("");
  };

  // Send letter via EmailJS
  const sendEmail = async () => {
    if (!email || !email.includes("@")) return;
    setEmailSending(true);
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email:      email,
          to_name:       "ZoningFight Customer",
          property:      formData.address,
          letter_standard: letter,
          letter_assertive: altLetter,
          from_name:     "ZoningFight",
          reply_to:      "support@zoningfight.com",
        },
        EMAILJS_PUBLIC_KEY
      );
      setEmailSent(true);
    } catch (e) {
      setError("Email send failed. Please copy the letter manually.");
    }
    setEmailSending(false);
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  const downloadPDF = (text) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 72;
    const usableWidth = doc.internal.pageSize.getWidth() - margin * 2;
    const lineHeight = 14;
    doc.setFont("Times", "normal");
    doc.setFontSize(11);
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const fullText = text.replace(/\[DATE\]/g, today);
    const lines = doc.splitTextToSize(fullText, usableWidth);
    let y = margin;
    lines.forEach(line => {
      if (y + lineHeight > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    });
    doc.save("ZoningFight-variance-letter.pdf");
  };

  const reset = () => {
    setStep(codeValid ? 1 : 0);
    setFormData({});
    setLetter(""); setAltLetter("");
    setError(""); setEmailSent(false);
    setChecklist([]); setRetryCount(0);
    try { sessionStorage.removeItem("zf_form"); } catch {}
  };

  const currentStep = STEPS[step];

  // ─── Render ──────────────────────────────────────────────────────────────────

  const pageStyle = {
    minHeight: "100vh",
    background: colors.paper,
    fontFamily: "'Source Serif 4', Georgia, serif",
    color: colors.ink,
  };

  const containerStyle = {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "40px 24px 80px",
  };

  return (
    <div style={pageStyle}>

      {/* Header */}
      <div style={{ background: colors.white, borderBottom: `1px solid ${colors.border}`, padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "34px", height: "34px", background: `linear-gradient(135deg, ${colors.goldLight}, #8b6010)`, borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", boxShadow: "0 2px 8px rgba(184,134,11,0.3)" }}>⚖</div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: "700", fontFamily: "'Playfair Display', serif", color: colors.ink }}>ZoningFight</div>
            <div style={{ fontSize: "10px", color: colors.inkFaint, letterSpacing: "0.1em", textTransform: "uppercase" }}>Variance Letter Writer</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {step > 0 && step < STEPS.indexOf("Letter") && (
            <button onClick={() => setShowSample(s => !s)} style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.inkMuted, padding: "7px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontFamily: "'Source Serif 4', serif" }}>
              {showSample ? "Hide" : "View"} Sample
            </button>
          )}
          {letter && (
            <button onClick={reset} style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.inkMuted, padding: "7px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontFamily: "'Source Serif 4', serif" }}>
              ← New Letter
            </button>
          )}
        </div>
      </div>

      {/* Sample drawer */}
      {showSample && (
        <div style={{ background: colors.paperWarm, borderBottom: `1px solid ${colors.border}`, padding: "24px 28px", maxHeight: "320px", overflowY: "auto" }}>
          <div style={{ fontSize: "11px", color: colors.goldLight, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Example Output</div>
          <pre style={{ fontSize: "12px", color: colors.inkLight, lineHeight: "1.8", whiteSpace: "pre-wrap", fontFamily: "'Source Serif 4', Georgia, serif", margin: 0 }}>{SAMPLE_LETTER}</pre>
        </div>
      )}

      <div style={containerStyle}>

        {/* ── ACCESS CODE GATE ── */}
        {currentStep === "Intro" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "13px", color: colors.goldLight, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>⚖ ZoningFight</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 5vw, 44px)", color: colors.ink, marginBottom: "16px", fontWeight: "900" }}>
              Variance Letter Writer
            </h1>
            <p style={{ fontSize: "17px", color: colors.inkMuted, marginBottom: "48px", maxWidth: "480px", margin: "0 auto 40px", lineHeight: "1.7" }}>
              Attorney-quality variance letters in 5 minutes. Enter your access code from your Payhip receipt to begin.
            </p>

            {/* Tips */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "40px", textAlign: "left" }}>
              {TIPS.map(t => (
                <div key={t.title} style={{ background: colors.white, border: `1px solid ${colors.borderLight}`, borderRadius: "10px", padding: "20px", display: "flex", gap: "14px" }}>
                  <span style={{ fontSize: "22px" }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: colors.ink, marginBottom: "4px" }}>{t.title}</div>
                    <div style={{ fontSize: "12px", color: colors.inkMuted, lineHeight: "1.6" }}>{t.body}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Access code input */}
            <div style={{ maxWidth: "400px", margin: "0 auto", background: colors.white, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "32px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: "14px", color: colors.inkLight, marginBottom: "16px", fontWeight: "600" }}>Enter Your Access Code</div>
              <input
                type="text"
                value={accessCode}
                onChange={e => { setAccessCode(e.target.value.toUpperCase()); setCodeError(""); }}
                placeholder="e.g. ZD-ABC123"
                style={{ ...inputStyle(false), textAlign: "center", fontSize: "18px", letterSpacing: "0.1em", marginBottom: "12px", fontWeight: "600" }}
              />
              {codeError && <div style={{ color: colors.errorText, fontSize: "13px", marginBottom: "12px" }}>{codeError}</div>}
              <button onClick={() => verifyCode(accessCode)} style={{ ...btnStyle(!!accessCode.trim()), width: "100%", justifyContent: "center", padding: "14px" }}>
                Unlock My Letter →
              </button>
              <div style={{ marginTop: "16px", fontSize: "12px", color: colors.inkFaint, lineHeight: "1.6" }}>
                Don't have an access code?{" "}
                <a href="https://payhip.com/b/Z3JNl" style={{ color: colors.goldLight, textDecoration: "none" }}>Purchase for $49 →</a>
              </div>
            </div>
          </div>
        )}

        {/* ── FORM STEPS ── */}
        {["Property","Variance","Hardship","Criteria"].includes(currentStep) && (
          <>
            {/* Progress */}
            <div style={{ marginBottom: "36px" }}>
              <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
                {["Property","Variance","Hardship","Criteria"].map((s, i) => {
                  const idx = ["Property","Variance","Hardship","Criteria"].indexOf(currentStep);
                  return <div key={s} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i < idx ? colors.goldLight : i === idx ? colors.gold : colors.borderLight, transition: "background 0.3s" }} />;
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {["Property","Variance","Hardship","Criteria"].map((s, i) => {
                  const idx = ["Property","Variance","Hardship","Criteria"].indexOf(currentStep);
                  return <div key={s} style={{ fontSize: "10px", color: i <= idx ? colors.goldLight : colors.borderLight, letterSpacing: "0.07em", textTransform: "uppercase" }}>{s}</div>;
                })}
              </div>
            </div>

            {/* Step title */}
            <div style={{ marginBottom: "28px" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", color: colors.ink, marginBottom: "6px", fontWeight: "700" }}>
                {currentStep === "Property"  && "About Your Property"}
                {currentStep === "Variance"  && "What Are You Requesting?"}
                {currentStep === "Hardship"  && "Describe Your Situation"}
                {currentStep === "Criteria"  && "Your Town's Criteria"}
              </h2>
              <p style={{ fontSize: "14px", color: colors.inkMuted, lineHeight: "1.6" }}>
                {currentStep === "Property"  && "Basic details. Approximate values are fine for most fields."}
                {currentStep === "Variance"  && "Specific measurements are critical. The more precise, the stronger your application."}
                {currentStep === "Hardship"  && "Write in plain English — the AI converts it into compelling legal language."}
                {currentStep === "Criteria"  && "Paste your town's specific criteria. The AI addresses each one explicitly — works for every town in America."}
              </p>
            </div>

            {/* Use variance warning */}
            {currentStep === "Variance" && formData.varianceType === "Use Variance" && (
              <div style={{ background: "#fffbf0", border: `1px solid ${colors.gold}`, borderRadius: "8px", padding: "14px 18px", marginBottom: "20px", fontSize: "13px", color: "#7a5a00", lineHeight: "1.6" }}>
                ⚠️ {USE_VARIANCE_WARNING}
              </div>
            )}

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {stepFields[currentStep].map(f => (
                <Field key={f.key} field={f} value={formData[f.key]} onChange={v => handleChange(f.key, v)} />
              ))}
            </div>

            {/* Nav */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "36px" }}>
              <button onClick={() => setStep(s => s - 1)} style={{ ...btnStyle(true), background: "transparent", border: `1px solid ${colors.border}`, color: colors.inkMuted, boxShadow: "none" }}>
                ← Back
              </button>
              <button onClick={() => setStep(s => s + 1)} disabled={!isStepValid(currentStep)} style={btnStyle(isStepValid(currentStep))}>
                Continue →
              </button>
            </div>
          </>
        )}

        {/* ── GENERATE STEP ── */}
        {currentStep === "Generate" && (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "30px", color: colors.ink, marginBottom: "12px" }}>Ready to Generate</h2>
            <p style={{ fontSize: "16px", color: colors.inkMuted, marginBottom: "40px", maxWidth: "480px", margin: "0 auto 36px", lineHeight: "1.7" }}>
              Enter your email to receive a copy of your letter, then click Generate. The AI runs a two-pass quality review — takes about 20–30 seconds.
            </p>

            <div style={{ maxWidth: "420px", margin: "0 auto" }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ ...inputStyle(false), textAlign: "center", marginBottom: "16px", fontSize: "15px" }}
              />

              <button onClick={generateLetter} disabled={loading} style={{ ...btnStyle(!loading), width: "100%", justifyContent: "center", padding: "16px", fontSize: "17px" }}>
                {loading ? <><Spinner /> {loadingMsg || "Generating..."}</> : "Generate My Letter ✦"}
              </button>

              {error && (
                <div style={{ marginTop: "16px", padding: "13px 16px", background: colors.errorBg, border: `1px solid ${colors.errorBorder}`, borderRadius: "8px", color: colors.errorText, fontSize: "13px" }}>
                  {error}
                  {retryCount < 3 && <button onClick={generateLetter} style={{ marginLeft: "12px", background: "transparent", border: "none", color: colors.goldLight, cursor: "pointer", fontFamily: "'Source Serif 4', serif", fontSize: "13px" }}>Try again →</button>}
                </div>
              )}

              <div style={{ marginTop: "14px", fontSize: "12px", color: colors.inkFaint }}>
                Two-pass AI review • Standard + Assertive versions • Submission checklist
              </div>
            </div>

            <button onClick={() => setStep(s => s - 1)} style={{ marginTop: "28px", background: "transparent", border: "none", color: colors.inkFaint, cursor: "pointer", fontFamily: "'Source Serif 4', serif", fontSize: "13px" }}>
              ← Edit my answers
            </button>
          </div>
        )}

        {/* ── LETTER OUTPUT ── */}
        {currentStep === "Letter" && letter && (
          <div>
            {/* Success bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", color: colors.gold, marginBottom: "4px" }}>Your Letter is Ready</div>
                <div style={{ fontSize: "13px", color: colors.inkFaint }}>Two-pass AI reviewed &nbsp;·&nbsp; Two versions &nbsp;·&nbsp; Checklist included</div>
              </div>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={() => copyText(activeTab === "standard" ? letter : altLetter)} style={btnStyle(true)}>
                  {copied ? "✓ Copied!" : "Copy Letter"}
                </button>
                <button onClick={() => downloadPDF(activeTab === "standard" ? letter : altLetter)} style={{...btnStyle(true), background:"transparent", border:`1px solid ${colors.goldLight}`, color:colors.goldLight}}>⬇ PDF</button>
              </div>
            </div>

            {/* Version tabs */}
            {altLetter && (
              <div style={{ display: "flex", gap: "2px", background: colors.paperDark, padding: "4px", borderRadius: "8px", marginBottom: "6px" }}>
                {[["standard","Standard / Professional"],["assertive","Assertive / Detailed"]].map(([key, label]) => (
                  <button key={key} onClick={() => setActiveTab(key)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", cursor: "pointer", fontFamily: "'Source Serif 4', serif", fontSize: "13px", transition: "all 0.2s", background: activeTab === key ? `linear-gradient(135deg, ${colors.goldLight}, #8b6010)` : "transparent", color: activeTab === key ? "#fff8e8" : colors.inkMuted, fontWeight: activeTab === key ? "600" : "400" }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
            <div style={{ fontSize: "12px", color: colors.inkFaint, marginBottom: "16px" }}>
              {activeTab === "standard" ? "Measured, professional tone. Suitable for most boards." : "More assertive framing. Better for clear-cut cases or strong precedents."}
            </div>

            {/* Letter body */}
            <div style={{ background: colors.white, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "40px 48px", lineHeight: "1.9", fontSize: "14px", color: colors.inkLight, whiteSpace: "pre-wrap", fontFamily: "'Source Serif 4', Georgia, serif", boxShadow: "0 4px 32px rgba(0,0,0,0.08)", marginBottom: "24px" }}>
              {activeTab === "standard" ? letter : altLetter}
            </div>

            {/* Email copy */}
            {email && !emailSent && (
              <div style={{ background: colors.paperWarm, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "18px 22px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                <div style={{ fontSize: "14px", color: colors.inkLight }}>
                  Send a copy to <strong>{email}</strong>
                </div>
                <button onClick={sendEmail} disabled={emailSending} style={{ ...btnStyle(!emailSending), padding: "9px 20px", fontSize: "13px" }}>
                  {emailSending ? <><Spinner /> Sending...</> : "Send Copy →"}
                </button>
              </div>
            )}
            {emailSent && (
              <div style={{ background: "#e8f5e8", border: "1px solid #b0d8b0", borderRadius: "8px", padding: "14px 20px", marginBottom: "20px", fontSize: "14px", color: colors.green }}>
                ✓ Letter emailed to {email}
              </div>
            )}

            {/* Submission checklist */}
            {checklist.length > 0 && (
              <div style={{ background: colors.white, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "24px 28px", marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", color: colors.goldLight, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>Submission Checklist</div>
                {checklist.map((item, i) => (
                  <label key={i} style={{ display: "flex", gap: "12px", marginBottom: "10px", cursor: "pointer", alignItems: "flex-start" }}>
                    <input type="checkbox" style={{ marginTop: "3px", accentColor: colors.goldLight }} />
                    <span style={{ fontSize: "14px", color: colors.inkLight, lineHeight: "1.5" }}>{item}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Attorney CTA */}
            <div style={{ background: "#fdf8ff", border: "1px solid #d8c8e8", borderRadius: "10px", padding: "20px 24px", marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "14px" }}>
                <span style={{ fontSize: "22px" }}>⚠️</span>
                <div>
                  <div style={{ fontSize: "13px", color: "#7050a0", fontWeight: "600", marginBottom: "6px" }}>Complex case? Consider an attorney.</div>
                  <div style={{ fontSize: "12px", color: "#9070b0", lineHeight: "1.6" }}>
                    Ideal for straightforward area variances. For use variances, historic districts, or strong opposition — a land use attorney improves your odds significantly.
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "#9070b0" }}>
                    Search: <span style={{ color: colors.goldLight }}>"{formData.state} land use attorney zoning variance"</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{ padding: "14px 18px", background: colors.paperWarm, borderRadius: "8px", border: `1px solid ${colors.borderLight}`, fontSize: "11px", color: colors.inkFaint, lineHeight: "1.7" }}>
              <strong>Legal Disclaimer:</strong> This letter is AI-generated and does not constitute legal advice. Review all content carefully for accuracy before submission. ZoningFight makes no warranty regarding approval outcomes. For complex applications, consult a licensed land use attorney in your jurisdiction.
            </div>

            {/* Testimonial prompt */}
            <div style={{ marginTop: "24px", textAlign: "center", padding: "20px", background: colors.white, borderRadius: "10px", border: `1px solid ${colors.borderLight}` }}>
              <div style={{ fontSize: "14px", color: colors.inkMuted, marginBottom: "6px" }}>Did your variance get approved?</div>
              <div style={{ fontSize: "12px", color: colors.inkFaint }}>Share your result → <span style={{ color: colors.goldLight }}>results@zoningfight.com</span></div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #c8c0b0; }
        * { box-sizing: border-box; }
        body { margin: 0; }
        @media print {
          nav, button, .no-print { display: none !important; }
          body { background: #fff; }
          @page { margin: 0.75in; }
        }
      `}</style>
      <footer style={{textAlign:'center',padding:'16px',fontSize:'0.72rem',color:'#888',borderTop:'1px solid #e5e0d6',marginTop:'40px'}}>
        ZoningFight Pro v1.0 &nbsp;·&nbsp; © 2026 The Super Simple Software Company &nbsp;·&nbsp; support@buyappsonce.com
      </footer>
    </div>
  );
}
