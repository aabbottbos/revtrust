"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MessageSquare, Phone, CheckCircle2 } from "lucide-react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: ""
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))

    setSubmitted(true)
    setSubmitting(false)

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false)
      setFormData({ name: "", email: "", company: "", message: "" })
    }, 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
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

            <Link href="/">
              <Button variant="ghost">Back to Home</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-black text-slate-900 mb-6">
              Let&apos;s Talk About{" "}
              <span style={{ color: '#2563EB' }}>Your Pipeline</span>
            </h1>
            <p className="text-xl text-slate-600">
              Whether you&apos;re an individual AE or managing a sales team, we&apos;re here to help.
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
              <h2 className="text-3xl font-bold mb-6">Send us a message</h2>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                      Name *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@company.com"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-2">
                      Company
                    </label>
                    <Input
                      id="company"
                      name="company"
                      type="text"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Your company name"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                      Message *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your needs..."
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
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-slate-500 text-center">
                    We typically respond within 24 hours
                  </p>
                </form>
              ) : (
                <Card className="p-8 bg-green-50 border-green-200">
                  <div className="text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-green-900 mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-green-700">
                      Thanks for reaching out. We&apos;ll get back to you within 24 hours.
                    </p>
                  </div>
                </Card>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-6">Other ways to reach us</h2>
              </div>

              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Email Us</h3>
                    <p className="text-slate-600 text-sm mb-2">
                      For general inquiries and support
                    </p>
                    <a
                      href="mailto:hello@revtrust.com"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      hello@revtrust.com
                    </a>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Sales Inquiries</h3>
                    <p className="text-slate-600 text-sm mb-2">
                      For team plans and enterprise features
                    </p>
                    <a
                      href="mailto:sales@revtrust.com"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      sales@revtrust.com
                    </a>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Enterprise Support</h3>
                    <p className="text-slate-600 text-sm">
                      For enterprise customers, we offer dedicated support, custom onboarding, and
                      priority response times.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-slate-50">
                <h3 className="font-bold text-lg mb-3">What to Expect</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-3"></div>
                    Response within 24 hours
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-3"></div>
                    Custom pricing for teams of 5+
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-3"></div>
                    Dedicated onboarding support
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-3"></div>
                    CRM integration assistance
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-2">How quickly can I get started?</h3>
              <p className="text-slate-600">
                You can start using RevTrust in under 5 minutes. Simply sign up, upload a CSV of your
                pipeline data, and you&apos;ll get instant insights. No lengthy setup or IT involvement required.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-lg mb-2">Do you offer a free trial?</h3>
              <p className="text-slate-600">
                Yes! Our free tier includes unlimited CSV uploads and 14-point accuracy inspection. You can
                use it forever without a credit card. Upgrade to Pro ($59/month) for AI coaching features.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-lg mb-2">Can I integrate with my CRM?</h3>
              <p className="text-slate-600">
                CRM integration (Salesforce, HubSpot) is available for Enterprise customers. Contact our
                sales team to discuss your integration needs.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-lg mb-2">Is my data secure?</h3>
              <p className="text-slate-600">
                Absolutely. We use enterprise-grade encryption, never share your data with third parties,
                and maintain SOC 2 compliance. Learn more on our{" "}
                <Link href="/security" className="text-blue-600 hover:text-blue-700 font-medium">
                  security page
                </Link>
                .
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-lg mb-2">What&apos;s included in the Enterprise plan?</h3>
              <p className="text-slate-600">
                Enterprise includes everything in Pro plus: unlimited users, CRM integration, team rollups,
                forecast confidence scoring, dedicated support, and custom onboarding. Contact sales for pricing.
              </p>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-slate-600 mb-4">
              Still have questions?
            </p>
            <p className="text-sm text-slate-500">
              Not ready to talk?{" "}
              <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                Start with a free account
              </Link>
            </p>
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
