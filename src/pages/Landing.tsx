import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { isCorporateEmail } from "@/lib/blocked-domains";
import {
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
  Phone,
  Mail,
  MapPin,
  BarChart3,
  Database,
  Shield,
  Leaf,
  type LucideIcon,
} from "lucide-react";

const SERVICES: { title: string; description: string; icon: LucideIcon; accent: string }[] = [
  {
    title: "Financial Reporting",
    description: "Streamline your financial reporting process with automated workflows, linked data, and audit-ready controls.",
    icon: FileText,
    accent: "from-hv-blue to-[#065a9e]",
  },
  {
    title: "Management Reporting",
    description: "Create dynamic management reports with real-time data integration across your organization.",
    icon: BarChart3,
    accent: "from-hv-mint to-[#2a9474]",
  },
  {
    title: "Connectivity (Wdata)",
    description: "Seamless data integration and transformation using Workiva's Wdata platform.",
    icon: Database,
    accent: "from-[#8b5cf6] to-[#6d28d9]",
  },
  {
    title: "SOX / Internal Controls",
    description: "Governance, Risk, and Compliance management — structured around Workiva's GRC framework.",
    icon: Shield,
    accent: "from-hv-yellow to-[#d4a03c]",
  },
  {
    title: "Sustainability",
    description: "Environmental, Social, and Governance reporting built on Workiva's purpose-built sustainability platform.",
    icon: Leaf,
    accent: "from-hv-mint to-[#2a9474]",
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
    title: "Answer a few questions",
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

  return (
    <div className="min-h-screen bg-hv-white font-sans">

      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 z-20 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <img src="/hvc-logo.png" alt="Harbor View Consulting" className="h-12 w-auto" />
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
              Skip the weeks of back-and-forth. Answer a few targeted questions and receive
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
      <section className="relative bg-hv-white py-24 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_#079FE008_0%,_transparent_50%),_radial-gradient(circle_at_80%_20%,_#3AB79508_0%,_transparent_50%)]" />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-hv-blue text-sm font-semibold uppercase tracking-widest mb-3 block">What we deliver</span>
            <h2 className="text-4xl font-bold text-hv-navy mb-4">Workiva Services</h2>
            <p className="text-hv-slate max-w-lg mx-auto text-lg">
              We scope and deliver across the full Workiva platform.
            </p>
          </div>
          {/* Top row — 3 cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {SERVICES.slice(0, 3).map((service) => (
              <div
                key={service.title}
                className="relative rounded-2xl bg-white border border-hv-border hover:shadow-xl transition-all duration-300 group overflow-hidden"
              >
                {/* Top gradient bar */}
                <div className={`h-1.5 bg-gradient-to-r ${service.accent}`} />
                <div className="p-7">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${service.accent} flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-hv-navy mb-2">{service.title}</h3>
                  <p className="text-hv-slate text-sm leading-relaxed">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Bottom row — 2 cards, centered */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {SERVICES.slice(3).map((service) => (
              <div
                key={service.title}
                className="relative rounded-2xl bg-white border border-hv-border hover:shadow-xl transition-all duration-300 group overflow-hidden"
              >
                <div className={`h-1.5 bg-gradient-to-r ${service.accent}`} />
                <div className="p-7">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${service.accent} flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-hv-navy mb-2">{service.title}</h3>
                  <p className="text-hv-slate text-sm leading-relaxed">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <a
              href="https://www.harborview-consulting.com/services/workiva"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-hv-blue font-semibold hover:underline"
            >
              View all Workiva services on harborview-consulting.com <ArrowRight className="w-4 h-4" />
            </a>
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
      <section ref={ctaRef} className="relative bg-hv-navy py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-hv-navy via-hv-navy to-[#0a4a7a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#079FE020_0%,_transparent_60%)]" />
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 bg-hv-blue/20 border border-hv-blue/30 text-hv-blue text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-hv-blue animate-pulse" />
            No commitment required
          </div>
          <h2 className="text-4xl font-black text-white mb-4">
            Ready to get your estimate?
          </h2>
          <p className="text-xl text-white/80 mb-10 leading-relaxed">
            Enter your work email to start. Answer a few questions and receive
            a personalized fee range within 24 hours.
          </p>
          <EmailForm size="default" />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-hv-navy text-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center mb-8">
            <img src="/hvc-logo.png" alt="Harbor View Consulting" className="h-12 mb-4" />
          </div>
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <div className="space-y-3 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>443-909-2700</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>workiva@harborview-consulting.com</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>400 East Pratt Street<br />Baltimore, MD 21202</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold mb-4">Learn More About Us</h3>
              <a
                href="https://www.harborview-consulting.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-hv-navy font-semibold px-6 py-2.5 rounded-lg hover:bg-white/90 transition text-sm"
              >
                Visit Our Website
              </a>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 text-center text-sm text-white/60 space-y-3">
            <div className="flex items-center justify-center gap-4">
              <span>© {new Date().getFullYear()} Harbor View Consulting. All rights reserved.</span>
              <span className="text-white/30">•</span>
              <a href="https://www.harborview-consulting.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Privacy Policy</a>
            </div>
            <p className="text-white/50 text-xs max-w-2xl mx-auto">
              This site is owned and maintained by Harbor View Consulting, a registered Workiva implementation partner. This site is not affiliated with or endorsed by Workiva Inc.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
