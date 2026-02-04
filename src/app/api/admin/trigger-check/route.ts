import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request parameters
    const body = await req.json().catch(() => ({}))
    const { useMockPrices = false } = body

    // Path to worker script
    const workerPath = path.join(process.cwd(), 'apps', 'worker', 'fareMonitor.js')
    
    // Environment variables
    const env = { ...process.env }
    if (useMockPrices) {
      env.USE_MOCK_PRICES = 'true'
    }

    // Spawn worker process
    const child = spawn('node', [workerPath], {
      env,
      cwd: path.join(process.cwd(), 'apps', 'worker')
    })

    let output = ''
    let errorOutput = ''

    // Collect output
    child.stdout?.on('data', (data) => {
      output += data.toString()
    })

    child.stderr?.on('data', (data) => {
      errorOutput += data.toString()
    })

    // Wait for completion with timeout
    const exitCode = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        child.kill('SIGTERM')
        reject(new Error('Process timeout after 5 minutes'))
      }, 5 * 60 * 1000) // 5 minute timeout

      child.on('close', (code) => {
        clearTimeout(timeout)
        resolve(code)
      })

      child.on('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
    })

    // Parse results from output
    const successMatch = output.match(/success['"]\s*:\s*(\d+)/)
    const errorMatch = output.match(/errors['"]\s*:\s*(\d+)/)
    const totalMatch = output.match(/total['"]\s*:\s*(\d+)/)
    
    const results = {
      exitCode,
      total: totalMatch ? parseInt(totalMatch[1]) : 0,
      success: successMatch ? parseInt(successMatch[1]) : 0,
      errors: errorMatch ? parseInt(errorMatch[1]) : 0,
      timestamp: new Date().toISOString(),
      output: output.slice(-1000), // Last 1000 characters
      errorOutput: errorOutput.slice(-500) // Last 500 characters of errors
    }

    return NextResponse.json({
      message: 'Price check completed',
      results,
      usedMockPrices: useMockPrices,
      triggeredBy: session.user.email
    })

  } catch (error) {
    console.error('Error triggering price check:', error)
    return NextResponse.json(
      { 
        error: 'Failed to trigger price check',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// GET method to check trigger capabilities
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if worker script exists
    const workerPath = path.join(process.cwd(), 'apps', 'worker', 'fareMonitor.js')
    
    try {
      const fs = require('fs')
      fs.accessSync(workerPath)
      
      return NextResponse.json({
        available: true,
        workerPath,
        capabilities: [
          'manual_price_checks',
          'mock_price_testing',
          'real_amadeus_api'
        ],
        limits: {
          timeout: '5 minutes',
          cooldown: '30 seconds'
        }
      })
    } catch (error) {
      return NextResponse.json({
        available: false,
        error: 'Worker script not found',
        workerPath
      })
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check trigger availability' },
      { status: 500 }
    )
  }
}