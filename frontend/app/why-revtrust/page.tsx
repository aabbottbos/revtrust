import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, X, Minus } from "lucide-react"

export default function WhyRevTrustPage() {
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
              <Link href="/product" className="text-slate-600 hover:text-slate-900 font-medium">
                Product
              </Link>
              <Link href="/why-revtrust" className="text-slate-900 hover:text-slate-600 font-semibold">
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
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight">
              Why RevTrust Beats{" "}
              <span style={{ color: '#2563EB' }}>Everything Else</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              RevTrust is the only platform that combines pipeline hygiene with AI coaching.
              We don&apos;t just show you the problems—we fix them and tell you what to do next.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold mb-4">How We Compare</h2>
              <p className="text-slate-600">
                See how RevTrust stacks up against the alternatives
              </p>
            </div>

            {/* Desktop Comparison Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-4 px-4 font-semibold text-slate-900">Feature</th>
                    <th className="text-center py-4 px-4 font-semibold" style={{ color: '#2563EB' }}>
                      RevTrust
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-600">Clari</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-600">Gong</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-600">Manual Spreadsheets</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-4 px-4 font-medium">Pipeline Data Cleanup</td>
                    <td className="text-center py-4 px-4">
                      <Check className="h-6 w-6 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-4">
                      <X className="h-6 w-6 text-red-400 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-4">
                      <X className="h-6 w-6 text-red-400 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-4">
                      <Minus className="h-6 w-6 text-slate-300 mx-auto" />
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-4 px-4 font-medium">AI Deal Coaching</td>
                    <td className="text-center py-4 px-4">
                      <Check className="h-6 w-6 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-4">
                      <Minus className="h-6 w-6 text-slate-300 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-4">
                      <Check className="h-6 w-6 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-4">
                      <X className="h-6 w-6 text-red-400 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">Easy CSV Upload</td>
                    <td className="text-center py-4 px-4">
                      <Check className="h-6 w-6 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-4">
                      <X className="h-6 w-6 text-red-400 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-4">
                      <X className="h-6 w-6 text-red-400 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-4">
                      <Check className="h-6 w-6 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-4 px-4 font-medium">Real-Time Health Scoring</td>
                    <td className="text-center py-4 px-4">
                      <Check className="h-6 w-6 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-4">
                      <Check className="h-6 w-6 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-4">
                      <Minus className="h-6 w-6 text-slate-300 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-4">
                      <X className="h-6 w-6 text-red-400 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">Forecast Confidence Scoring</td>
                    <td className="text-center py-4 px-4">
                      <Check className="h-6 w-6 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-4">
                      <Check className="h-6 w-6 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-4">
                      <X className="h-6 w-6 text-red-400 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-4">
                      <X className="h-6 w-6 text-red-400 mx-auto" />
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-4 px-4 font-medium">Setup Time</td>
                    <td className="text-center py-4 px-4">
                      <span className="text-sm font-semibold text-green-600">5 minutes</span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-sm text-slate-600">2-4 weeks</span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-sm text-slate-600">1-2 weeks</span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-sm text-slate-600">Immediate</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">Starting Price</td>
                    <td className="text-center py-4 px-4">
                      <span className="text-sm font-bold" style={{ color: '#2563EB' }}>$0 (Free)</span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-sm text-slate-600">$100+/user</span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-sm text-slate-600">$1,200+/user</span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-sm text-slate-600">Free</span>
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-4 px-4 font-medium">Best For</td>
                    <td className="text-center py-4 px-4">
                      <span className="text-sm font-semibold" style={{ color: '#2563EB' }}>
                        AEs & Managers
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-sm text-slate-600">Enterprise VPs</span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-sm text-slate-600">Sales Leaders</span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-sm text-slate-600">DIY Users</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Comparison Cards */}
            <div className="lg:hidden space-y-6">
              <Card className="p-6 border-2" style={{ borderColor: '#2563EB' }}>
                <h3 className="font-bold text-xl mb-4" style={{ color: '#2563EB' }}>RevTrust</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                    Pipeline Data Cleanup
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                    AI Deal Coaching
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                    Easy CSV Upload
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                    Real-Time Health Scoring
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                    Forecast Confidence Scoring
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm"><span className="font-semibold">Setup:</span> 5 minutes</p>
                  <p className="text-sm"><span className="font-semibold">Price:</span> Free to start</p>
                  <p className="text-sm"><span className="font-semibold">Best for:</span> AEs & Managers</p>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-xl mb-4 text-slate-700">Clari</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center text-slate-400">
                    <X className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                    Pipeline Data Cleanup
                  </li>
                  <li className="flex items-center text-slate-600">
                    <Minus className="h-5 w-5 text-slate-300 mr-2 flex-shrink-0" />
                    Limited AI Coaching
                  </li>
                  <li className="flex items-center text-slate-400">
                    <X className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                    Easy CSV Upload
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                    Real-Time Health Scoring
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                    Forecast Confidence Scoring
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm"><span className="font-semibold">Setup:</span> 2-4 weeks</p>
                  <p className="text-sm"><span className="font-semibold">Price:</span> $100+/user</p>
                  <p className="text-sm"><span className="font-semibold">Best for:</span> Enterprise VPs</p>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-xl mb-4 text-slate-700">Gong</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center text-slate-400">
                    <X className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                    Pipeline Data Cleanup
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                    AI Deal Coaching
                  </li>
                  <li className="flex items-center text-slate-400">
                    <X className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                    Easy CSV Upload
                  </li>
                  <li className="flex items-center text-slate-600">
                    <Minus className="h-5 w-5 text-slate-300 mr-2 flex-shrink-0" />
                    Limited Health Scoring
                  </li>
                  <li className="flex items-center text-slate-400">
                    <X className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                    Forecast Confidence Scoring
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm"><span className="font-semibold">Setup:</span> 1-2 weeks</p>
                  <p className="text-sm"><span className="font-semibold">Price:</span> $1,200+/user</p>
                  <p className="text-sm"><span className="font-semibold">Best for:</span> Sales Leaders</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Key Differentiators */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">What Makes RevTrust Different</h2>

            <div className="space-y-8">
              <Card className="p-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-2xl font-bold" style={{ color: '#2563EB' }}>1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">We Fix Problems, Not Just Find Them</h3>
                    <p className="text-slate-600">
                      Other tools show you dashboards with red flags. RevTrust gives you a 5-minute cleanup wizard
                      that fixes data quality issues in bulk. You spend less time on admin and more time selling.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-2xl font-bold" style={{ color: '#2563EB' }}>2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Built for AEs First, Managers Second</h3>
                    <p className="text-slate-600">
                      Enterprise tools are designed for VPs and require weeks of implementation. RevTrust works
                      instantly with a CSV upload—no IT department needed. Individual reps get value on day one.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-2xl font-bold" style={{ color: '#2563EB' }}>3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Hygiene + Strategy = Real Impact</h3>
                    <p className="text-slate-600">
                      Gong tells you what happened on calls. Clari shows you forecast accuracy. Only RevTrust
                      combines clean data with AI coaching to tell you exactly what to do next on every deal.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-2xl font-bold" style={{ color: '#2563EB' }}>4</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Free Tier That Actually Works</h3>
                    <p className="text-slate-600">
                      Most tools require enterprise contracts. RevTrust offers a genuinely useful free tier with
                      unlimited CSV uploads and 14-point accuracy inspection. Try it before you buy.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Who Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Who Benefits from RevTrust?</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-4">For Individual AEs</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Defend your forecast in 1-on-1s with data, not gut feelings</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Clean up your pipeline in 5 minutes every Friday</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Get AI coaching on what to do next with at-risk deals</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Track quota progress in real-time</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-8">
                <h3 className="text-xl font-bold mb-4">For Sales Managers</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">See team pipeline health before the forecast call</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Identify coaching opportunities across your team</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Submit forecasts with confidence intervals</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Generate executive summaries automatically</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-white" style={{ background: 'linear-gradient(to bottom right, #2563EB, #1e40af)' }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to see the difference?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Join sales teams choosing RevTrust over expensive enterprise tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignedOut>
              <SignUpButton mode="modal">
                <Button size="lg" className="bg-white hover:bg-slate-100 text-lg px-8" style={{ color: '#2563EB' }}>
                  Try Free (No Credit Card)
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
            <Link href="/product">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8">
                Explore Features
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
