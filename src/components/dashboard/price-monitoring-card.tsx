'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  Play,
  Activity,
  DollarSign
} from 'lucide-react'

interface MonitoringStats {
  totalTrips: number
  monitoringTrips: number
  totalSavings: number
  avgSavings: number
  lastChecked?: string
  recentAlerts: number
}

export function PriceMonitoringCard() {
  const [stats, setStats] = useState<MonitoringStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [triggering, setTriggering] = useState(false)

  useEffect(() => {
    fetchMonitoringStats()
  }, [])

  const fetchMonitoringStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/monitoring/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch monitoring stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerPriceCheck = async (useMockPrices = false) => {
    setTriggering(true)
    try {
      const response = await fetch('/api/admin/trigger-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useMockPrices })
      })
      if (response.ok) {
        setTimeout(fetchMonitoringStats, 2000)
      }
    } catch (error) {
      console.error('Failed to trigger price check:', error)
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Price Monitoring</span>
          </CardTitle>
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalTrips}</div>
              <div className="text-sm text-muted-foreground">Total Trips</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.monitoringTrips}</div>
              <div className="text-sm text-muted-foreground">Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500 flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
                {formatCurrency(stats.totalSavings)}
              </div>
              <div className="text-sm text-muted-foreground">Total Savings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{stats.recentAlerts}</div>
              <div className="text-sm text-muted-foreground">Recent Alerts</div>
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <Button
            onClick={() => triggerPriceCheck(false)}
            disabled={triggering}
            size="sm"
            className="flex-1"
          >
            {triggering ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Check Prices Now
          </Button>
          <Button
            onClick={() => triggerPriceCheck(true)}
            disabled={triggering}
            variant="outline" 
            size="sm"
            className="flex-1"
          >
            Test with Mock
          </Button>
        </div>

        <Button
          onClick={fetchMonitoringStats}
          disabled={loading}
          variant="ghost"
          size="sm"
          className="w-full"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Statistics
        </Button>
      </CardContent>
    </Card>
  )
}
