import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Send, Sparkles, Trash2, X } from "lucide-react"
import { useAIAssistant } from "@/context/AIAssistantContext"

const SUGGESTIONS = [
  "Quel est mon chantier le plus rentable ce mois ?",
  "Résume mon activité de la semaine",
  "Combien j'ai fait en chiffre d'affaires ce mois ?",
  "Quels clients n'ont pas encore payé ?",
]

const suggestionPillStyle: React.CSSProperties = {
  background: "rgba(124,58,237,0.1)",
  border: "1px solid rgba(124,58,237,0.25)",
  borderRadius: "10px",
  padding: "10px 14px",
  fontSize: "13px",
  color: "rgba(255,255,255,0.8)",
  cursor: "pointer",
  transition: "all 0.2s",
  textAlign: "left",
}

export function AIAssistantPanel() {
  const { isOpen, close, messages, loading, sendMessage, clearMessages } = useAIAssistant()
  const [input, setInput] = useState("")
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches,
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, loading])

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)")
    const handler = () => setIsMobile(mq.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const handleSubmit = async () => {
    if (!input.trim() || loading) return
    const text = input
    setInput("")
    await sendMessage(text)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit()
    }
  }

  const welcomeMsg = messages.find((m) => m.id === "welcome")
  const conversationMessages = messages.filter((m) => m.id !== "welcome")

  const panelStyle: React.CSSProperties = isMobile
    ? {
        width: "100vw",
        height: "100dvh",
        borderRadius: 0,
        position: "fixed",
        bottom: 0,
        left: 0,
      }
    : {
        width: 420,
        height: 600,
        borderRadius: "16px",
        top: "3.5rem",
        right: "1rem",
      }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Fermer l'assistant"
            className="fixed inset-0 z-40 bg-[#080d1a]/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />

          <motion.div
            role="dialog"
            aria-label="Assistant IA"
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed z-50 flex flex-col overflow-hidden ai-surface-glass shadow-ai-glow"
            style={panelStyle}
          >
            <header
              style={{
                background: "rgba(124,58,237,0.15)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderBottom: "1px solid rgba(124,58,237,0.2)",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 0 2px rgba(124,58,237,0.4)",
                    flexShrink: 0,
                  }}
                >
                  <Sparkles className="h-5 w-5 text-white" aria-hidden />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ fontSize: "15px", fontWeight: 600, color: "white", margin: 0 }}>
                    Assistant IA
                  </h2>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.5)",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Chantiers · Devis · Clients · Factures
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={clearMessages}
                  aria-label="Effacer"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    color: "rgba(255,255,255,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Fermer"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    color: "rgba(255,255,255,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            {welcomeMsg && (
              <div
                style={{
                  background:
                    "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))",
                  border: "1px solid rgba(124,58,237,0.2)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  margin: "16px",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                {welcomeMsg.content}
              </div>
            )}

            {messages.length <= 1 && !loading && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "8px",
                  padding: "0 16px",
                  marginBottom: "8px",
                }}
              >
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void sendMessage(s)}
                    style={suggestionPillStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(124,58,237,0.2)"
                      e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(124,58,237,0.1)"
                      e.currentTarget.style.borderColor = "rgba(124,58,237,0.25)"
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                minHeight: 0,
              }}
            >
              {conversationMessages.map((msg) => (
                <div
                  key={msg.id}
                  style={
                    msg.role === "user"
                      ? {
                          background:
                            "linear-gradient(135deg, rgba(232,112,42,0.2), rgba(232,112,42,0.1))",
                          border: "1px solid rgba(232,112,42,0.2)",
                          borderRadius: "12px 12px 4px 12px",
                          padding: "12px 16px",
                          fontSize: "14px",
                          maxWidth: "85%",
                          alignSelf: "flex-end",
                          color: "white",
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.5,
                        }
                      : {
                          background: "rgba(124,58,237,0.1)",
                          border: "1px solid rgba(124,58,237,0.15)",
                          borderRadius: "12px 12px 12px 4px",
                          padding: "12px 16px",
                          fontSize: "14px",
                          maxWidth: "85%",
                          alignSelf: "flex-start",
                          color: "white",
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.5,
                        }
                  }
                >
                  {msg.content}
                </div>
              ))}

              {loading && (
                <div
                  style={{
                    background: "rgba(124,58,237,0.1)",
                    border: "1px solid rgba(124,58,237,0.15)",
                    borderRadius: "12px 12px 12px 4px",
                    padding: "12px 16px",
                    fontSize: "14px",
                    maxWidth: "85%",
                    alignSelf: "flex-start",
                    color: "rgba(255,255,255,0.6)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#a78bfa" }} />
                  Réflexion en cours…
                </div>
              )}
            </div>

            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid rgba(124,58,237,0.2)",
                display: "flex",
                gap: "10px",
                alignItems: "flex-end",
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Posez votre question…"
                rows={2}
                disabled={loading}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(124,58,237,0.3)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  color: "inherit",
                  fontSize: "14px",
                  resize: "none",
                  minHeight: "44px",
                  maxHeight: "120px",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(124,58,237,0.7)"
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)"
                }}
              />
              <button
                type="button"
                disabled={!input.trim() || loading}
                onClick={() => void handleSubmit()}
                aria-label="Envoyer"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  border: "none",
                  color: "white",
                  cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  opacity: !input.trim() || loading ? 0.5 : 1,
                }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function AIAssistantButton() {
  const { toggle } = useAIAssistant()

  return (
    <button
      type="button"
      onClick={toggle}
      title="Assistant IA"
      aria-label="Assistant IA"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-white border border-violet-500/50 hover:bg-violet-500 transition-all duration-200 hover:scale-105"
      style={{ boxShadow: "0 0 20px rgba(124,58,237,0.4)" }}
    >
      <Sparkles className="h-4 w-4" />
    </button>
  )
}
