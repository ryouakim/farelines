import Link from 'next/link'
import { Plane } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-slate-900 border-t dark:border-slate-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Plane className="h-6 w-6 text-sky-500 rotate-45" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Farelines</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Never overpay for flights again. Track prices and save on every trip.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Product</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li><Link href="/how-it-works" className="hover:text-sky-500 transition-colors">How It Works</Link></li>
              <li><Link href="/pricing" className="hover:text-sky-500 transition-colors">Pricing</Link></li>
              <li><Link href="/app" className="hover:text-sky-500 transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Company</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li><Link href="/about" className="hover:text-sky-500 transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-sky-500 transition-colors">Contact</Link></li>
              <li><Link href="/blog" className="hover:text-sky-500 transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li><Link href="/privacy" className="hover:text-sky-500 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-sky-500 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t dark:border-slate-800 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} Farelines. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
