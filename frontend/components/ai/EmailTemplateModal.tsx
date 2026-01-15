"use client"

import { useState } from "react"
import { X, Copy, CheckCircle, Loader2, Mail, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface EmailTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  dealId?: string
  analysisId?: string
  dealName?: string
}

type TemplateType = "follow_up" | "check_in" | "re_engagement" | "proposal"
type Tone = "professional" | "friendly" | "urgent"

export function EmailTemplateModal({
  isOpen,
  onClose,
  dealId,
  analysisId,
  dealName
}: EmailTemplateModalProps) {
  const [templateType, setTemplateType] = useState<TemplateType>("follow_up")
  const [tone, setTone] = useState<Tone>("professional")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const authenticatedFetch = useAuthenticatedFetch()

  const generateEmail = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await authenticatedFetch(`${API_URL}/api/ai/email-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_id: dealId,
          analysis_id: analysisId,
          template_type: templateType,
          tone: tone
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to generate email")
      }

      const data = await response.json()
      setSubject(data.subject)
      setBody(data.body)
      setIsEditing(false)

    } catch (error) {
      console.error("Email generation error:", error)
      setError(error instanceof Error ? error.message : "Failed to generate email")
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    const fullEmail = `Subject: ${subject}\n\n${body}`
    navigator.clipboard.writeText(fullEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setSubject("")
    setBody("")
    setError(null)
    setIsEditing(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Generate Email Template</h2>
                {dealName && <p className="text-sm text-blue-100 mt-1">{dealName}</p>}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!subject && !body ? (
            // Configuration Step
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "follow_up", label: "Follow Up", desc: "After demo or call" },
                    { value: "check_in", label: "Check In", desc: "Stalled or quiet deal" },
                    { value: "re_engagement", label: "Re-engage", desc: "Cold or lost deal" },
                    { value: "proposal", label: "Proposal", desc: "Sending next steps" }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setTemplateType(type.value as TemplateType)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        templateType === type.value
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="font-semibold text-sm">{type.label}</div>
                      <div className="text-xs text-slate-600 mt-1">{type.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tone
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "professional", label: "Professional" },
                    { value: "friendly", label: "Friendly" },
                    { value: "urgent", label: "Urgent" }
                  ].map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value as Tone)}
                      className={`p-3 rounded-lg border-2 text-center font-medium text-sm transition-all ${
                        tone === t.value
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 hover:border-blue-300 text-slate-700"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={generateEmail}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Email...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Email
                  </>
                )}
              </Button>
            </>
          ) : (
            // Preview/Edit Step
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Subject Line
                  </label>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="font-medium text-slate-900">{subject}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Body
                </label>
                {isEditing ? (
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                ) : (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-wrap font-mono text-sm">
                    {body}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="flex-1"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => {
                    setSubject("")
                    setBody("")
                    setIsEditing(false)
                  }}
                  variant="outline"
                >
                  Generate New
                </Button>
              </div>

              {isEditing && (
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="w-full"
                >
                  Done Editing
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
