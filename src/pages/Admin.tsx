import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";

const ADMIN_DOMAIN = "harborview-consulting.com";

const TEST_PROFILES = {
  prospect: { email: "testuser@acmecorp.com", label: "Prospect (acmecorp.com)" },
  workiva: { email: "testuser@workiva.com", label: "Workiva Seller" },
  custom: { email: "", label: "Custom Email" },
} as const;

type ProfileKey = keyof typeof TEST_PROFILES;

export default function Admin() {
  const navigate = useNavigate();

  // Auth state
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("hv_admin") === "1" && !!sessionStorage.getItem("hv_admin_token"));
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Admin state
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem("hv_admin_token") ?? "");
  const [selectedProfile, setSelectedProfile] = useState<ProfileKey>("prospect");
  const [customEmail, setCustomEmail] = useState("");

  // Simulate completion state
  const [simCompany, setSimCompany] = useState("");
  const [simServices, setSimServices] = useState<string[]>([]);
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<{ status: "success" | "error"; message: string } | null>(null);

  const currentSession = sessionStorage.getItem("hv_lead");
  const parsedSession = currentSession ? JSON.parse(currentSession) : null;

  // --- Auth handlers ---

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");

    const domain = email.split("@")[1]?.toLowerCase();
    if (domain !== ADMIN_DOMAIN) {
      setAuthError("Admin access is restricted to @harborview-consulting.com");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch("/.netlify/functions/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setAuthError(data.error ?? "Failed to send code");
        return;
      }
      setOtpSent(true);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setAuthError("Network error — try again");
    } finally {
      setAuthLoading(false);
    }
  }

  async function verifyOtp(code: string) {
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch("/.netlify/functions/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), code }),
      });
      if (!res.ok) {
        const data = await res.json();
        setAuthError(data.error ?? "Invalid code");
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
        return;
      }
      const data = await res.json() as { sessionToken?: string };
      sessionStorage.setItem("hv_admin", "1");
      if (data.sessionToken) {
        sessionStorage.setItem("hv_admin_token", data.sessionToken);
        setAdminToken(data.sessionToken);
      }
      setAuthed(true);
    } catch {
      setAuthError("Network error — try again");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5) {
      const code = next.join("");
      if (code.length === 6) void verifyOtp(code);
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split("");
      setOtp(digits);
      otpRefs.current[5]?.focus();
      void verifyOtp(pasted);
    }
  }

  // --- Auth gate ---

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="text-white text-xl font-bold mb-1">Admin Access</h1>
          <p className="text-gray-500 text-sm mb-6">
            {otpSent
              ? `Enter the 6-digit code sent to ${email}`
              : "Verify your Harbor View email to continue."}
          </p>

          {!otpSent ? (
            <form onSubmit={handleSendOtp}>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setAuthError(""); }}
                placeholder="you@harborview-consulting.com"
                autoFocus
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-hv-blue/50 mb-3"
              />
              {authError && <p className="text-red-400 text-xs mb-3">{authError}</p>}
              <button
                type="submit"
                disabled={authLoading || !email}
                className="w-full bg-hv-blue hover:bg-hv-blue/90 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-xl transition"
              >
                {authLoading ? "Sending..." : "Send Verification Code"}
              </button>
            </form>
          ) : (
            <div>
              <div className="flex gap-2 justify-center mb-3" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={authLoading}
                    className="w-11 h-13 bg-gray-900 border border-gray-700 rounded-lg text-center text-lg text-white font-bold focus:outline-none focus:ring-2 focus:ring-hv-blue/50 disabled:opacity-40"
                  />
                ))}
              </div>
              {authError && <p className="text-red-400 text-xs mb-3 text-center">{authError}</p>}
              <button
                onClick={() => { setOtpSent(false); setOtp(["", "", "", "", "", ""]); setAuthError(""); }}
                className="block mx-auto text-xs text-gray-500 hover:text-gray-300 transition mt-2"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Admin console ---

  function startSession(targetPage: string, overrideEmail?: string) {
    const em = overrideEmail ?? (selectedProfile === "custom" ? customEmail : TEST_PROFILES[selectedProfile].email);
    if (!em) return;

    sessionStorage.setItem(
      "hv_lead",
      JSON.stringify({ leadId: `test-${Date.now()}`, email: em, sessionToken: adminToken })
    );
    navigate(targetPage);
  }

  function clearSession() {
    sessionStorage.removeItem("hv_lead");
    sessionStorage.removeItem("hv_proposal_slug");
    window.location.reload();
  }

  function logout() {
    sessionStorage.removeItem("hv_admin");
    sessionStorage.removeItem("hv_admin_token");
    setAdminToken("");
    setAuthed(false);
    setOtpSent(false);
    setOtp(["", "", "", "", "", ""]);
    setEmail("");
  }

  const SERVICE_OPTIONS = [
    { label: "Workiva Health Check", template: "health-check" },
    { label: "Financial Reporting Implementation", template: "financial-reporting" },
    { label: "ESG / Sustainability Reporting", template: "esg" },
    { label: "SOX / Internal Controls", template: "sox" },
    { label: "FP&A / Management Reporting", template: "fpa" },
  ];

  function toggleService(label: string) {
    setSimServices((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  }

  type Msg = { role: "user" | "assistant"; content: string };

  function buildSimData(companyName: string, services: string[]) {
    const primary = services[0];
    const templates = services.map(
      (s) => SERVICE_OPTIONS.find((o) => o.label === s)!.template
    );

    const transcripts: Record<string, { transcript: Msg[]; industry: string; duration: string; fee: string; complexity: string; notes: string; modules: string[] }> = {
      "Workiva Health Check": {
        industry: "Financial Services",
        duration: "3–4 weeks",
        fee: "$12,000 – $18,000",
        complexity: "moderate",
        notes: "Mid-size financial services firm with 3 years on Workiva. Multiple report owners with inconsistent workflows, some broken linked content, and no governance standards documented. Moderate complexity due to multi-entity structure and need for permissions audit.",
        modules: ["Wdesk"],
        transcript: [
          { role: "assistant", content: `Hi there! Welcome to Harbor View Consulting's Workiva scoping tool. I'm here to learn about your needs so we can put together a personalized estimate.\n\nTo get started — what's your company name, and what brings you to us today?` },
          { role: "user", content: `I'm with ${companyName}. We've been using Workiva for about 3 years now for our SEC filings, but honestly things have gotten a bit messy. We have multiple people building reports with no real standards, and we keep running into broken links and formatting issues. Someone mentioned a health check might help.` },
          { role: "assistant", content: `That's a really common situation — after a few years of organic growth on the platform, things tend to drift. A Workiva Health Check is exactly the right starting point.\n\nCan you tell me a little more about your organization? What industry are you in, roughly how large is the company, and how many people are actively working in Workiva today?` },
          { role: "user", content: `We're a financial services company, about 1,200 employees. I'd say we have around 15 people who touch Workiva regularly — some in accounting, some in FP&A, and a couple in legal.` },
          { role: "assistant", content: `Got it — 15 active users across multiple departments is a good-sized footprint.\n\nA couple more questions: How many reports or documents do you currently maintain in Workiva? And are they mostly SEC filings, or do you also have internal reports, board decks, or other document types in there?` },
          { role: "user", content: `We have our 10-K, 10-Q, proxy statement, and a couple of 8-Ks. Plus there are maybe 6–8 internal reports that various teams built over time. I think some of those are duplicates or outdated but nobody wants to delete anything.` },
          { role: "assistant", content: `That's pretty typical — the fear of deleting something important is real! A health check would inventory all of that and help you clean house safely.\n\nWhat about your entity structure? Are you a single entity or multi-entity? And do you have any integrations pulling data into Workiva from other systems like an ERP?` },
          { role: "user", content: `We're multi-entity — we have a parent company and 4 subsidiaries. We do have a data feed from Oracle into Workiva but I'm not sure anyone really manages it anymore. The person who set it up left about a year ago.` },
          { role: "assistant", content: `That's a really important detail — orphaned integrations can cause data issues downstream. We'd definitely want to audit that Oracle connection as part of the health check.\n\nLast couple of questions: Does your team have any documented Workiva governance — things like naming conventions, folder structure standards, or a process for who reviews what? And is there a particular deadline driving this, like a filing date?` },
          { role: "user", content: `No governance documentation at all — that's part of the problem. Everyone just does their own thing. No hard deadline, but we'd like to get it cleaned up before our next 10-K filing cycle, which kicks off in about 8 weeks.` },
          { role: "assistant", content: `That's a great timeline — a health check typically takes 3–4 weeks, so we'd have you in good shape well before the 10-K cycle.\n\nI have everything I need to put together your estimate. Our team will review this and send you a personalized fee range within 24 hours. You'll hear from us soon!` },
        ],
      },
      "Financial Reporting Implementation": {
        industry: "Manufacturing",
        duration: "12–16 weeks",
        fee: "$85,000 – $130,000",
        complexity: "complex",
        notes: "Large manufacturer with 12 entities across 3 countries, migrating from legacy Certent system. Complex consolidation requirements, multi-currency (USD, EUR, GBP), tight Q1 2027 filing deadline, and need for ERP integration with SAP S/4HANA. Limited internal Workiva experience — will need significant training.",
        modules: ["Wdesk", "Workiva Reporting"],
        transcript: [
          { role: "assistant", content: `Hi there! Welcome to Harbor View Consulting's Workiva scoping tool. I'm here to learn about your needs so we can put together a personalized estimate.\n\nTo get started — what's your company name, and what brings you to us today?` },
          { role: "user", content: `Hi, I'm the VP of Financial Reporting at ${companyName}. We're a publicly traded manufacturer and we need to implement Workiva for our SEC financial reporting. We've been using Certent for years but we're migrating to Workiva.` },
          { role: "assistant", content: `Welcome! Certent to Workiva is a migration path we've done many times — there are some real wins to be had in terms of workflow efficiency and collaboration.\n\nCan you give me a sense of the scope? How many entities are in your consolidation, and what are your primary filings — 10-K, 10-Q, proxy?` },
          { role: "user", content: `We have 12 entities total — the parent plus 11 subs. 3 of those are international (UK, Germany, and France). Primary filings are 10-K, 10-Q, proxy, and we do about 4–5 8-Ks a year. We also need to think about our earnings release.` },
          { role: "assistant", content: `That's a substantial footprint. The international entities add a layer of complexity with multi-currency considerations.\n\nWhat ERP system are you on, and are you planning to integrate it with Workiva for data feeds? Also, how does your consolidation process work today — is it handled in the ERP or in a separate tool like HFM or BPC?` },
          { role: "user", content: `We're on SAP S/4HANA globally. We do our consolidation in SAP as well. We'd definitely want to set up a data feed from SAP into Workiva — right now with Certent we're doing a lot of manual data entry and copy-paste, which is a big reason we're switching.` },
          { role: "assistant", content: `SAP integration with Workiva works well — we can set up automated data connections that eliminate most of that manual work. That's usually one of the biggest ROI drivers in these projects.\n\nHow large is your reporting team? Who will be the day-to-day users in Workiva, and do any of them have prior Workiva experience?` },
          { role: "user", content: `The core reporting team is about 8 people — controllers, senior accountants, and our IR person for the earnings release. Nobody on the team has used Workiva before. We'll definitely need training as part of this. We also have an IT team of 3 who would manage the SAP integration once it's set up.` },
          { role: "assistant", content: `Training is definitely part of what we'd scope in. With 8 core users who are net-new to Workiva, we'd want to make sure they're comfortable before the first live filing.\n\nSpeaking of timelines — when is your next 10-K filing? Is there a specific go-live date you're targeting?` },
          { role: "user", content: `Our fiscal year ends December 31, so the 10-K is due late February. We'd ideally want to be live on Workiva for the Q1 2027 10-Q filing at the latest. So we need to be fully up and running by early April 2027.` },
          { role: "assistant", content: `That gives us about a year, which is workable but we'd want to start soon to leave room for testing and dry runs.\n\nOne more question — are there any other complicating factors I should know about? Things like XBRL tagging requirements, custom financial statement layouts, or any audit firm requirements around the transition?` },
          { role: "user", content: `Yes, we do our own XBRL tagging in-house currently. We'd want to move that into Workiva too. And our audit firm (PwC) wants to be looped in on the transition timeline. No unusual financial statement layouts though — pretty standard manufacturing disclosures.` },
          { role: "assistant", content: `Perfect — XBRL in Workiva is much more streamlined than standalone tagging tools, so your team should appreciate that improvement.\n\nI have everything I need to put together your estimate. Our team will review this and send you a personalized fee range within 24 hours. Given the scope — 12 entities, multi-currency, SAP integration, XBRL, and full team training — this is a comprehensive engagement, but it's exactly the kind of project we specialize in. You'll hear from us soon!` },
        ],
      },
      "ESG / Sustainability Reporting": {
        industry: "Energy",
        duration: "10–14 weeks",
        fee: "$50,000 – $80,000",
        complexity: "moderate",
        notes: "Mid-size energy company building first formal ESG reporting program on Workiva. Needs CSRD and TCFD framework support, data collection across 8 facilities, and integration with existing emissions tracking spreadsheets. Moderate complexity — first-time ESG reporter but has executive sponsorship and a dedicated sustainability team of 4.",
        modules: ["Wdesk", "Workiva ESG"],
        transcript: [
          { role: "assistant", content: `Hi there! Welcome to Harbor View Consulting's Workiva scoping tool. I'm here to learn about your needs so we can put together a personalized estimate.\n\nTo get started — what's your company name, and what brings you to us today?` },
          { role: "user", content: `Hi, I'm the Director of Sustainability at ${companyName}. We're an energy company and we need to get serious about our ESG reporting. Our board is pushing us to publish a formal sustainability report, and we've purchased Workiva to do it.` },
          { role: "assistant", content: `Great timing — ESG reporting is moving fast and getting the right infrastructure in place now will pay dividends. Workiva's ESG solution is purpose-built for exactly this.\n\nCan you tell me a bit more about where you are today? Have you published any sustainability reports before, or is this your first formal ESG disclosure?` },
          { role: "user", content: `This is our first formal one. We've had a section on our website with some high-level sustainability info, but nothing structured or auditable. Our investors are asking for it and we're also looking at CSRD compliance since we have operations in Europe.` },
          { role: "assistant", content: `First-time ESG reporting with CSRD requirements — that's a meaningful scope. Are you also looking at any other frameworks? TCFD, GRI, SASB? And do you know if your report will need any level of assurance or third-party verification?` },
          { role: "user", content: `We're planning to align with TCFD and CSRD. Our auditors (Deloitte) have mentioned they'll want to do limited assurance on the climate-related disclosures starting next year. So yes, it needs to be auditable from the start.` },
          { role: "assistant", content: `That's smart to build for auditability from day one — it's much easier than retrofitting later.\n\nTell me about your data landscape. Where is your ESG data coming from today? Things like emissions data, energy consumption, workforce metrics — is that in spreadsheets, a separate system, or scattered across the organization?` },
          { role: "user", content: `Mostly spreadsheets, honestly. We have 8 facilities and each one tracks their own energy and emissions data in Excel. Workforce data comes from our HRIS (Workday). Water usage is tracked by our operations team in another spreadsheet. It's pretty fragmented.` },
          { role: "assistant", content: `That's very common for companies at this stage. One of the big wins with Workiva is centralizing all of that data collection with proper audit trails.\n\nHow large is your sustainability team? And do you have executive sponsorship for this initiative — a C-suite champion who's driving it?` },
          { role: "user", content: `I have a team of 4, including myself. Our CFO is the executive sponsor — she's the one who got board approval for the Workiva purchase. We also have a cross-functional working group with people from operations, HR, legal, and investor relations.` },
          { role: "assistant", content: `That's a really strong setup — executive sponsorship from the CFO and a cross-functional team. That makes a big difference in these projects.\n\nLast question — what's your target timeline? When do you need the first report published?` },
          { role: "user", content: `We're targeting publication in Q3 2027, covering calendar year 2026 data. So we need the Workiva platform configured and data collection processes in place well before that — ideally by Q1 2027 so we have a full quarter to collect and validate data.` },
          { role: "assistant", content: `That's a very achievable timeline. Starting implementation now gives us plenty of runway to get the platform configured, data collection workflows built, and your team trained before the Q1 data collection period.\n\nI have everything I need to put together your estimate. Our team will review this and send you a personalized fee range within 24 hours. You'll hear from us soon!` },
        ],
      },
      "SOX / Internal Controls": {
        industry: "Technology",
        duration: "14–18 weeks",
        fee: "$100,000 – $150,000",
        complexity: "complex",
        notes: "Fast-growing tech company recently IPO'd, building SOX compliance program from scratch on Workiva. 200+ controls across 6 business processes, multiple IT general controls for SaaS environment (AWS, Salesforce, NetSuite). Complex due to first-year SOX, limited internal audit team, aggressive timeline for first 404(b) audit, and need for ITGC coverage across cloud infrastructure.",
        modules: ["Wdesk", "Workiva SOX"],
        transcript: [
          { role: "assistant", content: `Hi there! Welcome to Harbor View Consulting's Workiva scoping tool. I'm here to learn about your needs so we can put together a personalized estimate.\n\nTo get started — what's your company name, and what brings you to us today?` },
          { role: "user", content: `Hey, I'm the VP of Internal Audit at ${companyName}. We're a tech company that IPO'd about 8 months ago and we need to build out our SOX compliance program. We bought Workiva to manage it but we need help getting everything set up.` },
          { role: "assistant", content: `Congratulations on the IPO! Building a SOX program post-IPO is a critical milestone, and Workiva is a great platform for it.\n\nCan you tell me where you are in the process? Have you already identified your in-scope processes and controls, or are you starting from scratch?` },
          { role: "user", content: `We're pretty early. Our external auditors (EY) helped us do a risk assessment and identify the in-scope processes. We've got about 200+ controls identified across 6 major business processes — revenue, procure-to-pay, financial close, payroll, treasury, and IT. But none of it is documented in Workiva yet.` },
          { role: "assistant", content: `200+ controls across 6 processes is a meaningful scope, but it's in line with what we typically see for a company your stage.\n\nTell me about the IT side — what's your technology environment? What ERP, CRM, and infrastructure are we dealing with? IT general controls tend to be a big piece of first-year SOX.` },
          { role: "user", content: `We're a cloud-native company. NetSuite for ERP, Salesforce for CRM, AWS for infrastructure, and we have about 15 other SaaS tools that touch financial data in some way — things like Stripe for billing, Expensify, Brex for corporate cards. Our ITGC scope is going to be significant.` },
          { role: "assistant", content: `That's a complex ITGC environment — 15+ applications with financial data means a lot of access reviews, change management controls, and SOD analysis.\n\nHow large is your internal audit team? And are you planning to do testing in-house, outsource it, or a combination? Also, are you going straight to a 404(b) integrated audit, or doing 404(a) management assessment only first?` },
          { role: "user", content: `My team is small — just me and two senior auditors. We'll do some testing in-house but we'll definitely need to co-source some of the testing. We're going straight to 404(b) — our audit committee and EY are aligned on that. First audit period ends December 31, 2026.` },
          { role: "assistant", content: `Straight to 404(b) with a December year-end — that means you need everything documented, tested, and remediated well before year-end. That's an aggressive but doable timeline.\n\nA couple more questions: Are there any known control deficiencies or material weaknesses that EY flagged during the risk assessment? And does your team have any experience with Workiva specifically?` },
          { role: "user", content: `EY flagged a few areas of concern around segregation of duties in NetSuite and lack of formal change management for our AWS environment. No material weaknesses formally identified yet but those are the risk areas. And no, nobody on my team has used Workiva before — we're coming from a spreadsheet-and-SharePoint approach.` },
          { role: "assistant", content: `Those are very common findings for post-IPO tech companies. We can help you design controls to address the SOD and change management gaps as part of the implementation.\n\nLast question — beyond the core SOX program in Workiva, are you looking at any additional capabilities? Things like continuous monitoring, automated evidence collection, or integration with your GRC tool if you have one?` },
          { role: "user", content: `We don't have a separate GRC tool — we're hoping Workiva can be our single platform for all of this. Automated evidence collection would be huge for us given our small team. And we'd want to set up dashboards so I can report testing status to the audit committee each quarter.` },
          { role: "assistant", content: `Workiva can absolutely serve as your central SOX platform with dashboards and status reporting. Great fit for a lean team.\n\nI have everything I need to put together your estimate. Given the scope — first-year 404(b), 200+ controls, complex ITGC environment, team training, and the December deadline — this is a comprehensive engagement. Our team will review this and send you a personalized fee range within 24 hours. You'll hear from us soon!` },
        ],
      },
      "FP&A / Management Reporting": {
        industry: "Healthcare",
        duration: "8–12 weeks",
        fee: "$45,000 – $70,000",
        complexity: "moderate",
        notes: "Regional healthcare system with 5 hospitals consolidating management reporting onto Workiva. Currently using a patchwork of Excel models and legacy Hyperion reports. Need monthly board deck, departmental P&Ls, and KPI dashboards. Moderate complexity — straightforward reporting needs but multiple data sources (Epic, PeopleSoft, Kronos) and 20+ report consumers across executive leadership.",
        modules: ["Wdesk", "Workiva Reporting"],
        transcript: [
          { role: "assistant", content: `Hi there! Welcome to Harbor View Consulting's Workiva scoping tool. I'm here to learn about your needs so we can put together a personalized estimate.\n\nTo get started — what's your company name, and what brings you to us today?` },
          { role: "user", content: `Hi, I'm the Senior Director of FP&A at ${companyName}. We're a regional healthcare system and we need help implementing Workiva for our management reporting. Right now our reporting is a mess — spreadsheets everywhere, nothing centralized.` },
          { role: "assistant", content: `I hear that a lot — especially in healthcare where there are so many stakeholders needing different cuts of the same data. Workiva is great for centralizing and standardizing management reporting.\n\nCan you tell me more about your organization? How many facilities or entities are in your system, and what does your current reporting look like?` },
          { role: "user", content: `We have 5 hospitals, a physician group, and a corporate entity. Right now each hospital has its own set of Excel reports. The CFO gets a monthly board deck that my team manually assembles from all of these — it takes us about 2 weeks each month. We also produce departmental P&Ls for about 40 cost centers.` },
          { role: "assistant", content: `Two weeks to assemble the board deck — that's a huge amount of time that Workiva can dramatically reduce. And 40 departmental P&Ls is meaningful volume.\n\nWhat systems does the data come from? What's your ERP, and are there other source systems for clinical or operational metrics?` },
          { role: "user", content: `PeopleSoft is our ERP for financials. We use Epic for clinical data — things like patient volumes, case mix index, length of stay. Kronos for labor and staffing metrics. And honestly there are probably 5–6 other departmental spreadsheets that feed into various reports.` },
          { role: "assistant", content: `Three major source systems plus departmental spreadsheets — that's a typical healthcare data landscape. We'd want to set up data connections for at least PeopleSoft and potentially Epic, with a structured process for the manual data inputs.\n\nWho are the primary consumers of these reports? And what's the current approval or review workflow before reports go to the board?` },
          { role: "user", content: `The board gets the monthly deck. Each hospital CEO and CFO gets their facility-specific reports. Department heads get their P&Ls. So maybe 20–25 people total who consume reports. For the board deck, it goes through me, then our system CFO reviews, then the CEO signs off. It's all done via email with track changes right now.` },
          { role: "assistant", content: `Workiva's review workflow will be a huge improvement over the email-and-track-changes approach — built-in review cycles, comments, and sign-offs.\n\nHow large is your FP&A team? And do you have any IT support available for setting up the data integrations?` },
          { role: "user", content: `My team is 6 people — 4 financial analysts, a manager, and me. We have an IT team but they're stretched thin. They could help with initial integration setup but we'd need the consultant to lead it. Oh, and we'd also love to build some KPI dashboards in Workiva if that's possible — things like revenue per adjusted patient day, labor cost trends, that kind of thing.` },
          { role: "assistant", content: `Dashboards are definitely possible in Workiva — and really valuable for healthcare KPI tracking. We'd scope those as part of the engagement.\n\nLast question — what's your timeline? Is there a board meeting or fiscal year milestone you're targeting for go-live?` },
          { role: "user", content: `Our fiscal year starts July 1, so ideally we'd be live for the August board meeting — that would be the first month-end close on the new platform. So we need to be ready by late July 2027.` },
          { role: "assistant", content: `That gives us good runway. An 8–12 week implementation starting in the spring would have you ready well before that July cutover.\n\nI have everything I need to put together your estimate. Our team will review this and send you a personalized fee range within 24 hours. You'll hear from us soon!` },
        ],
      },
    };

    const data = transcripts[primary] ?? transcripts["Workiva Health Check"];

    return {
      transcript: data.transcript,
      payload: {
        services,
        company_name: companyName,
        industry: data.industry,
        project_duration: data.duration,
        fee_range: data.fee,
        complexity_tier: data.complexity,
        complexity_notes: data.notes,
        modules: data.modules,
        templates_to_use: templates,
      },
    };
  }

  async function handleSimulateCompletion() {
    if (!simCompany.trim() || simServices.length === 0) return;
    setSimLoading(true);
    setSimResult(null);

    const { transcript, payload } = buildSimData(simCompany.trim(), simServices);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;
      const res = await fetch("/.netlify/functions/complete-chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          transcript,
          payload,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSimResult({ status: "error", message: data.error ?? `Failed (${res.status})` });
        return;
      }

      await res.json();
      setSimResult({
        status: "success",
        message: `Notification email sent for ${simCompany.trim()}`,
      });
    } catch {
      setSimResult({ status: "error", message: "Network error" });
    } finally {
      setSimLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin / Test Console</h1>
            <p className="text-sm text-gray-400 mt-1">Test and preview the Workiva Scoping Agent</p>
          </div>
          <button onClick={logout} className="text-xs text-gray-500 hover:text-red-400 border border-gray-700 px-3 py-1.5 rounded-lg transition">
            Log out
          </button>
        </div>

        {/* Getting Started Guide */}
        <div className="bg-gradient-to-br from-hv-navy to-hv-navy/80 rounded-xl p-6 mb-6 border border-hv-blue/20">
          <h2 className="text-base font-bold text-white mb-3">How this system works</h2>
          <p className="text-sm text-white/70 leading-relaxed mb-4">
            The Workiva Scoping Agent qualifies prospects through an AI-powered chat, generates a fee estimate, researches the company, and sends the HVC team a notification email with full details. Here's how to test it:
          </p>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-hv-blue flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <p className="text-sm font-semibold text-white">Try the real prospect flow</p>
                <p className="text-xs text-white/60">Visit the <button onClick={() => navigate("/")} className="text-hv-blue hover:underline">Landing Page</button> and go through the full experience: enter your email, verify with OTP, chat with the AI, and see the confirmation page.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-hv-blue flex items-center justify-center text-xs font-bold">2</span>
              <div>
                <p className="text-sm font-semibold text-white">Quick-launch individual pages</p>
                <p className="text-xs text-white/60">Use the buttons below to jump directly into any page with a test profile. Great for reviewing the Chat UI or Confirmation page without going through OTP each time.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-hv-blue flex items-center justify-center text-xs font-bold">3</span>
              <div>
                <p className="text-sm font-semibold text-white">Test the notification email</p>
                <p className="text-xs text-white/60">Use "Simulate Chat Completion" at the bottom to fire a realistic scoping result for any company. This sends the same notification email the HVC team receives when a real prospect completes the chat.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Session */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Active Session</h2>
          {parsedSession ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-mono text-green-400">{parsedSession.email}</p>
                <p className="text-xs text-gray-500 mt-0.5">Lead ID: {parsedSession.leadId}</p>
              </div>
              <button onClick={clearSession} className="text-xs text-red-400 hover:text-red-300 border border-red-400/30 px-3 py-1.5 rounded-lg transition">
                Clear Session
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active session. Use Quick Launch below or go through the real flow from the Landing Page.</p>
          )}
        </div>

        {/* Test Profile Selector */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Test Profile</h2>
          <p className="text-xs text-gray-500 mb-3">Choose which persona to use when quick-launching pages. This controls what the chat and confirmation pages look like.</p>
          <div className="space-y-2">
            {(Object.entries(TEST_PROFILES) as [ProfileKey, typeof TEST_PROFILES[ProfileKey]][]).map(([key, profile]) => (
              <label key={key} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${selectedProfile === key ? "bg-gray-800 border border-gray-700" : "hover:bg-gray-800/50 border border-transparent"}`}>
                <input
                  type="radio"
                  name="profile"
                  checked={selectedProfile === key}
                  onChange={() => setSelectedProfile(key)}
                  className="accent-hv-blue"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">{profile.label}</span>
                  {key !== "custom" && <span className="text-xs text-gray-500 ml-2 font-mono">{profile.email}</span>}
                  {key === "prospect" && <span className="block text-xs text-gray-600 mt-0.5">Standard prospect chat and confirmation experience</span>}
                  {key === "workiva" && <span className="block text-xs text-gray-600 mt-0.5">Seller-tailored chat prompts and partner confirmation page</span>}
                  {key === "custom" && <span className="block text-xs text-gray-600 mt-0.5">Test with any email domain to see how the system responds</span>}
                </div>
              </label>
            ))}
          </div>
          {selectedProfile === "custom" && (
            <input
              type="email"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              placeholder="Enter test email..."
              className="mt-3 w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-hv-blue/50"
            />
          )}
        </div>

        {/* Quick Launch */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Quick Launch</h2>
          <p className="text-xs text-gray-500 mb-4">Jump directly into any page using the selected test profile above. Skips OTP verification.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <button onClick={() => startSession("/chat")} className="w-full bg-hv-blue hover:bg-hv-blue/90 text-white text-sm font-semibold py-3 px-4 rounded-xl transition">
                Chat Experience
              </button>
              <p className="text-[10px] text-gray-600 mt-1 text-center">AI scoping conversation</p>
            </div>
            <div>
              <button onClick={() => startSession("/confirmation")} className="w-full bg-hv-mint hover:bg-hv-mint/90 text-white text-sm font-semibold py-3 px-4 rounded-xl transition">
                Confirmation Page
              </button>
              <p className="text-[10px] text-gray-600 mt-1 text-center">Post-chat meeting scheduling</p>
            </div>
            <div>
              <button onClick={() => navigate("/")} className="w-full bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold py-3 px-4 rounded-xl transition border border-gray-700">
                Landing Page
              </button>
              <p className="text-[10px] text-gray-600 mt-1 text-center">Email entry + OTP gate</p>
            </div>
            <div>
              <button onClick={() => navigate("/verify")} className="w-full bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold py-3 px-4 rounded-xl transition border border-gray-700">
                Verify OTP Page
              </button>
              <p className="text-[10px] text-gray-600 mt-1 text-center">6-digit code entry</p>
            </div>
          </div>
        </div>

        {/* Workiva Seller Quick Launch */}
        <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-1">Workiva Seller Experience</h2>
          <p className="text-xs text-gray-500 mb-4">Preview what Workiva sellers see. Launches as testuser@workiva.com — this triggers the seller-specific system prompt, tailored quick replies, and the partner confirmation page with Workiva Day CTA.</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => startSession("/chat", "testuser@workiva.com")} className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold py-3 px-4 rounded-xl transition">
              Seller Chat
            </button>
            <button onClick={() => startSession("/confirmation", "testuser@workiva.com")} className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold py-3 px-4 rounded-xl transition">
              Seller Confirmation
            </button>
          </div>
        </div>

        {/* Simulate Chat Completion */}
        <div className="bg-gray-900 border border-amber-500/30 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-1">Simulate Chat Completion</h2>
          <p className="text-xs text-gray-500 mb-2">Test the backend without chatting. Enter a company name and pick a service — this fires the <span className="font-mono text-amber-400/80">complete-chat</span> function with a realistic transcript, just like a real prospect conversation completed.</p>
          <p className="text-xs text-gray-500 mb-4">
            <span className="font-semibold text-gray-400">What happens:</span> The system researches the company via Claude, saves a session to Supabase, and sends the HVC notification email with company research, scoping summary, fee range, and full transcript.
          </p>

          <input
            type="text"
            value={simCompany}
            onChange={(e) => { setSimCompany(e.target.value); setSimResult(null); }}
            placeholder="Company name (e.g. Acme Corp)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 mb-3"
          />

          <p className="text-xs text-gray-500 mb-2">Select service(s):</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {SERVICE_OPTIONS.map((svc) => (
              <button
                key={svc.label}
                onClick={() => toggleService(svc.label)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  simServices.includes(svc.label)
                    ? "bg-amber-500 border-amber-500 text-white"
                    : "border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                }`}
              >
                {svc.label}
              </button>
            ))}
          </div>

          {!adminToken && (
            <p className="text-red-400 text-xs mb-3">No session token — log out and re-authenticate to use protected endpoints.</p>
          )}
          <button
            onClick={() => { void handleSimulateCompletion(); }}
            disabled={simLoading || !simCompany.trim() || simServices.length === 0 || !adminToken}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 text-sm font-semibold py-3 rounded-xl transition"
          >
            {simLoading ? "Running..." : "Fire complete-chat"}
          </button>

          {simResult && (
            <div className={`mt-3 text-xs p-3 rounded-lg ${
              simResult.status === "success"
                ? "bg-green-500/10 border border-green-500/30 text-green-400"
                : "bg-red-500/10 border border-red-500/30 text-red-400"
            }`}>
              {simResult.status === "success" ? "OK — " : "Error — "}{simResult.message}
            </div>
          )}
        </div>

        {/* Direct Links */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Direct Links</h2>
          <p className="text-xs text-gray-500 mb-3">Open any page without changing the current session. Useful if you want to see what happens when you visit a page without being authenticated.</p>
          <div className="flex flex-wrap gap-2">
            {["/", "/verify", "/chat", "/confirmation"].map((path) => (
              <a key={path} href={path} className="text-xs text-gray-400 hover:text-white font-mono bg-gray-800 px-3 py-1.5 rounded-lg transition">
                {path}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
