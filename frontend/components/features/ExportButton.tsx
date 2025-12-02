"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, Copy, Check, Loader2, Printer, Link } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ExportButtonProps {
  analysisId: string
  filename: string
}

export function ExportButton({ analysisId, filename }: ExportButtonProps) {
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const { toast } = useToast()

  const handleDownloadCSV = async () => {
    try {
      setDownloading(true)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analysis/${analysisId}/export/csv`,
        {
          credentials: 'include',
        }
      )

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You don't have access to this analysis")
        } else if (response.status === 404) {
          throw new Error("Analysis not found")
        } else {
          throw new Error("Export failed")
        }
      }

      // Get the blob
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `revtrust-${filename.replace('.csv', '').replace('.xlsx', '')}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Export successful",
        description: "Your report has been downloaded",
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleCopySummary = async () => {
    try {
      setCopying(true)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analysis/${analysisId}/export/summary`,
        {
          credentials: 'include',
        }
      )

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You don't have access to this analysis")
        } else if (response.status === 404) {
          throw new Error("Analysis not found")
        } else {
          throw new Error("Failed to get summary")
        }
      }

      const data = await response.json()

      // Copy to clipboard
      await navigator.clipboard.writeText(data.summary)

      setCopied(true)

      toast({
        title: "Copied to clipboard",
        description: "Summary has been copied",
      })

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Copy failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setCopying(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const copyShareLink = async () => {
    const url = `${window.location.origin}/results/${analysisId}`
    await navigator.clipboard.writeText(url)

    toast({
      title: "Link copied",
      description: "Share this link to view results",
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleDownloadCSV} disabled={downloading}>
          {downloading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Download CSV Report
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleCopySummary} disabled={copying}>
          {copying ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : copied ? (
            <Check className="h-4 w-4 mr-2 text-green-600" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          {copied ? "Copied!" : "Copy Summary"}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print Results
        </DropdownMenuItem>

        <DropdownMenuItem onClick={copyShareLink}>
          <Link className="h-4 w-4 mr-2" />
          Copy Share Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
