
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import { 
  Target, 
  DollarSign, 
  Calendar, 
  Package, 
  Truck, 
  CreditCard, 
  Plus,
  Phone,
  Mail,
  Clock,
  TrendingUp
} from 'lucide-react';
import type { Lead, Order, CreateOrderInput } from '../../../server/src/schema';

interface LeadWithOrders extends Lead {
  orders?: Order[];
}

export function ActiveDeals() {
  const [activeDeals, setActiveDeals] = useState<LeadWithOrders[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateOrderDialog, setShowCreateOrderDialog] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [orderFormData, setOrderFormData] = useState<CreateOrderInput>({
    lead_id: 0,
    product_type: '',
    price: 0,
    quantity: 1,
    special_notes: null,
    estimated_delivery: null
  });

  const loadActiveDeals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get genuine leads (active deals)
      const leadsData = await trpc.getLeads.query({
        stage: 'genuine_lead',
        limit: 100
      });
      
      // Get all orders
      const ordersData = await trpc.getOrders.query({
        limit: 200
      });
      
      setActiveDeals(leadsData);
      setOrders(ordersData);
    } catch {
      setError('Failed to load active deals. Backend handlers are stubs.');
      // Show demo data
      setActiveDeals([
        {
          id: 1,
          phone: '+91 98765 43210',
          email: 'priya.sharma@email.com',
          name: 'Priya Sharma',
          stage: 'genuine_lead',
          status: 'estimates_shared',
          follow_up_status: 'follow_up',
          medium: 'wati',
          source: 'google',
          high_intent: true,
          request_type: 'product_enquiry',
          urgency: '2_weeks',
          special_date: new Date('2024-02-14'),
          occasion: 'Anniversary',
          assigned_agent_id: 1,
          lead_score: 85,
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-20'),
          last_contact_at: new Date('2024-01-18')
        },
        {
          id: 4,
          phone: '+91 76543 21098',
          email: 'vikram.singh@email.com',
          name: 'Vikram Singh',
          stage: 'genuine_lead',
          status: 'first_call_done',
          follow_up_status: 'follow_up',
          medium: 'phone',
          source: 'referral',
          high_intent: true,
          request_type: 'product_enquiry',
          urgency: '1_week',
          special_date: new Date('2024-03-15'),
          occasion: 'Wedding',
          assigned_agent_id: 2,
          lead_score: 92,
          created_at: new Date('2024-01-10'),
          updated_at: new Date('2024-01-21'),
          last_contact_at: new Date('2024-01-20')
        }
      ]);

      setOrders([
        {
          id: 1,
          lead_id: 1,
          product_type: 'Diamond Engagement Ring',
          price: 125000,
          quantity: 1,
          special_notes: '1.5 carat solitaire, white gold band',
          delivery_status: 'in_transit',
          payment_status: 'partial',
          order_status: 'in_production',
          created_at: new Date('2024-01-20'),
          updated_at: new Date('2024-01-22'),
          estimated_delivery: new Date('2024-02-10'),
          actual_delivery: null
        },
        {
          id: 2,
          lead_id: 4,
          product_type: 'Diamond Necklace Set',
          price: 89000,
          quantity: 1,
          special_notes: 'Traditional design with matching earrings',
          delivery_status: 'delivered',
          payment_status: 'paid',
          order_status: 'delivered',
          created_at: new Date('2024-01-12'),
          updated_at: new Date('2024-01-23'),
          estimated_delivery: new Date('2024-01-25'),
          actual_delivery: null
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveDeals();
  }, [loadActiveDeals]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) return;

    try {
      const orderData = { ...orderFormData, lead_id: selectedLeadId };
      const newOrder = await trpc.createOrder.mutate(orderData);
      setOrders((prev: Order[]) => [newOrder, ...prev]);
      setShowCreateOrderDialog(false);
      setOrderFormData({
        lead_id: 0,
        product_type: '',
        price: 0,
        quantity: 1,
        special_notes: null,
        estimated_delivery: null
      });
      setSelectedLeadId(null);
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'first_call_done': 'bg-blue-100 text-blue-800',
      'estimates_shared': 'bg-purple-100 text-purple-800',
      'disqualified': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getOrderStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'in_production': 'bg-purple-100 text-purple-800',
      'ready_for_delivery': 'bg-green-100 text-green-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-red-100 text-red-800',
      'partial': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'refunded': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getProgressPercentage = (status: string) => {
    const progress = {
      'first_call_done': 25,
      'estimates_shared': 50,
      'disqualified': 0
    };
    return progress[status as keyof typeof progress] || 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getLeadOrders = (leadId: number) => {
    return orders.filter((order: Order) => order.lead_id === leadId);
  };

  const filteredDeals = activeDeals.filter((deal: LeadWithOrders) => {
    if (statusFilter === 'all') return true;
    return deal.status === statusFilter;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
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
          <h2 className="text-3xl font-bold text-gray-900">🎯 Active Deals</h2>
          <p className="text-gray-600 mt-1">Manage genuine leads and their orders</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="first_call_done">First Call Done</SelectItem>
              <SelectItem value="estimates_shared">Estimates Shared</SelectItem>
              <SelectItem value="disqualified">Disqualified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deals</p>
                <p className="text-2xl font-bold text-gray-900">{filteredDeals.length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(orders.reduce((sum: number, order: Order) => sum + (order.price * order.quantity), 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">68%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Deals List */}
      <div className="space-y-6">
        {filteredDeals.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No active deals found</h3>
              <p className="text-gray-600">
                Active deals will appear here when leads are marked as genuine leads.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDeals.map((deal: LeadWithOrders) => {
            const dealOrders = getLeadOrders(deal.id);
            const totalOrderValue = dealOrders.reduce((sum: number, order: Order) => sum + (order.price * order.quantity), 0);
            
            return (
              <Card key={deal.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className="text-xl text-gray-900">
                          {deal.name || 'Anonymous Deal'}
                        </CardTitle>
                        {deal.high_intent && (
                          <Badge className="bg-orange-100 text-orange-800">
                            High Intent
                          </Badge>
                        )}
                        {deal.status && (
                          <Badge className={getStatusColor(deal.status)}>
                            {deal.status.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          {deal.phone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span>{deal.phone}</span>
                            </div>
                          )}
                          {deal.email && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span>{deal.email}</span>
                            </div>
                          )}
                          {deal.occasion && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{deal.occasion}</span>
                              {deal.special_date && (
                                <span>({deal.special_date.toLocaleDateString()})</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600 mb-1">
                            {deal.lead_score}
                          </div>
                          <div className="text-xs text-gray-500 mb-2">Lead Score</div>
                          
                          {deal.status && (
                            <div className="mb-2">
                              <div className="text-xs text-gray-500 mb-1">Progress</div>
                              <Progress 
                                value={getProgressPercentage(deal.status)} 
                                className="h-2"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Orders ({dealOrders.length})
                    </h4>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        Total Value: <span className="font-semibold text-green-600">
                          {formatCurrency(totalOrderValue)}
                        </span>
                      </span>
                      <Dialog 
                        open={showCreateOrderDialog && selectedLeadId === deal.id} 
                        onOpenChange={(open) => {
                          setShowCreateOrderDialog(open);
                          if (open) setSelectedLeadId(deal.id);
                          else setSelectedLeadId(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Order
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Create Order for {deal.name}</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleCreateOrder} className="space-y-4">
                            <div>
                              <Label htmlFor="product_type">Product Type</Label>
                              <Input
                                id="product_type"
                                value={orderFormData.product_type}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setOrderFormData((prev: CreateOrderInput) => ({ ...prev, product_type: e.target.value }))
                                }
                                placeholder="Diamond Ring, Necklace, etc."
                                required
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="price">Price (₹)</Label>
                                <Input
                                  id="price"
                                  type="number"
                                  value={orderFormData.price}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setOrderFormData((prev: CreateOrderInput) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                                  }
                                  min="0"
                                  step="100"
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="quantity">Quantity</Label>
                                <Input
                                  id="quantity"
                                  type="number"
                                  value={orderFormData.quantity}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setOrderFormData((prev: CreateOrderInput) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))
                                  }
                                  min="1"
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="estimated_delivery">Estimated Delivery</Label>
                              <Input
                                id="estimated_delivery"
                                type="date"
                                value={orderFormData.estimated_delivery?.toISOString().split('T')[0] || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setOrderFormData((prev: CreateOrderInput) => ({ 
                                    ...prev, 
                                    estimated_delivery: e.target.value ? new Date(e.target.value) : null 
                                  }))
                                }
                              />
                            </div>

                            <div>
                              <Label htmlFor="special_notes">Special Notes</Label>
                              <Textarea
                                id="special_notes"
                                value={orderFormData.special_notes || ''}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                  setOrderFormData((prev: CreateOrderInput) => ({ ...prev, special_notes: e.target.value || null }))
                                }
                                placeholder="Customization details, special requirements..."
                                rows={3}
                              />
                            </div>

                            <Button type="submit" className="w-full">
                              Create Order
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {dealOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No orders yet. Create the first order for this deal.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dealOrders.map((order: Order) => (
                        <div key={order.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900 mb-2">
                                {order.product_type}
                              </h5>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">Price & Quantity</p>
                                  <p className="font-semibold">
                                    {formatCurrency(order.price)} × {order.quantity}
                                  </p>
                                  <p className="text-green-600 font-bold">
                                    Total: {formatCurrency(order.price * order.quantity)}
                                  </p>
                                </div>
                                
                                <div className="space-y-1">
                                  <Badge className={getOrderStatusColor(order.order_status)}>
                                    <Package className="h-3 w-3 mr-1" />
                                    {order.order_status.replace('_', ' ')}
                                  </Badge>
                                  <Badge className={getPaymentStatusColor(order.payment_status)}>
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    {order.payment_status}
                                  </Badge>
                                  <Badge variant="outline">
                                    <Truck className="h-3 w-3 mr-1" />
                                    {order.delivery_status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                
                                <div>
                                  {order.estimated_delivery && (
                                    <div className="flex items-center space-x-1 text-gray-600">
                                      <Clock className="h-3 w-3" />
                                      <span className="text-xs">
                                        Est. Delivery: {order.estimated_delivery.toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    Created: {order.created_at.toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              
                              {order.special_notes && (
                                <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                                  <p className="text-blue-800">{order.special_notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
