import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent } from '@/components/ui/card'

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-background">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground mb-8">
              Last updated: February 2025
            </p>

            <Card>
              <CardContent className="pt-6 prose prose-gray dark:prose-invert max-w-none">
                <h2 className="text-xl font-semibold mt-6 mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground mb-4">
                  By accessing or using Farelines, you agree to be bound by these Terms of Service and all applicable
                  laws and regulations. If you do not agree with any of these terms, you are prohibited from using
                  this service.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-4">2. Description of Service</h2>
                <p className="text-muted-foreground mb-4">
                  Farelines is a flight price monitoring service that helps users track price changes for their
                  booked flights. We provide:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                  <li>Flight price monitoring for your booked trips</li>
                  <li>Email notifications when prices drop</li>
                  <li>Price history and savings tracking</li>
                  <li>Information to help you request refunds or rebookings from airlines</li>
                </ul>

                <h2 className="text-xl font-semibold mt-6 mb-4">3. User Accounts</h2>
                <p className="text-muted-foreground mb-4">
                  To use Farelines, you must create an account using Google OAuth. You are responsible for:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                  <li>Maintaining the security of your account</li>
                  <li>All activities that occur under your account</li>
                  <li>Providing accurate and complete information</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                </ul>

                <h2 className="text-xl font-semibold mt-6 mb-4">4. Acceptable Use</h2>
                <p className="text-muted-foreground mb-4">
                  You agree not to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                  <li>Use the service for any illegal purpose</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the service</li>
                  <li>Use automated systems to access the service without permission</li>
                  <li>Share your account credentials with others</li>
                  <li>Resell or redistribute our service</li>
                </ul>

                <h2 className="text-xl font-semibold mt-6 mb-4">5. Service Limitations</h2>
                <p className="text-muted-foreground mb-4">
                  Please understand that:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                  <li>We monitor prices but do not guarantee savings or refunds from airlines</li>
                  <li>Airline policies for fare adjustments vary and are outside our control</li>
                  <li>Price data may have slight delays or inaccuracies</li>
                  <li>Service availability may vary and we may have scheduled maintenance</li>
                  <li>We do not book, rebook, or cancel flights on your behalf</li>
                </ul>

                <h2 className="text-xl font-semibold mt-6 mb-4">6. Beta Service</h2>
                <p className="text-muted-foreground mb-4">
                  Farelines is currently in beta. This means:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                  <li>The service is provided free of charge during the beta period</li>
                  <li>Features may change, be added, or removed</li>
                  <li>We may introduce paid plans in the future</li>
                  <li>Beta users may receive special offers when paid plans launch</li>
                </ul>

                <h2 className="text-xl font-semibold mt-6 mb-4">7. Intellectual Property</h2>
                <p className="text-muted-foreground mb-4">
                  The service, including its original content, features, and functionality, is owned by Farelines
                  and is protected by international copyright, trademark, and other intellectual property laws.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-4">8. Disclaimer of Warranties</h2>
                <p className="text-muted-foreground mb-4">
                  The service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either
                  express or implied. We do not warrant that the service will be uninterrupted, secure, or error-free.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-4">9. Limitation of Liability</h2>
                <p className="text-muted-foreground mb-4">
                  To the maximum extent permitted by law, Farelines shall not be liable for any indirect, incidental,
                  special, consequential, or punitive damages, including lost profits, data, or goodwill, arising
                  from your use of the service.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-4">10. Indemnification</h2>
                <p className="text-muted-foreground mb-4">
                  You agree to indemnify and hold harmless Farelines and its officers, directors, employees, and
                  agents from any claims, damages, or expenses arising from your use of the service or violation
                  of these terms.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-4">11. Termination</h2>
                <p className="text-muted-foreground mb-4">
                  We may terminate or suspend your account at any time, without prior notice, for conduct that
                  we believe violates these Terms of Service or is harmful to other users or us. You may also
                  delete your account at any time.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-4">12. Changes to Terms</h2>
                <p className="text-muted-foreground mb-4">
                  We reserve the right to modify these terms at any time. We will notify users of material changes
                  by posting the updated terms on our website. Your continued use of the service after changes
                  constitutes acceptance of the new terms.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-4">13. Governing Law</h2>
                <p className="text-muted-foreground mb-4">
                  These Terms of Service shall be governed by and construed in accordance with the laws of the
                  United States, without regard to its conflict of law provisions.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-4">14. Contact Information</h2>
                <p className="text-muted-foreground mb-4">
                  For questions about these Terms of Service, please contact us at:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                  <li>Email: legal@farelines.com</li>
                  <li>Website: farelines.com/contact</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
