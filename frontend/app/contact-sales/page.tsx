"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, CheckCircle2, Building2, Users, Zap } from "lucide-react"

export default function ContactSalesPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "",
    teamSize: "",
    message: ""
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // TODO: Integrate with your backend API to send the form data
    // Example:
    // await fetch('/api/contact-sales', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(formData)
    // })

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))

    setSubmitted(true)
    setSubmitting(false)

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false)
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        role: "",
        teamSize: "",
        message: ""
      })
    }, 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    })
  }

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

            <Link href="/pricing">
              <Button variant="ghost">Back to Pricing</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-black text-slate-900 mb-6">
              Ready to Transform Your{" "}
              <span style={{ color: '#2563EB' }}>Sales Team?</span>
            </h1>
            <p className="text-xl text-slate-600">
              Let&apos;s discuss how RevTrust Enterprise can help your team close more deals with AI-powered insights and CRM integration.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold mb-6">Contact Our Sales Team</h2>
              <p className="text-slate-600 mb-8">
                Fill out the form below and our team will reach out within 24 hours to discuss your needs.
              </p>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Smith"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      Work Email *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@company.com"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                      Phone Number (optional)
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-2">
                      Company Name *
                    </label>
                    <Input
                      id="company"
                      name="company"
                      type="text"
                      required
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Acme Inc."
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">
                      Your Role *
                    </label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => handleSelectChange("role", value)}
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales_rep">Sales Representative</SelectItem>
                        <SelectItem value="sales_manager">Sales Manager</SelectItem>
                        <SelectItem value="vp_sales">VP of Sales</SelectItem>
                        <SelectItem value="cro">Chief Revenue Officer</SelectItem>
                        <SelectItem value="revops">Revenue Operations</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label htmlFor="teamSize" className="block text-sm font-medium text-slate-700 mb-2">
                      Team Size *
                    </label>
                    <Select
                      value={formData.teamSize}
                      onValueChange={(value) => handleSelectChange("teamSize", value)}
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select team size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-5">1-5 users</SelectItem>
                        <SelectItem value="6-10">6-10 users</SelectItem>
                        <SelectItem value="11-25">11-25 users</SelectItem>
                        <SelectItem value="26-50">26-50 users</SelectItem>
                        <SelectItem value="51-100">51-100 users</SelectItem>
                        <SelectItem value="100+">100+ users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                      Tell us about your needs *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your sales team's challenges and what you're hoping to achieve with RevTrust..."
                      rows={6}
                      className="w-full"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    style={{ backgroundColor: '#2563EB' }}
                    className="w-full hover:bg-blue-700"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Contact Sales
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-slate-500 text-center">
                    By submitting this form, you agree to our terms and privacy policy.
                  </p>
                </form>
              ) : (
                <Card className="p-8 bg-green-50 border-green-200">
                  <div className="text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-green-900 mb-2">
                      Thank You!
                    </h3>
                    <p className="text-green-700">
                      Our sales team will contact you within 24 hours to discuss how RevTrust can help your team.
                    </p>
                  </div>
                </Card>
              )}
            </div>

            {/* Benefits Section */}
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-6">What You&apos;ll Get</h2>
              </div>

              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Dedicated Support</h3>
                    <p className="text-slate-600 text-sm">
                      Work directly with our team to set up RevTrust for your organization. Get custom onboarding, training, and ongoing support.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">CRM Integration</h3>
                    <p className="text-slate-600 text-sm">
                      Seamlessly connect with Salesforce, HubSpot, and other CRMs. Get real-time pipeline insights without manual data entry.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Unlimited Users</h3>
                    <p className="text-slate-600 text-sm">
                      Give your entire sales team access to AI-powered deal coaching and pipeline insights. No per-seat pricing.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-slate-50">
                <h3 className="font-bold text-lg mb-3">Enterprise Features</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-3"></div>
                    Everything in Pro plan
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-3"></div>
                    Unlimited users across your organization
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-3"></div>
                    Native CRM integration (Salesforce, HubSpot)
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-3"></div>
                    Team rollups and manager dashboards
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-3"></div>
                    Forecast confidence scoring
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-3"></div>
                    Priority support and custom onboarding
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-3"></div>
                    SSO and advanced security options
                  </li>
                </ul>
              </Card>

              <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="font-bold text-lg mb-2">Typical Response Time</h3>
                <p className="text-slate-700 text-sm">
                  Our sales team typically responds within 24 hours on business days. For urgent inquiries, email us directly at{" "}
                  <a
                    href="mailto:sales@revtrust.com"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    sales@revtrust.com
                  </a>
                </p>
              </Card>
            </div>
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
