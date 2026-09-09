import { useState, useEffect, useRef } from "react";
import emailjs from "@emailjs/browser";
import { errorFor, inputTooLong, SUPPORT_EMAIL } from "./lib/errors.js";
import { checkPayload, CAPS } from "./lib/validate.js";
import { selectFrame } from "./lib/frames.js";
import { buildFramePrompt } from "./lib/prompt.js";
import { cleanCriteria, MAX_ROWS, MIN_ROWS, CRITERION_CAP, EVIDENCE_CAP } from "./lib/criteria.js";
import { stateAbbr } from "../frames/select.mjs";
import { lookupHost, searchString } from "./lib/hosts.js";

const EMAILJS_SERVICE_ID  = "YOUR_EMAILJS_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_EMAILJS_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY  = "YOUR_EMAILJS_PUBLIC_KEY";

const APP = {
  name: "ZoningFight",
  tagline: "Variance Letters — Request or Oppose",
  icon: "⚖️",
  color: "#2a4a1a",
  colorLight: "#4a7a2a",
  payhip: "https://payhip.com/b/Z3JNl",
  support: "support@zoningfight.com",
  price: "$19",
  font: "'Source Serif 4', Georgia, serif",
  displayFont: "'Playfair Display', serif",
};

const STEPS = ["Intro", "Direction", "Property", "Variance", "Hardship", "Criteria", "Demand", "Special", "Generate", "Letter"];
const FORM_STEPS = ["Property", "Variance", "Hardship", "Criteria", "Demand"];

// T2 — draft persistence
const DRAFT_KEY = "zf_draft_v1";
const DRAFT_MAX_BYTES = 256 * 1024;

// T5 — application types. `flow` routes to the existing variance/opposing wizard
// or the new special-exception flow. `posture` and `appType` feed the frame layer.
const APP_TYPES = [
  { key: "variance",                    title: "Request a Variance",              desc: "Ask for relief from a zoning rule based on a hardship unique to your property.", flow: "variance", posture: "requesting", appType: "variance", prove: "A legal hardship — unique to your land and not self-created.", decides: "Zoning board of appeals / board of adjustment." },
  { key: "special_exception",           title: "Request a Special Exception",     desc: "Ask for a use the code already allows in your district if you meet its listed criteria.", flow: "special", posture: "requesting", appType: "special_exception", prove: "That your proposal meets each criterion the ordinance lists.", decides: "The body your local code names (varies)." },
  { key: "opposing_variance",           title: "Oppose a Variance",               desc: "Fight a variance granted to a neighbor or another party.", flow: "opposing", posture: "opposing", appType: "opposing_variance", prove: "That the applicant did not meet the hardship standard / the grant harms you.", decides: "The board that granted it, or a higher body." },
  { key: "opposing_special_exception",  title: "Oppose a Special Exception",      desc: "Fight a special exception / conditional use granted to another party.", flow: "special", posture: "opposing", appType: "opposing_special_exception", prove: "That the criteria are unmet AND the proposal is adverse to the public interest.", decides: "The body your local code names (varies)." },
  { key: "other",                       title: "Other (describe)",                desc: "A different zoning matter — you describe it in your own words.", flow: "variance", posture: "requesting", appType: "other", prove: "Whatever your matter requires — you set it out.", decides: "Depends on your matter." },
];
const appTypeByKey = (k) => APP_TYPES.find(t => t.key === k) || null;
const SE_TERMS = ["Special Exception", "Special Permit", "Conditional Use", "Special Use Permit"];

// Opposing-variance mode reuses the same 5 form-step SLOTS (Property, Variance,
// Hardship, Criteria, Demand) so the name-based navigation and progress bar keep
// working — only the fields, titles, and prompt change. These maps drive the
// opposing branch; the requesting branch is unchanged.
const STEP_LABELS_OPP = { Property: "Property", Variance: "The Variance", Hardship: "Grounds", Criteria: "Relief", Demand: "Deadline" };

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
    { key: "additionalInfo",  label: "Additional Information", type: "textarea", required: false, placeholder: "Any other relevant details...", cap: CAPS.additionalInfo },
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

