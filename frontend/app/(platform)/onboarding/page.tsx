"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { CheckCircle2, UserCircle, Target, TrendingUp, Trophy, Sparkles } from "lucide-react"

type OnboardingStep = 1 | 2 | 3

interface OnboardingData {
  // Step 1: About You
  role: string
  sellingMotion: string
  yearsInSales: string

  // Step 2: Your Sales Process
  salesMethodology: string
  typicalSalesCycle: string
  typicalDealSize: string

  // Step 3: Set Your Target
  revenueTarget: string
  targetQuarter: string
  targetYear: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const { getToken } = useAuth()
  const [step, setStep] = useState<OnboardingStep>(1)
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    role: "",
    sellingMotion: "",
    yearsInSales: "",
    salesMethodology: "",
    typicalSalesCycle: "",
    typicalDealSize: "",
    revenueTarget: "",
    targetQuarter: new Date().getMonth() < 3 ? "1" : new Date().getMonth() < 6 ? "2" : new Date().getMonth() < 9 ? "3" : "4",
    targetYear: new Date().getFullYear().toString(),
  })

  // Load saved progress on mount
  useEffect(() => {
    const loadSavedProgress = async () => {
      try {
        const token = await getToken()
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const profile = await response.json()

          // Load existing profile data if available
          setData(prev => ({
            ...prev,
            role: profile.role || prev.role,
            sellingMotion: profile.sellingMotion || prev.sellingMotion,
            yearsInSales: profile.yearsInSales || prev.yearsInSales,
            salesMethodology: profile.salesMethodology || prev.salesMethodology,
            typicalSalesCycle: profile.typicalSalesCycle || prev.typicalSalesCycle,
            typicalDealSize: profile.typicalDealSize || prev.typicalDealSize,
          }))
        }
      } catch (error) {
        console.error("Error loading saved progress:", error)
      } finally {
        setInitialLoad(false)
      }
    }

    loadSavedProgress()
  }, [getToken])

  // Auto-save progress when data changes
  useEffect(() => {
    // Don't auto-save on initial load
    if (initialLoad) return

    const saveProgress = async () => {
      try {
        const token = await getToken()

        // Only save profile fields (not revenue target)
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            role: data.role || null,
            selling_motion: data.sellingMotion || null,
            years_in_sales: data.yearsInSales || null,
            sales_methodology: data.salesMethodology || null,
            typical_sales_cycle: data.typicalSalesCycle || null,
            typical_deal_size: data.typicalDealSize || null,
            onboarding_completed: false, // Don't mark as completed until they finish
          }),
        })
      } catch (error) {
        console.error("Error auto-saving progress:", error)
      }
    }

    // Debounce auto-save by 1 second
    const timeoutId = setTimeout(saveProgress, 1000)
    return () => clearTimeout(timeoutId)
  }, [data, getToken, initialLoad])

  const updateData = (field: keyof OnboardingData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const canProceedStep1 = data.role && data.sellingMotion && data.yearsInSales
  const canProceedStep2 = data.salesMethodology && data.typicalSalesCycle && data.typicalDealSize
  const canCompleteStep3 = data.revenueTarget && parseFloat(data.revenueTarget) > 0

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as OnboardingStep)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as OnboardingStep)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      const token = await getToken()

      // Update user profile
      const profilePayload = {
        role: data.role || null,
        selling_motion: data.sellingMotion || null,
        years_in_sales: data.yearsInSales || null,
        sales_methodology: data.salesMethodology || null,
        typical_sales_cycle: data.typicalSalesCycle || null,
        typical_deal_size: data.typicalDealSize || null,
        onboarding_completed: true,
      }

      console.log('Updating profile with:', profilePayload)

      const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profilePayload),
      })

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json().catch(() => ({ detail: 'Unknown error' }))
        console.error('Profile update failed:', {
          status: profileResponse.status,
          statusText: profileResponse.statusText,
          error: errorData
        })
        throw new Error(`Failed to update profile: ${errorData.detail || profileResponse.statusText}`)
      }

      // Set revenue target if provided
      if (data.revenueTarget && parseFloat(data.revenueTarget) > 0) {
        const targetResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/revenue-target`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            year: parseInt(data.targetYear),
            quarter: parseInt(data.targetQuarter),
            target: parseFloat(data.revenueTarget),
            set_by: 'self',
          }),
        })

        if (!targetResponse.ok) {
          const errorData = await targetResponse.json().catch(() => ({ detail: 'Unknown error' }))
          console.error('Failed to set revenue target:', {
            status: targetResponse.status,
            statusText: targetResponse.statusText,
            error: errorData
          })
        }
      }

      // Show completion celebration
      setCompleted(true)

      // Set session storage flag to prevent redirect loop
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('onboarding_just_completed', 'true')
      }

      // Redirect to dashboard after 3 seconds using replace to avoid back button issues
      setTimeout(() => {
        // Clear the flag after redirect
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('onboarding_just_completed')
        }
        router.replace('/dashboard')
      }, 3000)
    } catch (error) {
      console.error('Error completing onboarding:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save your information. Please try again.'
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  // Show completion celebration
  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 flex items-center justify-center">
        <Card className="max-w-2xl w-full text-center border-2 border-blue-200">
          <CardContent className="p-12">
            <div className="mb-6 relative">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
                <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
              </div>
              <div className="absolute bottom-0 right-1/3">
                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
              </div>
              <div className="absolute bottom-0 left-1/3">
                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-3">
              Setup Complete!
            </h1>

            <p className="text-lg text-slate-600 mb-6">
              You've unlocked personalized AI coaching tailored to your sales process
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-900 mb-3">What's unlocked:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Methodology-aligned coaching</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Gap-to-quota tracking</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Experience-based insights</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Deal prioritization</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Redirecting to dashboard in a moment...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    s < step
                      ? 'bg-green-500 text-white'
                      : s === step
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      s < step ? 'bg-green-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={step === 1 ? 'font-semibold text-blue-600' : 'text-slate-500'}>
              About You
            </span>
            <span className={step === 2 ? 'font-semibold text-blue-600' : 'text-slate-500'}>
              Sales Process
            </span>
            <span className={step === 3 ? 'font-semibold text-blue-600' : 'text-slate-500'}>
              Set Target
            </span>
          </div>
        </div>

        {/* Step 1: About You */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <UserCircle className="w-6 h-6 text-blue-600" />
                <CardTitle>Tell us about yourself</CardTitle>
              </div>
              <CardDescription>
                Help us personalize your RevTrust experience (30 seconds)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="role">What's your role?</Label>
                <Select value={data.role} onValueChange={(value) => updateData('role', value)}>
                  <SelectTrigger id="role" className="mt-2">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ic">Individual Contributor (AE/SDR)</SelectItem>
                    <SelectItem value="manager">Sales Manager</SelectItem>
                    <SelectItem value="director">Director of Sales</SelectItem>
                    <SelectItem value="vp">VP of Sales</SelectItem>
                    <SelectItem value="c_level">C-Level (CRO/CEO)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sellingMotion">How do you primarily sell?</Label>
                <Select value={data.sellingMotion} onValueChange={(value) => updateData('sellingMotion', value)}>
                  <SelectTrigger id="sellingMotion" className="mt-2">
                    <SelectValue placeholder="Select selling motion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hunter">Hunter (New Logos)</SelectItem>
                    <SelectItem value="farmer">Farmer (Account Management)</SelectItem>
                    <SelectItem value="hybrid">Hybrid (Both)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="yearsInSales">Years in sales?</Label>
                <Select value={data.yearsInSales} onValueChange={(value) => updateData('yearsInSales', value)}>
                  <SelectTrigger id="yearsInSales" className="mt-2">
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<1">Less than 1 year</SelectItem>
                    <SelectItem value="1-3">1-3 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="5-10">5-10 years</SelectItem>
                    <SelectItem value="10+">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={handleSkip}>
                  Skip for now
                </Button>
                <Button onClick={handleNext} disabled={!canProceedStep1}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Your Sales Process */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <CardTitle>Your sales process</CardTitle>
              </div>
              <CardDescription>
                Help us provide coaching aligned to how you sell (45 seconds)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="methodology">Sales methodology</Label>
                <Select value={data.salesMethodology} onValueChange={(value) => updateData('salesMethodology', value)}>
                  <SelectTrigger id="methodology" className="mt-2">
                    <SelectValue placeholder="Select methodology" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meddic">MEDDIC</SelectItem>
                    <SelectItem value="bant">BANT</SelectItem>
                    <SelectItem value="sandler">Sandler</SelectItem>
                    <SelectItem value="solution_selling">Solution Selling</SelectItem>
                    <SelectItem value="challenger">Challenger Sale</SelectItem>
                    <SelectItem value="custom">Custom/Proprietary</SelectItem>
                    <SelectItem value="none">No formal methodology</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">
                  We'll align coaching to your sales process
                </p>
              </div>

              <div>
                <Label htmlFor="salesCycle">Typical sales cycle</Label>
                <Select value={data.typicalSalesCycle} onValueChange={(value) => updateData('typicalSalesCycle', value)}>
                  <SelectTrigger id="salesCycle" className="mt-2">
                    <SelectValue placeholder="Select typical cycle length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<30">Less than 30 days</SelectItem>
                    <SelectItem value="30-60">30-60 days</SelectItem>
                    <SelectItem value="60-90">60-90 days</SelectItem>
                    <SelectItem value="90-180">90-180 days</SelectItem>
                    <SelectItem value="180+">180+ days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dealSize">Typical deal size</Label>
                <Select value={data.typicalDealSize} onValueChange={(value) => updateData('typicalDealSize', value)}>
                  <SelectTrigger id="dealSize" className="mt-2">
                    <SelectValue placeholder="Select average deal value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<10k">Less than $10K</SelectItem>
                    <SelectItem value="10k-50k">$10K - $50K</SelectItem>
                    <SelectItem value="50k-100k">$50K - $100K</SelectItem>
                    <SelectItem value="100k-500k">$100K - $500K</SelectItem>
                    <SelectItem value="500k+">$500K+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleNext} disabled={!canProceedStep2}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Set Your Target */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-6 h-6 text-blue-600" />
                <CardTitle>Set your revenue target</CardTitle>
              </div>
              <CardDescription>
                Track your progress and get gap-to-quota insights (30 seconds)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetQuarter">Quarter</Label>
                  <Select value={data.targetQuarter} onValueChange={(value) => updateData('targetQuarter', value)}>
                    <SelectTrigger id="targetQuarter" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Q1</SelectItem>
                      <SelectItem value="2">Q2</SelectItem>
                      <SelectItem value="3">Q3</SelectItem>
                      <SelectItem value="4">Q4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="targetYear">Year</Label>
                  <Select value={data.targetYear} onValueChange={(value) => updateData('targetYear', value)}>
                    <SelectTrigger id="targetYear" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="revenueTarget">Revenue target (USD)</Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <Input
                    id="revenueTarget"
                    type="number"
                    placeholder="500000"
                    value={data.revenueTarget}
                    onChange={(e) => updateData('revenueTarget', e.target.value)}
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Your target for Q{data.targetQuarter} {data.targetYear}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">What you'll unlock:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>✓ Gap-to-quota tracking on every analysis</li>
                  <li>✓ "You need X more deals to hit target" insights</li>
                  <li>✓ Deal prioritization based on quota urgency</li>
                  <li>✓ Week-by-week pacing recommendations</li>
                </ul>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleComplete} disabled={loading || !canCompleteStep3}>
                  {loading ? 'Saving...' : 'Complete Setup'}
                </Button>
              </div>

              <p className="text-center text-sm text-slate-500">
                You can update these settings anytime in Settings
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
