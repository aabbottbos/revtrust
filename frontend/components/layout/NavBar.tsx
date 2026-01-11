"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { UserButton, useUser } from "@clerk/nextjs"
import { LayoutDashboard, Play, History, Settings } from "lucide-react"

export function NavBar() {
    const { user } = useUser()
    const pathname = usePathname()

    const isActive = (path: string) => {
        if (path === "/dashboard") {
            return pathname === "/dashboard"
        }
        return pathname.startsWith(path)
    }

    const linkClass = (path: string) => `
        flex items-center space-x-2 px-3 py-2 rounded-md transition-colors
        ${isActive(path)
            ? "text-blue-600 bg-blue-50"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        }
    `

    return (
        <nav className="border-b bg-white">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center">
                        <Image
                            src="/revtrust-logo.png"
                            alt="RevTrust"
                            width={200}
                            height={50}
                            className="h-10 w-auto"
                            priority
                        />
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-1">
                        <Link href="/dashboard" className={linkClass("/dashboard")}>
                            <LayoutDashboard className="h-4 w-4" />
                            <span>Dashboard</span>
                        </Link>
                        <Link href="/scan" className={linkClass("/scan")}>
                            <Play className="h-4 w-4" />
                            <span>Scan</span>
                        </Link>
                        <Link href="/history" className={linkClass("/history")}>
                            <History className="h-4 w-4" />
                            <span>History</span>
                        </Link>
                        <Link href="/settings" className={linkClass("/settings")}>
                            <Settings className="h-4 w-4" />
                            <span>Settings</span>
                        </Link>
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        {user && (
                            <div className="hidden md:block text-sm text-slate-600">
                                {user.firstName || user.emailAddresses[0].emailAddress}
                            </div>
                        )}
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </div>
        </nav>
    )
}
