
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import { 
  MousePointer, 
  TrendingUp, 
  Clock, 
  Eye, 
  ShoppingCart, 
  Users, 
  ArrowRight,
  Sparkles,
  Globe,
  Smartphone
} from 'lucide-react';
import type { Browser, CreateLeadInput } from '../../../server/src/schema';

export function BrowsersPage() {
  const [browsers, setBrowsers] = useState<Browser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHighIntentOnly, setShowHighIntentOnly] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [selectedBrowser, setSelectedBrowser] = useState<Browser | null>(null);
  const [leadFormData, setLeadFormData] = useState<CreateLeadInput>({
    phone: null,
    email: null,
    name: null,
    stage: 'raw_lead',
    medium: 'website',
    source: 'organic',
    high_intent: true,
    request_type: 'product_enquiry',
    urgency: null,
    special_date: null,
    occasion: null,
    assigned_agent_id: null
  });

  const loadBrowsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await trpc.getBrowsers.query({ highIntentOnly: showHighIntentOnly });
      setBrowsers(data);
    } catch {
      setError('Failed to load browser data. Backend handlers are stubs.');
      // Show demo data
      setBrowsers([
        {
          id: 1,
          session_id: 'sess_12345abcde',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ip_address: '192.168.1.100',
          pages_visited: 8,
          time_spent: 1245, // seconds
          actions: ['product_view', 'add_to_cart', 'product_view', 'wishlist_add'],
          high_intent_score: 85,
          converted_to_lead: false,
          lead_id: null,
          created_at: new Date('2024-01-20'),
          last_activity: new Date('2024-01-22')
        },
        {
          id: 2,
          session_id: 'sess_67890fghij',
          user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
          ip_address: '10.0.1.50',
          pages_visited: 12,
          time_spent: 892,
          actions: ['product_view', 'product_view', 'compare', 'product_view', 'add_to_cart', 'checkout_start'],
          high_intent_score: 92,
          converted_to_lead: false,
          lead_id: null,
          created_at: new Date('2024-01-21'),
          last_activity: new Date('2024-01-23')
        },
        {
          id: 3,
          session_id: 'sess_klmno12345',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          ip_address: '172.16.0.25',
          pages_visited: 5,
          time_spent: 623,
          actions: ['product_view', 'product_view', 'contact_form'],
          high_intent_score: 76,
          converted_to_lead: true,
          lead_id: 5,
          created_at: new Date('2024-01-19'),
          last_activity: new Date('2024-01-21')
        },
        {
          id: 4,
          session_id: 'sess_pqrst67890',
          user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          ip_address: '203.0.113.45',
          pages_visited: 15,
          time_spent: 2156,
          actions: ['product_view', 'add_to_cart', 'product_view', 'add_to_cart', 'wishlist_add', 'compare', 'product_view'],
          high_intent_score: 95,
          converted_to_lead: false,
          lead_id: null,
          created_at: new Date('2024-01-22'),
          last_activity: new Date('2024-01-24')
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [showHighIntentOnly]);

  useEffect(() => {
    loadBrowsers();
  }, [loadBrowsers]);

  const handleConvertToLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrowser) return;

    try {
      await trpc.convertBrowserToLead.mutate({
        browserId: selectedBrowser.id,
        leadInput: leadFormData
      });

      // Update the browser as converted
      setBrowsers((prev: Browser[]) => 
        prev.map((browser: Browser) => 
          browser.id === selectedBrowser.id 
            ? { ...browser, converted_to_lead: true }
            : browser
        )
      );

      setShowConvertDialog(false);
      setSelectedBrowser(null);
      setLeadFormData({
        phone: null,
        email: null,
        name: null,
        stage: 'raw_lead',
        medium: 'website',
        source: 'organic',
        high_intent: true,
        request_type: 'product_enquiry',
        urgency: null,
        special_date: null,
        occasion: null,
        assigned_agent_id: null
      });
    } catch (error) {
      console.error('Failed to convert browser to lead:', error);
    }
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Globe className="h-4 w-4" />;
    if (userAgent.includes('iPhone') || userAgent.includes('Android')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Globe className="h-4 w-4" />;
  };

  const getDeviceType = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('Macintosh')) return 'Mac';
    if (userAgent.includes('Windows')) return 'Windows';
    return 'Desktop';
  };

  const getIntentColor = (score: number) => {
    if (score >= 90) return 'text-red-600 bg-red-100';
    if (score >= 75) return 'text-orange-600 bg-orange-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'add_to_cart': return '🛒';
      case 'product_view': return '👁️';
      case 'wishlist_add': return '❤️';
      case 'compare': return '⚖️';
      case 'checkout_start': return '💳';
      case 'contact_form': return '📞';
      default: return '📄';
    }
  };

  const filteredBrowsers = browsers.filter((browser: Browser) => 
    !showHighIntentOnly || browser.high_intent_score >= 70
  );

  const highIntentBrowsers = browsers.filter((browser: Browser) => browser.high_intent_score >= 70);
  const convertedBrowsers = browsers.filter((browser: Browser) => browser.converted_to_lead);
  const avgIntentScore = browsers.length > 0 
    ? Math.round(browsers.reduce((sum: number, browser: Browser) => sum + browser.high_intent_score, 0) / browsers.length)
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-24 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">🖱️ High-Intent Browsers</h2>
          <p className="text-gray-600 mt-1">Track website visitors with high purchase intent</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={showHighIntentOnly}
              onCheckedChange={setShowHighIntentOnly}
              id="high-intent-filter"
            />
            <Label htmlFor="high-intent-filter" className="text-sm">
              High Intent Only (70+)
            </Label>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Browsers</p>
                <p className="text-2xl font-bold text-gray-900">{browsers.length}</p>
              </div>
              <MousePointer className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Intent</p>
                <p className="text-2xl font-bold text-gray-900">{highIntentBrowsers.length}</p>
                <p className="text-xs text-orange-600">Score 70+</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Converted</p>
                <p className="text-2xl font-bold text-gray-900">{convertedBrowsers.length}</p>
                <p className="text-xs text-green-600">
                  {browsers.length > 0 ? Math.round((convertedBrowsers.length / browsers.length) * 100) : 0}% rate
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Intent Score</p>
                <p className="text-2xl font-bold text-gray-900">{avgIntentScore}</p>
                <Progress value={avgIntentScore} className="h-2 mt-2" />
              </div>
              <Sparkles className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Browsers List */}
      <div className="space-y-4">
        {filteredBrowsers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MousePointer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No browsers found</h3>
              <p className="text-gray-600">
                {showHighIntentOnly 
                  ? 'No high-intent browsers at the moment. Try disabling the filter.'
                  : 'Browser sessions will appear here as users visit your website.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredBrowsers.map((browser: Browser) => (
            <Card key={browser.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Session #{browser.session_id.slice(-8)}
                      </h3>
                      
                      <Badge className={`${getIntentColor(browser.high_intent_score)} font-semibold`}>
                        <Sparkles className="h-3 w-3 mr-1" />
                        Intent: {browser.high_intent_score}
                      </Badge>
                      
                      {browser.converted_to_lead ? (
                        <Badge className="bg-green-100 text-green-800">
                          <Users className="h-3 w-3 mr-1" />
                          Converted
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Active Browser
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          {getDeviceIcon(browser.user_agent)}
                          <span>{getDeviceType(browser.user_agent)}</span>
                          <span className="text-gray-400">•</span>
                          <span>{browser.ip_address}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Eye className="h-4 w-4" />
                          <span>{browser.pages_visited} pages viewed</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(browser.time_spent)} on site</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Recent Actions:</p>
                        <div className="flex flex-wrap gap-1">
                          {browser.actions.slice(-5).map((action, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <span className="mr-1">{getActionIcon(action)}</span>
                              {action.replace('_', ' ')}
                            </Badge>
                          ))}
                          {browser.actions.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{browser.actions.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          <p>First Seen: {browser.created_at.toLocaleDateString()}</p>
                          <p>Last Activity: {browser.last_activity.toLocaleDateString()}</p>
                        </div>
                        
                        {browser.actions.includes('add_to_cart') && (
                          <Badge className="bg-red-100 text-red-800">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Cart Activity
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-2 ml-6">
                    <div className="text-right">
                      <div className="text-3xl font-bold text-purple-600 mb-1">
                        {browser.high_intent_score}
                      </div>
                      <div className="text-xs text-gray-500">Intent Score</div>
                      <Progress 
                        value={browser.high_intent_score} 
                        className="h-2 w-16 mt-2"
                      />
                    </div>

                    {!browser.converted_to_lead && browser.high_intent_score >= 70 && (
                      <Dialog 
                        open={showConvertDialog && selectedBrowser?.id === browser.id} 
                        onOpenChange={(open) => {
                          setShowConvertDialog(open);
                          if (open) {
                            setSelectedBrowser(browser);
                            setLeadFormData(prev => ({ ...prev, high_intent: true }));
                          } else {
                            setSelectedBrowser(null);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Convert to Lead
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Convert Browser to Lead</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleConvertToLead} className="space-y-4">
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <p className="text-sm text-purple-800">
                                <strong>Session:</strong> #{browser.session_id.slice(-8)}<br />
                                <strong>Intent Score:</strong> {browser.high_intent_score}<br />
                                <strong>Actions:</strong> {browser.actions.length} total
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                  id="name"
                                  value={leadFormData.name || ''}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setLeadFormData((prev: CreateLeadInput) => ({ ...prev, name: e.target.value || null }))
                                  }
                                  placeholder="Lead name"
                                />
                              </div>
                              <div>
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                  id="phone"
                                  value={leadFormData.phone || ''}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setLeadFormData((prev: CreateLeadInput) => ({ ...prev, phone: e.target.value || null }))
                                  }
                                  placeholder="+91 xxxxx xxxxx"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                type="email"
                                value={leadFormData.email || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setLeadFormData((prev: CreateLeadInput) => ({ ...prev, email: e.target.value || null }))
                                }
                                placeholder="email@example.com"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="source">Source</Label>
                                <Select 
                                  value={leadFormData.source} 
                                  onValueChange={(value: 'google' | 'meta' | 'seo' | 'organic' | 'direct_unknown' | 'referral') => 
                                    setLeadFormData((prev: CreateLeadInput) => ({ ...prev, source: value }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="organic">Organic</SelectItem>
                                    <SelectItem value="google">Google</SelectItem>
                                    <SelectItem value="meta">Meta</SelectItem>
                                    <SelectItem value="seo">SEO</SelectItem>
                                    <SelectItem value="referral">Referral</SelectItem>
                                    <SelectItem value="direct_unknown">Direct/Unknown</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label htmlFor="urgency">Urgency</Label>
                                <Select 
                                  value={leadFormData.urgency || 'no_urgency'} 
                                  onValueChange={(value: '1_week' | '2_weeks' | '3_weeks' | '1_month' | '3_months' | 'no_urgency') => 
                                    setLeadFormData((prev: CreateLeadInput) => ({ 
                                      ...prev, 
                                      urgency: value === 'no_urgency' ? null : value 
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1_week">1 Week</SelectItem>
                                    <SelectItem value="2_weeks">2 Weeks</SelectItem>
                                    <SelectItem value="3_weeks">3 Weeks</SelectItem>
                                    <SelectItem value="1_month">1 Month</SelectItem>
                                    <SelectItem value="3_months">3 Months</SelectItem>
                                    <SelectItem value="no_urgency">No Urgency</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="occasion">Occasion</Label>
                              <Input
                                id="occasion"
                                value={leadFormData.occasion || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setLeadFormData((prev: CreateLeadInput) => ({ ...prev, occasion: e.target.value || null }))
                                }
                                placeholder="Wedding, Anniversary, etc."
                              />
                            </div>

                            <Button type="submit" className="w-full">
                              Convert to Lead
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}

                    {browser.converted_to_lead && (
                      <Badge className="bg-green-100 text-green-800">
                        Lead #{browser.lead_id}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Conversion Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Browser Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {browsers.reduce((sum: number, b: Browser) => sum + b.pages_visited, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Pages Viewed</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Math.round(browsers.reduce((sum: number, b: Browser) => sum + b.time_spent, 0) / 60)}m
              </div>
              <div className="text-sm text-gray-600">Total Time on Site</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {browsers.reduce((sum: number, b: Browser) => sum + b.actions.filter(a => a === 'add_to_cart').length, 0)}
              </div>
              <div className="text-sm text-gray-600">Cart Additions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
