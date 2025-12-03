import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-slate-600">
            Choose the plan that's right for you
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free */}
          <Card className="p-8">
            <Badge className="mb-4 bg-slate-200 text-slate-700">FREE</Badge>
            <h3 className="text-2xl font-bold mb-2">Pipeline Health Check</h3>
            <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-slate-600">/mo</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center"><Check className="w-5 h-5 text-green-600 mr-2" />Unlimited CSV uploads</li>
              <li className="flex items-center"><Check className="w-5 h-5 text-green-600 mr-2" />14 business rules</li>
              <li className="flex items-center"><Check className="w-5 h-5 text-green-600 mr-2" />Export to CSV</li>
            </ul>
            <Link href="/sign-up">
              <Button className="w-full" variant="outline">Get Started</Button>
            </Link>
          </Card>

          {/* Pro */}
          <Card className="p-8 border-2 border-revtrust-blue">
            <Badge className="mb-4 bg-revtrust-blue text-white">PRO</Badge>
            <h3 className="text-2xl font-bold mb-2">AI Deal Coach</h3>
            <div className="text-4xl font-bold mb-6">$59<span className="text-lg text-slate-600">/mo</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center"><Check className="w-5 h-5 text-revtrust-blue mr-2" />Everything in Free</li>
              <li className="flex items-center"><Check className="w-5 h-5 text-revtrust-blue mr-2" />AI Risk Scoring</li>
              <li className="flex items-center"><Check className="w-5 h-5 text-revtrust-blue mr-2" />Next Best Action</li>
              <li className="flex items-center"><Check className="w-5 h-5 text-revtrust-blue mr-2" />AI Pipeline Review</li>
            </ul>
            <Link href="/sign-up">
              <Button className="w-full bg-revtrust-blue">Start Trial</Button>
            </Link>
          </Card>

          {/* Enterprise */}
          <Card className="p-8">
            <Badge className="mb-4 bg-slate-200 text-slate-700">ENTERPRISE</Badge>
            <h3 className="text-2xl font-bold mb-2">Team & Enterprise</h3>
            <div className="text-4xl font-bold mb-6">Custom</div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center"><Check className="w-5 h-5 text-green-600 mr-2" />Everything in Pro</li>
              <li className="flex items-center"><Check className="w-5 h-5 text-green-600 mr-2" />Unlimited users</li>
              <li className="flex items-center"><Check className="w-5 h-5 text-green-600 mr-2" />CRM Integration</li>
              <li className="flex items-center"><Check className="w-5 h-5 text-green-600 mr-2" />Dedicated support</li>
            </ul>
            <Button className="w-full" variant="outline">Contact Sales</Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
