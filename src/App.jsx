import { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE_ID  = "YOUR_EMAILJS_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_EMAILJS_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY  = "YOUR_EMAILJS_PUBLIC_KEY";

const APP = {
  name: "ZoningFight",
  tagline: "Variance Letter Writer",
  icon: "⚖️",
  color: "#2a4a1a",
  colorLight: "#4a7a2a",
  payhip: "https://payhip.com/b/Z3JNl",
  support: "support@zoningfight.com",
  price: "$49",
  font: "'Source Serif 4', Georgia, serif",
  displayFont: "'Playfair Display', serif",
};

const STEPS = ["Intro", "Property", "Variance", "Hardship", "Criteria", "Demand", "Generate", "Letter"];
const FORM_STEPS = ["Property", "Variance", "Hardship", "Criteria", "Demand"];

const colors = {
  paper: "#f8faf8",
  paperWarm: "#f0f5f0",
  paperDark: "#e0ece0",
  white: "#ffffff",
  ink: "#0f1a0f",
  inkLight: "#2a3d2a",
  inkMuted: "#5a7a5a",
  inkFaint: "#8aaa8a",
  gold: APP.color,
  goldLight: APP.colorLight,
  border: "#b0ccb0",
  borderLight: "#d0e8d0",
  green: "#1a5c2a",
  red: "#8b1a1a",
  errorBg: "#fff0f0",
  errorBorder: "#ffcccc",
  errorText: "#cc2222",
};

const stepFields = {
  Property: [
    { key: "propertyAddress", label: "Property Address",     type: "text",   required: true,  placeholder: "123 Oak Street" },
    { key: "town",            label: "Town / Municipality",  type: "text",   required: false, placeholder: "e.g. Westport" },
    { key: "state",           label: "State",                type: "text",   required: true,  placeholder: "Connecticut" },
    { key: "zoningDistrict",  label: "Zoning District",      type: "text",   required: false, placeholder: "e.g. R-20, Commercial B" },
  ],
  Variance: [
    { key: "varianceType",      label: "Type of Dispute",         type: "select", required: true,
      options: ["Area/Setback Variance", "Use Variance", "Dimensional Variance", "Building Permit Denial", "Cease and Desist / Stop Work Order", "Non-Conforming Use Dispute", "Conditional Use Permit Denial", "Zoning Code Interpretation Dispute", "Sign Permit Denial", "Code Enforcement / Neighbor Complaint", "Other"] },
    { key: "whatYouWant",       label: "What You Want to Build/Do", type: "textarea", required: true,
      placeholder: "e.g. Build a 12x16 detached garage in the side yard, 4 feet from the property line" },
    { key: "currentRequirement", label: "Current Zoning Requirement", type: "textarea", required: true,
      placeholder: "e.g. Side yard setback is 15 feet per Section 4.2.3 of the zoning regulations" },
    { key: "whatYouRequest",    label: "What You Are Requesting",   type: "textarea", required: true,
      placeholder: "e.g. Reduction of side yard setback from 15 feet to 4 feet for the proposed garage" },
  ],
  Hardship: [
    { key: "hardshipDescription", label: "Describe the Hardship",        type: "textarea", required: true,
      placeholder: "e.g. The lot is irregularly shaped (pie-shaped) with only 35 feet of frontage, making it impossible to meet the 15-foot setback on both sides and still build a usable structure." },
    { key: "whyUnique",           label: "Why Is This Unique to Your Property?", type: "textarea", required: false,
      placeholder: "e.g. Adjacent lots are rectangular with 80+ feet of frontage. This lot's shape was created by a 1962 subdivision and predates current zoning." },
  ],
  Criteria: [
    { key: "townCriteria",      label: "Town's Variance Evaluation Criteria", type: "textarea", required: true,
      placeholder: "Paste your town's variance evaluation criteria here — found in your zoning ordinance or on the application form" },
    { key: "priorVariances",    label: "Prior Variances Granted Nearby",      type: "textarea", required: false,
      placeholder: "e.g. 45 Elm St was granted a similar setback variance in 2022 (ZBA Case #2022-14)" },
  ],
  Demand: [
    { key: "hearingDate",     label: "Hearing Date",          type: "text",     required: false, placeholder: "e.g. May 15, 2026" },
    { key: "additionalInfo",  label: "Anything Else to Include", type: "textarea", required: false, placeholder: "Any other relevant details..." },
  ],
};

const requiredFields = {
  Property: ["propertyAddress", "state"],
  Variance: ["varianceType", "whatYouWant", "currentRequirement", "whatYouRequest"],
  Hardship: ["hardshipDescription"],
  Criteria: ["townCriteria"],
  Demand: [],
};

const VARIANCE_TYPES = ["Area/Setback Variance", "Use Variance", "Dimensional Variance"];
const isVarianceType = (t) => VARIANCE_TYPES.includes(t);

const conditionalFields = {
  "Building Permit Denial": [
    { key: "permitType",         label: "Permit Type",                                type: "select",   options: ["Residential — new construction","Residential — addition","Residential — accessory structure","Commercial — new construction","Commercial — renovation","Demolition","Change of use","Other"] },
    { key: "permitDenialReason", label: "Denial Reason the Municipality Gave",        type: "textarea", placeholder: "e.g. 'Does not meet lot coverage requirements' — no specific subsection cited" },
    { key: "permitProjectDesc",  label: "Project Description",                        type: "textarea", placeholder: "e.g. Two-story 2,400 sq ft single-family home with attached garage on a 12,000 sq ft R-1 lot" },
    { key: "permitPriorApprovals",label: "Prior Approvals for Similar Nearby Projects",type: "textarea", placeholder: "e.g. 145 Maple Ave approved for similar lot coverage in 2023 (Permit #23-0842); 210 Maple approved 2024" },
  ],
  "Cease and Desist / Stop Work Order": [
    { key: "stopActivity",       label: "Activity Ordered to Stop",                   type: "textarea", placeholder: "e.g. Construction of the approved 10x12 rear deck" },
    { key: "stopOrderDate",      label: "Date of Order",                               type: "text",     placeholder: "e.g. March 12, 2026" },
    { key: "stopReason",         label: "Reason Given for the Order",                  type: "textarea", placeholder: "e.g. 'Activity not permitted in R-1 zone' — no ordinance section cited" },
    { key: "stopDuration",       label: "How Long Has the Activity Been Ongoing?",     type: "text",     placeholder: "e.g. 8 weeks since permit #24-1102 was issued" },
  ],
  "Non-Conforming Use Dispute": [
    { key: "ncUseAtIssue",       label: "Use at Issue",                                type: "textarea", placeholder: "e.g. Small auto repair shop operating from the detached garage" },
    { key: "ncEstablishedDate",  label: "Date the Use Was Established",                type: "text",     placeholder: "e.g. June 1978" },
    { key: "ncCurrentZoning",    label: "Current Zoning Designation",                  type: "text",     placeholder: "e.g. R-20 (changed from MU-1 in 2015)" },
    { key: "ncMunicipalityBasis",label: "Municipality's Stated Basis for Action",      type: "textarea", placeholder: "e.g. Claims the use was abandoned when owner took medical leave 2022-2023" },
  ],
  "Conditional Use Permit Denial": [
    { key: "cupUseProposed",     label: "Use Proposed",                                type: "textarea", placeholder: "e.g. Home-occupation tutoring service — up to 4 students at a time, 2pm-7pm weekdays" },
    { key: "cupCriteria",        label: "Criteria in the Ordinance",                   type: "textarea", placeholder: "Paste the ordinance's conditional-use criteria here (e.g. compatibility, traffic impact, hours, parking)" },
    { key: "cupDenialReason",    label: "Denial Reason Given",                         type: "textarea", placeholder: "e.g. 'Not in keeping with the neighborhood' — no specific criterion identified" },
  ],
  "Zoning Code Interpretation Dispute": [
    { key: "interpSection",      label: "Ordinance Section in Dispute",                type: "text",     placeholder: "e.g. Section 4.2.3 — Accessory Structures" },
    { key: "interpMunicipality", label: "Municipality's Interpretation",               type: "textarea", placeholder: "e.g. Reads 'accessory structure' to exclude detached workshops over 200 sq ft" },
    { key: "interpOwner",        label: "Your Interpretation",                         type: "textarea", placeholder: "e.g. Plain text includes all accessory structures up to the 600 sq ft cap in §4.2.3(b)" },
    { key: "interpBasis",        label: "Basis for Your Interpretation",               type: "textarea", placeholder: "e.g. Plain language of §4.2.3(b); consistent prior interpretations in 2018-2023 permits; defined term in §2.1" },
  ],
  "Sign Permit Denial": [
    { key: "signType",           label: "Sign Type",                                   type: "select",   options: ["Business wall sign","Freestanding / pole sign","Monument sign","Window sign","Temporary / political sign","Digital / LED sign","Directional sign","Other"] },
    { key: "signDenialReason",   label: "Denial Reason Given",                         type: "textarea", placeholder: "e.g. 'Content not permitted for your business category'" },
    { key: "signSimilarApproved",label: "Similar Signs Approved in the Area",          type: "textarea", placeholder: "e.g. The national-chain tenant next door has an identical-size internally illuminated sign approved in 2022" },
  ],
  "Code Enforcement / Neighbor Complaint": [
    { key: "ceAllegedViolation", label: "Alleged Violation",                           type: "textarea", placeholder: "e.g. 'Excessive outdoor storage' — pertaining to 2 kayaks and a bicycle rack" },
    { key: "ceNoticeDate",       label: "Notice Date",                                 type: "text",     placeholder: "e.g. March 4, 2026" },
    { key: "ceSameActivityNeighbors", label: "Same Activity Visible on Neighboring Properties?", type: "select", options: ["Yes — clearly visible on many","Yes — visible on a few","No","Not sure"] },
    { key: "cePriorNotices",     label: "Prior Notices or Enforcement",                type: "textarea", placeholder: "e.g. None; or this is the third notice in 18 months" },
  ],
};

function buildVarianceFields(baseFields, varianceType) {
  const cond = conditionalFields[varianceType];
  if (!cond) return baseFields;
  const idx = baseFields.findIndex(f => f.key === "varianceType");
  if (idx === -1) return [...baseFields, ...cond];
  return [...baseFields.slice(0, idx + 1), ...cond, ...baseFields.slice(idx + 1)];
}

const inputStyle = (focused) => ({
  width: "100%",
  padding: "13px 16px",
  background: colors.white,
  border: `1px solid ${focused ? colors.goldLight : colors.border}`,
  borderRadius: "8px",
  color: colors.ink,
  fontSize: "15px",
  fontFamily: APP.font,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
});

const btnStyle = (active) => ({
  background: active ? `linear-gradient(135deg, ${colors.goldLight}, ${colors.gold})` : colors.paperDark,
  border: "none",
  color: active ? "#fff" : colors.inkFaint,
  padding: "13px 28px",
  borderRadius: "6px",
  cursor: active ? "pointer" : "default",
  fontSize: "15px",
  fontWeight: active ? "700" : "400",
  fontFamily: APP.font,
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  boxShadow: active ? `0 2px 12px ${colors.goldLight}55` : "none",
});

function Field({ field, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: "4px" }}>
      <label style={{ display: "block", marginBottom: "7px", fontSize: "13px", color: colors.inkMuted }}>
        {field.label}
        {field.required && <span style={{ color: colors.goldLight, marginLeft: "4px" }}>*</span>}
      </label>
      {field.type === "select" ? (
        <select
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...inputStyle(focused), cursor: "pointer" }}
        >
          <option value="">Select...</option>
          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...inputStyle(focused), resize: "vertical", lineHeight: "1.7", minHeight: "112px" }}
        />
      ) : (
        <input
          type="text"
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={inputStyle(focused)}
        />
      )}
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      width: "16px", height: "16px",
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "#fff",
      borderRadius: "50%",
      display: "inline-block",
      animation: "spin 0.8s linear infinite"
    }} />
  );
}

