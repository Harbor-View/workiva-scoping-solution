import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Shield, Phone, Mail, Linkedin, ExternalLink, Clock, CheckCircle2, Handshake, Users } from "lucide-react";

const HUBSPOT_MEETING_URL = import.meta.env.VITE_HUBSPOT_MEETING_URL as string;

export default function Confirmation() {
  const navigate = useNavigate();
  const hubspotRef = useRef<HTMLDivElement>(null);
  const [isWorkivaSeller, setIsWorkivaSeller] = useState(false);

  // Auth guard
  useEffect(() => {
    const lead = sessionStorage.getItem("hv_lead");
    if (!lead) { navigate("/"); return; }
    const parsed = JSON.parse(lead) as { email?: string };
    setIsWorkivaSeller(parsed.email?.endsWith("@workiva.com") ?? false);
  }, [navigate]);

  // Load HubSpot meeting embed script
  useEffect(() => {
    if (!hubspotRef.current || !HUBSPOT_MEETING_URL) return;

    const script = document.createElement("script");
    script.src = "https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-hv-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-hv-border px-8 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/hvc-icon.png" alt="Harbor View Consulting" className="w-8 h-8 rounded" />
            <div>
              <span className="text-hv-navy font-bold tracking-wide block leading-tight">Harbor View Consulting</span>
              <span className="text-[11px] text-hv-slate">Workiva Implementation Partner</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-hv-mint">
            <Shield className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">Registered Workiva Partner</span>
          </div>
        </div>
      </header>

      {isWorkivaSeller ? (
        /* ─── WORKIVA SELLER LAYOUT ─── */
        <main className="flex-1 px-4 py-8">
          <div className="max-w-5xl mx-auto">

            {/* Hero success banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-hv-navy via-hv-navy to-hv-blue/80 rounded-2xl p-8 md:p-10 mb-8 text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-hv-mint/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-hv-mint" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Thanks — we're on it</h1>
                    <p className="text-white/60 text-sm mt-0.5">Scoping request received</p>
                  </div>
                </div>
                <p className="text-white/80 leading-relaxed max-w-2xl mb-6">
                  We've got your scoping details. Our team will review the opportunity and prepare a client-ready proposal you can share directly with your customer.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
                    <Clock className="w-4 h-4 text-hv-mint" />
                    Client-facing proposal within 24 hours
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
                    <Mail className="w-4 h-4 text-hv-mint" />
                    Proposal link + password sent to you
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-8">
              {/* Left: Meeting + What's Next */}
              <div className="flex-1 min-w-0">

                {/* What happens next */}
                <div className="bg-white rounded-2xl shadow-sm border border-hv-border p-6 mb-8">
                  <h2 className="text-base font-bold text-hv-navy mb-4 flex items-center gap-2">
                    <Handshake className="w-5 h-5 text-hv-blue" />
                    What happens next
                  </h2>
                  <div className="space-y-4">
                    {[
                      { step: "1", title: "We review your scoping details", desc: "Our team analyzes the opportunity, customer context, and Workiva modules involved." },
                      { step: "2", title: "Client-ready proposal prepared", desc: "You'll receive a proposal link and password within 24 hours — branded and addressed to your customer." },
                      { step: "3", title: "We align with you on strategy", desc: "Book a call below to refine the proposal, discuss pricing, and plan the customer presentation." },
                    ].map((item) => (
                      <div key={item.step} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-hv-blue/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-hv-blue">{item.step}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-hv-navy">{item.title}</p>
                          <p className="text-sm text-hv-slate leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Book a call */}
                <div className="bg-white rounded-2xl shadow-sm border border-hv-border p-6 mb-8">
                  <h2 className="text-base font-bold text-hv-navy mb-1">Let's align on the opportunity</h2>
                  <p className="text-sm text-hv-slate mb-6">
                    Book a quick call so we can discuss deal strategy, refine the proposal, and plan the customer presentation together.
                  </p>

                  {HUBSPOT_MEETING_URL ? (
                    <div
                      ref={hubspotRef}
                      className="meetings-iframe-container"
                      data-src={`${HUBSPOT_MEETING_URL}?embed=true`}
                    />
                  ) : (
                    <div className="bg-hv-white rounded-xl p-6 text-center text-hv-slate text-sm border border-hv-border">
                      Meeting booking coming soon.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="hidden lg:block w-80 shrink-0">
                <div className="sticky top-24 space-y-5">

                  {/* Partner Contacts */}
                  <div className="bg-white rounded-2xl shadow-sm border border-hv-border overflow-hidden">
                    <div className="bg-hv-navy px-5 py-3">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-hv-blue" />
                        Your Partner Contacts
                      </h3>
                    </div>
                    <div className="p-5 space-y-5">
                      {[
                        { name: "Mike Molloy", img: "/team-mike-molloy.png", email: "mmolloy@harborview-consulting.com", phone: "+14439092727", phoneLabel: "(443) 909-2727", linkedin: "https://www.linkedin.com/in/mpmolloy/" },
                        { name: "Kevin Collingsworth", img: "/team-kevin-collingsworth.png", email: "kcollingsworth@harborview-consulting.com", phone: "+14439092702", phoneLabel: "(443) 909-2702", linkedin: "https://www.linkedin.com/in/kevin-collingsworth-b62417102/" },
                      ].map((person) => (
                        <div key={person.name} className="flex items-start gap-3">
                          <img src={person.img} alt={person.name} className="w-12 h-12 rounded-full object-cover border-2 border-hv-border shadow-sm" />
                          <div className="min-w-0">
                            <span className="text-sm font-semibold text-hv-navy block">{person.name}</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Mail className="w-3 h-3 text-hv-slate shrink-0" />
                              <a href={`mailto:${person.email}`} className="text-[11px] text-hv-slate hover:text-hv-blue transition truncate">{person.email}</a>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-hv-slate shrink-0" />
                              <a href={`tel:${person.phone}`} className="text-[11px] text-hv-slate hover:text-hv-blue transition">{person.phoneLabel}</a>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Linkedin className="w-3 h-3 text-[#0A66C2] shrink-0" />
                              <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#0A66C2] hover:text-[#004182] transition">Connect on LinkedIn</a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Workiva Day CTA */}
                  <div className="bg-gradient-to-br from-hv-yellow/10 to-hv-yellow/5 rounded-2xl border border-hv-yellow/20 p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-hv-yellow/20 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-hv-yellow" />
                      </div>
                      <h3 className="text-sm font-bold text-hv-navy leading-tight">
                        Host a "Workiva Day"<br />with Your Client
                      </h3>
                    </div>
                    <p className="text-[13px] text-hv-slate leading-relaxed mb-4">
                      We'll help you get onsite with your customers by offering <strong className="text-hv-navy">free CPE-accredited training</strong> as part of a "Workiva Day." Deepen the relationship, showcase platform value, and drive expansion — all while your client earns continuing education credits.
                    </p>
                    <a
                      href="mailto:mmolloy@harborview-consulting.com?subject=Workiva%20Day%20—%20Let's%20Plan%20One"
                      className="block w-full text-center bg-hv-navy hover:bg-hv-navy/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                    >
                      Let's Plan a Workiva Day
                    </a>
                  </div>

                  {/* Partner with HVC */}
                  <div className="bg-gradient-to-br from-hv-navy to-hv-blue/90 rounded-2xl p-5 text-white">
                    <h3 className="text-sm font-bold mb-2">Partner with Harbor View</h3>
                    <p className="text-[13px] text-white/70 leading-relaxed mb-4">
                      From scoping to customer success and expansion — learn how we support Workiva teams.
                    </p>
                    <a
                      href="https://implementworkiva.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white text-hv-navy text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/90 transition"
                    >
                      implementworkiva.com
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Follow on LinkedIn */}
                  <a
                    href="https://www.linkedin.com/company/harborviewconsulting/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 bg-white rounded-2xl shadow-sm border border-hv-border p-4 text-sm font-semibold text-[#0A66C2] hover:bg-[#0A66C2]/5 transition"
                  >
                    <Linkedin className="w-5 h-5" />
                    Follow Harbor View on LinkedIn
                  </a>

                </div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* ─── PROSPECT LAYOUT ─── */
        <main className="flex-1 px-4 py-8">
          <div className="max-w-6xl mx-auto flex gap-8">

            {/* Left Column — Main Content */}
            <div className="flex-1 min-w-0">
              {/* Success card */}
              <div className="bg-white rounded-2xl shadow-sm border border-hv-border p-8 mb-8 text-center">
                <div className="w-14 h-14 rounded-full bg-hv-mint/15 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-hv-mint" />
                </div>

                <h1 className="text-2xl font-bold text-hv-navy mb-2">You're all set</h1>
                <p className="text-hv-slate mb-6">
                  Thanks for walking us through your Workiva needs. Our team will review
                  your responses and send a personalized estimate to your inbox.
                </p>

                <div className="inline-flex items-center gap-2 bg-hv-blue/8 text-hv-blue font-semibold text-sm px-5 py-2.5 rounded-full">
                  <Clock className="w-4 h-4" />
                  Your estimate will arrive within 24 hours
                </div>

                <p className="text-xs text-hv-slate mt-4">
                  Your estimate will arrive before any meeting you book below.
                </p>
              </div>

              {/* Book a call */}
              <div className="bg-white rounded-2xl shadow-sm border border-hv-border p-8 mb-8">
                <h2 className="text-lg font-bold text-hv-navy mb-1">Book a call while you wait</h2>
                <p className="text-sm text-hv-slate mb-6">
                  Optional — but a great way to ask questions and align on next steps.
                  Your estimate will be in your inbox before the meeting.
                </p>

                {HUBSPOT_MEETING_URL ? (
                  <div
                    ref={hubspotRef}
                    className="meetings-iframe-container"
                    data-src={`${HUBSPOT_MEETING_URL}?embed=true`}
                  />
                ) : (
                  <div className="bg-hv-white rounded-xl p-6 text-center text-hv-slate text-sm border border-hv-border">
                    Meeting booking coming soon.
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="hidden lg:block w-80 shrink-0">
              <div className="sticky top-24 space-y-6">

                {/* Your Contacts */}
                <div className="bg-white rounded-2xl shadow-sm border border-hv-border p-6">
                  <h3 className="text-sm font-bold text-hv-navy mb-3">Your Harbor View Contacts</h3>
                  <div className="space-y-4">
                    {[
                      { name: "Mike Molloy", img: "/team-mike-molloy.png", email: "mmolloy@harborview-consulting.com", phone: "+14439092727", phoneLabel: "(443) 909-2727", linkedin: "https://www.linkedin.com/in/mpmolloy/" },
                      { name: "Kevin Collingsworth", img: "/team-kevin-collingsworth.png", email: "kcollingsworth@harborview-consulting.com", phone: "+14439092702", phoneLabel: "(443) 909-2702", linkedin: "https://www.linkedin.com/in/kevin-collingsworth-b62417102/" },
                    ].map((person) => (
                      <div key={person.name} className="flex items-start gap-3">
                        <img src={person.img} alt={person.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm mt-0.5" />
                        <div>
                          <span className="text-sm font-semibold text-hv-navy block leading-tight">{person.name}</span>
                          <a href={`mailto:${person.email}`} className="text-[11px] text-hv-slate hover:text-hv-blue transition block">{person.email}</a>
                          <a href={`tel:${person.phone}`} className="text-[11px] text-hv-slate hover:text-hv-blue transition block">{person.phoneLabel}</a>
                          <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className="text-[11px] text-hv-blue hover:text-hv-blue/70 transition">LinkedIn</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CPE Training Ad */}
                <div className="bg-white rounded-2xl shadow-sm border border-hv-border p-6">
                  <div className="w-11 h-11 rounded-full bg-hv-yellow/20 flex items-center justify-center mb-4">
                    <GraduationCap className="w-5.5 h-5.5 text-hv-yellow" />
                  </div>

                  <h3 className="text-base font-bold text-hv-navy mb-2">
                    Earn CPE Credits with Harbor View
                  </h3>
                  <p className="text-sm text-hv-slate leading-relaxed mb-4">
                    Keep your team sharp and compliant. Our Workiva-focused CPE training courses help your finance and audit teams build real skills — while earning the continuing education credits they need.
                  </p>

                  <a
                    href="mailto:mmolloy@harborview-consulting.com?subject=CPE%20Training%20Courses%20—%20Tell%20Me%20More"
                    className="block w-full text-center bg-hv-blue hover:bg-hv-blue/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                  >
                    Contact Us to Learn More
                  </a>
                </div>

                {/* Explore Services */}
                <div className="bg-gradient-to-br from-hv-navy to-hv-navy/90 rounded-2xl p-6 text-white">
                  <h3 className="text-base font-bold mb-2">Explore Our Workiva Services</h3>
                  <p className="text-sm text-white/70 leading-relaxed mb-4">
                    From financial reporting to SOX compliance and sustainability — see how Harbor View can help your team get the most out of Workiva.
                  </p>
                  <a
                    href="https://www.harborview-consulting.com/services/workiva"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-hv-navy text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/90 transition"
                  >
                    View Services
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

              </div>
            </div>

          </div>
        </main>
      )}
    </div>
  );
}
