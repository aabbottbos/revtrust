import { NavBar } from "@/components/layout/NavBar"
import { FeedbackWidget } from "@/components/feedback-widget"
import { OnboardingCheck } from "@/components/onboarding/OnboardingCheck"

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <OnboardingCheck />
      <NavBar />
      <main>{children}</main>
      <FeedbackWidget />
    </div>
  )
}
