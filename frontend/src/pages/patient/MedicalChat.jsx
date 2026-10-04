import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axiosClient from "../../api/axiosClient";
import { useMedicalLabels } from "../../i18n/medical";
import { currentLang, dateLocale } from "../../i18n";
import {
  Bot, Send, Loader2, User, RefreshCw, AlertTriangle,
  Stethoscope, Sparkles, MessageSquare
} from "lucide-react";

const QUICK_PROMPTS = ["meaning", "urgent", "explain", "lifestyle", "watch"];

function Bubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1
        ${isUser
          ? "bg-teal-500/30 border border-teal-400/40"
          : "bg-purple-500/20 border border-purple-400/30"}`}>
        {isUser
          ? <User className="w-4 h-4 text-teal-300" />
          : <Bot className="w-4 h-4 text-purple-300" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap
          ${isUser
            ? "bg-teal-500/25 border border-teal-400/30 text-white rounded-tr-sm"
            : "bg-white/10 border border-white/15 text-white/90 rounded-tl-sm"}`}>
          {msg.content}
        </div>
        {msg.timestamp && (
          <span className="text-[10px] text-white/25 px-1">
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
      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-500/20 border border-purple-400/30 shrink-0">
        <Bot className="w-4 h-4 text-purple-300" />
      </div>
      <div className="bg-white/10 border border-white/15 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }} />
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

  /* Load latest analysis as context */
  useEffect(() => {
    axiosClient.get("/api/analysis/").then(r => {
      if (r.data?.length) {
        const latest = r.data[0];
        axiosClient.get(`/api/analysis/${latest.id}`).then(res => {
          const d = res.data;
          const top = d.predictions?.[0];
          if (top) {
            setContext({
              top_disease: top.disease || top.disease_name,
              symptoms: [],
              urgency: d.urgency_level,
              specialist: d.recommended_specialist,
              analysis_id: d.id,
            });
          }
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput("");

    const newMsg = { role: "user", content: userMsg, timestamp: new Date().toISOString() };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const history = updated.slice(0, -1).map(m => ({ role: m.role, content: m.i18nKey ? t(m.i18nKey) : m.content }));
      const res = await axiosClient.post("/api/chat/", {
        message: userMsg,
        history,
        context,
        language: currentLang(),
      });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: res.data.reply,
        timestamp: new Date().toISOString(),
        model: res.data.model_used,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        i18nKey: "chat.error",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const reset = () => {
    setMessages([{
      role: "assistant",
      i18nKey: "chat.reset",
      timestamp: new Date().toISOString(),
    }]);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6" style={{ maxHeight: "100vh" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/25"
            style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.3) 0%, rgba(139,92,246,0.2) 100%)" }}>
            <MessageSquare className="w-7 h-7 text-purple-300" />
          </div>
          <div>
            <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">{t("chat.assistant")}</p>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              {t("chat.title")}
              <span className="inline-flex items-center gap-1 bg-purple-500/20 border border-purple-400/30 text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            </h1>
            <p className="text-white/40 text-xs mt-0.5">{t("chat.subtitle")}</p>
          </div>
        </div>
        <button onClick={reset} title={t("chat.clear")} aria-label={t("chat.clear")}
          className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Context banner */}
      {context && (
        <div className="shrink-0 mb-4 bg-teal-500/10 border border-teal-400/25 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <Stethoscope className="w-4 h-4 text-teal-400 shrink-0" />
          <p className="text-xs text-teal-200 font-medium">
            {t("chat.contextLoaded")} <strong>{labels.disease(context.top_disease)}</strong>
            {context.urgency && <> · {t("chat.urgency")} <strong>{t(`common.urgency.${context.urgency}`)}</strong></>}
          </p>
        </div>
      )}

      {/* Quick prompts */}
      <div className="shrink-0 flex flex-wrap gap-2 mb-4">
        {QUICK_PROMPTS.map(p => (
          <button key={p} onClick={() => send(t(`chat.prompts.${p}`))} disabled={loading}
            className="text-xs font-semibold text-white/60 bg-white/8 border border-white/15 px-3 py-1.5 rounded-full hover:bg-white/15 hover:text-white transition-all disabled:opacity-40">
            {t(`chat.prompts.${p}`)}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0
        bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
        {messages.map((m, i) => <Bubble key={i} msg={m.i18nKey ? { ...m, content: t(m.i18nKey) } : m} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 mt-4">
        {messages.some(m => m.role === "assistant" && m.model === "rule-based") && (
          <div className="flex items-center gap-2 text-amber-300/70 text-xs mb-2 px-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            {t("chat.basicMode")}
          </div>
        )}
        <div className="flex gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={t("chat.placeholder")}
            aria-label={t("chat.placeholder")}
            className="flex-1 bg-transparent text-white text-sm placeholder-white/30 resize-none focus:outline-none py-2 px-2 leading-relaxed"
            style={{ maxHeight: "120px", overflowY: "auto" }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading} aria-label={t("chat.send")}
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all
              disabled:opacity-40 disabled:cursor-not-allowed
              bg-gradient-to-br from-teal-500 to-teal-600 text-white hover:from-teal-400 hover:to-teal-500
              shadow-lg shadow-teal-500/25">
            {loading
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-center text-[10px] text-white/20 mt-2">
          {t("chat.footer")}
        </p>
      </div>
    </div>
  );
}
