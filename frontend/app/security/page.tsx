import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Lock, Server, Eye, FileCheck, Key, Database, Users } from "lucide-react"

export default function SecurityPage() {
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
              <Link href="/security" className="text-slate-900 hover:text-slate-600 font-semibold">
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <Shield className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight">
              Your Data is{" "}
              <span style={{ color: '#2563EB' }}>Safe With Us</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              Enterprise-grade security and privacy for your sensitive sales data.
              We take security seriously so you can trust us with your pipeline.
            </p>
          </div>
        </div>
      </section>

      {/* Security Features Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <Card className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <Lock className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-bold mb-2">Encrypted at Rest</h3>
                <p className="text-sm text-slate-600">
                  AES-256 encryption for all stored data
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Key className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-bold mb-2">Encrypted in Transit</h3>
                <p className="text-sm text-slate-600">
                  TLS 1.3 for all data transfers
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <Server className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-bold mb-2">Secure Infrastructure</h3>
                <p className="text-sm text-slate-600">
                  Hosted on SOC 2 compliant cloud providers
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                  <Eye className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="font-bold mb-2">Zero Data Sharing</h3>
                <p className="text-sm text-slate-600">
                  Your data is never sold or shared with third parties
                </p>
              </Card>
            </div>

            {/* Detailed Security Information */}
            <div className="space-y-12">
              {/* Data Encryption */}
              <div className="grid lg:grid-cols-2 gap-8 items-start">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <Lock className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold">Data Encryption</h2>
                  </div>
                  <p className="text-slate-600 mb-4">
                    All your pipeline data is protected with military-grade encryption both at rest and in transit.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 mr-3"></div>
                      <div>
                        <p className="font-semibold">AES-256 Encryption at Rest</p>
                        <p className="text-sm text-slate-600">
                          The same encryption standard used by banks and government agencies
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 mr-3"></div>
                      <div>
                        <p className="font-semibold">TLS 1.3 in Transit</p>
                        <p className="text-sm text-slate-600">
                          All data transfers use the latest secure protocol
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 mr-3"></div>
                      <div>
                        <p className="font-semibold">Encrypted Backups</p>
                        <p className="text-sm text-slate-600">
                          All backups are encrypted and stored securely
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                <Card className="p-8 bg-slate-50">
                  <h3 className="font-bold mb-4">Security Certifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Badge className="bg-green-500 text-white mr-3">✓</Badge>
                      <div>
                        <p className="font-semibold">SOC 2 Type II</p>
                        <p className="text-xs text-slate-600">Infrastructure compliance</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Badge className="bg-blue-500 text-white mr-3">✓</Badge>
                      <div>
                        <p className="font-semibold">GDPR Compliant</p>
                        <p className="text-xs text-slate-600">EU data protection standards</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Badge className="bg-purple-500 text-white mr-3">✓</Badge>
                      <div>
                        <p className="font-semibold">CCPA Compliant</p>
                        <p className="text-xs text-slate-600">California privacy rights</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Privacy & Data Handling */}
              <div className="grid lg:grid-cols-2 gap-8 items-start">
                <Card className="p-8 bg-slate-50 order-2 lg:order-1">
                  <h3 className="font-bold mb-4">Data Handling Principles</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Your data belongs to you. We&apos;re just the caretakers.</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>We never use your data to train public AI models.</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>We never sell or share your data with third parties.</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>You can delete your data at any time, permanently.</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>We retain data only as long as you need it.</span>
                    </li>
                  </ul>
                </Card>

                <div className="order-1 lg:order-2">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <Eye className="h-6 w-6 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold">Privacy First</h2>
                  </div>
                  <p className="text-slate-600 mb-4">
                    We believe your sales data is your competitive advantage. We treat it with the respect it deserves.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 mr-3"></div>
                      <div>
                        <p className="font-semibold">Minimal Data Collection</p>
                        <p className="text-sm text-slate-600">
                          We only collect what&apos;s necessary to provide the service
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 mr-3"></div>
                      <div>
                        <p className="font-semibold">Data Isolation</p>
                        <p className="text-sm text-slate-600">
                          Your data is completely isolated from other customers
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 mr-3"></div>
                      <div>
                        <p className="font-semibold">Right to Delete</p>
                        <p className="text-sm text-slate-600">
                          Export or delete your data anytime with one click
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Infrastructure Security */}
              <div className="grid lg:grid-cols-2 gap-8 items-start">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                      <Server className="h-6 w-6 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold">Secure Infrastructure</h2>
                  </div>
                  <p className="text-slate-600 mb-4">
                    Our infrastructure is built on industry-leading cloud providers with enterprise-grade security.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2 mr-3"></div>
                      <div>
                        <p className="font-semibold">Redundant Systems</p>
                        <p className="text-sm text-slate-600">
                          Multi-region deployment for 99.9% uptime
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2 mr-3"></div>
                      <div>
                        <p className="font-semibold">Automated Backups</p>
                        <p className="text-sm text-slate-600">
                          Daily encrypted backups with 30-day retention
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2 mr-3"></div>
                      <div>
                        <p className="font-semibold">DDoS Protection</p>
                        <p className="text-sm text-slate-600">
                          Advanced threat protection and monitoring
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                <Card className="p-8 bg-slate-50">
                  <h3 className="font-bold mb-4">Infrastructure Partners</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Database className="h-8 w-8 text-slate-400 mr-3" />
                      <div>
                        <p className="font-semibold">Cloud Storage</p>
                        <p className="text-xs text-slate-600">AWS/GCP with encryption at rest</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-slate-400 mr-3" />
                      <div>
                        <p className="font-semibold">Authentication</p>
                        <p className="text-xs text-slate-600">Clerk - Enterprise SSO & MFA</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FileCheck className="h-8 w-8 text-slate-400 mr-3" />
                      <div>
                        <p className="font-semibold">Monitoring</p>
                        <p className="text-xs text-slate-600">24/7 security monitoring & alerts</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Access Control */}
              <div className="grid lg:grid-cols-2 gap-8 items-start">
                <Card className="p-8 bg-slate-50 order-2 lg:order-1">
                  <h3 className="font-bold mb-4">Authentication Features</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <Key className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Multi-factor authentication (MFA) available</span>
                    </li>
                    <li className="flex items-start">
                      <Key className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Single Sign-On (SSO) for enterprise teams</span>
                    </li>
                    <li className="flex items-start">
                      <Key className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Role-based access control (RBAC)</span>
                    </li>
                    <li className="flex items-start">
                      <Key className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Session management and automatic timeouts</span>
                    </li>
                    <li className="flex items-start">
                      <Key className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Audit logs for all account activity</span>
                    </li>
                  </ul>
                </Card>

                <div className="order-1 lg:order-2">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                      <Key className="h-6 w-6 text-orange-600" />
                    </div>
                    <h2 className="text-2xl font-bold">Access Control</h2>
                  </div>
                  <p className="text-slate-600 mb-4">
                    Enterprise-grade authentication and authorization to ensure only authorized users access your data.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-2 mr-3"></div>
                      <div>
                        <p className="font-semibold">Zero-Trust Architecture</p>
                        <p className="text-sm text-slate-600">
                          Every request is authenticated and authorized
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-2 mr-3"></div>
                      <div>
                        <p className="font-semibold">Team Permissions</p>
                        <p className="text-sm text-slate-600">
                          Control who can view, edit, or delete data
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-2 mr-3"></div>
                      <div>
                        <p className="font-semibold">Activity Monitoring</p>
                        <p className="text-sm text-slate-600">
                          Complete audit trail of all user actions
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Questions Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Security Questions?</h2>

            <Card className="p-8 mb-8">
              <h3 className="font-bold text-lg mb-3">Can I get a BAA for HIPAA compliance?</h3>
              <p className="text-slate-600 mb-4">
                While RevTrust is designed for sales pipeline data (not PHI), we can discuss BAAs for
                enterprise customers. Contact us for more information.
              </p>
            </Card>

            <Card className="p-8 mb-8">
              <h3 className="font-bold text-lg mb-3">Do you support on-premise deployment?</h3>
              <p className="text-slate-600 mb-4">
                Currently, RevTrust is cloud-only to ensure the best security and reliability. For enterprise
                customers with specific requirements, please contact our sales team.
              </p>
            </Card>

            <Card className="p-8 mb-8">
              <h3 className="font-bold text-lg mb-3">How long is my data retained?</h3>
              <p className="text-slate-600 mb-4">
                Your data is retained as long as you have an active account. When you delete your account,
                all data is permanently deleted within 30 days. You can export your data at any time.
              </p>
            </Card>

            <Card className="p-8">
              <h3 className="font-bold text-lg mb-3">Who has access to my data?</h3>
              <p className="text-slate-600 mb-4">
                Only you and team members you explicitly grant access to. RevTrust employees never access
                customer data except for debugging with explicit written permission.
              </p>
            </Card>

            <div className="text-center mt-12">
              <p className="text-slate-600 mb-4">
                Have more security questions?
              </p>
              <Link href="/contact">
                <Button style={{ backgroundColor: '#2563EB' }} className="hover:bg-blue-700">
                  Contact Our Security Team
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-white" style={{ background: 'linear-gradient(to bottom right, #2563EB, #1e40af)' }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Trust us with your pipeline data
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Join sales teams who trust RevTrust to keep their data secure.
          </p>
          <SignedOut>
            <SignUpButton mode="modal">
              <Button size="lg" className="bg-white hover:bg-slate-100 text-lg px-8" style={{ color: '#2563EB' }}>
                Get Started Securely
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
