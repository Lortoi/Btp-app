import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Send, Sparkles, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAIAssistant } from "@/context/AIAssistantContext"
import { cn } from "@/lib/utils"

const SUGGESTIONS = [
  "Quel est mon chantier le plus rentable ce mois ?",
  "Résume mon activité de la semaine",
  "Combien j'ai fait en chiffre d'affaires ce mois ?",
  "Quels clients n'ont pas encore payé ?",
]

export function AIAssistantPanel() {
  const { isOpen, close, messages, loading, sendMessage, clearMessages } = useAIAssistant()
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, loading])

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Fermer l'assistant"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
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
            className={cn(
              "fixed z-50 flex flex-col overflow-hidden ai-surface-glass shadow-ai-glow",
              "top-14 right-2 sm:right-4",
              "w-[min(420px,calc(100vw-1rem))]",
              "h-[min(640px,calc(100vh-4.5rem))]"
            )}
          >
            <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-ai/25">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ai/15 border border-ai/40 shadow-ai-glow-sm">
                  <Sparkles className="h-4 w-4 text-ai-light animate-pulse" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-sm text-white truncate">Assistant IA</h2>
                  <p className="text-xs text-gray-400 truncate">
                    Chantiers · Devis · Clients · Factures
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button type="button" variant="ghost" size="icon" onClick={clearMessages} aria-label="Effacer">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={close} aria-label="Fermer">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-ai text-white rounded-br-md font-medium shadow-ai-glow-sm"
                        : "bg-[#111111] border border-[#222222] text-white rounded-bl-md"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md px-3 py-2 text-sm bg-[#111111] border border-[#222222] text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin text-ai-light" />
                    Réflexion en cours…
                  </div>
                </div>
              )}

              {messages.length <= 1 && !loading && (
                <div className="pt-2 space-y-2">
                  <p className="text-xs text-gray-400">Suggestions :</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => void sendMessage(s)}
                        className="text-left text-xs rounded-full px-3 py-1.5 border border-ai/30 bg-ai-muted text-gray-200 hover:border-ai/50 hover:text-white hover:shadow-ai-glow-sm transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-ai/20 p-3 bg-ai-muted">
              <div className="flex items-end gap-2">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Posez votre question…"
                  rows={2}
                  disabled={loading}
                  className="min-h-[44px] max-h-28 resize-none border-ai/30 bg-[#111111] text-white placeholder:text-gray-500 focus-visible:ring-ai"
                />
                <Button
                  type="button"
                  size="icon"
                  disabled={!input.trim() || loading}
                  onClick={() => void handleSubmit()}
                  className="shrink-0 h-10 w-10 ai-btn"
                  aria-label="Envoyer"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
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
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-lg",
        "bg-ai text-white border border-ai-light/50 shadow-ai-glow-sm",
        "hover:bg-ai-light transition-colors animate-pulse hover:animate-none"
      )}
    >
      <Sparkles className="h-4 w-4" />
    </button>
  )
}
