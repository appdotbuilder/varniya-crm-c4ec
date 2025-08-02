
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { 
  Search, 
  Filter, 
  Plus, 
  Phone, 
  Mail, 
  User, 
  Calendar,
  Target,
  AlertCircle,
  Star
} from 'lucide-react';
import type { Lead, CreateLeadInput, User as Agent } from '../../../server/src/schema';

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<CreateLeadInput>({
    phone: null,
    email: null,
    name: null,
    stage: 'raw_lead',
    medium: 'phone',
    source: 'direct_unknown',
    high_intent: false,
    request_type: 'product_enquiry',
    urgency: null,
    special_date: null,
    occasion: null,
    assigned_agent_id: null
  });

  const loadLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await trpc.getLeads.query({
        stage: stageFilter !== 'all' ? stageFilter as 'raw_lead' | 'in_contact' | 'not_interested' | 'no_response' | 'junk' | 'genuine_lead' : undefined,
        source: sourceFilter !== 'all' ? sourceFilter as 'google' | 'meta' | 'seo' | 'organic' | 'direct_unknown' | 'referral' : undefined,
        limit: 100
      });
      setLeads(data);
    } catch {
      setError('Failed to load leads. Backend handlers are stubs.');
      // Show demo data
      setLeads([
        {
          id: 1,
          phone: '+91 98765 43210',
          email: 'priya.sharma@email.com',
          name: 'Priya Sharma',
          stage: 'genuine_lead',
          status: 'first_call_done',
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
          id: 2,
          phone: '+91 87654 32109',
          email: null,
          name: 'Rajesh Kumar',
          stage: 'in_contact',
          status: null,
          follow_up_status: null,
          medium: 'phone',
          source: 'meta',
          high_intent: false,
          request_type: 'request_for_information',
          urgency: '1_month',
          special_date: null,
          occasion: null,
          assigned_agent_id: 2,
          lead_score: 45,
          created_at: new Date('2024-01-16'),
          updated_at: new Date('2024-01-19'),
          last_contact_at: new Date('2024-01-17')
        },
        {
          id: 3,
          phone: null,
          email: 'anita.patel@email.com',
          name: 'Anita Patel',
          stage: 'raw_lead',
          status: null,
          follow_up_status: null,
          medium: 'website',
          source: 'seo',
          high_intent: true,
          request_type: 'product_enquiry',
          urgency: '1_week',
          special_date: new Date('2024-03-01'),
          occasion: 'Wedding',
          assigned_agent_id: null,
          lead_score: 72,
          created_at: new Date('2024-01-18'),
          updated_at: new Date('2024-01-18'),
          last_contact_at: null
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [stageFilter, sourceFilter]);

  const loadAgents = useCallback(async () => {
    try {
      const data = await trpc.getUsers.query({ role: 'sales_agent' });
      setAgents(data);
    } catch {
      // Show demo agents
      setAgents([
        { id: 1, name: 'Amit Verma', email: 'amit@varniya.com', role: 'sales_agent', active: true, created_at: new Date() },
        { id: 2, name: 'Sneha Gupta', email: 'sneha@varniya.com', role: 'sales_agent', active: true, created_at: new Date() }
      ]);
    }
  }, []);

  useEffect(() => {
    loadLeads();
    loadAgents();
  }, [loadLeads, loadAgents]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newLead = await trpc.createLead.mutate(formData);
      setLeads((prev: Lead[]) => [newLead, ...prev]);
      setShowCreateDialog(false);
      setFormData({
        phone: null,
        email: null,
        name: null,
        stage: 'raw_lead',
        medium: 'phone',
        source: 'direct_unknown',
        high_intent: false,
        request_type: 'product_enquiry',
        urgency: null,
        special_date: null,
        occasion: null,
        assigned_agent_id: null
      });
    } catch (error) {
      console.error('Failed to create lead:', error);
    }
  };

  const getStageColor = (stage: string) => {
    const colors = {
      'raw_lead': 'bg-gray-100 text-gray-800',
      'in_contact': 'bg-blue-100 text-blue-800',
      'genuine_lead': 'bg-green-100 text-green-800',
      'not_interested': 'bg-red-100 text-red-800',
      'no_response': 'bg-yellow-100 text-yellow-800',
      'junk': 'bg-gray-100 text-gray-600'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSourceIcon = (source: string) => {
    const icons = {
      'google': '🔍',
      'meta': '📱',
      'seo': '🌐',
      'organic': '🌱',
      'referral': '👥',
      'direct_unknown': '❓'
    };
    return icons[source as keyof typeof icons] || '❓';
  };

  const filteredLeads = leads.filter((lead: Lead) => {
    const matchesSearch = !searchTerm || 
      (lead.name && lead.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.phone && lead.phone.includes(searchTerm)) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
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
          <h2 className="text-3xl font-bold text-gray-900">💎 Leads Management</h2>
          <p className="text-gray-600 mt-1">Track and manage all your diamond sales leads</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateLeadInput) => ({ ...prev, name: e.target.value || null }))
                    }
                    placeholder="Lead name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateLeadInput) => ({ ...prev, phone: e.target.value || null }))
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
                  value={formData.email || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateLeadInput) => ({ ...prev, email: e.target.value || null }))
                  }
                  placeholder="email@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="medium">Medium</Label>
                  <Select 
                    value={formData.medium || 'phone'} 
                    onValueChange={(value: 'wati' | 'phone' | 'email' | 'website' | 'social_media' | 'other') => 
                      setFormData((prev: CreateLeadInput) => ({ ...prev, medium: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wati">WATI</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Select 
                    value={formData.source || 'direct_unknown'} 
                    onValueChange={(value: 'google' | 'meta' | 'seo' | 'organic' | 'direct_unknown' | 'referral') => 
                      setFormData((prev: CreateLeadInput) => ({ ...prev, source: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="meta">Meta</SelectItem>
                      <SelectItem value="seo">SEO</SelectItem>
                      <SelectItem value="organic">Organic</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="direct_unknown">Direct/Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="request_type">Request Type</Label>
                <Select 
                  value={formData.request_type || 'product_enquiry'} 
                  onValueChange={(value: 'product_enquiry' | 'request_for_information' | 'suggestions' | 'other') => 
                    setFormData((prev: CreateLeadInput) => ({ ...prev, request_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product_enquiry">Product Enquiry</SelectItem>
                    <SelectItem value="request_for_information">Request for Information</SelectItem>
                    <SelectItem value="suggestions">Suggestions</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="urgency">Urgency</Label>
                  <Select 
                    value={formData.urgency || 'no_urgency'} 
                    onValueChange={(value: '1_week' | '2_weeks' | '3_weeks' | '1_month' | '3_months' | 'no_urgency') => 
                      setFormData((prev: CreateLeadInput) => ({ 
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

                <div>
                  <Label htmlFor="agent">Assign Agent</Label>
                  <Select 
                    value={formData.assigned_agent_id?.toString() || 'none'} 
                    onValueChange={(value: string) => 
                      setFormData((prev: CreateLeadInput) => ({ 
                        ...prev, 
                        assigned_agent_id: value === 'none' ? null : parseInt(value)
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Assignment</SelectItem>
                      {agents.map((agent: Agent) => (
                        <SelectItem key={agent.id} value={agent.id.toString()}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="occasion">Occasion</Label>
                <Input
                  id="occasion"
                  value={formData.occasion || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateLeadInput) => ({ ...prev, occasion: e.target.value || null }))
                  }
                  placeholder="Wedding, Anniversary, etc."
                />
              </div>

              <Button type="submit" className="w-full">
                Create Lead
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="raw_lead">Raw Lead</SelectItem>
                <SelectItem value="in_contact">In Contact</SelectItem>
                <SelectItem value="genuine_lead">Genuine Lead</SelectItem>
                <SelectItem value="not_interested">Not Interested</SelectItem>
                <SelectItem value="no_response">No Response</SelectItem>
                <SelectItem value="junk">Junk</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="meta">Meta</SelectItem>
                <SelectItem value="seo">SEO</SelectItem>
                <SelectItem value="organic">Organic</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="direct_unknown">Direct/Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="space-y-4">
        {filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
              <p className="text-gray-600">
                {searchTerm || stageFilter !== 'all' || sourceFilter !== 'all' 
                  ? 'Try adjusting your filters or search term.'
                  : 'Create your first lead to get started.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead: Lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {lead.name || 'Anonymous Lead'}
                      </h3>
                      {lead.high_intent && (
                        <Badge className="bg-orange-100 text-orange-800">
                          <Star className="h-3 w-3 mr-1" />
                          High Intent
                        </Badge>
                      )}
                      <Badge className={getStageColor(lead.stage)}>
                        {lead.stage.replace('_', ' ')}
                      </Badge>
                      {lead.status && (
                        <Badge variant="outline">
                          {lead.status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        {lead.phone && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{lead.email}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>{getSourceIcon(lead.source)}</span>
                          <span>{lead.source.replace('_', ' ')} • {lead.medium}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Target className="h-4 w-4" />
                          <span>{lead.request_type.replace('_', ' ')}</span>
                        </div>
                        {lead.urgency && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>Urgent: {lead.urgency.replace('_', ' ')}</span>
                          </div>
                        )}
                        {lead.occasion && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{lead.occasion}</span>
                            {lead.special_date && (
                              <span>({lead.special_date.toLocaleDateString()})</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold text-purple-600">
                      {lead.lead_score}
                    </div>
                    <div className="text-xs text-gray-500">Lead Score</div>
                    
                    {lead.assigned_agent_id && (
                      <Badge variant="secondary" className="text-xs">
                        Agent #{lead.assigned_agent_id}
                      </Badge>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Created: {lead.created_at.toLocaleDateString()}
                    </div>
                    {lead.last_contact_at && (
                      <div className="text-xs text-gray-500">
                        Last Contact: {lead.last_contact_at.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredLeads.length} of {leads.length} leads</span>
            <div className="flex items-center space-x-4">
              <span>High Intent: {leads.filter((l: Lead) => l.high_intent).length}</span>
              <span>Assigned: {leads.filter((l: Lead) => l.assigned_agent_id).length}</span>
              <span>Genuine Leads: {leads.filter((l: Lead) => l.stage === 'genuine_lead').length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
