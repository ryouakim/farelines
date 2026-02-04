import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mockStatus = {
      enabled: true,
      lastRun: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      nextRun: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      totalJobs: 24,
      successfulJobs: 20,
      failedJobs: 4,
      averageRunTime: 45
    }

    return NextResponse.json(mockStatus)
  } catch (error) {
    console.error('Error fetching cron status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}