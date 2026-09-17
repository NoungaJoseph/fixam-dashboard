"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Phone, Video, MoreVertical, Paperclip, Smile } from "lucide-react"
import { useSocket } from "@/hooks/useSocket"

export default function ChatWindow({ conversationId, currentUser, receiver }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef(null)
  
  const token = localStorage.getItem('admin_token')
  const { on, emit } = useSocket(token)

  useEffect(() => {
    // Initial Fetch (Mocking API call here for brevity, would use api.js)
    // fetchMessages(conversationId).then(setMessages)

    // Join room
    emit('join:conversation', conversationId)

    // Listen for new messages
    const offMessage = on('message:new', (msg) => {
      setMessages(prev => [...prev, msg])
    })

    // Listen for typing
    const offTyping = on('user:typing', ({ userId, isTyping }) => {
      if (userId !== currentUser.id) setIsTyping(isTyping)
    })

    return () => {
      offMessage?.()
      offTyping?.()
    }
  }, [conversationId, emit, on, currentUser.id])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const newMessage = {
      conversationId,
      content: input,
      senderId: currentUser.id,
      createdAt: new Date().toISOString()
    }

    emit('message:send', newMessage) // Backend controller would handle saving + emitting back
    setMessages(prev => [...prev, newMessage])
    setInput("")
    emit('typing', { conversationId, isTyping: false })
  }

  const handleTyping = (e) => {
    setInput(e.target.value)
    emit('typing', { conversationId, isTyping: e.target.value.length > 0 })
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl border shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-slate-200 border flex items-center justify-center text-slate-400">
              {receiver?.fullName?.charAt(0) || 'U'}
            </div>
            {receiver?.isOnline && (
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{receiver?.fullName || 'Fixam User'}</h3>
            <p className="text-xs text-slate-500">{receiver?.isOnline ? 'Online' : 'Offline'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600"><Phone size={20}/></button>
          <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600"><Video size={20}/></button>
          <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400"><MoreVertical size={20}/></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100/30">
        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUser.id
          return (
            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${
                isMe ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border'
              }`}>
                {msg.content}
                <p className={`text-[10px] mt-1 ${isMe ? 'text-slate-400' : 'text-slate-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border p-2 rounded-xl text-xs text-slate-400 animate-pulse">
              typing...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t bg-white flex items-center gap-3">
        <button type="button" className="text-slate-400 hover:text-slate-600"><Paperclip size={20}/></button>
        <div className="flex-1 bg-slate-100 rounded-xl px-4 py-2 flex items-center">
          <input 
            type="text" 
            placeholder="Type a message..." 
            className="flex-1 bg-transparent outline-none text-sm text-slate-700"
            value={input}
            onChange={handleTyping}
          />
          <button type="button" className="text-slate-400 hover:text-slate-600"><Smile size={20}/></button>
        </div>
        <button type="submit" className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg shadow-blue-600/20">
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
