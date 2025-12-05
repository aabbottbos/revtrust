"use client"

import Link from "next/link"
import Image from "next/image"
import { UserButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Upload, History, Calendar } from "lucide-react"

export function NavBar() {
  const { user } = useUser()

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
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
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/upload"
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </Link>
            <Link
              href="/schedule"
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Calendar className="h-4 w-4" />
              <span>Scheduled Reviews</span>
            </Link>
            <Link
              href="/history"
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <History className="h-4 w-4" />
              <span>History</span>
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
