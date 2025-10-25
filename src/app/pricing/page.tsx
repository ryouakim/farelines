import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, X, Zap, Star } from 'lucide-react'
import Link from 'next/link'

export default function PricingPage() {
  const plans = [
    {
      name: 'Free Beta',
      price: '$0',
      period: 'forever during beta',
      description: 'Perfect for individual travelers',
      current: true,
      features: [
        { text: 'Unlimited trip monitoring', included: true },
        { text: 'Real-time price alerts', included: true },
        { text: 'Email notifications', included: true },
        { text: 'Price history tracking', included: true },
        { text: 'All fare types supported', included: true },
        { text: 'Google Flights integration', included: true },
        { text: 'SMS alerts', included: false },
        { text: 'API access', included: false },
        { text: 'Priority support', included: false },
      ],
    },
    {
      name: 'Pro',
      price: '$9',
      period: 'per month',
      description: 'For frequent travelers',
      coming: true,
      features: [
        { text: 'Everything in Free', included: true },
        { text: 'SMS alerts', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Multiple user accounts', included: true },
        { text: 'Priority price checking', included: true },
        { text: 'Bulk trip import', included: true },
        { text: 'API access', included: false },
        { text: 'White-label options', included: false },
        { text: 'Dedicated support', included: false },
      ],
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact sales',
      description: 'For travel agencies & corporations',
      enterprise: true,
      features: [
        { text: 'Everything in Pro', included: true },
        { text: 'Unlimited team members', included: true },
        { text: 'API access', included: true },
        { text: 'White-label options', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'SLA guarantee', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Custom reporting', included: true },
        { text: 'Priority support 24/7', included: true },
      ],
    },
  ]

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-background">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="secondary">
              <Zap className="mr-1 h-3 w-3" />
              Limited Time Offer
            </Badge>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Start saving on flights today. Free during our beta period, with premium features coming soon.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.name}
                className={plan.current ? 'border-primary shadow-lg scale-105' : ''}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    {plan.current && (
                      <Badge variant="default">
                        <Star className="mr-1 h-3 w-3" />
                        Current
                      </Badge>
                    )}
                    {plan.coming && (
                      <Badge variant="secondary">Coming Soon</Badge>
                    )}
                  </div>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        {plan.period}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? '' : 'text-gray-400'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {plan.current ? (
                    <Link href="/auth/signin" className="block">
                      <Button className="w-full" size="lg">
                        Get Started Free
                      </Button>
                    </Link>
                  ) : plan.enterprise ? (
                    <Link href="/contact" className="block">
                      <Button className="w-full" size="lg" variant="outline">
                        Contact Sales
                      </Button>
                    </Link>
                  ) : (
                    <Button className="w-full" size="lg" variant="outline" disabled>
                      Coming Soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  How long will the free beta last?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We&apos;re committed to keeping Farelines free during our beta period, which we expect to last through 2025. 
                  Beta users will receive special discounts when we introduce paid plans.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Can I cancel anytime?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Absolutely! When paid plans are introduced, you can cancel your subscription at any time. 
                  There are no long-term contracts or cancellation fees.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Do you offer refunds?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes, we offer a 30-day money-back guarantee on all paid plans. 
                  If you&apos;re not satisfied, contact our support team for a full refund.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  When paid plans launch, we&apos;ll accept all major credit cards, PayPal, and corporate invoicing for enterprise customers.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center">
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-10">
              <h2 className="text-3xl font-bold mb-4">
                Start Saving on Every Flight
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of travelers who are already saving hundreds on their flights. 
                Free to start, no credit card required.
              </p>
              <Link href="/auth/signin">
                <Button size="lg" className="text-lg px-8">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
