import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent } from '@/components/ui/card'

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-background">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground mb-8">
              Last updated: February 2025
            </p>

            <Card>
              <CardContent className="pt-6 prose prose-gray dark:prose-invert max-w-none">
                <h2 className="text-xl font-semibold mt-6 mb-4">1. Introduction</h2>
                <p className="text-muted-foreground mb-4">
                  Welcome to Farelines. We respect your privacy and are committed to protecting your personal data.
                  This privacy policy explains how we collect, use, and safeguard your information when you use our service.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-4">2. Information We Collect</h2>
                <p className="text-muted-foreground mb-4">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                  <li>Account information (name, email address) when you sign up via Google OAuth</li>
                  <li>Flight and trip details you enter for price monitoring</li>
                  <li>Communication preferences and settings</li>
                  <li>Feedback and correspondence you send to us</li>
                </ul>

                <h2 className="text-xl font-semibold mt-6 mb-4">3. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                  <li>Provide, maintain, and improve our price monitoring service</li>
                  <li>Send you alerts when flight prices drop</li>
                  <li>Respond to your comments, questions, and support requests</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                  <li>Detect, investigate, and prevent fraudulent transactions and abuse</li>
                </ul>

                <h2 className="text-xl font-semibold mt-6 mb-4">4. Information Sharing</h2>
                <p className="text-muted-foreground mb-4">
                  We do not sell your personal information. We may share your information only in the following circumstances:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                  <li>With your consent or at your direction</li>
                  <li>With service providers who assist in our operations</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights, privacy, safety, or property</li>
                </ul>

                <h2 className="text-xl font-semibold mt-6 mb-4">5. Data Security</h2>
                <p className="text-muted-foreground mb-4">
                  We implement appropriate technical and organizational measures to protect your personal data against
                  unauthorized access, alteration, disclosure, or destruction. We use industry-standard encryption
                  and security practices.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-4">6. Data Retention</h2>
                <p className="text-muted-foreground mb-4">
                  We retain your personal data only for as long as necessary to provide our services and fulfill
                  the purposes described in this policy. When you delete your account, we will delete or anonymize
                  your personal data within 30 days.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-4">7. Your Rights</h2>
                <p className="text-muted-foreground mb-4">
                  Depending on your location, you may have certain rights regarding your personal data, including:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                  <li>Access to your personal data</li>
                  <li>Correction of inaccurate data</li>
                  <li>Deletion of your data</li>
                  <li>Data portability</li>
                  <li>Objection to processing</li>
                </ul>

                <h2 className="text-xl font-semibold mt-6 mb-4">8. Cookies</h2>
                <p className="text-muted-foreground mb-4">
                  We use essential cookies to maintain your session and preferences. We do not use tracking cookies
                  or share data with third-party advertisers.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-4">9. Third-Party Services</h2>
                <p className="text-muted-foreground mb-4">
                  We use Google OAuth for authentication. Please review Google&apos;s privacy policy to understand
                  how they handle your data. We only receive basic profile information (name and email) from Google.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-4">10. Children&apos;s Privacy</h2>
                <p className="text-muted-foreground mb-4">
                  Our service is not directed to children under 13. We do not knowingly collect personal information
                  from children under 13. If we learn that we have collected such information, we will delete it promptly.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-4">11. Changes to This Policy</h2>
                <p className="text-muted-foreground mb-4">
                  We may update this privacy policy from time to time. We will notify you of any changes by posting
                  the new policy on this page and updating the &quot;Last updated&quot; date.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-4">12. Contact Us</h2>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                  <li>Email: privacy@farelines.com</li>
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
