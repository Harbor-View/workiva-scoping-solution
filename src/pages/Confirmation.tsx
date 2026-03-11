import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Shield } from "lucide-react";

const HUBSPOT_MEETING_URL = import.meta.env.VITE_HUBSPOT_MEETING_URL as string;

export default function Confirmation() {
  const navigate = useNavigate();
  const hubspotRef = useRef<HTMLDivElement>(null);

  // Auth guard
  useEffect(() => {
    const lead = sessionStorage.getItem("hv_lead");
    if (!lead) navigate("/");
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

              <h1 className="text-2xl font-bold text-hv-navy mb-2">You're all set</h1>
              <p className="text-hv-slate mb-6">
                Thanks for walking us through your Workiva needs. Our team will review
                your responses and send a personalized estimate to your inbox.
              </p>

              <div className="inline-flex items-center gap-2 bg-hv-blue/8 text-hv-blue font-semibold text-sm px-5 py-2.5 rounded-full">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
                <div className="space-y-3">
                  <a href="mailto:mmolloy@harborview-consulting.com" className="flex items-center gap-3 group">
                    <img src="/team-mike-molloy.png" alt="Mike Molloy" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                    <div>
                      <span className="text-sm font-semibold text-hv-navy group-hover:text-hv-blue transition block leading-tight">Mike Molloy</span>
                      <span className="text-[11px] text-hv-slate group-hover:text-hv-blue transition">mmolloy@harborview-consulting.com</span>
                    </div>
                  </a>
                  <a href="mailto:kcollingsworth@harborview-consulting.com" className="flex items-center gap-3 group">
                    <img src="/team-kevin-collingsworth.png" alt="Kevin Collingsworth" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                    <div>
                      <span className="text-sm font-semibold text-hv-navy group-hover:text-hv-blue transition block leading-tight">Kevin Collingsworth</span>
                      <span className="text-[11px] text-hv-slate group-hover:text-hv-blue transition">kcollingsworth@harborview-consulting.com</span>
                    </div>
                  </a>
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
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
