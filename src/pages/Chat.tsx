import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Shield } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface LeadSession {
  leadId: string;
  email: string;
  sessionToken?: string;
}

const SCOPING_COMPLETE_RE = /<SCOPING_COMPLETE>([\s\S]*?)<\/SCOPING_COMPLETE>/;

const PROSPECT_QUICK_REPLIES = [
  "SEC / Financial Reporting",
  "SOX Compliance",
  "Sustainability Reporting",
  "Management Reporting",
  "Not sure yet",
];

const SELLER_QUICK_REPLIES = [
  "New logo — net-new customer",
  "Expansion — existing customer",
  "Let me paste my Salesforce notes",
  "Health check for a current customer",
];

const STEPS = ["Verify Email", "Scoping Chat", "Your Estimate"] as const;

function stripScopingTag(text: string): string {
  return text.replace(/<SCOPING_COMPLETE>[\s\S]*?<\/SCOPING_COMPLETE>/, "").trim();
}

export default function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [done, setDone] = useState(false);
  const [lead, setLead] = useState<LeadSession | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasUserReplied = messages.some((m) => m.role === "user");
  const firstAssistantReady = messages.some((m) => m.role === "assistant" && m.content !== "");
  const currentStep = done ? 2 : 1;
  const isWorkivaSeller = lead?.email?.endsWith("@workiva.com") ?? false;
  const quickReplies = isWorkivaSeller ? SELLER_QUICK_REPLIES : PROSPECT_QUICK_REPLIES;

  function handleQuickReply(text: string) {
    setInput(text);
    textareaRef.current?.focus();
  }

  function handleSkip() {
    const nonEmptyMessages = messages.filter((m) => m.content !== "");
    if (nonEmptyMessages.length > 0 && lead) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (lead.sessionToken) headers["Authorization"] = `Bearer ${lead.sessionToken}`;
      void fetch("/.netlify/functions/send-transcript", {
        method: "POST",
        headers,
        body: JSON.stringify({ transcript: nonEmptyMessages, skipped: true }),
      });
    }
    navigate("/confirmation");
  }

  // Auth guard
  useEffect(() => {
    const stored = sessionStorage.getItem("hv_lead");
    if (!stored) { navigate("/"); return; }
    setLead(JSON.parse(stored) as LeadSession);
  }, [navigate]);

  // Kick off conversation once lead is set
  useEffect(() => {
    if (lead && messages.length === 0) {
      void sendToClaudeWithMessages([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const sendToClaudeWithMessages = useCallback(async (msgs: Message[]) => {
    setStreaming(true);

    const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (lead?.sessionToken) authHeaders["Authorization"] = `Bearer ${lead.sessionToken}`;

    // Append a placeholder for the assistant response
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ messages: msgs }),
      });

      if (!res.ok) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: "Sorry, something went wrong. Please try again." };
          return next;
        });
        return;
      }

      const full = await res.text();

      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: stripScopingTag(full) };
        return next;
      });

      // Check for completion payload
      const match = SCOPING_COMPLETE_RE.exec(full);
      if (match) {
        const payload = JSON.parse(match[1].trim()) as object;
        setDone(true);
        const finalMessages: Message[] = [...msgs, { role: "assistant", content: stripScopingTag(full) }];
        const completeRes = await fetch("/.netlify/functions/complete-chat", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ transcript: finalMessages, payload }),
        });
        const { proposalSlug } = await completeRes.json() as { proposalSlug: string };
        sessionStorage.setItem("hv_proposal_slug", proposalSlug);

        // Send transcript PDF in the background
        void fetch("/.netlify/functions/send-transcript", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ transcript: finalMessages, skipped: false }),
        });

        setTimeout(() => navigate("/confirmation"), 1500);
      }
    } finally {
      setStreaming(false);
    }
  }, [lead, navigate]);

  async function handleSend() {
    if (!input.trim() || streaming || done) return;
    const userMessage: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    await sendToClaudeWithMessages(updatedMessages.filter((m) => m.content !== ""));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }

  return (
    <div className="min-h-screen bg-hv-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-hv-border px-6 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <span className="text-hv-navy font-bold tracking-wide">Harbor View Consulting</span>
            <div className="flex items-center gap-1.5 text-hv-mint">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Registered Workiva Partner</span>
            </div>
          </div>
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-2">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  {i < currentStep ? (
                    <CheckCircle2 className="w-4 h-4 text-hv-mint" />
                  ) : i === currentStep ? (
                    <div className="w-4 h-4 rounded-full border-2 border-hv-blue flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-hv-blue" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-hv-border" />
                  )}
                  <span className={`text-[11px] font-medium ${
                    i < currentStep ? "text-hv-mint" : i === currentStep ? "text-hv-navy" : "text-hv-slate"
                  }`}>
                    {step}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-px ${i < currentStep ? "bg-hv-mint" : "bg-hv-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Immediate Help CTA */}
      <div className="bg-hv-navy/5 border-b border-hv-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <span className="text-xs font-semibold text-hv-navy whitespace-nowrap">Need immediate help?</span>
          <div className="flex items-center gap-4">
            <a href="mailto:mmolloy@harborview-consulting.com" className="flex items-center gap-2 group">
              <img src="/team-mike-molloy.png" alt="Mike Molloy" className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" />
              <div className="leading-tight">
                <span className="text-xs font-medium text-hv-navy group-hover:text-hv-blue transition">Mike Molloy</span>
                <span className="block text-[11px] text-hv-slate group-hover:text-hv-blue transition">mmolloy@harborview-consulting.com</span>
              </div>
            </a>
            <a href="mailto:kcollingsworth@harborview-consulting.com" className="flex items-center gap-2 group">
              <img src="/team-kevin-collingsworth.png" alt="Kevin Collingsworth" className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" />
              <div className="leading-tight">
                <span className="text-xs font-medium text-hv-navy group-hover:text-hv-blue transition">Kevin Collingsworth</span>
                <span className="block text-[11px] text-hv-slate group-hover:text-hv-blue transition">kcollingsworth@harborview-consulting.com</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Intro Card — shown until first assistant message is ready */}
          {!firstAssistantReady && (
            <div className="bg-gradient-to-br from-hv-navy to-hv-navy/90 rounded-2xl p-5 text-white">
              <h2 className="text-base font-bold mb-1">
                {isWorkivaSeller ? "Workiva Seller — Partner Scoping" : "Welcome to Workiva Scoping"}
              </h2>
              <p className="text-sm text-white/80 leading-relaxed">
                {isWorkivaSeller
                  ? "Tell us about your customer opportunity. We'll ask about the deal stage, existing Workiva footprint, and what you're looking to sell. Feel free to paste in Salesforce notes — the more context, the better the estimate."
                  : "This takes about 5 minutes. We'll ask about your reporting needs, team size, and timeline to build a personalized implementation estimate."}
              </p>
              <div className="flex gap-4 mt-3 text-xs text-white/60">
                <span>~5 min</span>
                <span>{isWorkivaSeller ? "Client-facing proposal within 24 hrs" : "Estimate within 24 hrs"}</span>
                <span>{isWorkivaSeller ? "Proposal addressed to your customer" : "No commitment"}</span>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-hv-navy flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">
                  HV
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-hv-blue text-white rounded-br-sm whitespace-pre-wrap"
                    : "bg-white border border-hv-border text-hv-navy rounded-bl-sm prose prose-sm prose-neutral max-w-none"
                }`}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
                {msg.role === "assistant" && streaming && i === messages.length - 1 && msg.content === "" && (
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-hv-slate animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-hv-slate animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-hv-slate animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                )}
              </div>
            </div>
          ))}

          {done && (
            <div className="flex justify-center">
              <div className="bg-hv-mint/10 border border-hv-mint/30 text-hv-mint rounded-xl px-4 py-2 text-sm font-medium">
                Scoping complete — preparing your confirmation…
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input */}
      <div className="bg-white border-t border-hv-border px-4 py-4">
        {/* Quick Reply Chips — shown after first assistant message, before user has replied */}
        {firstAssistantReady && !hasUserReplied && !done && (
          <div className="max-w-2xl mx-auto mb-3">
            <p className="text-[11px] text-hv-slate mb-1.5">Quick replies:</p>
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleQuickReply(reply)}
                  disabled={streaming}
                  className="text-xs px-3 py-1.5 rounded-full border border-hv-blue/30 text-hv-blue hover:bg-hv-blue hover:text-white transition disabled:opacity-40"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="max-w-2xl mx-auto flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={streaming || done}
            placeholder={done ? "Scoping complete" : "Type your response…"}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-hv-border px-4 py-3 text-sm text-hv-navy placeholder:text-hv-border focus:outline-none focus:ring-2 focus:ring-hv-blue/50 focus:border-hv-blue transition disabled:opacity-50"
          />
          <button
            onClick={() => { void handleSend(); }}
            disabled={!input.trim() || streaming || done}
            className="bg-hv-blue hover:bg-hv-blue/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 text-sm font-semibold transition shrink-0"
          >
            Send
          </button>
        </div>
        <div className="flex items-center justify-center gap-3 mt-2">
          <p className="text-xs text-hv-slate">Press Enter to send · Shift+Enter for new line</p>
          {!done && (
            <button
              onClick={handleSkip}
              disabled={streaming}
              className="text-xs text-hv-slate hover:text-hv-coral transition underline underline-offset-2 disabled:opacity-40"
            >
              Skip to schedule a meeting
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
