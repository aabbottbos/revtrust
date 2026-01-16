import { Suspense } from "react"
import ResultsClient from "./ResultsClient"
import { Loader2 } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
      </div>
    }>
      <ResultsClient />
    </Suspense>
  )
}
