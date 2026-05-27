"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Send, Loader2, MessagesSquare, RefreshCcw } from "lucide-react"
import { dashboardService } from "@/services/api"
import { toast } from "sonner"
import { useSocket } from "@/hooks/useSocket"

const getAdminUser = () => {
  if (typeof window === "undefined") return null
  try {
    return JSON.parse(localStorage.getItem("admin_user") || "null")
  } catch {
    return null
  }
}

const normalizeDashboardConversation = (conversation) => {
  const participant = conversation.user || conversation.participants?.[0] || {}
  return {
    ...conversation,
    user: participant,
  }
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [admin] = useState(getAdminUser)
  const searchParams = useSearchParams()
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null
  const { on, emit } = useSocket(token)

  const loadConversations = async () => {
    try {
      const res = await dashboardService.getConversations()
      const list = (res.data.data || []).map(normalizeDashboardConversation)
      setConversations(list)
      if (!selected && list[0]) setSelected(list[0])
    } catch (error) {
      toast.error("Could not load support conversations")
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId) => {
    if (!conversationId) return
    try {
      const res = await dashboardService.getChatMessages(conversationId)
      setMessages(res.data.data || [])
    } catch {
      toast.error("Could not load messages")
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await dashboardService.getConversations()
        if (cancelled) return
        const list = (res.data.data || []).map(normalizeDashboardConversation)
        setConversations(list)
        const conversationId = searchParams.get("conversationId") || searchParams.get("conversation")
        const match = conversationId ? list.find((item) => item.id === conversationId) : null
        if (match || list[0]) setSelected(match || list[0])
      } catch {
        if (!cancelled) toast.error("Could not load support conversations")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [searchParams])

  useEffect(() => {
    if (!selected?.id) return
    emit("join:conversation", selected.id)
    let cancelled = false
    ;(async () => {
      try {
        await dashboardService.markConversationRead(selected.id)
        window.dispatchEvent(new Event("fixam:messages-read"))
        const res = await dashboardService.getChatMessages(selected.id)
        if (!cancelled) setMessages(res.data.data || [])
      } catch {
        if (!cancelled) toast.error("Could not load messages")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selected?.id, emit])

  useEffect(() => {
    const off = on("message:new", (message) => {
      if (message.conversationId === selected?.id) {
        setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message])
      }
      loadConversations()
    })
    return () => off?.()
  }, [on, selected?.id])

  const sendReply = async (event) => {
    event.preventDefault()
    if (!input.trim() || !selected) return
    try {
      setSending(true)
      const res = await dashboardService.sendChatMessage({
        conversationId: selected.id,
        receiverId: selected.user?.id,
        content: input.trim(),
        type: "TEXT",
      })
      setMessages((current) => [...current, res.data.data])
      setInput("")
      loadConversations()
    } catch {
      toast.error("Reply failed")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium">Loading support inbox...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Support Messages</h2>
          <p className="text-slate-500">Live chat messages from users inside the Fixam app.</p>
        </div>
        <button onClick={loadConversations} className="inline-flex items-center gap-2 bg-[#0D9488] px-4 py-2 text-sm font-bold text-white">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid min-h-[680px] grid-cols-1 border bg-white lg:grid-cols-[360px_1fr]">
        <aside className="border-r bg-[#F8FAFC]">
          <div className="border-b p-4">
            <p className="text-xs font-black uppercase tracking-widest text-[#0D9488]">System</p>
            <h3 className="mt-1 font-bold text-slate-900">Support inbox</h3>
          </div>
          <div className="divide-y">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessagesSquare className="mx-auto mb-3 h-10 w-10 opacity-40" />
                No support chats yet.
              </div>
            ) : conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelected(conversation)}
                className={`block w-full p-4 text-left hover:bg-white ${selected?.id === conversation.id ? "bg-white border-l-4 border-[#0D9488]" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{conversation.user?.fullName || "Fixam User"}</p>
                    <p className="text-xs text-slate-500">{conversation.user?.phone || conversation.user?.email || conversation.user?.role}</p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="bg-[#0D9488] px-2 py-1 text-xs font-black text-white">{conversation.unreadCount}</span>
                  )}
                </div>
                <p className="mt-2 line-clamp-1 text-sm text-slate-500">{conversation.lastMessage?.content || "No messages yet"}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-[680px] flex-col">
          {selected ? (
            <>
              <div className="border-b p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Live support</p>
                <h3 className="text-xl font-bold text-slate-900">{selected.user?.fullName || "Fixam User"}</h3>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto bg-white p-5">
                {messages.map((message) => {
                  const mine = message.senderId === admin?.id
                  return (
                    <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] px-4 py-3 text-sm ${mine ? "bg-[#0D9488] text-white" : "bg-slate-100 text-slate-800"}`}>
                        {message.type === "IMAGE" ? (
                          <img src={message.content || message.mediaUrl} alt="" className="max-h-64 rounded-lg object-cover" />
                        ) : (
                          <p>{message.content}</p>
                        )}
                        <p className={`mt-2 text-[10px] ${mine ? "text-teal-50" : "text-slate-400"}`}>
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <form onSubmit={sendReply} className="flex gap-3 border-t p-4">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Reply to this user..."
                  className="h-12 flex-1 border bg-white px-4 text-sm outline-none focus:border-[#0D9488]"
                />
                <button disabled={sending} className="inline-flex h-12 items-center gap-2 bg-[#0D9488] px-5 font-bold text-white disabled:opacity-60">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-slate-400">Select a support conversation.</div>
          )}
        </section>
      </div>
    </div>
  )
}
