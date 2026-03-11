import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { isCorporateEmail } from "@/lib/blocked-domains";
import {
  CheckCircle,
  Clock,
  Bot,
  Users,
  FileCheck,
  Calendar,
  Award,
  Presentation,
  GraduationCap,
  ArrowRight,
  MessageSquare,
  FileText,
  Send,
} from "lucide-react";

const SERVICES = [
  {
    title: "Financial Reporting",
    description: "Streamline your financial reporting process with automated workflows, linked data, and audit-ready controls.",
    available: true,
  },
  {
    title: "Management Reporting",
    description: "Create dynamic management reports with real-time data integration across your organization.",
    available: true,
  },
  {
    title: "Connectivity (Wdata)",
    description: "Seamless data integration and transformation using Workiva's Wdata platform.",
    available: true,
  },
  {
    title: "SOX / Internal Controls",
    description: "Governance, Risk, and Compliance management — structured around Workiva's GRC framework.",
    available: true,
  },
  {
    title: "ESG Reporting",
    description: "Environmental, Social, and Governance reporting built on Workiva's purpose-built ESG platform.",
    available: true,
  },
];

const CREDENTIALS = [
  {
    icon: Users,
    title: "Expert Implementation Team",
    description: "Our team has successfully performed dozens of Workiva implementations across financial services, healthcare, manufacturing, and more.",
  },
  {
    icon: Award,
    title: "Client Advisory Experience",
    description: "Hundreds of advisory engagements providing strategic guidance on Workiva implementation and optimization.",
  },
  {
    icon: Presentation,
    title: "Conference Expertise",
    description: "Harbor View leadership has presented as industry experts at multiple Workiva conferences and events.",
  },
  {
    icon: GraduationCap,
    title: "Certified Professionals",
    description: "Our delivery team is fully certified in Workiva solutions, ensuring top-quality implementations.",
  },
];

const HOW_IT_WORKS = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Answer smart questions",
    description: "Our AI chat asks 8–12 targeted questions about your Workiva needs, current setup, and goals. Takes about 5 minutes.",
  },
  {
    icon: FileText,
    step: "02",
    title: "We review and price",
    description: "Harbor View reviews your responses and prepares a personalized fee range with rationale. Delivered within 24 hours.",
  },
  {
    icon: Send,
    step: "03",
    title: "Receive your estimate",
    description: "You get a clear, itemized estimate in your inbox — before you ever need to sit down with our team.",
  },
];

function EmailForm({ size = "default" }: { size?: "default" | "large" }) {
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

  const inputClass = size === "large"
    ? "flex-1 px-5 py-4 rounded-xl border border-hv-border text-hv-navy placeholder:text-hv-border focus:outline-none focus:ring-2 focus:ring-hv-blue/50 focus:border-hv-blue transition text-base"
    : "flex-1 px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 transition text-sm";

  const btnClass = size === "large"
    ? "bg-hv-blue hover:bg-hv-blue/90 disabled:opacity-50 text-white font-semibold px-6 py-4 rounded-xl transition shadow-sm whitespace-nowrap"
    : "bg-hv-yellow hover:bg-hv-yellow/90 disabled:opacity-50 text-hv-navy font-semibold px-6 py-3 rounded-xl transition shadow-sm whitespace-nowrap";

  return (
    <form onSubmit={(e) => { void handleSubmit(e); }} className="w-full">
      <div className="flex gap-3 flex-col sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className={inputClass}
        />
        <button type="submit" disabled={loading || !email} className={btnClass}>
          {loading ? "Sending…" : <span className="flex items-center gap-2">Get my estimate <ArrowRight className="w-4 h-4" /></span>}
        </button>
      </div>
      {error && <p className="text-hv-coral text-sm mt-2">{error}</p>}
      <p className={`text-xs mt-2 ${size === "large" ? "text-hv-slate" : "text-white/50"}`}>
        Work email required · Takes ~5 minutes · Estimate within 24 hours
      </p>
    </form>
  );
}

