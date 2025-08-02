
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { 
  Phone, 
  Mail, 
  Calendar, 
  Star, 
  User,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import type { Lead } from '../../../server/src/schema';

interface PipelineStage {
  id: string;
  title: string;
  color: string;
  leads: Lead[];
}

export function Pipeline() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPipelineData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await trpc.getLeads.query({ limit: 200 });
      
      // Group leads by stage
      const stageGroups: Record<string, Lead[]> = {
        raw_lead: [],
        in_contact: [],
        genuine_lead: [],
        not_interested: [],
        no_response: [],
        junk: []
      };

      data.forEach((lead: Lead) => {
        if (stageGroups[lead.stage]) {
          stageGroups[lead.stage].push(lead);
        }
      });

      setStages([
        {
          id: 'raw_lead',
          title: '🔍 Raw Leads',
          color: 'border-gray-300 bg-gray-50',
          leads: stageGroups.raw_lead
        },
        {
          id: 'in_contact',
          title: '📞 In Contact',
          color: 'border-blue-300 bg-blue-50',
          leads: stageGroups.in_contact
        },
        {
          id: 'genuine_lead',
          title: '💎 Genuine Leads',
          color: 'border-green-300 bg-green-50',
          leads: stageGroups.genuine_lead
        },
        {
          id: 'not_interested',
          title: '❌ Not Interested',
          color: 'border-red-300 bg-red-50',
          leads: stageGroups.not_interested
        },
        {
          id: 'no_response',
          title: '📵 No Response',
          color: 'border-yellow-300 bg-yellow-50',
          leads: stageGroups.no_response
        },
        {
          id: 'junk',
          title: '🗑️ Junk',
          color: 'border-gray-400 bg-gray-100',
          leads: stageGroups.junk
        }
      ]);
    } catch {
      setError('Failed to load pipeline data. Backend handlers are stubs.');
      // Show demo data
      setStages([
        {
          id: 'raw_lead',
          title: '🔍 Raw Leads',
          color: 'border-gray-300 bg-gray-50',
          leads: [
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
          ]
        },
        {
          id: 'in_contact',
          title: '📞 In Contact',
          color: 'border-blue-300 bg-blue-50',
          leads: [
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
              request_type:  'request_for_information',
              urgency: '1_month',
              special_date: null,
              occasion: null,
              assigned_agent_id: 2,
              lead_score: 45,
              created_at: new Date('2024-01-16'),
              updated_at: new Date('2024-01-19'),
              last_contact_at: new Date('2024-01-17')
            }
          ]
        },
        {
          id: 'genuine_lead',
          title: '💎 Genuine Leads',
          color: 'border-green-300 bg-green-50',
          leads: [
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
            }
          ]
        },
        {
          id: 'not_interested',
          title: '❌ Not Interested',
          color: 'border-red-300 bg-red-50',
          leads: []
        },
        {
          id: 'no_response',
          title: '📵 No Response',
          color: 'border-yellow-300 bg-yellow-50',
          leads: []
        },
        {
          id: 'junk',
          title: '🗑️ Junk',
          color: 'border-gray-400 bg-gray-100',
          leads: []
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPipelineData();
  }, [loadPipelineData]);

  const handleMoveToStage = async (leadId: number, newStage: string) => {
    try {
      await trpc.updateLead.mutate({
        id: leadId,
        stage: newStage as 'raw_lead' | 'in_contact' | 'not_interested' | 'no_response' | 'junk' | 'genuine_lead'
      });

      // Update local state
      setStages((prevStages: PipelineStage[]) => {
        const newStages = [...prevStages];
        
        // Find and remove lead from current stage
        let leadToMove: Lead | null = null;
        newStages.forEach((stage: PipelineStage) => {
          const leadIndex = stage.leads.findIndex((l: Lead) => l.id === leadId);
          if (leadIndex >= 0) {
            leadToMove = { ...stage.leads[leadIndex], stage: newStage as 'raw_lead' | 'in_contact' | 'not_interested' | 'no_response' | 'junk' | 'genuine_lead' };
            stage.leads.splice(leadIndex, 1);
          }
        });

        // Add lead to new stage
        if (leadToMove) {
          const targetStage = newStages.find((s: PipelineStage) => s.id === newStage);
          if (targetStage) {
            targetStage.leads.push(leadToMove);
          }
        }

        return newStages;
      });
    } catch (error) {
      console.error('Failed to update lead stage:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStageValue = (leads: Lead[]) => {
    // Estimate potential value based on lead scores and stages
    return leads.reduce((sum: number, lead: Lead) => {
      const baseValue = lead.stage === 'genuine_lead' ? 50000 : 
                       lead.stage === 'in_contact' ? 25000 : 10000;
      return sum + (baseValue * (lead.lead_score / 100));
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalLeads = stages.reduce((sum: number, stage: PipelineStage) => sum + stage.leads.length, 0);
  const totalValue = stages.reduce((sum: number, stage: PipelineStage) => sum + getStageValue(stage.leads), 0);

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-amber-800 text-sm">
              ⚠️ {error} Drag-and-drop disabled in demo mode. Showing static pipeline below.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">⚡ Sales Pipeline</h2>
          <p className="text-gray-600 mt-1">Visual representation of your sales process</p>
        </div>
        
        <div className="flex items-center space-x-6 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{totalLeads}</p>
            <p className="text-gray-600">Total Leads</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</p>
            <p className="text-gray-600">Pipeline Value</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {totalLeads > 0 ? Math.round((stages.find(s => s.id === 'genuine_lead')?.leads.length || 0) / totalLeads * 100) : 0}%
            </p>
            <p className="text-gray-600">Conversion Rate</p>
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 min-h-screen">
        {stages.map((stage: PipelineStage) => (
          <Card key={stage.id} className={`${stage.color} border-2`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  {stage.title}
                </CardTitle>
                <Badge variant="secondary">
                  {stage.leads.length}
                </Badge>
              </div>
              <div className="text-xs text-gray-600">
                Value: {formatCurrency(getStageValue(stage.leads))}
              </div>
            </CardHeader>

            <CardContent className="space-y-3 min-h-64">
              {stage.leads.map((lead: Lead) => (
                <div
                  key={lead.id}
                  className="bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">
                        {lead.name || 'Anonymous'}
                      </h4>
                      {lead.high_intent && (
                        <Star className="h-3 w-3 text-orange-500 flex-shrink-0" />
                      )}
                    </div>

                    <div className="space-y-1">
                      {lead.phone && (
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span className="truncate">{lead.phone}</span>
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      )}
                      {lead.occasion && (
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span className="truncate">{lead.occasion}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                      >
                        {lead.source.replace('_', ' ')}
                      </Badge>
                      <div className="text-right">
                        <div className="text-xs font-bold text-purple-600">
                          {lead.lead_score}
                        </div>
                        <div className="text-xs text-gray-500">Score</div>
                      </div>
                    </div>

                    {lead.urgency && (
                      <div className="text-xs text-red-600 font-medium">
                        ⚡ {lead.urgency.replace('_', ' ')}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {lead.assigned_agent_id ? (
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            Agent #{lead.assigned_agent_id}
                          </span>
                        ) : (
                          'Unassigned'
                        )}
                      </span>
                      <span>
                        {lead.created_at.toLocaleDateString()}
                      </span>
                    </div>

                    {/* Stage Navigation Buttons */}
                    <div className="flex justify-center pt-2">
                      <select
                        value={lead.stage}
                        onChange={(e) => handleMoveToStage(lead.id, e.target.value)}
                        className="text-xs px-2 py-1 border rounded bg-white"
                      >
                        <option value="raw_lead">Raw Lead</option>
                        <option value="in_contact">In Contact</option>
                        <option value="genuine_lead">Genuine Lead</option>
                        <option value="not_interested">Not Interested</option>
                        <option value="no_response">No Response</option>
                        <option value="junk">Junk</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              
              {stage.leads.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-sm">No leads in this stage</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stage Conversion Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Conversion Flow</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-4 overflow-x-auto">
            {stages.slice(0, 3).map((stage: PipelineStage, index: number) => (
              <div key={stage.id} className="flex items-center space-x-4">
                <div className="text-center min-w-24">
                  <div className="text-2xl mb-1">
                    {stage.title.split(' ')[0]}
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {stage.leads.length}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(getStageValue(stage.leads))}
                  </div>
                </div>
                {index < 2 && (
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
