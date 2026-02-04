'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Settings, 
  Play, 
  Pause, 
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Timer
} from 'lucide-react'

interface TripMonitoringControlsProps {
  tripId: string
  currentStatus?: {
    monitoringEnabled: boolean
    checkInterval: number
    nextCheckAt?: string
    lastCheckedAt?: string
    status: string
  }
  onStatusChange?: () => void
}

const intervalOptions = [
  { value: 60, label: '1 hour', description: 'Frequent checks' },
  { value: 120, label: '2 hours', description: 'Regular monitoring' },
  { value: 180, label: '3 hours', description: 'Moderate checking' },
  { value: 360, label: '6 hours', description: 'Standard (recommended)' },
  { value: 480, label: '8 hours', description: 'Business hours' },
  { value: 720, label: '12 hours', description: 'Twice daily' },
  { value: 1440, label: '24 hours', description: 'Daily checks' }
]

export function TripMonitoringControls({ 
  tripId, 
  currentStatus, 
  onStatusChange 
}: TripMonitoringControlsProps) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const [lastManualCheck, setLastManualCheck] = useState<string | null>(null)

  useEffect(() => {
    setStatus(currentStatus)
  }, [currentStatus])

  const getStatusBadge = () => {
    if (!status) return <Badge variant="secondary">Loading</Badge>
    
    switch (status.status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Active
        </Badge>
      case 'disabled':
        return <Badge variant="secondary">
          <Pause className="w-3 h-3 mr-1" />
          Disabled
        </Badge>
      case 'error':
        return <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      case 'stale':
        return <Badge variant="outline">
          <Clock className="w-3 h-3 mr-1" />
          Stale
        </Badge>
      case 'pending_first_check':
        return <Badge variant="outline">
          <Timer className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      default:
        return <Badge variant="secondary">{status.status}</Badge>
    }
  }

  const toggleMonitoring = async () => {
    setLoading(true)
    try {
      const action = status?.monitoringEnabled ? 'disable_monitoring' : 'enable_monitoring'
      
      const response = await fetch('/api/monitoring/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          tripIds: [tripId]
        })
      })

      if (response.ok) {
        await refreshStatus()
        onStatusChange?.()
      }
    } catch (error) {
      console.error('Failed to toggle monitoring:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateInterval = async (newInterval: number) => {
    setLoading(true)
    try {
      const response = await fetch('/api/monitoring/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_intervals',
          tripIds: [tripId],
          settings: { interval: newInterval }
        })
      })

      if (response.ok) {
        await refreshStatus()
        onStatusChange?.()
      }
    } catch (error) {
      console.error('Failed to update interval:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerManualCheck = async () => {
    // Check cooldown
    if (lastManualCheck) {
      const timeSince = Date.now() - new Date(lastManualCheck).getTime()
      if (timeSince < 30 * 60 * 1000) { // 30 minutes
        const waitMinutes = Math.ceil((30 * 60 * 1000 - timeSince) / 60000)
        alert(`Please wait ${waitMinutes} more minutes before triggering another check`)
        return
      }
    }

    setLoading(true)
    try {
      const response = await fetch('/api/monitoring/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger_manual_check',
          tripIds: [tripId]
        })
      })

      if (response.ok) {
        setLastManualCheck(new Date().toISOString())
        await refreshStatus()
        onStatusChange?.()
      }
    } catch (error) {
      console.error('Failed to trigger manual check:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshStatus = async () => {
    try {
      const response = await fetch(`/api/monitoring/control?tripId=${tripId}`)
      if (response.ok) {
        const newStatus = await response.json()
        setStatus(newStatus)
      }
    } catch (error) {
      console.error('Failed to refresh status:', error)
    }
  }

  const formatNextCheck = () => {
    if (!status?.nextCheckAt) return 'Not scheduled'
    
    const nextCheck = new Date(status.nextCheckAt)
    const now = new Date()
    const diffMs = nextCheck.getTime() - now.getTime()
    
    if (diffMs < 0) return 'Overdue'
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading monitoring status...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Settings className="h-5 w-5" />
              <span>Price Monitoring</span>
            </CardTitle>
            <CardDescription>Control how often we check prices for this trip</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Monitoring Toggle */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <div className="font-medium">Enable Monitoring</div>
            <div className="text-sm text-muted-foreground">
              Automatically check for price drops
            </div>
          </div>
          <Switch
            checked={status.monitoringEnabled}
            onCheckedChange={toggleMonitoring}
            disabled={loading}
          />
        </div>

        {/* Check Interval Setting */}
        {status.monitoringEnabled && (
          <div className="space-y-3">
            <div>
              <div className="font-medium mb-2">Check Frequency</div>
              <Select
                value={status.checkInterval?.toString() || '360'}
                onValueChange={(value) => updateInterval(parseInt(value))}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {intervalOptions.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      <div>
                        <div>{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Next Check Info */}
            <div className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
              <span className="text-muted-foreground">Next check in:</span>
              <span className="font-medium">{formatNextCheck()}</span>
            </div>
          </div>
        )}

        {/* Manual Actions */}
        <div className="flex space-x-2 pt-2">
          <Button
            onClick={triggerManualCheck}
            disabled={loading || !status.monitoringEnabled}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Check Now
          </Button>
          
          <Button
            onClick={refreshStatus}
            disabled={loading}
            size="sm"
            variant="ghost"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Last Check Info */}
        {status.lastCheckedAt && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            Last checked: {new Date(status.lastCheckedAt).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}