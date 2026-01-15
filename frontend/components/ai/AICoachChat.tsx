"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: string
  suggestions?: string[]
}

interface AICoachChatProps {
  dealId?: string
  analysisId?: string
  className?: string
}

export function AICoachChat({ dealId, analysisId, className = "" }: AICoachChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const authenticatedFetch = useAuthenticatedFetch()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await authenticatedFetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          deal_id: dealId,
          analysis_id: analysisId,
          conversation_id: conversationId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to send message")
      }

      const data = await response.json()

      const aiMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: data.timestamp,
        suggestions: data.suggestions
      }

      setMessages(prev => [...prev, aiMessage])
      setConversationId(data.conversation_id)

    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearConversation = async () => {
    if (conversationId) {
      try {
        await authenticatedFetch(`${API_URL}/api/ai/chat/${conversationId}`, {
          method: "DELETE"
        })
      } catch (error) {
        console.error("Failed to clear conversation:", error)
      }
    }
    setMessages([])
    setConversationId(null)
  }

  return (
    <>
      {/* Chat Toggle Button - Positioned above feedback button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-24 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-50 ${className}`}
          aria-label="Open AI Coach"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-green-500 w-3 h-3 rounded-full animate-pulse"></span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 ${className}`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">AI Sales Coach</h3>
                <p className="text-xs text-blue-100">Ask me anything about your deals</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={clearConversation}
                  className="text-white/80 hover:text-white text-xs underline"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 mt-8">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">Welcome to AI Coach!</p>
                <p className="text-sm mt-2">
                  {dealId
                    ? "Ask me how to move this deal forward"
                    : "Ask me about sales strategy, deal tactics, or pipeline management"
                  }
                </p>
                <div className="mt-4 space-y-2 text-left">
                  <button
                    onClick={() => setInput(dealId
                      ? "How do I move this deal forward?"
                      : "What should I focus on in my pipeline?"
                    )}
                    className="w-full text-left text-sm bg-white p-3 rounded-lg hover:bg-blue-50 transition-colors border border-slate-200"
                  >
                    💡 {dealId
                      ? "How do I move this deal forward?"
                      : "What should I focus on in my pipeline?"
                    }
                  </button>
                  <button
                    onClick={() => setInput(dealId
                      ? "What are the biggest risks with this deal?"
                      : "How can I improve my close rate?"
                    )}
                    className="w-full text-left text-sm bg-white p-3 rounded-lg hover:bg-blue-50 transition-colors border border-slate-200"
                  >
                    🎯 {dealId
                      ? "What are the biggest risks with this deal?"
                      : "How can I improve my close rate?"
                    }
                  </button>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-900 shadow-sm border border-slate-200"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-1">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Quick Actions:</p>
                      {message.suggestions.map((suggestion, i) => (
                        <div key={i} className="text-xs text-slate-700 flex items-start gap-1">
                          <span className="text-blue-600">•</span>
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-900 rounded-lg p-3 shadow-sm border border-slate-200">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask your AI coach..."
                className="flex-1 resize-none rounded-lg border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="self-end bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  )
}
