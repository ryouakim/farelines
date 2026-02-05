import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plane,
  Bell,
  DollarSign,
  TrendingDown,
  ArrowRight,
  Calendar
} from 'lucide-react'

export default function BlogPage() {
  const featuredPosts = [
    {
      title: 'How Airlines Handle Price Drops: A Complete Guide',
      description: 'Learn the policies of major airlines when it comes to fare adjustments and rebooking after a price drop.',
      category: 'Guides',
      date: 'Coming Soon',
      icon: Plane
    },
    {
      title: 'The Best Time to Book Flights for Maximum Savings',
      description: 'Data-driven insights on when to book your flights to get the best deals.',
      category: 'Tips',
      date: 'Coming Soon',
      icon: Calendar
    },
    {
      title: 'Understanding Fare Classes and Why They Matter',
      description: 'A deep dive into airline fare classes and how they affect your rebooking options.',
      category: 'Education',
      date: 'Coming Soon',
      icon: DollarSign
    }
  ]

  const upcomingTopics = [
    'How to Get Airline Credits for Price Drops',
    'Best Practices for Monitoring Multiple Trips',
    'Airline-Specific Rebooking Policies',
    'When to Cancel and Rebook vs. Request Adjustment',
    'International Flight Savings Strategies',
    'Peak Season vs. Off-Peak: What the Data Shows'
  ]

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-background">
        <div className="container mx-auto px-4 py-20">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="secondary">
              <Bell className="mr-1 h-3 w-3" />
              Coming Soon
            </Badge>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl mb-4">
              Farelines Blog
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Expert tips, industry insights, and travel savings strategies.
              Subscribe to be notified when we launch.
            </p>
          </div>

          {/* Featured Posts Preview */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold mb-6">Featured Articles (Coming Soon)</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredPosts.map((post, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow opacity-75">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{post.category}</Badge>
                      <span className="text-xs text-muted-foreground">{post.date}</span>
                    </div>
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-3">
                      <post.icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <CardTitle className="text-lg">{post.title}</CardTitle>
                    <CardDescription>{post.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Upcoming Topics */}
          <div className="max-w-2xl mx-auto mb-16">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-primary-600" />
                  Upcoming Topics
                </CardTitle>
                <CardDescription>
                  Here is what we are working on. Have a topic suggestion? Let us know!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {upcomingTopics.map((topic, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary-600 rounded-full" />
                      <span className="text-muted-foreground">{topic}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Newsletter Signup */}
          <div className="max-w-xl mx-auto">
            <Card className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
              <CardContent className="pt-6 text-center">
                <Bell className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Get Notified When We Launch</h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to read our travel savings tips and industry insights.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-sm"
                  />
                  <Button>
                    Subscribe
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  No spam, unsubscribe anytime.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
