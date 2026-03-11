import { useNavigate } from "react-router-dom";
import { useState } from "react";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined;

const TEST_PROFILES = {
  prospect: { email: "testuser@acmecorp.com", label: "Prospect (acmecorp.com)" },
  workiva: { email: "testuser@workiva.com", label: "Workiva Seller" },
  custom: { email: "", label: "Custom Email" },
} as const;

type ProfileKey = keyof typeof TEST_PROFILES;

export default function Admin() {
  const navigate = useNavigate();
  const [selectedProfile, setSelectedProfile] = useState<ProfileKey>("prospect");
  const [customEmail, setCustomEmail] = useState("");
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("hv_admin") === "1");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const currentSession = sessionStorage.getItem("hv_lead");
  const parsedSession = currentSession ? JSON.parse(currentSession) : null;

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
      setError("Invalid password");
      return;
    }
    sessionStorage.setItem("hv_admin", "1");
    setAuthed(true);
    setError("");
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <h1 className="text-white text-xl font-bold mb-1">Admin Access</h1>
          <p className="text-gray-500 text-sm mb-6">Enter the admin password to continue.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Password"
            autoFocus
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-hv-blue/50 mb-3"
          />
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
          <button type="submit" className="w-full bg-hv-blue hover:bg-hv-blue/90 text-white text-sm font-semibold py-3 rounded-xl transition">
            Unlock
          </button>
        </form>
      </div>
    );
  }

  function startSession(targetPage: string) {
    const email = selectedProfile === "custom" ? customEmail : TEST_PROFILES[selectedProfile].email;
    if (!email) return;

    sessionStorage.setItem(
      "hv_lead",
      JSON.stringify({ leadId: `test-${Date.now()}`, email })
    );
    navigate(targetPage);
  }

  function clearSession() {
    sessionStorage.removeItem("hv_lead");
    sessionStorage.removeItem("hv_proposal_slug");
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Admin / Test Console</h1>
            <p className="text-sm text-gray-400 mt-1">Quickly jump into different page experiences</p>
          </div>
          <span className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full font-semibold">DEV ONLY</span>
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
