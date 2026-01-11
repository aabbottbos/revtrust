import Link from "next/link"
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-orange-500 rounded"></div>
            <span className="font-bold text-xl">RevTrust</span>
          </div>

          <nav className="flex items-center space-x-6">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost">Login</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>Start Free Trial</Button>
              </SignUpButton>
            </SignedOut>

            <SignedIn>
              <Link href="/dashboard">
                <Button>Analyze Pipeline</Button>
              </Link>
            </SignedIn>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Stop Guessing. Start Closing.
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Turn messy pipeline data into accurate forecasts and actionable strategy.
            The first AI sales coach that cleans your CRM and gives you exactly how to hit quota.
          </p>

          <SignedOut>
            <SignUpButton mode="modal">
              <Button size="lg" className="text-lg px-8">
                Check My Pipeline Accuracy (Free)
              </Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8">
                Analyze Your Pipeline
              </Button>
            </Link>
          </SignedIn>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 RevTrust. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
