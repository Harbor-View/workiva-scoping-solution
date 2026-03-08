import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isCorporateEmail } from "@/lib/blocked-domains";

export default function Landing() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isCorporateEmail(email)) {
      setError("Please use a corporate email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      navigate("/verify", { state: { email } });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-hv-white flex flex-col">
      {/* Header */}
      <header className="px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <span className="text-hv-navy font-bold text-lg tracking-wide">Harbor View Consulting</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 bg-hv-blue/10 text-hv-blue text-sm font-semibold px-4 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-hv-blue inline-block" />
              Workiva Implementation Scoping
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-hv-navy text-center mb-3">
            Get your implementation estimate
          </h1>
          <p className="text-hv-slate text-center mb-8">
            Answer a few questions and receive a personalized fee range within 24&nbsp;hours —
            before your first meeting with our team.
          </p>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-hv-border p-8">
            <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-hv-navy mb-1.5">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 rounded-xl border border-hv-border text-hv-navy placeholder:text-hv-border focus:outline-none focus:ring-2 focus:ring-hv-blue/50 focus:border-hv-blue transition"
                />
              </div>

              {error && (
                <p className="text-hv-coral text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-hv-blue hover:bg-hv-blue/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition shadow-sm"
              >
                {loading ? "Sending code…" : "Continue"}
              </button>
            </form>

            <p className="text-xs text-hv-slate text-center mt-4">
              We'll send a 6-digit code to verify your email.
            </p>
          </div>

          {/* Trust line */}
          <p className="text-center text-xs text-hv-slate mt-6">
            Already working with Harbor View?{" "}
            <a href="https://www.harborview-consulting.com/contact" className="text-hv-blue hover:underline">
              Contact us directly
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
