
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import { 
  Users, 
  Target, 
  DollarSign, 
  TrendingUp, 
  MousePointer, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import type { DashboardStats } from '../../../server/src/handlers/get_dashboard_stats';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await trpc.getDashboardStats.query({});
      setStats(data);
    } catch {
      setError('Failed to load dashboard data. Backend handlers are stubs.');
      // Show demo data
      setStats({
        totalLeads: 1247,
        activeDeals: 89,
        completedSales: 156,
        revenue: 2847500,
        highIntentBrowsers: 23, 
        pendingFollowUps: 12,
        leadsByStage: {
          'raw_lead': 450,
          'in_contact': 234,
          'genuine_lead': 189,
          'not_interested': 298,
          'no_response': 76
        },
        leadsBySource: {
          'google': 467,
          'meta': 298,
          'seo': 187,
          'organic': 156,
          'referral': 89,
          'direct_unknown': 50
        },
        salesByMonth: [
          { month: 'Jan', sales: 23, revenue: 456700 },
          { month: 'Feb', sales: 31, revenue: 623400 },
          { month: 'Mar', sales: 28, revenue: 534200 },
          { month: 'Apr', sales: 35, revenue: 698500 },
          { month: 'May', sales: 39, revenue: 734800 }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <p className="text-red-800">
            {error || 'Failed to load dashboard data'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-amber-800 text-sm">
              ⚠️ {error} Showing demo data below.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Leads</p>
                <p className="text-3xl font-bold">{stats.totalLeads.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-green-200" />
                  <span className="text-sm text-blue-100">+12% from last month</span>
                </div>
              </div>
              <Users className="h-12 w-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Deals</p>
                <p className="text-3xl font-bold">{stats.activeDeals}</p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-green-200" />
                  <span className="text-sm text-green-100">+8% from last month</span>
                </div>
              </div>
              <Target className="h-12 w-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.revenue)}</p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-green-200" />
                  <span className="text-sm text-purple-100">+15% from last month</span>
                </div>
              </div>
              <DollarSign className="h-12 w-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">High Intent Browsers</p>
                <p className="text-3xl font-bold">{stats.highIntentBrowsers}</p>
                <div className="flex items-center mt-2">
                  <ArrowDownRight className="h-4 w-4 text-red-200" />
                  <span className="text-sm text-orange-100">-3% from last week</span>
                </div>
              </div>
              <MousePointer className="h-12 w-12 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed Sales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedSales}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>This Month</span>
                <span className="font-medium">39 sales</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending Follow-ups</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingFollowUps}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Due Today</span>
                <span className="font-medium text-red-600">5 pending</span>
              </div>
              <Progress value={42} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Leads by Stage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.leadsByStage).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={
                        stage === 'genuine_lead' ? 'default' :
                        stage === 'in_contact' ? 'secondary' :
                        stage === 'not_interested' ? 'destructive' :
                        'outline'
                      }
                    >
                      {stage.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{count}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(count / stats.totalLeads) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.leadsBySource).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">
                      {source.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{count}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(count / stats.totalLeads) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Sales Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {stats.salesByMonth.map((month) => (
              <div key={month.month} className="text-center">
                <div className="mb-2">
                  <p className="text-sm font-medium text-gray-600">{month.month}</p>
                </div>
                <div className="space-y-2">
                  <div className="bg-blue-100 rounded-lg p-3">
                    <p className="text-2xl font-bold text-blue-700">{month.sales}</p>
                    <p className="text-xs text-blue-600">Sales</p>
                  </div>
                  <div className="bg-green-100 rounded-lg p-2">
                    <p className="text-sm font-semibold text-green-700">
                      {formatCurrency(month.revenue)}
                    </p>
                    <p className="text-xs text-green-600">Revenue</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
