"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, X, ThumbsUp, ThumbsDown } from "lucide-react"
import { analytics } from "@/lib/analytics"

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [sentiment, setSentiment] = useState<"positive" | "negative" | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!feedback.trim()) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          feedback,
          sentiment,
          page: window.location.pathname,
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        setSubmitted(true)

        // Track feedback submission
        analytics.feedbackSubmitted(sentiment)

        setTimeout(() => {
          setIsOpen(false)
          setSubmitted(false)
          setFeedback("")
          setSentiment(null)
        }, 2000)
      } else {
        console.error("Failed to submit feedback")
      }
    } catch (err) {
      console.error("Error submitting feedback:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg bg-revtrust-blue hover:bg-blue-700"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      ) : (
        <Card className="w-80 p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Send Feedback</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ThumbsUp className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-slate-600">Thanks for your feedback!</p>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <p className="text-sm text-slate-600 mb-2">How&apos;s your experience?</p>
                <div className="flex gap-2">
                  <Button
                    variant={sentiment === "positive" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSentiment("positive")}
                    className={sentiment === "positive" ? "bg-green-500 hover:bg-green-600" : ""}
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    Good
                  </Button>
                  <Button
                    variant={sentiment === "negative" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSentiment("negative")}
                    className={sentiment === "negative" ? "bg-red-500 hover:bg-red-600" : ""}
                  >
                    <ThumbsDown className="w-4 h-4 mr-1" />
                    Issues
                  </Button>
                </div>
              </div>

              <Textarea
                placeholder="Tell us what you think..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="mb-3"
              />

              <Button
                onClick={handleSubmit}
                disabled={!feedback.trim() || isSubmitting}
                className="w-full bg-revtrust-blue hover:bg-blue-700"
              >
                {isSubmitting ? "Sending..." : "Send Feedback"}
              </Button>
            </>
          )}
        </Card>
      )}
    </div>
  )
}
