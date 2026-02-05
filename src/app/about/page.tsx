import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Plane,
  Target,
  Heart,
  TrendingDown,
  ArrowRight,
  Mail
} from 'lucide-react'

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-background">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl mb-6">
              About Farelines
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Helping travelers save money on every flight by tracking price drops after booking.
            </p>
          </div>
        </section>

        {/* Founder Story Section */}
        <section className="py-16 bg-white dark:bg-background">
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
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                    The Story Behind Farelines
                  </h2>
                  <div className="space-y-4 text-gray-600 dark:text-gray-300">
                    <p>
                      I began developing Farelines after noticing repeated price drops on flights I booked for summer basketball tournaments.
                      It was frustrating to see fares decrease after I had already purchased my tickets, knowing that airlines often
                      offer credits or refunds when prices drop.
                    </p>
                    <p>
                      The site allows users to track booked flights and receive alerts when fares drop, helping them capture
                      airfare savings that would otherwise go unnoticed. What started as a personal solution has grown into a
                      tool that helps travelers everywhere save money on their flights.
                    </p>
                    <p>
                      Our mission is simple: make sure you never overpay for a flight again. By monitoring prices 24/7 and
                      alerting you the moment your fare drops, Farelines helps you claim the refunds and credits you deserve.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl mb-4">
                Our Values
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                The principles that guide everything we do at Farelines
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="text-center">
                <CardContent className="pt-8 pb-6">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20">
                    <Target className="h-7 w-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">User-Focused</h3>
                  <p className="text-muted-foreground">
                    Every feature we build is designed to save you money and time. Your success is our success.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-8 pb-6">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20">
                    <Heart className="h-7 w-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Transparency</h3>
                  <p className="text-muted-foreground">
                    No hidden fees, no tricks. We believe in honest pricing and clear communication.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-8 pb-6">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20">
                    <TrendingDown className="h-7 w-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Relentless Savings</h3>
                  <p className="text-muted-foreground">
                    We monitor prices around the clock so you never miss an opportunity to save.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact CTA Section */}
        <section className="py-20 bg-primary-900 dark:bg-primary-950">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">
              Get In Touch
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Have questions or feedback? We&apos;d love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" variant="secondary" className="text-primary-900">
                  <Mail className="mr-2 h-5 w-5" />
                  Contact Us
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Start Tracking Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-50 dark:bg-gray-900 border-t">
          <div className="container mx-auto px-4 py-12">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Plane className="h-6 w-6 text-primary-600 rotate-45" />
                  <span className="text-xl font-bold">Farelines</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Never overpay for flights again. Track prices and save on every trip.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Product</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/how-it-works" className="hover:text-primary">How It Works</Link></li>
                  <li><Link href="/pricing" className="hover:text-primary">Pricing</Link></li>
                  <li><Link href="/app" className="hover:text-primary">Dashboard</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/about" className="hover:text-primary">About</Link></li>
                  <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
                  <li><Link href="/blog" className="hover:text-primary">Blog</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-primary">Terms of Service</Link></li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} Farelines. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
