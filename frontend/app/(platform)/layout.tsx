import { NavBar } from "@/components/layout/NavBar"
import { FeedbackWidget } from "@/components/feedback-widget"

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main>{children}</main>
      <FeedbackWidget />
    </div>
  )
}
