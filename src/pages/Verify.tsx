import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface LocationState {
  email: string;
}

export default function Verify() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = (location.state as LocationState) ?? {};

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) navigate("/");
  }, [email, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  function handleDigitChange(index: number, value: string) {
    // Allow pasting full code
    if (value.length === 6 && /^\d{6}$/.test(value)) {
      const next = value.split("");
      setDigits(next);
      inputs.current[5]?.focus();
      void submitCode(next.join(""));
      return;
    }

    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 5) inputs.current[index + 1]?.focus();

    if (next.every((d) => d !== "")) {
      void submitCode(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function submitCode(code: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json() as { leadId?: string; email?: string; sessionToken?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Invalid code. Please try again.");
        setDigits(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
        return;
      }
      sessionStorage.setItem("hv_lead", JSON.stringify({ leadId: data.leadId, email: data.email, sessionToken: data.sessionToken }));
      navigate("/chat");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");
    try {
      await fetch("/.netlify/functions/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendCooldown(30);
      setDigits(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-hv-white flex flex-col">
      <header className="px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <span className="text-hv-navy font-bold text-lg tracking-wide">Harbor View Consulting</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-hv-navy text-center mb-3">
            Check your email
          </h1>
          <p className="text-hv-slate text-center mb-8">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-hv-navy">{email}</span>
          </p>

          <div className="bg-white rounded-2xl shadow-sm border border-hv-border p-8">
            {/* Digit inputs */}
            <div className="flex gap-3 justify-center mb-4">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  autoFocus={i === 0}
                  disabled={loading}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold text-hv-navy border border-hv-border rounded-xl focus:outline-none focus:ring-2 focus:ring-hv-blue/50 focus:border-hv-blue transition disabled:opacity-50"
                />
              ))}
            </div>

            {loading && (
              <p className="text-center text-hv-slate text-sm mb-2">Verifying…</p>
            )}

            {error && (
              <p className="text-center text-hv-coral text-sm mb-2">{error}</p>
            )}

            <p className="text-center text-xs text-hv-slate mt-4">
              Didn't receive it?{" "}
              <button
                onClick={() => { void handleResend(); }}
                disabled={resending || resendCooldown > 0}
                className="text-hv-blue hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resending ? "Sending…" : "Resend code"}
              </button>
            </p>
          </div>

          <p className="text-center text-xs text-hv-slate mt-4">
            <button onClick={() => navigate("/")} className="text-hv-blue hover:underline">
              ← Use a different email
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
