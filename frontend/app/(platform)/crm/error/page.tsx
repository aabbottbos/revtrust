import { Suspense } from "react"
import ErrorContent from "./ErrorContent"

export const dynamic = 'force-dynamic'

export default function CRMErrorPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-2xl flex items-center justify-center min-h-[400px]">
        <div className="text-slate-600">Loading...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
