'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'

interface PricePoint {
  date: string
  price: number
}

interface PriceHistoryChartProps {
  priceHistory: PricePoint[]
  paidPrice: number
  currentPrice?: number
  lowestSeen?: number
}

export function PriceHistoryChart({
  priceHistory,
  paidPrice,
  currentPrice,
  lowestSeen
}: PriceHistoryChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  // Calculate chart dimensions
  const chartHeight = 200
  const chartWidth = '100%'

  // Get min and max for scaling
  const allPrices = [
    paidPrice,
    ...(priceHistory.map(p => p.price)),
    ...(currentPrice ? [currentPrice] : []),
    ...(lowestSeen ? [lowestSeen] : [])
  ].filter(p => p > 0)

  const minPrice = Math.min(...allPrices) * 0.9
  const maxPrice = Math.max(...allPrices) * 1.1
  const priceRange = maxPrice - minPrice

  // Generate SVG path for price line
  const generatePath = () => {
    if (priceHistory.length === 0) return ''

    const points = priceHistory.map((point, index) => {
      const x = (index / (priceHistory.length - 1)) * 100
      const y = ((maxPrice - point.price) / priceRange) * 100
      return `${x},${y}`
    })

    return `M ${points.join(' L ')}`
  }

  // Determine trend
  const trend = currentPrice
    ? currentPrice < paidPrice
      ? 'down'
      : currentPrice > paidPrice
        ? 'up'
        : 'neutral'
    : 'neutral'

  const savings = currentPrice ? paidPrice - currentPrice : 0

  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
          <span className="flex items-center gap-2">
            {trend === 'down' && <TrendingDown className="h-5 w-5 text-green-500" />}
            {trend === 'up' && <TrendingUp className="h-5 w-5 text-red-500" />}
            {trend === 'neutral' && <Minus className="h-5 w-5 text-gray-500" />}
            Price History
          </span>
          {savings !== 0 && (
            <span className={`text-sm font-normal ${savings > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {savings > 0 ? 'Save ' : 'Up '}{formatCurrency(Math.abs(savings))}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {priceHistory.length > 1 ? (
          <div className="space-y-4">
            {/* Chart */}
            <div className="relative h-[200px] w-full">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                {/* Grid lines */}
                <line x1="0" y1="25" x2="100" y2="25" className="stroke-gray-200 dark:stroke-slate-600" strokeWidth="0.2" />
                <line x1="0" y1="50" x2="100" y2="50" className="stroke-gray-200 dark:stroke-slate-600" strokeWidth="0.2" />
                <line x1="0" y1="75" x2="100" y2="75" className="stroke-gray-200 dark:stroke-slate-600" strokeWidth="0.2" />

                {/* Paid price reference line */}
                <line
                  x1="0"
                  y1={((maxPrice - paidPrice) / priceRange) * 100}
                  x2="100"
                  y2={((maxPrice - paidPrice) / priceRange) * 100}
                  className="stroke-amber-500"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />

                {/* Price line */}
                <path
                  d={generatePath()}
                  fill="none"
                  className="stroke-sky-500"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {priceHistory.map((point, index) => {
                  const x = (index / (priceHistory.length - 1)) * 100
                  const y = ((maxPrice - point.price) / priceRange) * 100
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="1.5"
                      className="fill-sky-500"
                    />
                  )
                })}
              </svg>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 -translate-x-full pr-2">
                <span>{formatCurrency(maxPrice)}</span>
                <span>{formatCurrency((maxPrice + minPrice) / 2)}</span>
                <span>{formatCurrency(minPrice)}</span>
              </div>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-2">
              {priceHistory.length > 0 && (
                <>
                  <span>{formatDate(priceHistory[0].date)}</span>
                  {priceHistory.length > 2 && (
                    <span>{formatDate(priceHistory[Math.floor(priceHistory.length / 2)].date)}</span>
                  )}
                  <span>{formatDate(priceHistory[priceHistory.length - 1].date)}</span>
                </>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-sky-500"></div>
                <span className="text-gray-600 dark:text-gray-300">Current Price</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-amber-500 border-dashed"></div>
                <span className="text-gray-600 dark:text-gray-300">Paid: {formatCurrency(paidPrice)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 mb-2">
              No price history available yet
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Price checks are performed every 6 hours. Check back soon!
            </p>
          </div>
        )}

        {/* Summary Stats */}
        {(currentPrice || lowestSeen) && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t dark:border-slate-600">
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">You Paid</div>
              <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(paidPrice)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current</div>
              <div className={`font-semibold ${currentPrice && currentPrice < paidPrice ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                {currentPrice ? formatCurrency(currentPrice) : '—'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lowest Seen</div>
              <div className="font-semibold text-green-600 dark:text-green-400">
                {lowestSeen ? formatCurrency(lowestSeen) : '—'}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
