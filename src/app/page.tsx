import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Plane,
  Bell,
  DollarSign,
  Shield,
  Search,
  TrendingDown,
  ArrowRight,
  BarChart3,
  Zap
} from 'lucide-react'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-background">
          <div className="container mx-auto px-4 py-20 sm:py-32">
            <div className="relative z-10 mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center rounded-full bg-primary-100 px-4 py-2 text-sm font-medium text-primary-900 dark:bg-primary-900/20 dark:text-primary-400">
                <Zap className="mr-2 h-4 w-4" />
                Free during beta - Get started today!
              </div>
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                Never Overpay for <span className="text-primary-600">Flights</span> Again
              </h1>
              <p className="mb-10 text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
                Track your booked flights and get instant alerts when the same fare type drops in price. 
                Join thousands who are saving hundreds on every trip.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signin">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Tracking Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    See How It Works
                  </Button>
                </Link>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl" aria-hidden="true">
              <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-primary-200 to-secondary-200 opacity-30" />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary-600">$2.5M+</div>
                <div className="text-sm text-muted-foreground mt-1">Saved by Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600">50K+</div>
                <div className="text-sm text-muted-foreground mt-1">Trips Monitored</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600">24/7</div>
                <div className="text-sm text-muted-foreground mt-1">Price Monitoring</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600">$350</div>
                <div className="text-sm text-muted-foreground mt-1">Avg. Savings/Trip</div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white dark:bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl mb-4">
                How Farelines Works
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Three simple steps to start saving on every flight
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="text-center relative">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <CardContent className="pt-10 pb-6">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20">
                    <Search className="h-7 w-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Connect Your Trip</h3>
                  <p className="text-muted-foreground">
                    Add your flight details by uploading your confirmation or pasting your Google Flights URL
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center relative">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <CardContent className="pt-10 pb-6">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20">
                    <BarChart3 className="h-7 w-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">We Monitor Prices</h3>
                  <p className="text-muted-foreground">
                    Our system checks prices 24/7 for the exact same fare type you booked
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center relative">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <CardContent className="pt-10 pb-6">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20">
                    <Bell className="h-7 w-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Get Price Drop Alerts</h3>
                  <p className="text-muted-foreground">
                    Receive instant notifications when prices drop so you can claim your refund
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl mb-4">
                Everything You Need to Save
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Powerful features designed to maximize your savings on every flight
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="flex space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Real-Time Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Continuous monitoring of your exact fare class across all booking sites
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Instant Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    Get notified immediately via email when prices drop below your threshold
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Refund Guidance</h3>
                  <p className="text-sm text-muted-foreground">
                    Step-by-step instructions on claiming your airline credit or refund
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Secure & Private</h3>
                  <p className="text-sm text-muted-foreground">
                    Bank-level encryption and we never store payment information
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Price History</h3>
                  <p className="text-sm text-muted-foreground">
                    Track historical price trends and see your total savings over time
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                    <Plane className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">All Airlines</h3>
                  <p className="text-sm text-muted-foreground">
                    Works with every major airline and booking platform worldwide
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary-900 dark:bg-primary-950">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">
              Start Saving on Your Flights Today
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of travelers who never overpay for flights. 
              Free during our beta period - no credit card required.
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
