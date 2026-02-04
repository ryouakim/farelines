'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings,
  Clock,
  Play,
  Pause,
  RefreshCw,
  Bell,
  Shield,
  User,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Database,
  Mail,
  Globe
} from 'lucide-react'

interface UserSettings {
  email: string
  notifications: {
    emailAlerts: boolean
    priceDrops: boolean
    systemUpdates: boolean
    weeklyDigest: boolean
  }
  monitoring: {
    enabled: boolean
    interval: number // minutes
    alertThreshold: number // dollars
    autoArchive: boolean
  }
  privacy: {
    dataRetention: number // days
    shareAnalytics: boolean
  }
}

interface CronStatus {
  enabled: boolean
  lastRun: string
  nextRun: string
  totalJobs: number
  successfulJobs: number
  failedJobs: number
  averageRunTime: number
}

interface SystemStats {
  totalTrips: number
  activeTrips: number
  totalSavings: number
  lastWorkerRun: string
  workerStatus: 'active' | 'idle' | 'error'
  databaseConnected: boolean
  emailServiceStatus: 'active' | 'error'
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [cronStatus, setCronStatus] = useState<CronStatus | null>(null)
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [triggering, setTriggering] = useState(false)
  const [triggerResult, setTriggerResult] = useState<any>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchAllData()
    }
  }, [status, router])

  const fetchAllData = async () => {
    await Promise.all([
      fetchSettings(),
      fetchCronStatus(),
      fetchSystemStats()
    ])
    setLoading(false)
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/user/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      } else {
        // Set defaults if no settings exist
        setSettings({
          email: session?.user?.email || '',
          notifications: {
            emailAlerts: true,
            priceDrops: true,
            systemUpdates: false,
            weeklyDigest: true
          },
          monitoring: {
            enabled: true,
            interval: 360, // 6 hours
            alertThreshold: 50,
            autoArchive: true
          },
          privacy: {
            dataRetention: 365,
            shareAnalytics: false
          }
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const fetchCronStatus = async () => {
    try {
      const response = await fetch('/api/admin/cron/status')
      if (response.ok) {
        const data = await response.json()
        setCronStatus(data)
      }
    } catch (error) {
      console.error('Error fetching cron status:', error)
    }
  }

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/monitoring/stats')
      if (response.ok) {
        const data = await response.json()
        setSystemStats({
          totalTrips: data.totalTrips,
          activeTrips: data.monitoringTrips,
          totalSavings: data.totalSavings,
          lastWorkerRun: data.lastCheck?.timestamp || 'Never',
          workerStatus: data.lastCheck?.successful > 0 ? 'active' : 'idle',
          databaseConnected: true,
          emailServiceStatus: 'active'
        })
      }
    } catch (error) {
      console.error('Error fetching system stats:', error)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })

      if (response.ok) {
        alert('Settings saved successfully!')
      } else {
        alert('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const toggleCron = async (enable: boolean) => {
    try {
      const response = await fetch('/api/admin/cron/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: enable })
      })

      if (response.ok) {
        fetchCronStatus()
      }
    } catch (error) {
      console.error('Error toggling cron:', error)
    }
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
        
        // Refresh data after manual run
        setTimeout(() => {
          fetchAllData()
        }, 2000)
      }
    } catch (error) {
      console.error('Error triggering manual run:', error)
    } finally {
      setTriggering(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString || dateString === 'Never') return 'Never'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
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

  if (!settings) return null

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account, monitoring preferences, and system controls
            </p>
          </div>

          <Tabs defaultValue="monitoring" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            {/* Monitoring Tab */}
            <TabsContent value="monitoring" className="space-y-6">
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
                      <div className="text-2xl font-bold">{systemStats?.totalTrips || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Trips</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(systemStats?.totalSavings || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Savings</div>
                    </div>
                    <div className="text-center">
                      <Badge variant={systemStats?.workerStatus === 'active' ? 'default' : 'secondary'}>
                        {systemStats?.workerStatus || 'Unknown'}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">Worker Status</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cron Job Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Automated Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Cron Status */}
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        cronStatus?.enabled ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <div className="font-medium">
                          Automatic Price Checking
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {cronStatus?.enabled ? 'Running every 6 hours' : 'Disabled'}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={cronStatus?.enabled || false}
                      onCheckedChange={toggleCron}
                    />
                  </div>

                  {/* Monitoring Settings */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="interval">Check Interval</Label>
                        <Select
                          value={settings.monitoring.interval.toString()}
                          onValueChange={(value) => setSettings({
                            ...settings,
                            monitoring: {
                              ...settings.monitoring,
                              interval: parseInt(value)
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="60">Every hour</SelectItem>
                            <SelectItem value="180">Every 3 hours</SelectItem>
                            <SelectItem value="360">Every 6 hours</SelectItem>
                            <SelectItem value="720">Every 12 hours</SelectItem>
                            <SelectItem value="1440">Daily</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="threshold">Alert Threshold ($)</Label>
                        <Select
                          value={settings.monitoring.alertThreshold.toString()}
                          onValueChange={(value) => setSettings({
                            ...settings,
                            monitoring: {
                              ...settings.monitoring,
                              alertThreshold: parseInt(value)
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">$10</SelectItem>
                            <SelectItem value="25">$25</SelectItem>
                            <SelectItem value="50">$50</SelectItem>
                            <SelectItem value="100">$100</SelectItem>
                            <SelectItem value="250">$250</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {cronStatus && (
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Run:</span>
                            <span>{formatDateTime(cronStatus.lastRun)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Next Run:</span>
                            <span>{formatDateTime(cronStatus.nextRun)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Success Rate:</span>
                            <span>
                              {cronStatus.totalJobs > 0 
                                ? Math.round((cronStatus.successfulJobs / cronStatus.totalJobs) * 100)
                                : 0}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Manual Controls */}
                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Manual Controls
                    </h4>
                    <div className="flex flex-col sm:flex-row gap-3">
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
                        {triggering ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        Test with Mock Data
                      </Button>
                    </div>

                    {/* Trigger Result */}
                    {triggerResult && (
                      <div className="mt-4 p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-800 dark:text-green-200">
                            Manual Check Complete
                          </span>
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                          <div>Processed: {triggerResult.results?.processed || 0} trips</div>
                          <div>Successful: {triggerResult.results?.successful || 0}</div>
                          {(triggerResult.results?.alerts || 0) > 0 && (
                            <div className="font-medium">
                              🎉 Generated {triggerResult.results?.alerts} new alerts!
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-alerts">Email Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive email notifications for important updates
                        </p>
                      </div>
                      <Switch
                        id="email-alerts"
                        checked={settings.notifications.emailAlerts}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            emailAlerts: checked
                          }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="price-drops">Price Drop Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when flight prices drop below your threshold
                        </p>
                      </div>
                      <Switch
                        id="price-drops"
                        checked={settings.notifications.priceDrops}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            priceDrops: checked
                          }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="system-updates">System Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Notifications about system maintenance and updates
                        </p>
                      </div>
                      <Switch
                        id="system-updates"
                        checked={settings.notifications.systemUpdates}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            systemUpdates: checked
                          }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="weekly-digest">Weekly Digest</Label>
                        <p className="text-sm text-muted-foreground">
                          Weekly summary of your trips and savings
                        </p>
                      </div>
                      <Switch
                        id="weekly-digest"
                        checked={settings.notifications.weeklyDigest}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            weeklyDigest: checked
                          }
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6">
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
                      {session?.user?.email}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Account Created</Label>
                    <div className="text-sm text-muted-foreground mt-1">
                      {new Date().toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacy Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="retention">Data Retention</Label>
                    <Select
                      value={settings.privacy.dataRetention.toString()}
                      onValueChange={(value) => setSettings({
                        ...settings,
                        privacy: {
                          ...settings.privacy,
                          dataRetention: parseInt(value)
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="180">6 months</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                        <SelectItem value="730">2 years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="analytics">Share Analytics</Label>
                      <p className="text-sm text-muted-foreground">
                        Help improve the service with anonymous usage data
                      </p>
                    </div>
                    <Switch
                      id="analytics"
                      checked={settings.privacy.shareAnalytics}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        privacy: {
                          ...settings.privacy,
                          shareAnalytics: checked
                        }
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Tab */}
            <TabsContent value="system" className="space-y-6">
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
                        <div className={`w-2 h-2 rounded-full ${
                          systemStats?.databaseConnected ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span>Database Connection</span>
                      </div>
                      <Badge variant={systemStats?.databaseConnected ? 'default' : 'destructive'}>
                        {systemStats?.databaseConnected ? 'Connected' : 'Error'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          systemStats?.emailServiceStatus === 'active' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span>Email Service</span>
                      </div>
                      <Badge variant={systemStats?.emailServiceStatus === 'active' ? 'default' : 'destructive'}>
                        {systemStats?.emailServiceStatus === 'active' ? 'Active' : 'Error'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          systemStats?.workerStatus === 'active' ? 'bg-green-500' : 'bg-gray-500'
                        }`}></div>
                        <span>Price Monitoring Worker</span>
                      </div>
                      <Badge variant={systemStats?.workerStatus === 'active' ? 'default' : 'secondary'}>
                        {systemStats?.workerStatus || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Settings */}
          <div className="flex justify-end pt-6 border-t">
            <Button 
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Settings className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}