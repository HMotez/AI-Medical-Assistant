import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axiosClient, { streamPost } from "../../api/axiosClient";
import { useMedicalLabels } from "../../i18n/medical";
import { currentLang, dateLocale } from "../../i18n";
import PageHead from "../../components/ui/PageHead";
import { Bot, Send, Loader2, User, RefreshCw, AlertTriangle, Stethoscope, Sparkles } from "lucide-react";

const QUICK_PROMPTS = ["meaning", "urgent", "explain", "lifestyle", "watch"];

function Bubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 mt-1
        ${isUser ? "bg-accent/12 text-accent" : "text-white"}`}
        style={isUser ? undefined : { background: "var(--hero)" }}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`max-w-[78%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        <div className={`rounded-[20px] px-4 py-3 text-[15.5px] leading-relaxed whitespace-pre-wrap
          ${isUser
            ? "bg-accent text-white rounded-tr-md shadow-glow"
            : "bg-panel border border-line text-ink rounded-tl-md shadow-elev1"}`}>
          {msg.content}
        </div>
        {msg.timestamp && (
          <span className="font-data text-[11.5px] text-dim px-1">
            {new Date(msg.timestamp).toLocaleTimeString(dateLocale(), { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-xl grid place-items-center text-white shrink-0" style={{ background: "var(--hero)" }}>
        <Bot className="w-4 h-4" />
      </div>
      <div className="bg-panel border border-line rounded-[20px] rounded-tl-md px-4 py-3.5 flex items-center gap-1.5 shadow-elev1">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );
}

export default function MedicalChat() {
  const { t } = useTranslation();
  const labels = useMedicalLabels();
  // The opening message is stored as a translation key so it follows language changes
  const [messages, setMessages] = useState([
    { role: "assistant", i18nKey: "chat.welcome", timestamp: new Date().toISOString() },
  ]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [context, setContext]   = useState(null);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  /* Latest analysis: the server loads its full details for the assistant */
  useEffect(() => {
    axiosClient.get("/api/analysis/").then(r => {
      const latest = r.data?.[0];
      if (latest?.top_disease) {
        setContext({ analysis_id: latest.id, top_disease: latest.top_disease, urgency: latest.urgency_level });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  const send = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput("");

    const newMsg = { role: "user", content: userMsg, timestamp: new Date().toISOString() };
    const history = messages.map(m => ({ role: m.role, content: m.i18nKey ? t(m.i18nKey) : m.content }));
    // Empty assistant bubble that fills in as the reply streams
    setMessages([...messages, newMsg, { role: "assistant", content: "", timestamp: new Date().toISOString() }]);
    setLoading(true);

    const updateReply = (change) =>
      setMessages(prev => [...prev.slice(0, -1), { ...prev[prev.length - 1], ...change(prev[prev.length - 1]) }]);

    try {
      await streamPost("/api/chat/stream", {
        message: userMsg,
        history,
        context: context ? { analysis_id: context.analysis_id } : null,
        language: currentLang(),
      }, (event) => {
        if (event.type === "text")    updateReply(m => ({ content: m.content + event.text }));
        if (event.type === "refusal") updateReply(() => ({ content: event.text }));
        if (event.type === "done")    updateReply(() => ({ model: event.model_used }));
      });
    } catch {
      updateReply(() => ({ content: "", i18nKey: "chat.error" }));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const reset = () => setMessages([{ role: "assistant", i18nKey: "chat.reset", timestamp: new Date().toISOString() }]);
  const basicMode = messages.some(m => m.role === "assistant" && m.model === "rule-based");

  return (
    <div className="flex flex-col gap-3 h-full min-h-[560px]">
      <PageHead compact
        eyebrow={t("chat.assistant")}
        title={<span className="inline-flex items-center gap-2.5">{t("chat.title")} <span className="chip chip-accent"><Sparkles className="w-3 h-3" /> AI</span></span>}
        subtitle={t("chat.subtitle")}
        actions={
          <button onClick={reset} className="btn-ghost btn-sm" aria-label={t("chat.clear")}>
            <RefreshCw className="w-3.5 h-3.5" /> {t("chat.clear")}
          </button>
        }
      />

      <div className="card !p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Context + prompts */}
        <div className="p-4 border-b border-line grid gap-3">
          {context && (
            <div className="flex items-center gap-2.5 text-[14px] text-muted">
              <Stethoscope className="w-4 h-4 text-accent shrink-0" />
              <span>{t("chat.contextLoaded")} <strong className="text-ink">{labels.disease(context.top_disease)}</strong>
                {context.urgency && <> · {t("chat.urgency")} <strong className="text-ink">{t(`common.urgency.${context.urgency}`)}</strong></>}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => send(t(`chat.prompts.${p}`))} disabled={loading}
                className="chip hover:!bg-accent/12 hover:!text-accent transition-colors disabled:opacity-40">
                {t(`chat.prompts.${p}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div role="log" aria-live="polite" className="flex-1 min-h-0 overflow-y-auto p-5 grid content-start gap-4 bg-panel2/50">
          {messages.map((m, i) => (m.content || m.i18nKey) &&
            <Bubble key={i} msg={m.i18nKey ? { ...m, content: t(m.i18nKey) } : m} />)}
          {loading && !messages[messages.length - 1]?.content && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-line">
          {basicMode && (
            <div className="alert-warning !py-2 !text-[13.5px] mb-3"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {t("chat.basicMode")}</div>
          )}
          <div className="flex gap-2.5 items-end rounded-[18px] bg-panel border border-line p-2 focus-within:border-accent/50 focus-within:shadow-[0_0_0_4px_rgb(var(--accent)/0.12)] transition-shadow">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={t("chat.placeholder")}
              aria-label={t("chat.placeholder")}
              className="flex-1 bg-transparent text-[15.5px] text-ink placeholder:text-dim resize-none outline-none py-2 px-2 leading-relaxed max-h-[120px]"
            />
            <button onClick={() => send()} disabled={!input.trim() || loading} aria-label={t("chat.send")}
              className="btn-primary !w-11 !h-11 !p-0 !rounded-[14px] shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-center text-[12.5px] text-dim mt-2">{t("chat.footer")}</p>
        </div>
      </div>
    </div>
  );
}
