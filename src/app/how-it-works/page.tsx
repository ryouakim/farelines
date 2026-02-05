import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Search,
  BarChart3,
  Bell,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Plane,
  Clock,
  Shield,
  Zap
} from 'lucide-react'

export default function HowItWorksPage() {
  const steps = [
    {
      number: 1,
      icon: Search,
      title: 'Add Your Flight',
      description: 'Enter your flight details using your flight number, booking confirmation, or Google Flights URL. We support all major airlines worldwide.',
      details: [
        'Enter flight numbers directly (most reliable)',
        'Paste your Google Flights booking URL',
        'Upload your booking confirmation PDF (coming soon)'
      ]
    },
    {
      number: 2,
      icon: BarChart3,
      title: 'We Monitor Prices 24/7',
      description: 'Our system continuously checks prices for your exact route and fare type. We monitor the same fare class you booked to ensure accurate comparisons.',
      details: [
        'Price checks every 6 hours',
        'Monitors your exact fare type (Economy, Business, etc.)',
        'Tracks prices across multiple booking sites'
      ]
    },
    {
      number: 3,
      icon: Bell,
      title: 'Get Instant Alerts',
      description: 'When the price drops below what you paid, you will receive an instant email notification with all the details you need to claim your savings.',
      details: [
        'Instant email alerts when prices drop',
        'Customizable alert threshold',
        'Clear savings summary in every notification'
      ]
    },
    {
      number: 4,
      icon: DollarSign,
      title: 'Claim Your Refund',
      description: 'Contact your airline to rebook at the lower price or claim the fare difference. Many airlines offer travel credits or price adjustments for fare drops.',
      details: [
        'Step-by-step rebooking instructions',
        'Airline-specific policies explained',
        'Direct links to airline customer service'
      ]
    }
  ]

  const faqs = [
    {
      question: 'Which airlines do you support?',
      answer: 'We support all major airlines worldwide including American, Delta, United, Southwest, JetBlue, Alaska, and international carriers like British Airways, Lufthansa, Emirates, and more.'
    },
    {
      question: 'How accurate is the price monitoring?',
      answer: 'We monitor the exact fare type you booked (Basic Economy, Main Cabin, Business, etc.) to ensure accurate comparisons. Prices are checked every 6 hours.'
    },
    {
      question: 'What happens when a price drops?',
      answer: 'You will receive an instant email notification showing the price difference. You can then contact the airline to rebook at the lower price or request a fare adjustment.'
    },
    {
      question: 'Do I need to cancel and rebook?',
      answer: 'It depends on the airline. Some airlines allow price adjustments on existing bookings, while others may require a cancel-and-rebook. We provide airline-specific guidance in your alert.'
    },
    {
      question: 'Is there a fee for this service?',
      answer: 'Farelines is completely free during our beta period. You can monitor unlimited trips at no cost. Premium features will be introduced in the future with competitive pricing.'
    }
  ]

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-background py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl mb-6">
                How Farelines Works
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Four simple steps to start saving money on your flights.
                No complicated setup, no hidden fees, just real savings.
              </p>
              <Link href="/auth/signin">
                <Button size="lg">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-20 bg-white dark:bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.number} className="relative">
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-8 top-20 w-0.5 h-32 bg-gray-200 dark:bg-gray-700 hidden md:block" />
                  )}

                  <div className="flex flex-col md:flex-row gap-6 mb-16">
                    {/* Step Number & Icon */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                          {step.number}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                          <step.icon className="h-4 w-4 text-primary-600" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-3">{step.title}</h2>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {step.description}
                      </p>
                      <ul className="space-y-2">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-600 dark:text-gray-300">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose Farelines?</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Built by travelers, for travelers. We understand the frustration of paying more than you need to.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plane className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="font-semibold mb-2">All Airlines</h3>
                  <p className="text-sm text-muted-foreground">
                    Works with every major airline and booking platform
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="font-semibold mb-2">24/7 Monitoring</h3>
                  <p className="text-sm text-muted-foreground">
                    Continuous price tracking around the clock
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Secure & Private</h3>
                  <p className="text-sm text-muted-foreground">
                    Bank-level security, we never store payment info
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Instant Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time notifications when prices drop
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white dark:bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b pb-6">
                    <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary-900 dark:bg-primary-950">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">
              Ready to Start Saving?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of travelers who never overpay for flights.
              Free during our beta period.
            </p>
            <Link href="/auth/signin">
              <Button size="lg" variant="secondary" className="text-primary-900">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