// ---- OPPOSING-VARIANCE MODE: fields for a party fighting a variance granted to
// someone else. Reuses the 5 form-step slots (see STEP_LABELS_OPP). ----
const OPP_GROUNDS = [
  "No demonstrated hardship — the property is buildable as-of-right",
  "Self-created hardship — the applicant's own design choices created the need",
  "Not the minimum variance necessary — a smaller variance would suffice",
  "Adverse impact on adjacent property — light, air, drainage, privacy, value",
  "Contrary to the comprehensive plan or the intent of the zoning ordinance",
  "Procedural defect — improper notice, lack of quorum, no written findings",
  "Economic hardship only — financial inconvenience is not legal hardship",
];
const OPP_RELIEF = [
  "Rescission of the variance",
  "Denial on rehearing",
  "Appeal to a higher body",
  "Conditions imposed if the variance stands",
];
const stepFieldsOpp = {
  Property: [
    { key: "propertyAddress", label: "Your Property Address", type: "text", required: true, placeholder: "Your address (the objector's property)" },
    { key: "subjectAddress",  label: "Subject Property Address", type: "text", required: true, placeholder: "Where the variance was granted (e.g. neighbor's address)" },
    { key: "town",            label: "Municipality / County", type: "text", required: false, placeholder: "e.g. Lee County" },
    { key: "state",           label: "State", type: "text", required: true, placeholder: "Florida" },
    { key: "zoningDistrict",  label: "Zoning District", type: "text", required: false, placeholder: "e.g. R-1 Single Family Residential" },
    { key: "relationship",    label: "Your Relationship to the Property", type: "select", required: true,
      options: ["Abutting property owner (shared lot line)", "Directly across the street", "Within the notice radius", "Nearby owner in the neighborhood", "Other affected party"] },
  ],
  Variance: [
    { key: "varianceGranted", label: "What Variance Was Granted", type: "textarea", required: true,
      placeholder: "e.g. Side setback reduced from the required 25 ft to 12 ft to permit a two-story addition" },
    { key: "regulationSections", label: "Regulation Section Numbers", type: "text", required: false,
      placeholder: "e.g., Section 4.2.1; Article VI", cap: CAPS.regulationSections,
      helper: "The section or article numbers from the zoning regulations that apply. Short is fine — background goes in Additional Information below." },
    { key: "dateGranted",     label: "Date the Variance Was Granted", type: "text", required: false, placeholder: "e.g. April 2026" },
    { key: "caseNumber",      label: "Case / Application Number (if known)", type: "text", required: false, placeholder: "e.g. ZBA-2026-0142" },
    { key: "grantingBoard",   label: "Board That Granted It", type: "text", required: true, placeholder: "e.g. Lee County Zoning Board of Appeals" },
  ],
  Hardship: [ // slot repurposed as "Grounds for Opposition"
    { key: "oppGrounds",      label: "Grounds for Opposition (select all that apply)", type: "checkgroup", required: true, options: OPP_GROUNDS },
    { key: "oppGroundsDetail",label: "Describe the Specific Impact on Your Property", type: "textarea", required: true,
      placeholder: "e.g. Loss of light and air to my east-facing windows, altered drainage toward my lot, and loss of privacy to my rear yard." },
  ],
  Criteria: [ // slot repurposed as "Relief Sought"
    { key: "oppRelief",       label: "Relief Sought (select all that apply)", type: "checkgroup", required: true, options: OPP_RELIEF },
    { key: "oppAppealBody",   label: "If Appealing to a Higher Body, Name It", type: "text", required: false, placeholder: "e.g. Board of County Commissioners" },
  ],
  Demand: [ // slot repurposed as "Deadline & Details"
    { key: "oppDeadline",     label: "Appeal Deadline (if known)", type: "text", required: false, placeholder: "e.g. within 30 days of the decision" },
    { key: "additionalInfo",  label: "Additional Information", type: "textarea", required: false, placeholder: "Any other relevant details...", cap: CAPS.additionalInfo },
  ],
};
const requiredFieldsOpp = {
  Property: ["propertyAddress", "subjectAddress", "state", "relationship"],
  Variance: ["varianceGranted", "grantingBoard"],
  Hardship: ["oppGrounds", "oppGroundsDetail"],
  Criteria: ["oppRelief"],
  Demand: [],
};

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

// T5 — Special Exception flow fields (single form). The ordinance criteria are
// NOT here — they are the user-entered repeating group (CriteriaRows).
const seFields = [
  { key: "state",           label: "State",                       type: "text",   required: true,  placeholder: "Florida" },
  { key: "municipality",    label: "Municipality / County",       type: "text",   required: true,  placeholder: "e.g. Lee County" },
  { key: "decidingBody",    label: "Deciding Body (who decides)",  type: "text",   required: true,  placeholder: "e.g. Board of County Commissioners",
    helper: "Required — no default. In Florida this may be the board of adjustment, planning commission, county commission, or city council depending on your local code. Guessing addresses the letter to the wrong board." },
  { key: "propertyAddress", label: "Property / Parcel",            type: "text",   required: true,  placeholder: "123 Oak Street (or parcel ID)" },
  { key: "zoningDistrict",  label: "Zoning District",              type: "text",   required: false, placeholder: "e.g. AG-2, RS-1" },
  { key: "terminology",     label: "What does your code call it?", type: "select", required: true,  options: SE_TERMS,
    helper: "Use the exact term your local code uses." },
  { key: "regulationSections", label: "Regulation Section Numbers", type: "text",  required: false, placeholder: "e.g., Section 4.2.1; Article VI", cap: CAPS.regulationSections,
    helper: "The section or article numbers from your ordinance that list the special-exception criteria. Short is fine — background goes in Additional Information." },
  { key: "additionalInfo",  label: "Additional Information",       type: "textarea", required: false, placeholder: "Any other relevant background...", cap: CAPS.additionalInfo },
];
const seRequired = ["state", "municipality", "decidingBody", "propertyAddress", "terminology"];

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

// T4: every free-text field gets an explicit cap + visible counter. The cap is
// enforced with maxLength (hard stop) and the counter turns red as it fills.
function fieldCap(field) {
  if (field.cap) return field.cap;
  if (field.type === "textarea") return CAPS.longText;
  if (field.type === "text") return CAPS.shortText;
  return null;
}

