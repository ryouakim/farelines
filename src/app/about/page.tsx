import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Plane,
  Target,
  Heart,
  Users,
  TrendingUp,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: 'Mission-Driven',
      description: 'We believe everyone deserves to pay fair prices for flights. Our mission is to help travelers save money on every trip.'
    },
    {
      icon: Heart,
      title: 'Customer First',
      description: 'Your savings are our success. We are constantly improving our service based on traveler feedback.'
    },
    {
      icon: Users,
      title: 'Transparency',
      description: 'No hidden fees, no complicated pricing. What you see is what you get, and during beta, it is all free.'
    },
    {
      icon: TrendingUp,
      title: 'Innovation',
      description: 'We use the latest technology to monitor prices and deliver savings opportunities in real-time.'
    }
  ]

  const stats = [
    { value: '$2.5M+', label: 'Saved by Users' },
    { value: '50K+', label: 'Trips Monitored' },
    { value: '24/7', label: 'Price Monitoring' },
    { value: '$350', label: 'Avg. Savings Per Trip' }
  ]

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-background py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Plane className="h-16 w-16 text-primary-600 rotate-45" />
                  <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-secondary rounded-full" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl mb-6">
                About Farelines
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                We are on a mission to ensure travelers never overpay for flights again.
                Built by frequent flyers who were tired of missing out on price drops.
              </p>
            </div>
          </div>
        </section>

        {/* Founder Story */}
        <section className="py-20 bg-white dark:bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8 items-center">
                <div className="md:col-span-1">
                  <div className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center">
                    <span className="text-6xl font-bold text-primary-600">JY</span>
                  </div>
                  <div className="text-center mt-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Joseph Youakim</h3>
                    <p className="text-muted-foreground">Founder</p>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Story</h2>
                  <div className="space-y-4 text-gray-600 dark:text-gray-300">
                    <p>
                      I began developing Farelines after noticing repeated price drops on flights I booked
                      for summer basketball tournaments. It was frustrating to see fares decrease after I
                      had already purchased my tickets, knowing that airlines often offer credits or refunds
                      when prices drop.
                    </p>
                    <p>
                      The site allows users to track booked flights and receive alerts when fares drop,
                      helping them capture airfare savings that would otherwise go unnoticed. What started
                      as a personal solution has grown into a tool that helps travelers everywhere save
                      money on their flights.
                    </p>
                    <p>
                      Our mission is simple: make sure you never overpay for a flight again. By monitoring
                      prices 24/7 and alerting you the moment your fare drops, Farelines helps you claim
                      the refunds and credits you deserve.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="text-3xl font-bold text-primary-600">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-white dark:bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Values</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Everything we do is guided by our core values and commitment to our users.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {values.map((value, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4">
                      <value.icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How We Help */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">How We Help You Save</h2>
              <div className="space-y-4">
                {[
                  'Monitor your flights automatically 24/7',
                  'Track your exact fare type for accurate comparisons',
                  'Send instant alerts when prices drop',
                  'Provide step-by-step rebooking guidance',
                  'Support all major airlines worldwide',
                  'Keep your data secure and private'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{item}</span>
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
              Join Thousands of Happy Travelers
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Start saving on your flights today. Free during our beta period,
              no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signin">
                <Button size="lg" variant="secondary" className="text-primary-900">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
