import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { format } from 'date-fns'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { AlertCircle, TrendingUp, TrendingDown, Wallet, Users, Activity, LineChart, Download, FileText } from 'lucide-react'
import { StatCard } from '../components/StatCard'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'

interface DashboardData {
  net_worth: {
    total_net_worth: number
    total_assets: number
    total_liabilities: number
    last_updated: string
  }
  asset_allocation: {
    allocation: Array<{
      account_type: string
      amount: number
      percentage: number
    }>
  }
  member_net_worth: Array<{
    user_id: number
    user_name: string
    net_worth: number
    accounts_count: number
  }>
  top_movers: Array<{
    account_id: number
    account_name: string
    change_amount: number
    change_percentage: number
    change_type: string
  }>
  alerts: Array<{
    type: string
    title: string
    message: string
    account_id?: number
    due_date?: string
    amount?: number
  }>
  last_synced?: string
}

const COLORS = ['#22c55e', '#16a34a', '#10b981', '#4ade80', '#86efac', '#059669']

// Generate mock chart data for mini charts
const generateMiniChartData = (value: number, days: number = 30) => {
  const data = []
  const baseValue = value * 0.7
  for (let i = 0; i < days; i++) {
    data.push({
      date: dayjs().subtract(days - i, 'day').format('YYYY-MM-DD'),
      value: baseValue + (Math.random() * value * 0.6),
    })
  }
  return data
}

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard')
      return response.data
    },
  })

  // Export functions
  const exportPDF = async () => {
    try {
      const response = await api.get('/exports/net-worth/pdf', {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `net_worth_report_${format(new Date(), 'yyyyMMdd')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('PDF report downloaded successfully')
    } catch (error: any) {
      console.error('Error exporting PDF:', error)
      toast.error(error.response?.data?.detail || 'Failed to export PDF report')
    }
  }

  const exportCSV = async () => {
    try {
      const response = await api.get('/exports/net-worth/csv', {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `net_worth_report_${format(new Date(), 'yyyyMMdd')}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('CSV report downloaded successfully')
    } catch (error: any) {
      console.error('Error exporting CSV:', error)
      toast.error(error.response?.data?.detail || 'Failed to export CSV report')
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <StatCard
              key={`skeleton-${num}`}
              title="LOADING"
              value="0"
              isLoading={true}
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive">Error loading dashboard</div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  // Calculate trends (mock for now - you'll need to implement this based on your data)
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return undefined
    const change = ((current - previous) / previous) * 100
    return {
      change: Math.round(change * 10) / 10,
      current,
      previous,
      currentPeriod: { start: dayjs().subtract(30, 'day').format('YYYY-MM-DD'), end: dayjs().format('YYYY-MM-DD') },
      previousPeriod: { start: dayjs().subtract(60, 'day').format('YYYY-MM-DD'), end: dayjs().subtract(30, 'day').format('YYYY-MM-DD') },
    }
  }

  const netWorthTrend = calculateTrend(data.net_worth.total_net_worth, data.net_worth.total_net_worth * 0.95)
  const assetsTrend = calculateTrend(data.net_worth.total_assets, data.net_worth.total_assets * 0.97)
  const liabilitiesTrend = calculateTrend(data.net_worth.total_liabilities, data.net_worth.total_liabilities * 1.05)

  return (
    <div className="px-6 pt-0 pb-6 sm:pt-6">
      <div className="space-y-6">
        {/* Header with Export Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Overview of your financial portfolio</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards - Matching DataBuddy exact layout */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            id="net-worth-chart"
            title="NET WORTH"
            value={data.net_worth.total_net_worth}
            description=""
            icon={Wallet}
            chartData={generateMiniChartData(data.net_worth.total_net_worth)}
            trend={netWorthTrend}
            trendLabel="vs previous period"
            showChart={true}
            isLoading={isLoading}
          />
          <StatCard
            id="assets-chart"
            title="ASSETS"
            value={data.net_worth.total_assets}
            description=""
            icon={TrendingUp}
            chartData={generateMiniChartData(data.net_worth.total_assets)}
            trend={assetsTrend}
            trendLabel="vs previous period"
            showChart={true}
            isLoading={isLoading}
          />
          <StatCard
            id="liabilities-chart"
            title="LIABILITIES"
            value={data.net_worth.total_liabilities}
            description=""
            icon={TrendingDown}
            chartData={generateMiniChartData(data.net_worth.total_liabilities)}
            trend={liabilitiesTrend}
            trendLabel="vs previous period"
            showChart={true}
            isLoading={isLoading}
            invertTrend={true}
          />
          <StatCard
            id="accounts-chart"
            title="ACCOUNTS"
            value={data.member_net_worth.reduce((sum, m) => sum + m.accounts_count, 0)}
            description=""
            icon={Activity}
            chartData={generateMiniChartData(data.member_net_worth.reduce((sum, m) => sum + m.accounts_count, 0))}
            showChart={true}
            isLoading={isLoading}
          />
          <StatCard
            id="members-chart"
            title="MEMBERS"
            value={data.member_net_worth.length}
            description=""
            icon={Users}
            chartData={generateMiniChartData(data.member_net_worth.length)}
            showChart={true}
            isLoading={isLoading}
          />
          <StatCard
            id="movers-chart"
            title="TOP MOVERS"
            value={data.top_movers.length}
            description=""
            icon={LineChart}
            chartData={generateMiniChartData(data.top_movers.length)}
            showChart={true}
            isLoading={isLoading}
          />
        </div>

        {/* Chart Section - Matching DataBuddy */}
        <div className="rounded border border-sidebar-border border-b-0 bg-sidebar shadow-sm">
          <div className="flex flex-col items-start justify-between gap-3 border-sidebar-border border-b px-4 py-3 sm:flex-row">
            <div>
              <h2 className="font-semibold text-lg text-sidebar-foreground tracking-tight">
                Net Worth Trends
              </h2>
              <p className="text-sidebar-foreground/70 text-sm">
                Daily net worth data
              </p>
            </div>
          </div>
          <div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.member_net_worth}>
                <XAxis
                  dataKey="user_name"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={{ stroke: 'var(--border)' }}
                />
                <YAxis
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={{ stroke: 'var(--border)' }}
                />
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                />
                <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} />
                <Bar dataKey="net_worth" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded border border-sidebar-border bg-sidebar shadow-sm">
            <div className="border-sidebar-border border-b px-4 py-3">
              <h3 className="font-semibold text-lg text-sidebar-foreground tracking-tight">
                Asset Allocation
              </h3>
              <p className="text-sidebar-foreground/70 text-sm mt-1">
                Distribution of assets by type
              </p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.asset_allocation.allocation}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    outerRadius={90}
                    fill="var(--primary)"
                    dataKey="amount"
                  >
                    {data.asset_allocation.allocation.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Movers */}
          <div className="rounded border border-sidebar-border bg-sidebar shadow-sm">
            <div className="border-sidebar-border border-b px-4 py-3">
              <h3 className="font-semibold text-lg text-sidebar-foreground tracking-tight">
                Top Movers (7 days)
              </h3>
              <p className="text-sidebar-foreground/70 text-sm mt-1">
                Accounts with significant changes
              </p>
            </div>
            <div className="space-y-3 p-4">
              {data.top_movers.length > 0 ? (
                data.top_movers.map((mover) => (
                  <div key={mover.account_id} className="bg-card rounded-lg p-4 border border-border hover:border-primary/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-foreground mb-1">{mover.account_name}</div>
                        <div className="text-sm">
                          {mover.change_type === 'increase' ? (
                            <span className="text-success flex items-center">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              +₹{Math.abs(mover.change_amount).toLocaleString('en-IN')} ({mover.change_percentage.toFixed(1)}%)
                            </span>
                          ) : (
                            <span className="text-destructive flex items-center">
                              <TrendingDown className="h-4 w-4 mr-1" />
                              -₹{Math.abs(mover.change_amount).toLocaleString('en-IN')} ({mover.change_percentage.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground text-center py-8 text-sm">No significant changes in the last 7 days</div>
              )}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <div className="rounded border border-sidebar-border bg-sidebar shadow-sm border-warning/30 bg-warning/5">
            <div className="border-sidebar-border border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                <h3 className="font-semibold text-lg text-sidebar-foreground tracking-tight">
                  Alerts & Notifications
                </h3>
              </div>
            </div>
            <div className="space-y-3 p-4">
              {data.alerts.map((alert, index) => (
                <div key={index} className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                  <div className="font-medium text-warning">{alert.title}</div>
                  <div className="text-sm text-warning/80 mt-1">{alert.message}</div>
                  {alert.due_date && (
                    <div className="text-xs text-warning/60 mt-2">
                      Due: {format(new Date(alert.due_date), 'PPp')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