function Counter({ value, cap }) {
  if (!cap) return null;
  const n = (value || "").length;
  const near = n > cap * 0.9;
  return (
    <div style={{ textAlign: "right", fontSize: "11px", marginTop: "4px", color: n > cap ? colors.errorText : near ? colors.gold : colors.inkFaint }}>
      {n} / {cap}
    </div>
  );
}

function Field({ field, value, onChange }) {
  const [focused, setFocused] = useState(false);
  const cap = fieldCap(field);
  return (
    <div style={{ marginBottom: "4px" }}>
      <label style={{ display: "block", marginBottom: "7px", fontSize: "13px", color: colors.inkMuted }}>
        {field.label}
        {field.required && <span style={{ color: colors.goldLight, marginLeft: "4px" }}>*</span>}
      </label>
      {field.helper && (
        <div style={{ fontSize: "12px", color: colors.inkFaint, marginBottom: "8px", lineHeight: "1.5" }}>{field.helper}</div>
      )}
      {field.type === "checkgroup" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {field.options.map(o => {
            const sel = (value || "").split("|").filter(Boolean);
            const on = sel.includes(o);
            return (
              <label key={o} style={{ display: "flex", gap: "10px", alignItems: "flex-start", cursor: "pointer", background: colors.white, border: `1px solid ${on ? colors.goldLight : colors.border}`, borderRadius: "8px", padding: "11px 13px" }}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => onChange((on ? sel.filter(x => x !== o) : [...sel, o]).join("|"))}
                  style={{ marginTop: "3px", accentColor: colors.goldLight }}
                />
                <span style={{ fontSize: "14px", color: colors.inkLight, lineHeight: "1.45" }}>{o}</span>
              </label>
            );
          })}
        </div>
      ) : field.type === "select" ? (
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
        <>
          <textarea
            value={value || ""}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            maxLength={cap || undefined}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{ ...inputStyle(focused), resize: "vertical", lineHeight: "1.7", minHeight: "112px" }}
          />
          <Counter value={value} cap={cap} />
        </>
      ) : (
        <>
          <input
            type="text"
            value={value || ""}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            maxLength={cap || undefined}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={inputStyle(focused)}
          />
          <Counter value={value} cap={cap} />
        </>
      )}
    </div>
  );
}

// T5 — the user-entered ordinance criteria (the app supplies none).
function CriteriaRows({ rows, onChange }) {
  const list = rows && rows.length ? rows : [{ criterion: "", evidence: "" }];
  const set = (i, key, val) => {
    const next = list.map((r, idx) => idx === i ? { ...r, [key]: val } : r);
    onChange(next);
  };
  const add = () => { if (list.length < MAX_ROWS) onChange([...list, { criterion: "", evidence: "" }]); };
  const remove = (i) => { if (list.length > MIN_ROWS) onChange(list.filter((_, idx) => idx !== i)); };
  return (
    <div>
      <div style={{ fontSize: "12px", color: colors.inkFaint, marginBottom: "14px", lineHeight: "1.55" }}>
        Copy each criterion from your town's regulations. We format and argue your case — the substance is yours.
      </div>
      {list.map((r, i) => (
        <div key={i} style={{ background: colors.paperWarm, border: `1px solid ${colors.borderLight}`, borderRadius: "10px", padding: "16px 18px", marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: colors.gold, letterSpacing: "0.05em" }}>CRITERION {i + 1}</div>
            {list.length > MIN_ROWS && (
              <button onClick={() => remove(i)} style={{ background: "transparent", border: "none", color: colors.inkFaint, cursor: "pointer", fontSize: "12px" }}>✕ remove</button>
            )}
          </div>
          <Field field={{ label: "(a) The criterion, word for word from your ordinance", type: "textarea", cap: CRITERION_CAP }}
                 value={r.criterion} onChange={v => set(i, "criterion", v)} />
          <div style={{ height: "10px" }} />
          <Field field={{ label: "(b) How your proposal satisfies it", type: "textarea", cap: EVIDENCE_CAP }}
                 value={r.evidence} onChange={v => set(i, "evidence", v)} />
        </div>
      ))}
      {list.length < MAX_ROWS && (
        <button onClick={add} style={{ background: "transparent", border: `1px dashed ${colors.border}`, color: colors.inkMuted, borderRadius: "8px", padding: "11px", width: "100%", cursor: "pointer", fontSize: "13px", fontFamily: APP.font }}>
          + Add another criterion ({list.length}/{MAX_ROWS})
        </button>
      )}
    </div>
  );
}

