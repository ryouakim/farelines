import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const defaultSettings = {
      email: session.user.email,
      notifications: {
        emailAlerts: true,
        priceDrops: true,
        systemUpdates: false,
        weeklyDigest: true
      },
      monitoring: {
        enabled: true,
        interval: 360,
        alertThreshold: 50,
        autoArchive: true
      },
      privacy: {
        dataRetention: 365,
        shareAnalytics: false
      }
    }

    return NextResponse.json({
      success: true,
      settings: defaultSettings
    })
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { settings } = await request.json()
    console.log('Settings updated for:', session.user.email, settings)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving user settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
