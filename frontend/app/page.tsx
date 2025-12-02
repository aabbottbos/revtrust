import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <span className="text-xl font-bold">RevTrust</span>
          </div>
          <div className="flex gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="outline">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>Get Started</Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/upload">
                <Button>Go to Dashboard</Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Turn messy pipeline data into{" "}
            <span className="text-blue-600">accurate forecasts</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            RevTrust analyzes your sales pipeline, identifies hygiene issues, and provides
            actionable recommendations to improve forecast accuracy.
          </p>
          <div className="flex gap-4 justify-center">
            <SignedOut>
              <SignUpButton mode="modal">
                <Button size="lg" className="text-lg px-8">
                  Start Free Analysis
                </Button>
              </SignUpButton>
              <SignInButton mode="modal">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/upload">
                <Button size="lg" className="text-lg px-8">
                  Upload Pipeline Data
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">26+ Business Rules</h3>
            <p className="text-gray-600">
              Comprehensive rules across data quality, sales hygiene, forecasting, progression, engagement, and compliance.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Instant Analysis</h3>
            <p className="text-gray-600">
              Upload your CSV or Excel file and get immediate insights into pipeline hygiene issues.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Actionable Remediation</h3>
            <p className="text-gray-600">
              Get specific recommendations for each issue, assigned to the right owner (rep, manager, or auto).
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-16 border-y">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Upload Your Pipeline Data</h3>
                <p className="text-gray-600">
                  Upload your pipeline export from any CRM (Salesforce, HubSpot, etc.). We support CSV and Excel formats.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">AI-Powered Analysis</h3>
                <p className="text-gray-600">
                  Our AI maps your fields, applies 26+ business rules, and identifies hygiene issues across your entire pipeline.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Get Actionable Insights</h3>
                <p className="text-gray-600">
                  Review violations by severity, see which deals need attention, and export remediation tasks for your team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to clean up your pipeline?</h2>
        <p className="text-xl text-gray-600 mb-8">
          Start analyzing your sales data in minutes
        </p>
        <SignedOut>
          <SignUpButton mode="modal">
            <Button size="lg" className="text-lg px-8">
              Get Started Free
            </Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <Link href="/upload">
            <Button size="lg" className="text-lg px-8">
              Upload Pipeline Data
            </Button>
          </Link>
        </SignedIn>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 RevTrust. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
