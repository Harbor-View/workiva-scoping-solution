import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, X } from "lucide-react";

const HUBSPOT_MEETING_URL = import.meta.env.VITE_HUBSPOT_MEETING_URL as string;

export default function Confirmation() {
  const navigate = useNavigate();
  const hubspotRef = useRef<HTMLDivElement>(null);
  const [showCpeBanner, setShowCpeBanner] = useState(false);

  // Auth guard
  useEffect(() => {
    const lead = sessionStorage.getItem("hv_lead");
    if (!lead) navigate("/");
  }, [navigate]);

  // Show CPE popup after a short delay
  useEffect(() => {
    const timer = setTimeout(() => setShowCpeBanner(true), 3000);
    return () => clearTimeout(timer);
  }, []);

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
      <header className="px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <span className="text-hv-navy font-bold text-lg tracking-wide">Harbor View Consulting</span>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto">

          {/* Success card */}
          <div className="bg-white rounded-2xl shadow-sm border border-hv-border p-8 mb-8 text-center">
            {/* Check icon */}
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

            {/* 24-hour promise */}
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

          {/* Your Contacts */}
          <div className="bg-white rounded-2xl shadow-sm border border-hv-border p-8 mb-8">
            <h2 className="text-lg font-bold text-hv-navy mb-1">Your Harbor View Contacts</h2>
            <p className="text-sm text-hv-slate mb-5">
              Have questions? Reach out to us directly anytime.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a href="mailto:mmolloy@harborview-consulting.com" className="flex items-center gap-3 p-4 rounded-xl border border-hv-border hover:border-hv-blue/40 hover:bg-hv-blue/5 transition group">
                <img src="/team-mike-molloy.png" alt="Mike Molloy" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                <div>
                  <span className="text-sm font-semibold text-hv-navy group-hover:text-hv-blue transition block">Mike Molloy</span>
                  <span className="text-xs text-hv-slate group-hover:text-hv-blue transition">mmolloy@harborview-consulting.com</span>
                </div>
              </a>
              <a href="mailto:kcollingsworth@harborview-consulting.com" className="flex items-center gap-3 p-4 rounded-xl border border-hv-border hover:border-hv-blue/40 hover:bg-hv-blue/5 transition group">
                <img src="/team-kevin-collingsworth.png" alt="Kevin Collingsworth" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                <div>
                  <span className="text-sm font-semibold text-hv-navy group-hover:text-hv-blue transition block">Kevin Collingsworth</span>
                  <span className="text-xs text-hv-slate group-hover:text-hv-blue transition">kcollingsworth@harborview-consulting.com</span>
                </div>
              </a>
            </div>
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

          {/* Learn More */}
          <div className="text-center pb-8">
            <p className="text-sm text-hv-slate mb-3">Want to learn more about what we offer?</p>
            <a
              href="https://www.harborview-consulting.com/services/workiva"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-hv-navy text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-hv-navy/90 transition"
            >
              Explore Our Workiva Services
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

        </div>
      </main>

      {/* CPE Training Popup */}
      {showCpeBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="relative bg-white rounded-2xl shadow-xl border border-hv-border max-w-md w-full p-8 animate-in fade-in zoom-in">
            <button
              onClick={() => setShowCpeBanner(false)}
              className="absolute top-4 right-4 text-hv-slate hover:text-hv-navy transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-hv-yellow/20 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-6 h-6 text-hv-yellow" />
            </div>

            <h3 className="text-lg font-bold text-hv-navy text-center mb-2">
              Earn CPE Credits with Harbor View
            </h3>
            <p className="text-sm text-hv-slate text-center leading-relaxed mb-6">
              Keep your team sharp and compliant. Our Workiva-focused CPE training courses help your finance and audit teams build real skills — while earning the continuing education credits they need.
            </p>

            <div className="flex flex-col gap-3">
              <a
                href="mailto:mmolloy@harborview-consulting.com?subject=CPE%20Training%20Courses%20—%20Tell%20Me%20More"
                className="block w-full text-center bg-hv-blue hover:bg-hv-blue/90 text-white text-sm font-semibold px-6 py-3 rounded-xl transition"
              >
                Contact Us to Learn More
              </a>
              <button
                onClick={() => setShowCpeBanner(false)}
                className="text-xs text-hv-slate hover:text-hv-navy transition"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
