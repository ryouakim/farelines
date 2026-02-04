// File: src/app/api/admin/cron/status/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || ''
const client = new MongoClient(MONGODB_URI)

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await client.connect()
    const db = client.db('bearlines')
    
    // Get cron job status from jobs collection
    const jobs = await db.collection('jobs').find({
      type: 'price_check'
    }).sort({ createdAt: -1 }).limit(50).toArray()

    const totalJobs = jobs.length
    const successfulJobs = jobs.filter(job => job.status === 'completed').length
    const failedJobs = jobs.filter(job => job.status === 'failed').length

    const lastJob = jobs[0]
    const lastRun = lastJob ? lastJob.createdAt : null

    // Calculate next run (every 6 hours from last run)
    const nextRun = lastRun ? new Date(lastRun.getTime() + 6 * 60 * 60 * 1000) : new Date()

    // Get cron status from system collection
    const systemStatus = await db.collection('system_status').findOne({
      component: 'cron_scheduler'
    })

    return NextResponse.json({
      enabled: systemStatus?.enabled ?? true,
      lastRun: lastRun?.toISOString() || null,
      nextRun: nextRun.toISOString(),
      totalJobs,
      successfulJobs,
      failedJobs,
      averageRunTime: 45 // seconds
    })
  } catch (error) {
    console.error('Error fetching cron status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await client.close()
  }
}

// File: src/app/api/admin/cron/toggle/route.ts
export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { enabled } = await request.json()
    
    await client.connect()
    const db = client.db('bearlines')
    
    // Update system status
    await db.collection('system_status').updateOne(
      { component: 'cron_scheduler' },
      { 
        $set: { 
          component: 'cron_scheduler',
          enabled: enabled,
          updatedAt: new Date(),
          updatedBy: session.user.email
        }
      },
      { upsert: true }
    )

    // Log the action
    await db.collection('system_logs').insertOne({
      action: enabled ? 'cron_enabled' : 'cron_disabled',
      user: session.user.email,
      timestamp: new Date(),
      details: { enabled }
    })

    return NextResponse.json({ 
      success: true,
      message: `Cron scheduler ${enabled ? 'enabled' : 'disabled'}`
    })
  } catch (error) {
    console.error('Error toggling cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await client.close()
  }
}