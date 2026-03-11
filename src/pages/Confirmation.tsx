import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Shield } from "lucide-react";

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

      <main className="flex-1 px-4 py-8">
        <div className="max-w-6xl mx-auto flex gap-8">

          {/* Left Column — Main Content */}
          <div className="flex-1 min-w-0">
            {/* Success card */}
            <div className="bg-white rounded-2xl shadow-sm border border-hv-border p-8 mb-8 text-center">
              <div className="w-14 h-14 rounded-full bg-hv-mint/15 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-hv-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-hv-navy mb-2">
                {isWorkivaSeller ? "Thanks — we're on it" : "You're all set"}
              </h1>
              <p className="text-hv-slate mb-6">
                {isWorkivaSeller
                  ? "We've got your scoping details. Our team will review the opportunity and prepare a client-ready proposal you can share directly with your customer."
                  : "Thanks for walking us through your Workiva needs. Our team will review your responses and send a personalized estimate to your inbox."}
              </p>

              <div className="inline-flex items-center gap-2 bg-hv-blue/8 text-hv-blue font-semibold text-sm px-5 py-2.5 rounded-full">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isWorkivaSeller ? "Client-facing proposal within 24 hours" : "Your estimate will arrive within 24 hours"}
              </div>

              {!isWorkivaSeller && (
                <p className="text-xs text-hv-slate mt-4">
                  Your estimate will arrive before any meeting you book below.
                </p>
              )}
              {isWorkivaSeller && (
                <p className="text-xs text-hv-slate mt-4">
                  We'll send you the proposal link and password so you can review it before sharing with your customer.
                </p>
              )}
            </div>

            {/* Book a call */}
            <div className="bg-white rounded-2xl shadow-sm border border-hv-border p-8 mb-8">
              <h2 className="text-lg font-bold text-hv-navy mb-1">
                {isWorkivaSeller ? "Let's align on the opportunity" : "Book a call while you wait"}
              </h2>
              <p className="text-sm text-hv-slate mb-6">
                {isWorkivaSeller
                  ? "Book a quick call so we can discuss deal strategy, refine the proposal, and plan the customer presentation together."
                  : "Optional — but a great way to ask questions and align on next steps. Your estimate will be in your inbox before the meeting."}
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
                <h3 className="text-sm font-bold text-hv-navy mb-3">
                  {isWorkivaSeller ? "Your Partner Contacts" : "Your Harbor View Contacts"}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <img src="/team-mike-molloy.png" alt="Mike Molloy" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-hv-navy block leading-tight">Mike Molloy</span>
                      <a href="mailto:mmolloy@harborview-consulting.com" className="text-[11px] text-hv-slate hover:text-hv-blue transition block">mmolloy@harborview-consulting.com</a>
                      <a href="tel:+14439092727" className="text-[11px] text-hv-slate hover:text-hv-blue transition block">(443) 909-2727</a>
                      <a href="https://www.linkedin.com/in/mikemolloy1/" target="_blank" rel="noopener noreferrer" className="text-[11px] text-hv-blue hover:text-hv-blue/70 transition">LinkedIn</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <img src="/team-kevin-collingsworth.png" alt="Kevin Collingsworth" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-hv-navy block leading-tight">Kevin Collingsworth</span>
                      <a href="mailto:kcollingsworth@harborview-consulting.com" className="text-[11px] text-hv-slate hover:text-hv-blue transition block">kcollingsworth@harborview-consulting.com</a>
                      <a href="tel:+14439092702" className="text-[11px] text-hv-slate hover:text-hv-blue transition block">(443) 909-2702</a>
                      <a href="https://www.linkedin.com/in/kevincollingsworth/" target="_blank" rel="noopener noreferrer" className="text-[11px] text-hv-blue hover:text-hv-blue/70 transition">LinkedIn</a>
                    </div>
                  </div>
                </div>
              </div>

              {isWorkivaSeller ? (
                <>
                  {/* Workiva Day — Seller CTA */}
                  <div className="bg-white rounded-2xl shadow-sm border border-hv-border p-6">
                    <div className="w-11 h-11 rounded-full bg-hv-yellow/20 flex items-center justify-center mb-4">
                      <GraduationCap className="w-5.5 h-5.5 text-hv-yellow" />
                    </div>

                    <h3 className="text-base font-bold text-hv-navy mb-2">
                      Host a "Workiva Day" with Your Client
                    </h3>
                    <p className="text-sm text-hv-slate leading-relaxed mb-4">
                      We'll help you get onsite with your customers by offering free CPE-accredited training as part of a "Workiva Day." It's a great way to deepen the relationship, showcase platform value, and drive expansion — all while your client earns continuing education credits.
                    </p>

                    <a
                      href="mailto:mmolloy@harborview-consulting.com?subject=Workiva%20Day%20—%20Let's%20Plan%20One"
                      className="block w-full text-center bg-hv-blue hover:bg-hv-blue/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                    >
                      Let's Plan a Workiva Day
                    </a>
                  </div>

                  {/* Partner with HVC */}
                  <div className="bg-gradient-to-br from-hv-navy to-hv-navy/90 rounded-2xl p-6 text-white">
                    <h3 className="text-base font-bold mb-2">Partner with Harbor View</h3>
                    <p className="text-sm text-white/70 leading-relaxed mb-4">
                      Learn more about how we work with Workiva teams — from implementation scoping to customer success and expansion plays.
                    </p>
                    <a
                      href="https://implementworkiva.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white text-hv-navy text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/90 transition"
                    >
                      Visit implementworkiva.com
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Follow on LinkedIn */}
                  <div className="bg-white rounded-2xl shadow-sm border border-hv-border p-6 text-center">
                    <p className="text-sm font-semibold text-hv-navy mb-3">Stay connected</p>
                    <a
                      href="https://www.linkedin.com/company/harbor-view-consulting/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A66C2] hover:text-[#004182] transition"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      Follow Harbor View on LinkedIn
                    </a>
                  </div>
                </>
              ) : (
                <>
                  {/* CPE Training Ad — Prospect */}
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

                  {/* Explore Services — Prospect */}
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
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </>
              )}

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
