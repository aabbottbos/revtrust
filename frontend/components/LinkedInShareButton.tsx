"use client"

import { Button } from "@/components/ui/button"
import { Share2, Linkedin } from "lucide-react"

interface LinkedInShareButtonProps {
  dealCount: number
  healthScore?: number
  riskScore?: number
  highRiskCount?: number
}

export function LinkedInShareButton({
  dealCount,
  healthScore,
  riskScore,
  highRiskCount
}: LinkedInShareButtonProps) {
  const shareOnLinkedIn = () => {
    let text = `Just analyzed my pipeline with @RevTrust AI:\n\n`

    if (healthScore !== undefined) {
      text += `📊 ${dealCount} deals analyzed\n`
      text += `🎯 Health Score: ${healthScore}/100\n`
    }

    if (riskScore !== undefined && highRiskCount !== undefined) {
      text += `📊 ${dealCount} deals analyzed\n`
      text += `⚠️ Average Risk Score: ${riskScore.toFixed(1)}/100\n`
      text += `🚨 ${highRiskCount} high-risk deals identified\n`
    }

    text += `\n`
    text += `Game-changer for forecast accuracy! Try it: https://revtrust.com`

    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://revtrust.com')}&summary=${encodeURIComponent(text)}`

    window.open(linkedInUrl, '_blank', 'width=600,height=600')
  }

  return (
    <Button
      onClick={shareOnLinkedIn}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Linkedin className="w-4 h-4" />
      Share on LinkedIn
    </Button>
  )
}
