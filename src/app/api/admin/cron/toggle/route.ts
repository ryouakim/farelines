import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { enabled } = await request.json()
    console.log(`Cron scheduler ${enabled ? 'enabled' : 'disabled'} by ${session.user.email}`)

    return NextResponse.json({ 
      success: true,
      message: `Cron scheduler ${enabled ? 'enabled' : 'disabled'}`
    })
  } catch (error) {
    console.error('Error toggling cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}