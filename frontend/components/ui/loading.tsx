import { Loader2 } from "lucide-react"

interface LoadingProps {
  message?: string
  fullScreen?: boolean
}

export function Loading({ message = "Loading...", fullScreen = false }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-slate-600">{message}</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {content}
      </div>
    )
  }

  return <div className="py-12">{content}</div>
}