export default function App() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [accessCode, setAccessCode] = useState("");
  const [codeValid, setCodeValid] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [letter, setLetter] = useState("");
  const [altLetter, setAltLetter] = useState("");
  const [activeTab, setActiveTab] = useState("standard");
  const [checklist, setChecklist] = useState([]);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setAccessCode(code.toUpperCase());
      verifyCode(code.toUpperCase(), true);
    }
  }, []);

  useEffect(() => {
    try { const s = sessionStorage.getItem("zf_form"); if (s) setFormData(JSON.parse(s)); } catch {}
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem("zf_form", JSON.stringify(formData)); } catch {}
  }, [formData]);

  const handleChange = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const isStepValid = (stepName) => {
    const variance = isVarianceType(formData.varianceType);
    if (!variance) {
      if (stepName === "Variance") return !!formData.varianceType?.trim();
      if (stepName === "Hardship" || stepName === "Criteria") return true;
    }
    return (requiredFields[stepName] || []).every(k => formData[k] && formData[k].trim());
  };

  const verifyCode = async (code, silent = false) => {
    if (!code || !code.trim()) { setCodeError("Please enter your access code."); return; }
    setCodeError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode: code, systemPrompt: "Reply: VALID", userPrompt: "check" }),
      });
      if (res.status === 401) {
        if (!silent) setCodeError("Invalid access code. Check your Payhip receipt email.");
        setCodeValid(false);
      } else {
        setCodeValid(true);
        if (!silent) setStep(1);
      }
    } catch {
      if (!silent) setCodeError("Could not verify. Check your connection.");
    }
  };

  const callAPI = async (systemPrompt, userPrompt, reviewMode, draftLetter) => {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessCode, systemPrompt, userPrompt, reviewMode: !!reviewMode, draftLetter: draftLetter || "" }),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Generation failed"); }
    return (await res.json()).text;
  };

  const systemPrompt = "You are an expert land use and zoning attorney. Write compelling variance appeal letters that address the specific evaluation criteria for the town. Cite hardship, minimum variance necessary, and public benefit. Professional, precise tone. 550-750 words. Format: formal letter with [DATE] placeholder, via certified mail to the Zoning Board of Appeals. Output ONLY the letter, no preamble.";

  const buildingPermitPrompt = `You are an expert land use and zoning attorney specializing in building permit denial appeals. Write firm, legally precise demand letters.

Rules:
- Open with clear statement: the municipality denied the building permit application on a specific date; the denial is improper for specified reasons
- Cite the applicable state building code (state adoption of the International Residential Code, International Building Code, or state-specific code), the local zoning ordinance by section, and the state's zoning enabling act (e.g., New York Town Law §267; California Government Code §65900 et seq.; Florida Chapter 163; Connecticut General Statutes §8-7)
- Invoke due process — a denial must state with specificity which code sections are allegedly violated so the applicant can respond
- Rebut the stated denial reason point by point, citing the project's compliance with each provision
- Reference prior permits approved for similar projects in the same jurisdiction (comparable-treatment argument)
- Demand: written denial specifying exact code sections violated; reconsideration based on the compliance showing; identification of the administrative appeal path (zoning board of appeals, building code board of appeals) and its deadlines
- Warn of remedies: administrative appeal; Article 78 / mandamus; declaratory judgment; civil rights action under 42 U.S.C. §1983 for arbitrary due-process violations; and attorney's fees where statute provides
- Set a firm 30-day response deadline
- Professional but firm tone
- 500-700 words
- Format: formal letter with [DATE] placeholder, via certified mail
- Output ONLY the letter, no preamble`;

  const stopWorkPrompt = `You are an expert land use and zoning attorney specializing in stop-work orders and cease-and-desist responses. Write firm, legally precise response letters with appropriate urgency.

Rules:
- Open with clear statement: the municipality issued a stop-work / cease-and-desist order on a specific date; the order is improper because the activity is permitted
- Cite the local zoning ordinance by specific section governing the activity at issue
- Invoke the vested rights doctrine — work commenced under a valid permit or with substantial reliance on prior government approval cannot be halted by post-hoc interpretation changes
- Invoke non-conforming use protections where applicable — pre-existing legal uses are grandfathered against later zoning changes under state zoning enabling acts
- Cite the state's zoning enabling act and relevant case law on stop-work orders and procedural due process
- Demand: the specific ordinance citation underlying the stop-work determination; suspension of the order pending administrative review; identification of the appeal path and timeline (most jurisdictions provide 30 days to appeal to the zoning board of appeals)
- Warn of remedies: administrative appeal; Article 78 / mandamus; preliminary injunction against improper stoppage to prevent irreparable economic harm; and damages where authorized
- Set a firm 7-day response deadline given the urgency of a stop-work order
- Firm and urgent tone
- 500-700 words
- Format: formal letter with [DATE] placeholder, via certified mail and hand delivery
- Output ONLY the letter, no preamble`;

  const nonConformingPrompt = `You are an expert land use and zoning attorney specializing in non-conforming use protections. Write firm, legally precise demand letters.

Rules:
- Open with clear statement: the use at issue was lawfully established on a specific date and is protected as a pre-existing legal non-conforming use
- Cite the state zoning enabling act provision that protects non-conforming uses (e.g., New York Town Law §267-b; California Government Code §65852.25; Connecticut General Statutes §8-2; Florida Chapter 163)
- Cite case law establishing that non-conforming uses are vested property rights that cannot be eliminated without just compensation or a lawful amortization period meeting constitutional standards
- Document the use's establishment date, lawful commencement under then-applicable zoning, and continuous operation — non-conforming status is typically lost only by abandonment or substantial discontinuance
- If the municipality invokes amortization: challenge the amortization period as unreasonable; amortization must provide a period long enough to recoup investment and must be supported by a legitimate public purpose
- Demand: documentation of the specific zoning amendment allegedly eliminating the use; recognition of the vested non-conforming status; withdrawal of any enforcement action
- Warn of remedies: declaratory judgment quieting the non-conforming use; Article 78 / mandamus; inverse condemnation claim if the municipality attempts a regulatory taking; §1983 action for due-process violations; and attorney's fees where statute provides
- Set a firm 30-day response deadline
- Professional but firm tone
- 500-700 words
- Format: formal letter with [DATE] placeholder, via certified mail
- Output ONLY the letter, no preamble`;

  const cupPrompt = `You are an expert land use and zoning attorney specializing in conditional use permit (CUP) / special exception appeals. Write firm, legally precise appeal letters.

Rules:
- Open with clear statement: the municipality denied a conditional use permit / special exception for the specified proposed use on a specific date; the denial lacks required findings
- Cite the local zoning ordinance provision establishing the conditional use permit and the specific criteria that govern issuance
- Cite the state zoning enabling act provision on special exceptions and CUPs (e.g., New York Town Law §274-b; California Government Code §65901; Connecticut General Statutes §8-2; Florida §163.3202)
- Invoke the rule that a conditional use, unlike a variance, is a use the ordinance has already deemed appropriate for the district in general — the board's role is to verify compliance with enumerated standards, not to re-evaluate policy
- For each enumerated CUP criterion, demonstrate compliance with specific facts and evidence the applicant presented
- Rebut the denial reason point by point — conclusory findings like "not in keeping with the neighborhood" are legally insufficient without specific factual support in the record
- Demand: written findings identifying which specific criterion was not met and the evidentiary basis; reconsideration on the current record; identification of the appeal path
- Warn of remedies: administrative appeal; Article 78 / certiorari review (denial set aside if unsupported by substantial evidence or based on legal error); declaratory judgment; and attorney's fees where statute provides
- Set a firm 30-day response deadline
- Professional but firm tone
- 500-700 words
- Format: formal letter with [DATE] placeholder, via certified mail
- Output ONLY the letter, no preamble`;

  const codeInterpretationPrompt = `You are an expert land use and zoning attorney specializing in zoning code interpretation disputes. Write firm, legally precise demand letters.

Rules:
- Open with clear statement: the municipality has interpreted a specific zoning ordinance section in a manner the property owner disputes
- Cite the zoning ordinance section verbatim as provided
- Apply the rules of statutory construction: (1) plain meaning controls when unambiguous; (2) ambiguities in zoning ordinances are construed in favor of the property owner and against the government because zoning is in derogation of common-law property rights; (3) definitional terms must be applied consistently throughout the ordinance
- Present the owner's interpretation with textual, structural, and purposive support
- Rebut the municipality's interpretation — identify where it conflicts with the plain language, renders other provisions superfluous, or produces absurd results
- Demand: a formal written interpretation from the zoning officer citing specific ordinance language and reasoning; if adverse, identification of the administrative appeal path (the zoning board of appeals has primary jurisdiction to construe the ordinance in most states)
- Warn of remedies: administrative appeal; Article 78 / certiorari review of the interpretation for legal error; declaratory judgment as to the meaning of the ordinance; and attorney's fees where statute provides
- Set a firm 30-day response deadline
- Professional but firm tone
- 500-700 words
- Format: formal letter with [DATE] placeholder, via certified mail
- Output ONLY the letter, no preamble`;

  const signPermitPrompt = `You are an expert land use and zoning attorney specializing in sign ordinance disputes and First Amendment challenges. Write firm, legally precise appeal letters.

Rules:
- Open with clear statement: the municipality denied the sign permit application on a specific date; the denial is improper for specified reasons
- Cite the local sign ordinance section governing the proposed sign
- Invoke the U.S. Supreme Court's decision in Reed v. Town of Gilbert, 576 U.S. 155 (2015), which held that content-based sign regulations are subject to strict scrutiny — if the ordinance treats signs differently based on the message conveyed, it is presumptively unconstitutional
- Identify whether the stated denial basis is content-based (e.g., restrictions that turn on whether the sign is political, ideological, commercial, or directional) and challenge it under Reed
- Cite the state's adoption of and state-court gloss on First Amendment protections for commercial and noncommercial speech
- For selective-enforcement claims: identify other similar signs approved or not enforced against in the municipality
- Demand: written denial citing the specific ordinance section and the content-neutral justification; reconsideration; identification of the appeal path
- Warn of remedies: administrative appeal; First Amendment suit under 42 U.S.C. §1983 (injunctive relief, nominal and actual damages, attorney's fees under 42 U.S.C. §1988); declaratory judgment on facial and as-applied challenges; and Article 78 / certiorari review
- Set a firm 30-day response deadline
- Professional but firm tone
- 500-700 words
- Format: formal letter with [DATE] placeholder, via certified mail
- Output ONLY the letter, no preamble`;

  const codeEnforcementPrompt = `You are an expert land use and zoning attorney specializing in code enforcement defense and selective enforcement claims. Write firm, legally precise response letters.

Rules:
- Open with clear statement: the property owner received a code enforcement notice on a specific date; the notice is improper because the activity is permitted or the enforcement is selective
- Cite the local code section allegedly violated — demand that the municipality identify the specific subsection and the factual basis for the alleged violation
- For equal protection / selective enforcement: cite the rule that similarly situated property owners must be treated alike; identify other properties with the same condition visible on neighboring parcels that have not received enforcement action; this is a classic class-of-one equal protection claim under Village of Willowbrook v. Olech, 528 U.S. 562 (2000)
- Where the enforcement stems from a neighbor complaint, reference the rule that complaint-driven enforcement must still independently satisfy the code — a neighbor's complaint is not itself the violation
- Demand: specific code citation for the alleged violation; evidence supporting the determination; documentation of how other similarly situated properties have been treated; identification of the administrative appeal procedure
- Warn of remedies: administrative appeal; Article 78 / mandamus; §1983 action for equal protection or due process violations; injunctive relief; and attorney's fees where statute provides
- Set a firm response deadline consistent with (and not shorter than) the appeal period stated in the notice
- Professional but firm tone
- 500-700 words
- Format: formal letter with [DATE] placeholder, via certified mail
- Output ONLY the letter, no preamble`;

  const pickSystemPrompt = (varianceType) => {
    if (!varianceType) return systemPrompt;
    if (varianceType === "Building Permit Denial") return buildingPermitPrompt;
    if (varianceType === "Cease and Desist / Stop Work Order") return stopWorkPrompt;
    if (varianceType === "Non-Conforming Use Dispute") return nonConformingPrompt;
    if (varianceType === "Conditional Use Permit Denial") return cupPrompt;
    if (varianceType === "Zoning Code Interpretation Dispute") return codeInterpretationPrompt;
    if (varianceType === "Sign Permit Denial") return signPermitPrompt;
    if (varianceType === "Code Enforcement / Neighbor Complaint") return codeEnforcementPrompt;
    return systemPrompt;
  };

  const buildPrompt = (tone) => {
    const base = `
PROPERTY ADDRESS: ${formData.propertyAddress}
TOWN/MUNICIPALITY: ${formData.town || "not provided"}
STATE: ${formData.state}
ZONING DISTRICT: ${formData.zoningDistrict || "not specified"}
VARIANCE TYPE: ${formData.varianceType}
WHAT APPLICANT WANTS TO BUILD/DO: ${formData.whatYouWant}
CURRENT ZONING REQUIREMENT: ${formData.currentRequirement}
WHAT IS BEING REQUESTED: ${formData.whatYouRequest}
HARDSHIP DESCRIPTION: ${formData.hardshipDescription}
WHY UNIQUE TO THIS PROPERTY: ${formData.whyUnique || "not provided"}
TOWN'S VARIANCE EVALUATION CRITERIA: ${formData.townCriteria}
PRIOR VARIANCES NEARBY: ${formData.priorVariances || "none provided"}
HEARING DATE: ${formData.hearingDate || "not specified"}
ADDITIONAL INFO: ${formData.additionalInfo || "none"}`;

    const cond = (conditionalFields[formData.varianceType] || [])
      .filter(f => formData[f.key]?.toString().trim())
      .map(f => `${f.label.toUpperCase()}: ${formData[f.key]}`)
      .join("\n");
    const fullBase = cond ? `${base}\n\nTYPE-SPECIFIC DETAILS:\n${cond}` : base;

    if (tone === "assertive") {
      return `Write a MORE ASSERTIVE letter. Stronger language, explicit legal citations, more forceful arguments. Different wording from standard:\n${fullBase}`;
    }
    return `Write a STANDARD PROFESSIONAL letter:\n${fullBase}`;
  };

  const generateLetter = async () => {
    setLoading(true);
    setError("");
    setLetter("");
    setAltLetter("");
    setChecklist([]);
    try {
      const effectivePrompt = pickSystemPrompt(formData.varianceType);
      setLoadingMsg("Drafting your letter...");
      const draft = await callAPI(effectivePrompt, buildPrompt("standard"), false, "");
      setLoadingMsg("Running quality review...");
      const reviewed = await callAPI("", "", true, draft);
      setLetter(reviewed);
      setLoadingMsg("Generating assertive version...");
      const alt = await callAPI(effectivePrompt, buildPrompt("assertive"), false, "");
      setAltLetter(alt);
      setLoadingMsg("Building checklist...");
      try {
        const clRes = await fetch("/api/checklist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessCode,
            address: formData.propertyAddress,
            state: formData.state,
            varianceType: formData.varianceType,
            letterExcerpt: reviewed.substring(0, 300),
          }),
        });
        if (clRes.ok) {
          const d = await clRes.json();
          setChecklist(d.checklist || []);
        }
      } catch {}
      setStep(STEPS.indexOf("Letter"));
      setRetryCount(0);
    } catch (e) {
      const n = retryCount + 1;
      setRetryCount(n);
      setError(`Generation failed: ${e.message}. Please try again.`);
    }
    setLoading(false);
    setLoadingMsg("");
  };

  const sendEmail = async () => {
    if (!email || !email.includes("@")) return;
    setEmailSending(true);
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: email,
        to_name: formData.ownerName || "Applicant",
        insurer: formData.town || "Zoning Board",
        letter_standard: letter,
        letter_assertive: altLetter,
        from_name: APP.name,
        reply_to: APP.support,
      }, EMAILJS_PUBLIC_KEY);
      setEmailSent(true);
    } catch {
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
    setLetter("");
    setAltLetter("");
    setError("");
    setEmailSent(false);
    setChecklist([]);
    setRetryCount(0);
    try { sessionStorage.removeItem("zf_form"); } catch {}
  };

  const currentStep = STEPS[step];

  return (
    <div style={{ minHeight: "100vh", background: colors.paper, fontFamily: APP.font, color: colors.ink }}>

      {/* NAV */}
      <div style={{ background: colors.white, borderBottom: `1px solid ${colors.border}`, padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "34px", height: "34px", background: `linear-gradient(135deg, ${colors.goldLight}, ${colors.gold})`, borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
            {APP.icon}
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: "700", fontFamily: APP.displayFont, color: colors.ink }}>{APP.name}</div>
            <div style={{ fontSize: "10px", color: colors.inkFaint, letterSpacing: "0.1em", textTransform: "uppercase" }}>{APP.tagline}</div>
          </div>
        </div>
        {letter && (
          <button onClick={reset} style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.inkMuted, padding: "7px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontFamily: APP.font }}>
            ← New Letter
          </button>
        )}
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* INTRO / ACCESS GATE */}
        {currentStep === "Intro" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "13px", color: colors.goldLight, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
              {APP.icon} {APP.name}
            </div>
            <h1 style={{ fontFamily: APP.displayFont, fontSize: "clamp(28px,5vw,44px)", color: colors.ink, marginBottom: "16px", fontWeight: "900" }}>
              Your Zoning Board Said No. Fight Back.
            </h1>
            <p style={{ fontSize: "17px", color: colors.inkMuted, maxWidth: "480px", margin: "0 auto 40px", lineHeight: "1.7" }}>
              AI-generated letters for variance denials, building permits, stop-work orders, non-conforming use, CUPs, code interpretation, sign permits, and code enforcement. Attorney-quality. 5 minutes. {APP.price}.
            </p>
            <div style={{ maxWidth: "400px", margin: "0 auto", background: colors.white, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "32px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: "14px", color: colors.inkLight, marginBottom: "16px", fontWeight: "600" }}>Enter Your Access Code</div>
              <input
                type="text"
                value={accessCode}
                onChange={e => { setAccessCode(e.target.value.toUpperCase()); setCodeError(""); }}
                placeholder="e.g. ZF-ABC123"
                style={{ ...inputStyle(false), textAlign: "center", fontSize: "18px", letterSpacing: "0.1em", marginBottom: "12px", fontWeight: "600" }}
              />
              {codeError && <div style={{ color: colors.errorText, fontSize: "13px", marginBottom: "12px" }}>{codeError}</div>}
              <button onClick={() => verifyCode(accessCode)} style={{ ...btnStyle(!!accessCode.trim()), width: "100%", justifyContent: "center", padding: "14px" }}>
                Unlock My Letter →
              </button>
              <div style={{ marginTop: "16px", fontSize: "12px", color: colors.inkFaint }}>
                Don't have a code?{" "}
                <a href={APP.payhip} style={{ color: colors.goldLight, textDecoration: "none" }}>Purchase for {APP.price} →</a>
              </div>
            </div>
          </div>
        )}

        {/* FORM STEPS */}
        {FORM_STEPS.includes(currentStep) && (
          <div>
            {/* Progress bar */}
            <div style={{ marginBottom: "36px" }}>
              <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
                {FORM_STEPS.map((s, i) => {
                  const idx = FORM_STEPS.indexOf(currentStep);
                  return (
                    <div key={s} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i < idx ? colors.goldLight : i === idx ? colors.gold : colors.borderLight, transition: "background 0.3s" }} />
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {FORM_STEPS.map((s, i) => {
                  const idx = FORM_STEPS.indexOf(currentStep);
                  return (
                    <div key={s} style={{ fontSize: "10px", color: i <= idx ? colors.goldLight : colors.borderLight, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                      {s}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step title */}
            <div style={{ marginBottom: "28px" }}>
              <h2 style={{ fontFamily: APP.displayFont, fontSize: "26px", color: colors.ink, marginBottom: "6px", fontWeight: "700" }}>
                {currentStep === "Property" && "Your Property"}
                {currentStep === "Variance" && "The Variance"}
                {currentStep === "Hardship" && "The Hardship"}
                {currentStep === "Criteria" && "Town Criteria"}
                {currentStep === "Demand" && "Hearing Details"}
              </h2>
              <p style={{ fontSize: "14px", color: colors.inkMuted, lineHeight: "1.6" }}>
                {currentStep === "Property" && "The property location and zoning details."}
                {currentStep === "Variance" && "What you're requesting and what the current rules require."}
                {currentStep === "Hardship" && "The hardship that makes the variance necessary."}
                {currentStep === "Criteria" && "Your town's specific evaluation criteria for variances."}
                {currentStep === "Demand" && "Hearing date and any additional details."}
              </p>
            </div>

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {(currentStep === "Variance" ? buildVarianceFields(stepFields.Variance, formData.varianceType) : (stepFields[currentStep] || [])).map(f => (
                <Field key={f.key} field={f} value={formData[f.key]} onChange={v => handleChange(f.key, v)} />
              ))}
            </div>

            {/* Nav buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "36px" }}>
              <button onClick={() => setStep(s => s - 1)} style={{ ...btnStyle(true), background: "transparent", border: `1px solid ${colors.border}`, color: colors.inkMuted, boxShadow: "none" }}>
                ← Back
              </button>
              <button onClick={() => setStep(s => s + 1)} disabled={!isStepValid(currentStep)} style={btnStyle(isStepValid(currentStep))}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* GENERATE */}
        {currentStep === "Generate" && (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontFamily: APP.displayFont, fontSize: "30px", color: colors.ink, marginBottom: "12px" }}>Ready to Generate</h2>
            <p style={{ fontSize: "16px", color: colors.inkMuted, maxWidth: "480px", margin: "0 auto 36px", lineHeight: "1.7" }}>
              Enter your email to receive a copy, then click Generate. Two-pass AI quality review — about 20-30 seconds.
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
                  <button onClick={generateLetter} style={{ marginLeft: "12px", background: "transparent", border: "none", color: colors.goldLight, cursor: "pointer", fontSize: "13px" }}>Try again →</button>
                </div>
              )}
              <div style={{ marginTop: "14px", fontSize: "12px", color: colors.inkFaint }}>Two-pass AI review · Standard + Assertive versions · Checklist included</div>
            </div>
            <button onClick={() => setStep(s => s - 1)} style={{ marginTop: "28px", background: "transparent", border: "none", color: colors.inkFaint, cursor: "pointer", fontSize: "13px", fontFamily: APP.font }}>
              ← Edit my answers
            </button>
          </div>
        )}

        {/* LETTER OUTPUT */}
        {currentStep === "Letter" && letter && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
              <div>
                <div style={{ fontFamily: APP.displayFont, fontSize: "24px", color: colors.gold, marginBottom: "4px" }}>Your Letter is Ready</div>
                <div style={{ fontSize: "13px", color: colors.inkFaint }}>Two-pass AI reviewed · Two versions · Checklist included</div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => copyText(activeTab === "standard" ? letter : altLetter)} style={btnStyle(true)}>
                  {copied ? "✓ Copied!" : "Copy Letter"}
                </button>
                <button onClick={() => downloadPDF(activeTab === "standard" ? letter : altLetter)} style={{ ...btnStyle(true), background: "transparent", border: `1px solid ${colors.goldLight}`, color: colors.goldLight }}>
                  ⬇ PDF
                </button>
              </div>
            </div>

            {altLetter && (
              <div style={{ display: "flex", gap: "2px", background: colors.paperDark, padding: "4px", borderRadius: "8px", marginBottom: "6px" }}>
                {[["standard", "Standard / Professional"], ["assertive", "Assertive / Detailed"]].map(([key, label]) => (
                  <button key={key} onClick={() => setActiveTab(key)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", cursor: "pointer", fontFamily: APP.font, fontSize: "13px", transition: "all 0.2s", background: activeTab === key ? `linear-gradient(135deg, ${colors.goldLight}, ${colors.gold})` : "transparent", color: activeTab === key ? "#fff" : colors.inkMuted, fontWeight: activeTab === key ? "600" : "400" }}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div style={{ fontSize: "12px", color: colors.inkFaint, marginBottom: "16px" }}>
              {activeTab === "standard" ? "Measured, professional tone. Good for first submission." : "Stronger framing. Better when initial request was denied."}
            </div>

            <div style={{ background: colors.white, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "40px 48px", lineHeight: "1.9", fontSize: "14px", color: colors.inkLight, whiteSpace: "pre-wrap", fontFamily: APP.font, boxShadow: "0 4px 32px rgba(0,0,0,0.08)", marginBottom: "24px" }}>
              {activeTab === "standard" ? letter : altLetter}
            </div>

            {email && !emailSent && (
              <div style={{ background: colors.paperWarm, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "18px 22px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                <div style={{ fontSize: "14px", color: colors.inkLight }}>Send a copy to <strong>{email}</strong></div>
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

            {checklist.length > 0 && (
              <div style={{ background: colors.white, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "24px 28px", marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", color: colors.goldLight, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>Next Steps Checklist</div>
                {checklist.map((item, i) => (
                  <label key={i} style={{ display: "flex", gap: "12px", marginBottom: "10px", cursor: "pointer", alignItems: "flex-start" }}>
                    <input type="checkbox" style={{ marginTop: "3px", accentColor: colors.goldLight }} />
                    <span style={{ fontSize: "14px", color: colors.inkLight, lineHeight: "1.5" }}>{item}</span>
                  </label>
                ))}
              </div>
            )}

            <div style={{ background: "#fdf8ff", border: "1px solid #d8c8e8", borderRadius: "10px", padding: "20px 24px", marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "14px" }}>
                <span style={{ fontSize: "22px" }}>💡</span>
                <div>
                  <div style={{ fontSize: "13px", color: "#7050a0", fontWeight: "600", marginBottom: "6px" }}>Consider attending the hearing in person.</div>
                  <div style={{ fontSize: "12px", color: "#9070b0", lineHeight: "1.6" }}>
                    Boards are more likely to grant variances when applicants appear in person and can answer questions. Bring photos, a site plan, and copies of your letter for each board member.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: "14px 18px", background: colors.paperWarm, borderRadius: "8px", border: `1px solid ${colors.borderLight}`, fontSize: "11px", color: colors.inkFaint, lineHeight: "1.7" }}>
              <strong>Legal Disclaimer:</strong> This letter is AI-generated and does not constitute legal advice. Review all content for accuracy before sending. For complex matters, consult a licensed attorney.
            </div>

            <div style={{ marginTop: "24px", textAlign: "center", padding: "20px", background: colors.white, borderRadius: "10px", border: `1px solid ${colors.borderLight}` }}>
              <div style={{ fontSize: "14px", color: colors.inkMuted, marginBottom: "6px" }}>Did your variance get approved?</div>
              <div style={{ fontSize: "12px", color: colors.inkFaint }}>Share your outcome → <span style={{ color: colors.goldLight }}>results@zoningfight.com</span></div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
        @media print { button { display: none !important; } body { background: #fff; } }
      `}</style>

      <footer style={{ textAlign: "center", padding: "16px", fontSize: "0.72rem", color: "#888", borderTop: "1px solid #e5e0d6", marginTop: "40px" }}>
        ZoningFight v1.2 · © 2026 The Super Simple Software Company · support@buyappsonce.com
      </footer>
    </div>
  );
}
