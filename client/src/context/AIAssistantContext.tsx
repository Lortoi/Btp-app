import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useLocation } from "wouter"
import { useChantiers } from "@/context/ChantiersContext"
import { serializeAssistantContext } from "@/lib/buildAssistantContext"

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

type AIAssistantContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  messages: ChatMessage[]
  loading: boolean
  sendMessage: (text: string) => Promise<void>
  clearMessages: () => void
}

const AIAssistantContext = createContext<AIAssistantContextValue | undefined>(undefined)

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Bonjour ! Je suis votre assistant PLANCHAIS. Posez-moi des questions sur vos chantiers, devis, clients, factures ou votre activité.",
}

export function AIAssistantProvider({ children }: { children: ReactNode }) {
  const { clients, chantiers } = useChantiers()
  const [location] = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [loading, setLoading] = useState(false)
  const sendingRef = useRef(false)

  const contextJson = useMemo(
    () => serializeAssistantContext(clients, chantiers),
    [clients, chantiers]
  )

  useEffect(() => {
    if (location === "/login" || location === "/auth" || location === "/") {
      setIsOpen(false)
    }
  }, [location])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  const clearMessages = useCallback(() => {
    setMessages([WELCOME])
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || sendingRef.current) return

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      }

      setMessages((prev) => [...prev, userMsg])
      setLoading(true)
      sendingRef.current = true

      try {
        const history = [...messages.filter((m) => m.id !== "welcome"), userMsg]
        const res = await fetch("/api/assistant-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context: contextJson,
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          }),
        })

        const data = (await res.json()) as { ok?: boolean; reply?: string; message?: string }
        if (!res.ok || !data.ok || !data.reply) {
          throw new Error(data.message ?? "Réponse impossible")
        }

        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: data.reply! },
        ])
      } catch (e) {
        const errText = e instanceof Error ? e.message : "Erreur inconnue"
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Désolé, une erreur s'est produite : ${errText}`,
          },
        ])
      } finally {
        setLoading(false)
        sendingRef.current = false
      }
    },
    [contextJson, messages]
  )

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      messages,
      loading,
      sendMessage,
      clearMessages,
    }),
    [isOpen, open, close, toggle, messages, loading, sendMessage, clearMessages]
  )

  return (
    <AIAssistantContext.Provider value={value}>{children}</AIAssistantContext.Provider>
  )
}

export function useAIAssistant() {
  const ctx = useContext(AIAssistantContext)
  if (!ctx) {
    throw new Error("useAIAssistant must be used within AIAssistantProvider")
  }
  return ctx
}