// T5 — where to get the ordinance. The app never fetches it; it shows her where.
function GuidedRetrieval({ state, municipality }) {
  const host = lookupHost(state, municipality);
  const search = searchString(state, municipality);
  return (
    <div style={{ background: "#f4f8ff", border: "1px solid #cfe0f5", borderRadius: "10px", padding: "18px 22px", marginBottom: "22px" }}>
      <div style={{ fontSize: "13px", fontWeight: "700", color: "#2a5a8a", marginBottom: "10px" }}>📄 Where to find your criteria</div>
      {host ? (
        <div style={{ fontSize: "13px", color: colors.inkLight, marginBottom: "10px", lineHeight: "1.6" }}>
          Open your municipality's code, then pick the zoning / land development title:<br />
          <a href={host.landing_url} target="_blank" rel="noreferrer" style={{ color: "#2a5a8a", fontWeight: "600", wordBreak: "break-all" }}>{host.landing_url}</a>
          {host.notes && <div style={{ fontSize: "11px", color: colors.inkFaint, marginTop: "4px" }}>{host.notes}</div>}
        </div>
      ) : (
        <div style={{ fontSize: "13px", color: colors.inkLight, marginBottom: "10px", lineHeight: "1.6" }}>
          We don't have a verified link for your municipality. Search this (copy it):
          <div style={{ background: colors.white, border: `1px solid ${colors.border}`, borderRadius: "6px", padding: "9px 12px", marginTop: "6px", fontFamily: "monospace", fontSize: "12px", userSelect: "all" }}>{search}</div>
        </div>
      )}
      <ul style={{ fontSize: "12px", color: colors.inkMuted, lineHeight: "1.7", margin: "8px 0 0", paddingLeft: "18px" }}>
        <li>Look in your land development code or zoning code, in the article on special exceptions or conditional uses.</li>
        <li>Search within it for: <code>special exception</code>, <code>conditional use</code>, <code>standards of review</code>, <code>criteria</code>.</li>
        <li>You want the enumerated list — usually lettered or numbered — of conditions the board applies.</li>
        <li>Copy each one word for word; paraphrasing weakens the showing.</li>
        <li>The section number goes in <strong>Regulation Section Numbers</strong> above.</li>
      </ul>
      <div style={{ fontSize: "12px", color: colors.inkLight, marginTop: "12px", padding: "10px 12px", background: colors.white, borderRadius: "6px", lineHeight: "1.55" }}>
        <strong>Can't find it?</strong> Call your municipality's planning or zoning department and ask which code section lists the criteria for a special exception. They will tell you.
      </div>
    </div>
  );
}

