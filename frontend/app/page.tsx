import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, AlertCircle, TrendingUp } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white sticky top-0 z-50">
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
            <div className="hidden md:flex items-center space-x-8">
              <a href="#product" className="text-slate-600 hover:text-slate-900 font-medium">
                Product
              </a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 font-medium">
                Pricing
              </a>
              <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 font-medium">
                How It Works
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="ghost">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button style={{ backgroundColor: '#2563EB' }} className="hover:bg-blue-700">
                    Get Started
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/upload">
                  <Button style={{ backgroundColor: '#2563EB' }} className="hover:bg-blue-700">
                    Go to Dashboard
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Copy */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-black text-slate-900 leading-tight">
                  Stop Guessing.{" "}
                  <span style={{ color: '#2563EB' }}>Start Closing.</span>
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed">
                  Turn messy pipeline data into accurate forecasts and actionable strategy.
                  The first AI sales coach that cleans your CRM and tells you exactly how to hit quota.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <SignedOut>
                  <SignUpButton mode="modal">
                    <Button size="lg" style={{ backgroundColor: '#2563EB' }} className="w-full sm:w-auto hover:bg-blue-700 text-lg px-8">
                      Check My Pipeline Accuracy (Free)
                    </Button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/upload">
                    <Button size="lg" style={{ backgroundColor: '#2563EB' }} className="w-full sm:w-auto hover:bg-blue-700 text-lg px-8">
                      Upload Pipeline Data
                    </Button>
                  </Link>
                </SignedIn>
                <a href="#how-it-works">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                    See How It Works
                  </Button>
                </a>
              </div>

              {/* Trust Indicator */}
              <p className="text-sm text-slate-500">
                No credit card required. Supports CSV upload or Salesforce/HubSpot
              </p>
            </div>

            {/* Right Column - Visual */}
            <div className="relative">
              <div className="relative z-10">
                {/* Before/After Visual */}
                <div className="bg-white rounded-xl shadow-2xl p-6 space-y-4">
                  {/* Messy Data Representation */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-semibold">YOUR PIPELINE TODAY</span>
                      <Badge variant="destructive" className="text-xs">42% Issues</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 bg-red-500 rounded" style={{ width: "80%" }}></div>
                      <div className="h-3 bg-red-500 rounded" style={{ width: "65%" }}></div>
                      <div className="h-3 bg-orange-400 rounded" style={{ width: "90%" }}></div>
                      <div className="h-3 bg-red-500 rounded" style={{ width: "55%" }}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center py-4">
                    <div className="bg-blue-600 text-white rounded-full p-3">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Clean Dashboard Representation */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-semibold">WITH REVTRUST</span>
                      <Badge className="bg-green-500 text-white text-xs">68% Health</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-blue-900">68</div>
                        <div className="text-xs text-blue-700">Health Score</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-green-900">58</div>
                        <div className="text-xs text-green-700">Clean Deals</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Decoration */}
              <div className="absolute -z-10 top-10 right-10 w-72 h-72 bg-blue-600 opacity-5 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Your CRM is a Graveyard of Good Intentions.
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Everyone relies on the pipeline, but nobody trusts it.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* For AEs */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">For AEs:</h3>
              <p className="text-slate-600 text-sm">
                You scramble every Friday to explain deals you don&apos;t know if you&apos;ll close until the last week of the quarter.
              </p>
            </Card>

            {/* For Managers */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">For Managers:</h3>
              <p className="text-slate-600 text-sm">
                Your weekly forecasting session is more interrogation-style (&quot;Is this deal real?&quot;) instead of coaching strategy.
              </p>
            </Card>

            {/* For VPs */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">For VPs:</h3>
              <p className="text-slate-600 text-sm">
                You submit forecasts hoping they don&apos;t miss by more than 10%, risking credibility with the board.
              </p>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-2xl font-semibold text-slate-900">
              The Result? Sandbagging, &quot;happy ears,&quot; and missed revenue.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Meet RevTrust: Hygiene Meets Strategy.
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              We don&apos;t just show you the data. We fix it, then we tell you what to do with it.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <Card className="p-8 bg-white">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">1. The 5-Minute Cleanup Wizard</h3>
              <p className="text-slate-600 mb-4">
                Gamify your grunt work. RevTrust instantly flags &quot;close dates in the past,&quot; &quot;million-dollar deals,&quot; and &quot;missing next steps.&quot; Fix them in bulk with a few clicks.
              </p>
              <p className="text-sm font-semibold" style={{ color: '#2563EB' }}>
                Benefit: Turn 2 hours of admin work into 5 minutes.
              </p>
            </Card>

            {/* Feature 2 - Highlighted */}
            <Card className="p-8 bg-white border-2" style={{ borderColor: '#2563EB' }}>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">2. Your Personal AI Deal Coach</h3>
              <p className="text-slate-600 mb-4">
                Stop asking &quot;What&apos;s next?&quot; Our AI analyzes deal stages, time-in-stage, and engagement to prescribe the next best action.
              </p>
              <p className="text-sm font-semibold" style={{ color: '#2563EB' }}>
                Benefit: A 24/7 coach that helps you multi-thread, re-engage ghosts, and negotiate—without judgment.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-8 bg-white">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Reality-Based Forecasting</h3>
              <p className="text-slate-600 mb-4">
                Move from &quot;I think&quot; to &quot;The data says.&quot; We separate Accuracy (is the data clean?) from Clarity (do we know when it closes?).
              </p>
              <p className="text-sm font-semibold" style={{ color: '#2563EB' }}>
                Benefit: Commit your number with confidence intervals based on historical win rates, not gut feelings.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section id="product" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Who is RevTrust for?</h2>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* For Account Executives */}
            <div>
              <h3 className="text-2xl font-bold mb-6">For Account Executives:</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Your Personal Defense Attorney</p>
                    <p className="text-sm text-slate-600">
                      Your manager wants to know why you committed a deal. RevTrust helps you build the case.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Quota Tracker: Know where you stand in real-time</p>
                    <p className="text-sm text-slate-600">
                      Not a CRM update—RevTrust tracks your actual likelihood to close vs target.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Deal Doctor: Analyze this deal and tell me the top 3 risks</p>
                    <p className="text-sm text-slate-600">
                      Get specific, per-deal analysis instantly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Action Items: Generate re-engagement emails for stalled deals instantly</p>
                    <p className="text-sm text-slate-600">
                      AI-powered outreach suggestions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Sales Managers */}
            <div>
              <h3 className="text-2xl font-bold mb-6">For Sales Managers:</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">The Truth Teller</p>
                    <p className="text-sm text-slate-600">
                      Stop flying blind. Get an objective view of your team&apos;s pipeline health before the forecast call.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Risk Radar: Spot &quot;at-risk&quot; deals weeks before they slip</p>
                    <p className="text-sm text-slate-600">
                      Proactive deal management.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Coaching Bottlenecks: Identify exactly which rep needs help on which deal</p>
                    <p className="text-sm text-slate-600">
                      Data-driven coaching priorities.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Automated Rollups: Generate your forecast narrative for the VP in seconds</p>
                    <p className="text-sm text-slate-600">
                      AI-generated executive summaries.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Pricing that pays for itself in one closed deal.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Tier */}
            <Card className="p-8">
              <div className="mb-6">
                <Badge className="mb-4 bg-slate-200 text-slate-700">FREE</Badge>
                <h3 className="text-2xl font-bold mb-2">Free Accuracy Check</h3>
                <p className="text-slate-600 text-sm">
                  Best for AEs testing the waters.
                </p>
              </div>

              <div className="mb-6">
                <div className="text-4xl font-bold">$0</div>
                <div className="text-slate-600">/month</div>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start space-x-2">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited CSV uploads</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">14-point accuracy inspection</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Basic pipeline dashboard</span>
                </li>
              </ul>

              <SignedOut>
                <SignUpButton mode="modal">
                  <Button className="w-full" variant="outline">
                    Start Free
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/upload">
                  <Button className="w-full" variant="outline">
                    Go to Dashboard
                  </Button>
                </Link>
              </SignedIn>
            </Card>

            {/* Pro Tier - Highlighted */}
            <Card className="p-8 border-2 relative" style={{ borderColor: '#2563EB' }}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="text-white px-4 py-1" style={{ backgroundColor: '#2563EB' }}>
                  MOST POPULAR
                </Badge>
              </div>

              <div className="mb-6">
                <Badge className="mb-4 bg-blue-100" style={{ color: '#2563EB' }}>PRO</Badge>
                <h3 className="text-2xl font-bold mb-2">Pro Coach</h3>
                <p className="text-slate-600 text-sm">
                  Best for high-performing AEs.
                </p>
              </div>

              <div className="mb-6">
                <div className="text-4xl font-bold">$59</div>
                <div className="text-slate-600">/month</div>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start space-x-2">
                  <Check className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#2563EB' }} />
                  <span className="text-sm font-semibold">Includes everything in Free</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#2563EB' }} />
                  <span className="text-sm">AI Deal Scoring & Win Probability</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#2563EB' }} />
                  <span className="text-sm">Next Best Action Recommendations</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#2563EB' }} />
                  <span className="text-sm">Generative Email & Strategy Coaching</span>
                </li>
              </ul>

              <SignedOut>
                <SignUpButton mode="modal">
                  <Button className="w-full hover:bg-blue-700" style={{ backgroundColor: '#2563EB' }}>
                    Start Trial
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/upload">
                  <Button className="w-full hover:bg-blue-700" style={{ backgroundColor: '#2563EB' }}>
                    Go to Dashboard
                  </Button>
                </Link>
              </SignedIn>
            </Card>

            {/* Team/Enterprise Tier */}
            <Card className="p-8">
              <div className="mb-6">
                <Badge className="mb-4 bg-slate-200 text-slate-700">ENTERPRISE</Badge>
                <h3 className="text-2xl font-bold mb-2">Team & Enterprise</h3>
                <p className="text-slate-600 text-sm">
                  Managers & VPs benefit from...
                </p>
              </div>

              <div className="mb-6">
                <div className="text-4xl font-bold">Contact Sales</div>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start space-x-2">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Team Rollups & Leaderboards</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">CRM Integration (Salesforce/HubSpot)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Forecast Confidence Scoring</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Dedicated Support & Onboarding</span>
                </li>
              </ul>

              <Link href="/contact">
                <Button className="w-full" variant="outline">
                  Contact Sales
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 text-white" style={{ background: 'linear-gradient(to bottom right, #2563EB, #1e40af)' }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to hit your number without the panic?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Join high-performing reps using RevTrust to clean their pipeline and close more deals.
          </p>
          <SignedOut>
            <SignUpButton mode="modal">
              <Button size="lg" className="bg-white hover:bg-slate-100 text-lg px-8" style={{ color: '#2563EB' }}>
                Analyze My Pipeline Now
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/upload">
              <Button size="lg" className="bg-white hover:bg-slate-100 text-lg px-8" style={{ color: '#2563EB' }}>
                Upload Pipeline Data
              </Button>
            </Link>
          </SignedIn>
          <p className="mt-4 text-sm text-blue-200">
            (No credit card required)
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <Image
                  src="/revtrust-logo.png"
                  alt="RevTrust"
                  width={160}
                  height={40}
                  className="h-8 w-auto brightness-0 invert"
                />
              </div>
              <p className="text-sm text-slate-400">
                The AI sales coach that cleans your CRM and tells you how to hit quota.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#product" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Case Studies</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>&copy; {new Date().getFullYear()} RevTrust. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
