import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, TrendingUp, Target, Zap, Shield, Users, Brain } from "lucide-react"

export default function ProductPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
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

            <div className="hidden md:flex items-center space-x-8">
              <Link href="/product" className="text-slate-900 hover:text-slate-600 font-semibold">
                Product
              </Link>
              <Link href="/why-revtrust" className="text-slate-600 hover:text-slate-900 font-medium">
                Why RevTrust
              </Link>
              <Link href="/pricing" className="text-slate-600 hover:text-slate-900 font-medium">
                Pricing
              </Link>
              <Link href="/security" className="text-slate-600 hover:text-slate-900 font-medium">
                Security
              </Link>
            </div>

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
      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight">
              The AI Sales Coach Your Team{" "}
              <span style={{ color: '#2563EB' }}>Actually Wants to Use</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              RevTrust combines pipeline hygiene with AI-powered coaching to help sales teams hit quota.
              Clean data. Clear strategy. Confident forecasts.
            </p>
          </div>

          {/* 3-Tier Feature Overview */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="p-6 bg-white border-2 border-slate-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Pipeline Hygiene</h3>
              <p className="text-slate-600 text-sm mb-4">
                Instantly identify and fix data quality issues across your entire pipeline.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>14-point accuracy inspection</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Bulk fix wizard</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Real-time health scoring</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 bg-white border-2" style={{ borderColor: '#2563EB' }}>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI Deal Coaching</h3>
              <p className="text-slate-600 text-sm mb-4">
                Get personalized recommendations for every deal, powered by AI.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Win probability scoring</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Next best action suggestions</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Risk identification</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 bg-white border-2 border-slate-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Forecast Intelligence</h3>
              <p className="text-slate-600 text-sm mb-4">
                Submit forecasts with confidence using data-driven insights.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Accuracy vs clarity scoring</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Confidence intervals</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Team rollups</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Detailed Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Features That Drive Results
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Every feature is designed to save time, increase accuracy, and help you close more deals.
            </p>
          </div>

          <div className="max-w-6xl mx-auto space-y-20">
            {/* Feature 1: 5-Minute Cleanup Wizard */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4" style={{ backgroundColor: '#2563EB', color: 'white' }}>
                  PIPELINE HYGIENE
                </Badge>
                <h3 className="text-3xl font-bold mb-4">
                  5-Minute Cleanup Wizard
                </h3>
                <p className="text-lg text-slate-600 mb-6">
                  Turn hours of CRM cleanup into minutes. RevTrust identifies critical data quality
                  issues and lets you fix them in bulk with a few clicks.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-1">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold">14 Business Rules</p>
                      <p className="text-sm text-slate-600">
                        Automatically flag close dates in the past, missing next steps, stale deals, and more
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-1">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Bulk Actions</p>
                      <p className="text-sm text-slate-600">
                        Fix multiple deals at once instead of one-by-one updates
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-1">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Health Score Tracking</p>
                      <p className="text-sm text-slate-600">
                        See your pipeline health improve in real-time as you fix issues
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-100 rounded-xl p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-white rounded-lg shadow-xl p-6 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-slate-500">PIPELINE HEALTH</span>
                      <Badge className="bg-green-500 text-white">68%</Badge>
                    </div>
                    <div className="text-5xl font-bold text-slate-900 mb-2">42</div>
                    <div className="text-sm text-slate-600">Issues Found</div>
                  </div>
                  <p className="text-sm text-slate-600">
                    <Zap className="inline h-4 w-4 text-yellow-500 mr-1" />
                    Fix all in 5 minutes
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2: AI Deal Coach */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 bg-slate-100 rounded-xl p-8 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-slate-500">ACME CORP - $125K</span>
                    <Badge className="bg-yellow-500 text-white">Medium Risk</Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <Target className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Next Best Action</p>
                        <p className="text-xs text-slate-600">Schedule executive alignment call</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Users className="h-5 w-5 text-orange-600 mr-2 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Risk Detected</p>
                        <p className="text-xs text-slate-600">Missing economic buyer contact</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <Badge className="mb-4" style={{ backgroundColor: '#2563EB', color: 'white' }}>
                  AI COACHING
                </Badge>
                <h3 className="text-3xl font-bold mb-4">
                  Your Personal AI Deal Coach
                </h3>
                <p className="text-lg text-slate-600 mb-6">
                  Get intelligent recommendations for every deal in your pipeline. Our AI analyzes
                  stage progression, engagement patterns, and deal signals to prescribe next best actions.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-1">
                      <Check className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Win Probability Scoring</p>
                      <p className="text-sm text-slate-600">
                        Data-driven win rates based on deal characteristics and historical patterns
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-1">
                      <Check className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Deal Risk Analysis</p>
                      <p className="text-sm text-slate-600">
                        Identify at-risk deals before they slip with proactive alerts
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-1">
                      <Check className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Action Recommendations</p>
                      <p className="text-sm text-slate-600">
                        Specific next steps for multi-threading, re-engaging, and closing
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 3: Reality-Based Forecasting */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4" style={{ backgroundColor: '#2563EB', color: 'white' }}>
                  FORECASTING
                </Badge>
                <h3 className="text-3xl font-bold mb-4">
                  Reality-Based Forecasting
                </h3>
                <p className="text-lg text-slate-600 mb-6">
                  Stop guessing. Start forecasting with confidence using data-driven insights
                  that separate pipeline accuracy from deal clarity.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-1">
                      <Check className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Accuracy vs Clarity Scoring</p>
                      <p className="text-sm text-slate-600">
                        Understand both data quality AND deal predictability
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-1">
                      <Check className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Confidence Intervals</p>
                      <p className="text-sm text-slate-600">
                        Submit forecasts with statistical confidence ranges
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-1">
                      <Check className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Team Rollups</p>
                      <p className="text-sm text-slate-600">
                        Aggregate individual forecasts into team and org-level predictions
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-100 rounded-xl p-8">
                <div className="bg-white rounded-lg shadow-xl p-6">
                  <h4 className="font-semibold mb-4">Q4 Forecast</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600">Commit</span>
                        <span className="font-bold text-green-600">$2.4M</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">95% confidence</p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600">Best Case</span>
                        <span className="font-bold text-blue-600">$3.1M</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">65% confidence</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-white" style={{ background: 'linear-gradient(to bottom right, #2563EB, #1e40af)' }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to transform your pipeline?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Join sales teams using RevTrust to clean their CRM, coach their reps, and hit their numbers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignedOut>
              <SignUpButton mode="modal">
                <Button size="lg" className="bg-white hover:bg-slate-100 text-lg px-8" style={{ color: '#2563EB' }}>
                  Start Free Trial
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
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8">
                View Pricing
              </Button>
            </Link>
          </div>
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
                <li><Link href="/product" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/why-revtrust" className="hover:text-white">Why RevTrust</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Help Center</a></li>
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
