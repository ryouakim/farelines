import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { MongoDBAdapter } from '@next-auth/mongodb-adapter'
import { MongoClient } from 'mongodb'
import { getUsersCollection } from '@/lib/mongodb'

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing Google OAuth credentials')
}

const client = new MongoClient(process.env.MONGO_URI!)

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(client),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session?.user?.email) {
        const users = await getUsersCollection()
        const dbUser = await users.findOne({ email: session.user.email })
        
        if (dbUser) {
          session.user.id = dbUser._id?.toString()
        }
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (!user.email) return false
      
      try {
        const users = await getUsersCollection()
        const existingUser = await users.findOne({ email: user.email })
        
        if (!existingUser) {
          await users.insertOne({
            email: user.email,
            name: user.name || '',
            image: user.image || '',
            emailVerified: new Date(),
            marketingOptIn: false,
            notificationPreferences: {
              emailAlerts: true,
              priceDropThreshold: 1, // 1% minimum
              frequency: 'immediate' as const
            },
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
        
        return true
      } catch (error) {
        console.error('Error during sign in:', error)
        return false
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    newUser: '/app/onboarding'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
