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
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("hv_admin") === "1");
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Admin state
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
      sessionStorage.setItem("hv_admin", "1");
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
      JSON.stringify({ leadId: `test-${Date.now()}`, email: em })
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

  async function handleSimulateCompletion() {
    if (!simCompany.trim() || simServices.length === 0) return;
    setSimLoading(true);
    setSimResult(null);

    const companyName = simCompany.trim();
    const templates = simServices.map(
      (s) => SERVICE_OPTIONS.find((o) => o.label === s)!.template
    );

    const payload = {
      services: simServices,
      company_name: companyName,
      industry: "Unknown (admin test)",
      project_duration: "TBD",
      fee_range: "TBD — admin simulation",
      complexity_tier: "medium",
      complexity_notes: "Simulated from admin console for testing purposes.",
      modules: [],
      templates_to_use: templates,
    };

    const transcript = [
      { role: "user" as const, content: `[Admin simulation] Company: ${companyName}, Services: ${simServices.join(", ")}` },
      { role: "assistant" as const, content: "This is a simulated chat completion triggered from the admin console." },
    ];

    try {
      const res = await fetch("/.netlify/functions/complete-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: `admin-test-${Date.now()}`,
          transcript,
          payload,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSimResult({ status: "error", message: data.error ?? `Failed (${res.status})` });
        return;
      }

      const data = await res.json() as { proposalSlug: string; proposalPassword: string };
      setSimResult({
        status: "success",
        message: `Slug: ${data.proposalSlug} · Password: ${data.proposalPassword}`,
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Admin / Test Console</h1>
            <p className="text-sm text-gray-400 mt-1">Quickly jump into different page experiences</p>
          </div>
          <button onClick={logout} className="text-xs text-gray-500 hover:text-red-400 border border-gray-700 px-3 py-1.5 rounded-lg transition">
            Log out
          </button>
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
            <p className="text-sm text-gray-500">No active session</p>
          )}
        </div>

        {/* Test Profile Selector */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Test Profile</h2>
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
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Launch</h2>
          <p className="text-xs text-gray-500 mb-4">Sets session with selected profile and navigates to the page.</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => startSession("/chat")} className="bg-hv-blue hover:bg-hv-blue/90 text-white text-sm font-semibold py-3 px-4 rounded-xl transition">
              Chat Experience
            </button>
            <button onClick={() => startSession("/confirmation")} className="bg-hv-mint hover:bg-hv-mint/90 text-white text-sm font-semibold py-3 px-4 rounded-xl transition">
              Confirmation Page
            </button>
            <button onClick={() => navigate("/")} className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold py-3 px-4 rounded-xl transition border border-gray-700">
              Landing Page
            </button>
            <button onClick={() => navigate("/verify")} className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold py-3 px-4 rounded-xl transition border border-gray-700">
              Verify OTP Page
            </button>
          </div>
        </div>

        {/* Workiva Seller Quick Launch */}
        <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">Workiva Seller Experience</h2>
          <p className="text-xs text-gray-500 mb-4">Launches as testuser@workiva.com regardless of profile selection.</p>
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
          <p className="text-xs text-gray-500 mb-4">Calls complete-chat as if a scoping chat just finished. Triggers company research, notification email, and transcript PDF.</p>

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

          <button
            onClick={() => { void handleSimulateCompletion(); }}
            disabled={simLoading || !simCompany.trim() || simServices.length === 0}
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
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Direct Links (No Session Change)</h2>
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