// T5 — pre-selection disclosure: variance vs special exception, once per session.
function PreSelectionDisclosure({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,26,15,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "20px" }}>
      <div style={{ background: colors.white, borderRadius: "14px", padding: "30px 34px", maxWidth: "560px", boxShadow: "0 12px 48px rgba(0,0,0,0.3)" }}>
        <h3 style={{ fontFamily: APP.displayFont, fontSize: "22px", color: colors.ink, marginTop: 0, marginBottom: "14px" }}>First: a variance is not a special exception</h3>
        <p style={{ fontSize: "14px", color: colors.inkMuted, lineHeight: "1.65", marginBottom: "14px" }}>
          They ask for different things and require you to prove different things. Picking the right one matters — in Florida the two carry different burdens of proof, and the wrong caption can forfeit an advantage you're entitled to.
        </p>
        <div style={{ display: "flex", gap: "14px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px", background: colors.paperWarm, borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ fontWeight: "700", color: colors.ink, marginBottom: "6px", fontSize: "14px" }}>Variance</div>
            <div style={{ fontSize: "12px", color: colors.inkMuted, lineHeight: "1.55" }}>Permission to break a rule. You must prove a <strong>hardship</strong> unique to your land. You carry that burden.</div>
          </div>
          <div style={{ flex: "1 1 220px", background: colors.paperWarm, borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ fontWeight: "700", color: colors.ink, marginBottom: "6px", fontSize: "14px" }}>Special Exception</div>
            <div style={{ fontSize: "12px", color: colors.inkMuted, lineHeight: "1.55" }}>A use the code already allows if you meet its <strong>listed criteria</strong>. No hardship needed — and in Florida the burden can shift to the board once you make your showing.</div>
          </div>
        </div>
        <button onClick={onClose} style={{ ...btnStyle(true), width: "100%", justifyContent: "center", padding: "13px" }}>Got it — choose my type →</button>
      </div>
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
  const [error, setError] = useState(null);           // T3: {message, showSupport} | string | null
  const [retryCount, setRetryCount] = useState(0);
  const [showDraftBanner, setShowDraftBanner] = useState(false);  // T2
  const [disclosureSeen, setDisclosureSeen] = useState(false);    // T5 pre-selection
  const draftTimer = useRef(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setAccessCode(code.toUpperCase());
      verifyCode(code.toUpperCase(), true);
    }
  }, []);

  // T2: restore a saved draft (localStorage, NOT the license code) and offer a
  // dismissible banner. The draft is cleared only after a successful commit.
  useEffect(() => {
    try {
      const s = localStorage.getItem(DRAFT_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length) {
          setFormData(parsed);
          setShowDraftBanner(true);
        }
      }
    } catch {}
    restoredRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const stateParam = params.get("state");
    const disputeParam = params.get("dispute");
    const slugToStateName = {
      "california": "California", "texas": "Texas", "florida": "Florida",
      "new-york": "New York", "illinois": "Illinois", "pennsylvania": "Pennsylvania",
      "ohio": "Ohio", "georgia": "Georgia", "north-carolina": "North Carolina", "arizona": "Arizona"
    };
    const slugToVarianceType = {
      "zoning-variance-appeal-letter": "Area/Setback Variance",
      "zoning-decision-appeal": "Other",
      "special-use-permit-appeal": "Use Variance",
      "setback-variance-request": "Area/Setback Variance",
      "conditional-use-permit-denial": "Use Variance",
      "zoning-board-hearing-objection": "Other",
      "spot-zoning-challenge": "Other",
      "nonconforming-use-letter": "Other",
      "zoning-code-violation-defense": "Other",
      "rezoning-application-letter": "Other"
    };
    const updates = {};
    if (stateParam && slugToStateName[stateParam]) updates.state = slugToStateName[stateParam];
    if (disputeParam && slugToVarianceType[disputeParam]) updates.varianceType = slugToVarianceType[disputeParam];
    if (Object.keys(updates).length) setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // T2: debounced autosave (500ms). Never persists the license code (it lives in
  // its own `accessCode` state, not in formData). 256KB cap — on overflow keep
  // the most recent write, log, never silently drop the whole draft.
  useEffect(() => {
    if (!restoredRef.current) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      try {
        const json = JSON.stringify(formData || {});
        if (json.length > DRAFT_MAX_BYTES) {
          console.warn(`[draft] ${json.length}B exceeds ${DRAFT_MAX_BYTES}B cap — keeping latest write`);
        }
        localStorage.setItem(DRAFT_KEY, json);
      } catch (e) { console.warn("[draft] save failed", e); }
    }, 500);
    return () => draftTimer.current && clearTimeout(draftTimer.current);
  }, [formData]);

  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch {} };
  const discardDraft = () => { setFormData({}); clearDraft(); setShowDraftBanner(false); };

  const handleChange = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const isOpposing = formData.direction === "opposing";
  const activeStepFields = isOpposing ? stepFieldsOpp : stepFields;

  const isStepValid = (stepName) => {
    if (isOpposing) {
      return (requiredFieldsOpp[stepName] || []).every(k => formData[k] && formData[k].trim());
    }
    const variance = isVarianceType(formData.varianceType);
    if (!variance) {
      if (stepName === "Variance") return !!formData.varianceType?.trim();
      if (stepName === "Hardship" || stepName === "Criteria") return true;
    }
    return (requiredFields[stepName] || []).every(k => formData[k] && formData[k].trim());
  };

  // T5: special-exception flow validity — all required fields + >=1 criterion row.
  const seStepValid = () => {
    if (!seRequired.every(k => (formData[k] || "").trim())) return false;
    return cleanCriteria(formData.criteriaRows).length >= MIN_ROWS;
  };

  // Payhip gate check (lightweight — the authoritative check is at generation).
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

  // Payhip-authorized API call. Server verifies the code on each call; the code
  // is not consumed until the client sends { markUsed:true } after render.
  const callAPI = async (systemPrompt, userPrompt, reviewMode, draftLetter, extra = {}) => {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessCode, systemPrompt, userPrompt, reviewMode: !!reviewMode, draftLetter: draftLetter || "", ...extra }),
    });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Generation failed"); }
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
- Cite the state zoning enabling act provision that protects non-conforming uses (e.g., New York Town Law §267-b; California's common-law vested-rights doctrine and the local zoning ordinance's non-conforming-use provisions (note: California has no single non-conforming-use statute; Government Code §65852.25 covers only post-disaster reconstruction of multifamily dwellings, not general non-conforming use); Connecticut General Statutes §8-2; Florida Chapter 163)
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

  const opposingPrompt = `You are an expert land use and zoning attorney representing a property owner who OPPOSES a variance that has been granted to another party.

Write a formal objection letter that argues the variance should be rescinded, denied on rehearing, or overturned on appeal.

Your arguments must attack the legal basis for the variance:
- The applicant failed to demonstrate unnecessary hardship as required by statute. Economic inconvenience, personal preference, and self-created conditions do not constitute legal hardship.
- Any hardship claimed was self-created by the applicant's own design decisions, which is a bar to variance relief in nearly every jurisdiction.
- The variance granted exceeds the minimum necessary to afford relief.
- The variance causes substantial detriment to adjacent properties and the public good.
- The variance is contrary to the intent and purpose of the zoning ordinance and the comprehensive plan.
- Where applicable, cite procedural defects: inadequate notice, absence of written findings of fact, or failure to make the statutory findings on the record.

Establish the writer's standing as an aggrieved party — an abutting or nearby owner with a particularized injury distinct from the general public.

Be specific about the physical impact on the objector's property: loss of light and air, drainage, privacy, sightlines, and property value.

Professional, precise, factual tone. Do not use emotional appeals. 550-750 words.

Format: formal letter with [DATE] placeholder, addressed to the board that granted the variance, sent via certified mail, with a reference line citing the case or application number.

Output ONLY the letter, no preamble.`;

  const pickSystemPrompt = (varianceType) => {
    if (formData.direction === "opposing") return opposingPrompt;
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
    if (formData.direction === "opposing") {
      const grounds = (formData.oppGrounds || "").split("|").filter(Boolean).map(g => `- ${g}`).join("\n");
      const relief = (formData.oppRelief || "").split("|").filter(Boolean).map(r => `- ${r}`).join("\n");
      const oppBase = `
OBJECTOR'S PROPERTY ADDRESS: ${formData.propertyAddress}
SUBJECT PROPERTY (where the variance was granted): ${formData.subjectAddress}
MUNICIPALITY / COUNTY: ${formData.town || "not provided"}
STATE: ${formData.state}
ZONING DISTRICT: ${formData.zoningDistrict || "not specified"}
OBJECTOR'S RELATIONSHIP / STANDING: ${formData.relationship || "nearby affected owner"}
VARIANCE THAT WAS GRANTED: ${formData.varianceGranted}
REGULATION SECTION NUMBERS RELIED ON: ${formData.regulationSections || "not specified"}
DATE GRANTED: ${formData.dateGranted || "not specified"}
CASE / APPLICATION NUMBER: ${formData.caseNumber || "not provided"}
BOARD THAT GRANTED IT: ${formData.grantingBoard}
GROUNDS FOR OPPOSITION:
${grounds || "- No demonstrated hardship"}
SPECIFIC IMPACT ON OBJECTOR'S PROPERTY: ${formData.oppGroundsDetail}
RELIEF SOUGHT:
${relief || "- Rescission of the variance"}
HIGHER BODY (if appealing): ${formData.oppAppealBody || "not specified"}
APPEAL DEADLINE: ${formData.oppDeadline || "not specified"}
ADDITIONAL INFO: ${formData.additionalInfo || "none"}`;
      if (tone === "assertive") {
        return `Write a MORE ASSERTIVE objection letter. Stronger language, explicit legal citations, more forceful arguments that the variance must be overturned. Different wording from standard:\n${oppBase}`;
      }
      return `Write a STANDARD PROFESSIONAL objection letter arguing the granted variance should be rescinded/overturned:\n${oppBase}`;
    }
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

  const activeAppType = () =>
    appTypeByKey(formData.applicationType) ||
    (formData.direction === "opposing" ? appTypeByKey("opposing_variance") : appTypeByKey("variance"));

  // T4: collect {label,value,limit} for the active flow — validated BEFORE reserve.
  const collectEntries = (isSpecial) => {
    const e = [];
    if (isSpecial) {
      for (const f of seFields) e.push({ label: f.label, value: formData[f.key], limit: fieldCap(f) || CAPS.shortText });
      (formData.criteriaRows || []).forEach((r, i) => {
        e.push({ label: `Criterion ${i + 1}`, value: r.criterion, limit: CRITERION_CAP });
        e.push({ label: `Criterion ${i + 1} evidence`, value: r.evidence, limit: EVIDENCE_CAP });
      });
    } else {
      const fields = isOpposing
        ? Object.values(stepFieldsOpp).flat()
        : [...Object.values(stepFields).flat(), ...(conditionalFields[formData.varianceType] || [])];
      for (const f of fields) if (formData[f.key]) e.push({ label: f.label, value: formData[f.key], limit: fieldCap(f) || CAPS.longText });
    }
    return e;
  };

  const generateLetter = async () => {
    const at = activeAppType();
    const isSpecial = at.flow === "special";

    setError(null);
    setLetter(""); setAltLetter(""); setChecklist([]);

    // T4 — validate client-side FIRST. Invalid input never touches a reservation.
    const v = checkPayload(collectEntries(isSpecial));
    if (!v.ok) { setError(inputTooLong(v.label, v.count, v.limit)); return; }

    setLoading(true);

    try {
      let reviewed, alt, frameExtra = {};

      if (isSpecial) {
        // Frame is bundled static JSON; selection is a sync lookup (no runtime fetch).
        const sel = selectFrame(formData.state, at.appType);
        if (sel.fallback) console.log(`[DECISIONS backfill] GENERIC fallback: ${sel.key}`);
        const opts = { formData, criteriaRows: formData.criteriaRows || [], applicationType: at.appType, posture: at.posture };
        const built = buildFramePrompt(sel.frame, { ...opts, tone: "standard" });
        // Carry the lint inputs to the generation path (forbidden phrases + user criteria).
        frameExtra = { criteria: built.criteria, forbiddenPhrases: built.forbiddenPhrases, enforceForbidden: built.enforceForbidden };
        setLoadingMsg("Drafting your letter...");
        const draft = await callAPI(built.system, built.user, false, "", frameExtra);
        setLoadingMsg("Running quality review...");
        reviewed = await callAPI("", "", true, draft, frameExtra);
        setLoadingMsg("Generating assertive version...");
        const builtA = buildFramePrompt(sel.frame, { ...opts, tone: "assertive" });
        alt = await callAPI(builtA.system, builtA.user, false, "", frameExtra);
      } else {
        const effectivePrompt = pickSystemPrompt(formData.varianceType);
        setLoadingMsg("Drafting your letter...");
        const draft = await callAPI(effectivePrompt, buildPrompt("standard"), false, "");
        setLoadingMsg("Running quality review...");
        reviewed = await callAPI("", "", true, draft);
        setLoadingMsg("Generating assertive version...");
        alt = await callAPI(effectivePrompt, buildPrompt("assertive"), false, "");
      }

      setLetter(reviewed);
      setAltLetter(alt);

      setLoadingMsg("Building checklist...");
      try {
        const clRes = await fetch("/api/checklist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessCode,
            direction: at.posture,
            address: formData.propertyAddress,
            state: formData.state,
            varianceType: isSpecial ? at.title : (isOpposing ? "Opposing a granted variance" : formData.varianceType),
            letterExcerpt: reviewed.substring(0, 300),
          }),
        });
        if (clRes.ok) setChecklist((await clRes.json()).checklist || []);
      } catch {}

      // Deliver: render the letter, THEN mark the code used (only after delivery).
      setStep(STEPS.indexOf("Letter"));
      setRetryCount(0);

      try {
        await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessCode, markUsed: true }),
        });
      } catch { /* letter delivered; usage-mark is best-effort */ }
      clearDraft();
      setShowDraftBanner(false);
    } catch (e) {
      // Pre-render failure: the code was never marked used, so nothing to release.
      // Keep the draft so nothing is lost.
      setRetryCount(retryCount + 1);
      setError({ message: `${e.message || "Generation failed"}. Please try again.`, showSupport: false });
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
      setError({ message: "Email send failed. Please copy the letter manually.", showSupport: false });
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
    doc.save(isOpposing ? "ZoningFight-variance-objection.pdf" : "ZoningFight-variance-letter.pdf");
  };

  const reset = () => {
    setStep(codeValid ? 1 : 0);
    setFormData({});
    setLetter("");
    setAltLetter("");
    setError(null);
    setEmailSent(false);
    setChecklist([]);
    setRetryCount(0);
    setReservationToken(null);
    clearDraft();
    setShowDraftBanner(false);
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

        {/* T2 — draft restored banner */}
        {showDraftBanner && currentStep !== "Letter" && (
          <div style={{ background: "#fff8e6", border: "1px solid #e8d48a", borderRadius: "8px", padding: "12px 16px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "13px", color: colors.inkLight }}>
              📝 We restored your unfinished draft. Your access code is never saved.
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setShowDraftBanner(false)} style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.inkMuted, padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontFamily: APP.font }}>Keep it</button>
              <button onClick={discardDraft} style={{ background: "transparent", border: `1px solid ${colors.errorBorder}`, color: colors.errorText, padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontFamily: APP.font }}>Discard draft</button>
            </div>
          </div>
        )}

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
              AI-generated letters to <strong>request</strong> a variance — or to <strong>oppose</strong> one granted to a neighbor. Also building permits, stop-work orders, non-conforming use, CUPs, code interpretation, sign permits, and code enforcement. Attorney-quality. 5 minutes. {APP.price}.
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

        {/* DIRECTION — application-type selection (T5) */}
        {currentStep === "Direction" && (
          <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
            {!disclosureSeen && <PreSelectionDisclosure onClose={() => setDisclosureSeen(true)} />}
            <h2 style={{ fontFamily: APP.displayFont, fontSize: "28px", color: colors.ink, marginBottom: "10px", fontWeight: "800" }}>What do you need?</h2>
            <p style={{ fontSize: "15px", color: colors.inkMuted, marginBottom: "28px", lineHeight: "1.6" }}>
              Pick your situation. A variance and a special exception are different requests — see the guide if you're unsure.{" "}
              <button onClick={() => setDisclosureSeen(false)} style={{ background: "transparent", border: "none", color: colors.goldLight, cursor: "pointer", fontSize: "14px", textDecoration: "underline", padding: 0 }}>Compare them</button>.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {APP_TYPES.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, applicationType: opt.key, direction: opt.posture, terminology: prev.terminology || (opt.flow === "special" ? "Special Exception" : prev.terminology) }));
                    setStep(STEPS.indexOf(opt.flow === "special" ? "Special" : "Property"));
                  }}
                  style={{ textAlign: "left", background: colors.white, border: `2px solid ${formData.applicationType === opt.key ? colors.goldLight : colors.border}`, borderRadius: "12px", padding: "18px 22px", cursor: "pointer", fontFamily: APP.font, transition: "all 0.2s", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
                >
                  <div style={{ fontSize: "17px", fontWeight: "700", color: colors.ink, marginBottom: "5px", fontFamily: APP.displayFont }}>{opt.title}</div>
                  <div style={{ fontSize: "13px", color: colors.inkMuted, lineHeight: "1.5" }}>{opt.desc}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(0)} style={{ marginTop: "24px", background: "transparent", border: "none", color: colors.inkFaint, cursor: "pointer", fontSize: "13px", fontFamily: APP.font }}>
              ← Back
            </button>
          </div>
        )}

        {/* SPECIAL EXCEPTION FLOW (T5) */}
        {currentStep === "Special" && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontFamily: APP.displayFont, fontSize: "26px", color: colors.ink, marginBottom: "6px", fontWeight: "700" }}>
                {activeAppType().title}
              </h2>
              <p style={{ fontSize: "14px", color: colors.inkMuted, lineHeight: "1.6" }}>
                Tell us the jurisdiction and paste your ordinance's criteria. We supply none of the criteria — the substance is yours.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {seFields.map(f => (
                <Field key={f.key} field={f} value={formData[f.key]} onChange={v => handleChange(f.key, v)} />
              ))}
            </div>

            <div style={{ height: "26px" }} />
            <GuidedRetrieval state={formData.state} municipality={formData.municipality} />

            <div style={{ fontSize: "15px", fontWeight: "700", color: colors.ink, margin: "6px 0 12px", fontFamily: APP.displayFont }}>
              Criteria From Your Ordinance <span style={{ color: colors.goldLight }}>*</span>
            </div>
            <CriteriaRows rows={formData.criteriaRows} onChange={rows => handleChange("criteriaRows", rows)} />

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
              <button onClick={() => setStep(STEPS.indexOf("Direction"))} style={{ ...btnStyle(true), background: "transparent", border: `1px solid ${colors.border}`, color: colors.inkMuted, boxShadow: "none" }}>
                ← Back
              </button>
              <button
                onClick={() => setStep(STEPS.indexOf("Generate"))}
                disabled={!seStepValid()}
                style={btnStyle(seStepValid())}
              >
                Continue →
              </button>
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
                      {isOpposing ? STEP_LABELS_OPP[s] : s}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step title */}
            <div style={{ marginBottom: "28px" }}>
              <h2 style={{ fontFamily: APP.displayFont, fontSize: "26px", color: colors.ink, marginBottom: "6px", fontWeight: "700" }}>
                {!isOpposing && currentStep === "Property" && "Your Property"}
                {!isOpposing && currentStep === "Variance" && "The Variance"}
                {!isOpposing && currentStep === "Hardship" && "The Hardship"}
                {!isOpposing && currentStep === "Criteria" && "Town Criteria"}
                {!isOpposing && currentStep === "Demand" && "Hearing Details"}
                {isOpposing && currentStep === "Property" && "The Properties"}
                {isOpposing && currentStep === "Variance" && "The Granted Variance"}
                {isOpposing && currentStep === "Hardship" && "Grounds for Opposition"}
                {isOpposing && currentStep === "Criteria" && "Relief Sought"}
                {isOpposing && currentStep === "Demand" && "Deadline & Details"}
              </h2>
              <p style={{ fontSize: "14px", color: colors.inkMuted, lineHeight: "1.6" }}>
                {!isOpposing && currentStep === "Property" && "The property location and zoning details."}
                {!isOpposing && currentStep === "Variance" && "What you're requesting and what the current rules require."}
                {!isOpposing && currentStep === "Hardship" && "The hardship that makes the variance necessary."}
                {!isOpposing && currentStep === "Criteria" && "Your town's specific evaluation criteria for variances."}
                {!isOpposing && currentStep === "Demand" && "Hearing date and any additional details."}
                {isOpposing && currentStep === "Property" && "Your property, the property that got the variance, and your standing to object."}
                {isOpposing && currentStep === "Variance" && "What was granted, to whom, and by which board."}
                {isOpposing && currentStep === "Hardship" && "Why the variance should not have been granted."}
                {isOpposing && currentStep === "Criteria" && "What you are asking the board to do."}
                {isOpposing && currentStep === "Demand" && "Appeal deadline and anything else to include."}
              </p>
            </div>

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {((!isOpposing && currentStep === "Variance") ? buildVarianceFields(stepFields.Variance, formData.varianceType) : (activeStepFields[currentStep] || [])).map(f => (
                <Field key={f.key} field={f} value={formData[f.key]} onChange={v => handleChange(f.key, v)} />
              ))}
            </div>

            {/* Nav buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "36px" }}>
              <button onClick={() => setStep(currentStep === "Property" ? STEPS.indexOf("Direction") : step - 1)} style={{ ...btnStyle(true), background: "transparent", border: `1px solid ${colors.border}`, color: colors.inkMuted, boxShadow: "none" }}>
                ← Back
              </button>
              <button onClick={() => setStep(currentStep === "Demand" ? STEPS.indexOf("Generate") : step + 1)} disabled={!isStepValid(currentStep)} style={btnStyle(isStepValid(currentStep))}>
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
                <div style={{ marginTop: "16px", padding: "13px 16px", background: colors.errorBg, border: `1px solid ${colors.errorBorder}`, borderRadius: "8px", color: colors.errorText, fontSize: "13px", lineHeight: "1.55" }}>
                  {typeof error === "string" ? error : error.message}
                  {typeof error === "object" && error.showSupport && (
                    <> <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: colors.goldLight }}>Contact support</a>.</>
                  )}
                  <button onClick={generateLetter} style={{ marginLeft: "12px", background: "transparent", border: "none", color: colors.goldLight, cursor: "pointer", fontSize: "13px" }}>Try again →</button>
                </div>
              )}
              <div style={{ marginTop: "14px", fontSize: "12px", color: colors.inkFaint }}>Two-pass AI review · Standard + Assertive versions · Checklist included</div>
            </div>
            <button onClick={() => setStep(STEPS.indexOf(activeAppType().flow === "special" ? "Special" : "Demand"))} style={{ marginTop: "28px", background: "transparent", border: "none", color: colors.inkFaint, cursor: "pointer", fontSize: "13px", fontFamily: APP.font }}>
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
