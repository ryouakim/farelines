'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Settings,
  Clock,
  Play,
  RefreshCw,
  Bell,
  User,
  Zap,
  CheckCircle2,
  Activity,
  Database
} from 'lucide-react'

interface StatsData {
  totalTrips: number
  monitoringTrips: number
  totalSavings: number
  avgSavings: number
  recentAlerts: number
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [isClient, setIsClient] = useState(false)
  const [cronEnabled, setCronEnabled] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [triggerResult, setTriggerResult] = useState<any>(null)
  const [stats, setStats] = useState<StatsData>({
    totalTrips: 0,
    monitoringTrips: 0,
    totalSavings: 0,
    avgSavings: 0,
    recentAlerts: 0
  })

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && status === 'authenticated') {
      fetchData()
    } else if (isClient && status === 'unauthenticated') {
      setLoading(false)
    }
  }, [isClient, status])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/monitoring/stats')
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalTrips: data.totalTrips || 0,
          monitoringTrips: data.monitoringTrips || 0,
          totalSavings: data.totalSavings || 0,
          avgSavings: data.avgSavings || 0,
          recentAlerts: data.recentAlerts || 0
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
    setLoading(false)
  }

  const triggerManualRun = async (mockMode = false) => {
    setTriggering(true)
    setTriggerResult(null)
    
    try {
      const response = await fetch('/api/admin/trigger-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mock: mockMode })
      })
      
      if (response.ok) {
        const result = await response.json()
        setTriggerResult(result)
        setTimeout(fetchData, 2000)
      }
    } catch (error) {
      console.error('Error triggering manual run:', error)
    } finally {
      setTriggering(false)
    }
  }

  // Show nothing until client-side rendering is ready
  if (!isClient) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </>
    )
  }

  if (status === 'loading' || loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Settings</h1>
          <p className="text-muted-foreground">Please sign in to access settings.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your monitoring preferences and system controls
            </p>
          </div>

          <div className="space-y-6">
            {/* System Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalTrips}</div>
                    <div className="text-sm text-muted-foreground">Total Trips</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${stats.totalSavings.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Savings</div>
                  </div>
                  <div className="text-center">
                    <Badge variant="default">Active</Badge>
                    <div className="text-sm text-muted-foreground mt-1">Monitoring Status</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manual Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Price Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Cron Status */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div>
                      <div className="font-medium">Automatic Price Checking</div>
                      <div className="text-sm text-muted-foreground">Running every 6 hours</div>
                    </div>
                  </div>
                  <Switch
                    checked={cronEnabled}
                    onCheckedChange={setCronEnabled}
                  />
                </div>

                {/* Manual Controls */}
                <div className="border-t pt-6">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Manual Controls
                  </h4>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => triggerManualRun(false)}
                      disabled={triggering}
                      className="flex items-center gap-2"
                    >
                      {triggering ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      Run Price Check Now
                    </Button>
                    
                    <Button 
                      onClick={() => triggerManualRun(true)}
                      disabled={triggering}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      Test Mock Data
                    </Button>
                  </div>

                  {triggerResult && (
                    <div className="mt-4 p-3 rounded-lg border border-green-200 bg-green-50">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">Manual Check Complete</span>
                      </div>
                      <div className="text-sm text-green-700">
                        Processed: {triggerResult.results?.processed || 0} trips
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email Address</Label>
                  <div className="text-sm text-muted-foreground mt-1">
                    {session?.user?.email || 'Not available'}
                  </div>
                </div>
                
                <div>
                  <Label>Monitoring Status</Label>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stats.monitoringTrips} active trips being monitored
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when flight prices drop
                    </p>
                  </div>
                  <Switch
                    checked={emailAlerts}
                    onCheckedChange={setEmailAlerts}
                  />
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Database Connection</span>
                    </div>
                    <Badge variant="default">Connected</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Price Monitoring Worker</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}