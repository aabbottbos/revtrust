"use client"

import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'

/**
 * Admin header component
 * Displays admin mode indicator and exit button
 */
export function AdminHeader() {
  const router = useRouter()

  return (
    <div className="bg-slate-800 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            <span className="text-amber-500 font-medium text-sm">Admin Mode</span>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            Exit Admin
          </button>
        </div>
      </div>
    </div>
  )
}
