import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

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

          {/* Book a call */}
          <div className="bg-white rounded-2xl shadow-sm border border-hv-border p-8">
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
      </main>
    </div>
  );
}
