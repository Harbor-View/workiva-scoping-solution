import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface LeadSession {
  leadId: string;
  email: string;
}

const SCOPING_COMPLETE_RE = /<SCOPING_COMPLETE>([\s\S]*?)<\/SCOPING_COMPLETE>/;

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

    // Append a placeholder for the assistant response
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: lead?.leadId, transcript: finalMessages, payload }),
        });
        const { proposalSlug } = await completeRes.json() as { proposalSlug: string };
        sessionStorage.setItem("hv_proposal_slug", proposalSlug);
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
      <header className="bg-white border-b border-hv-border px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-hv-navy font-bold tracking-wide">Harbor View Consulting</span>
          <span className="text-xs text-hv-slate">Workiva Scoping</span>
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
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-hv-navy flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">
                  HV
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-hv-blue text-white rounded-br-sm"
                    : "bg-white border border-hv-border text-hv-navy rounded-bl-sm"
                }`}
              >
                {msg.content}
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
        <p className="text-center text-xs text-hv-slate mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
