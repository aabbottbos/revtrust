import { AdminHeader } from '@/components/admin/AdminHeader'

/**
 * Admin layout
 * Admin routes are protected by middleware.ts which verifies admin access
 * No additional server-side check needed here
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Admin header bar */}
      <AdminHeader />
      {children}
    </div>
  )
}