export default function Landing() {
  const ctaRef = useRef<HTMLDivElement>(null);

  function scrollToCTA() {
    ctaRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-hv-white font-sans">

      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 z-20 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-white font-bold text-lg tracking-wide">Harbor View Consulting</span>
          <a
            href="https://www.harborview-consulting.com"
            className="text-white/70 hover:text-white text-sm transition"
          >
            Main site →
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-hv-navy min-h-[85vh] flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-hv-navy via-hv-navy to-[#0a4a7a] opacity-100" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#079FE020_0%,_transparent_60%)]" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-32">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-hv-blue/20 border border-hv-blue/30 text-hv-blue text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-hv-blue animate-pulse" />
              Registered Workiva Implementation Partner
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6">
              Get your Workiva estimate{" "}
              <span className="text-hv-blue">in 24 hours</span>
            </h1>

            <p className="text-xl text-white/80 mb-10 leading-relaxed">
              Skip the weeks of back-and-forth. Answer a few smart questions and receive
              a personalized, expert-reviewed fee range — before your first meeting
              with our team.
            </p>

            <EmailForm size="default" />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-px h-12 bg-gradient-to-b from-white/30 to-transparent mx-auto" />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-hv-navy mb-3">How it works</h2>
            <p className="text-hv-slate max-w-xl mx-auto">
              A faster, lower-friction path to a credible implementation estimate.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="relative p-8 rounded-2xl bg-hv-white border border-hv-border">
                <div className="text-5xl font-black text-hv-blue/10 absolute top-6 right-6 leading-none select-none">
                  {step.step}
                </div>
                <div className="w-12 h-12 rounded-xl bg-hv-blue/10 flex items-center justify-center mb-5">
                  <step.icon className="w-6 h-6 text-hv-blue" />
                </div>
                <h3 className="text-lg font-bold text-hv-navy mb-2">{step.title}</h3>
                <p className="text-hv-slate text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-hv-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-hv-navy mb-3">Implementation services</h2>
            <p className="text-hv-slate max-w-xl mx-auto">
              We scope and deliver across the full Workiva platform. Click any service to start your estimate.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service) => (
              <button
                key={service.title}
                onClick={scrollToCTA}
                className="text-left p-6 rounded-2xl bg-white border border-hv-border hover:border-hv-blue hover:shadow-md transition-all duration-200 group"
              >
                <CheckCircle className="w-8 h-8 text-hv-blue mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-hv-navy mb-2">{service.title}</h3>
                <p className="text-hv-slate text-sm leading-relaxed">{service.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-hv-navy py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Fast-track your scoping</h2>
            <p className="text-white/70 max-w-xl mx-auto">
              The traditional process takes weeks. Ours takes 24 hours.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-white/10">
            <div className="grid grid-cols-3 bg-white/5 text-white/60 text-sm font-semibold uppercase tracking-wider">
              <div className="px-6 py-4">Step</div>
              <div className="px-6 py-4 border-l border-white/10">Traditional approach</div>
              <div className="px-6 py-4 border-l border-white/10 text-hv-blue">Harbor View</div>
            </div>
            {[
              {
                step: "Initial contact",
                traditional: { icon: Users, text: "30-min intro meeting with client, Workiva, and partner" },
                hv: { icon: Bot, text: "Immediate AI chat on this page" },
              },
              {
                step: "Scoping process",
                traditional: { icon: Clock, text: "Up to 3 one-hour scoping meetings" },
                hv: { icon: Bot, text: "Expert-designed questionnaire with targeted follow-ups" },
              },
              {
                step: "Proposal review",
                traditional: { icon: FileCheck, text: "1-hour proposal review meeting" },
                hv: { icon: Calendar, text: "30-minute meeting — schedule at your convenience" },
              },
              {
                step: "Total timeline",
                traditional: { icon: Clock, text: "3–4 weeks" },
                hv: { icon: Clock, text: "24 hours" },
              },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 border-t border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition">
                <div className="px-6 py-5 text-white font-medium">{row.step}</div>
                <div className="px-6 py-5 border-l border-white/10">
                  <div className="flex items-start gap-3 text-white/50 text-sm">
                    <row.traditional.icon className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{row.traditional.text}</span>
                  </div>
                </div>
                <div className="px-6 py-5 border-l border-white/10">
                  <div className="flex items-start gap-3 text-hv-blue text-sm font-medium">
                    <row.hv.icon className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{row.hv.text}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-hv-navy mb-3">Why Harbor View</h2>
            <p className="text-hv-slate max-w-xl mx-auto">
              A boutique firm with deep Workiva expertise and a track record of successful implementations.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CREDENTIALS.map((cred) => (
              <div key={cred.title} className="p-6 rounded-2xl bg-hv-white border border-hv-border text-center">
                <div className="w-12 h-12 rounded-xl bg-hv-blue/10 flex items-center justify-center mx-auto mb-4">
                  <cred.icon className="w-6 h-6 text-hv-blue" />
                </div>
                <h3 className="text-base font-bold text-hv-navy mb-2">{cred.title}</h3>
                <p className="text-hv-slate text-sm leading-relaxed">{cred.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section ref={ctaRef} className="bg-hv-blue py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to get your estimate?</h2>
          <p className="text-white/80 mb-8">
            Enter your work email to start. Our AI will ask a few questions, and
            your personalized estimate will arrive within 24 hours.
          </p>
          <EmailForm size="large" />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-hv-navy py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-white/40 text-sm">
          <span>© {new Date().getFullYear()} Harbor View Consulting. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="https://www.harborview-consulting.com" className="hover:text-white/70 transition">harborview-consulting.com</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
