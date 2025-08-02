
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  User,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { FollowUpActivity, CreateFollowUpInput, Lead, User as Agent } from '../../../server/src/schema';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  activities: FollowUpActivity[];
}

export function Calendar() {
  const [activities, setActivities] = useState<FollowUpActivity[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<CreateFollowUpInput>({
    lead_id: 0,
    agent_id: 1,
    title: '',
    description: null,
    scheduled_at: new Date()
  });

  const loadCalendarData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [activitiesData, leadsData, agentsData] = await Promise.all([
        trpc.getFollowUps.query({}),
        trpc.getLeads.query({ limit: 100 }),
        trpc.getUsers.query({ role: 'sales_agent' })
      ]);
      
      setActivities(activitiesData);
      setLeads(leadsData);
      setAgents(agentsData);
    } catch {
      setError('Failed to load calendar data. Backend handlers are stubs.');
      // Show demo data
      setActivities([
        {
          id: 1,
          lead_id: 1,
          agent_id: 1,
          title: 'Follow-up call with Priya Sharma',
          description: 'Discuss diamond ring preferences and budget',
          scheduled_at: new Date(2024, 1, 15, 10, 0), // Feb 15, 10:00 AM
          completed: false,
          completed_at: null,
          created_at: new Date('2024-01-20')
        },
        {
          id: 2,
          lead_id: 4,
          agent_id: 2,
          title: 'Send estimate to Vikram Singh',
          description: 'Email detailed quotation for wedding jewelry set',
          scheduled_at: new Date(2024, 1, 16, 14, 30), // Feb 16, 2:30 PM
          completed: true,
          completed_at: new Date('2024-01-16'),
          created_at: new Date('2024-01-12')
        },
        {
          id: 3,
          lead_id: 3,
          agent_id: 1,
          title: 'Product showcase meeting',
          description: 'Show diamond collection and discuss customization options',
          scheduled_at: new Date(2024, 1, 18, 11, 0), // Feb 18, 11:00 AM
          completed: false,
          completed_at: null,
          created_at: new Date('2024-01-18')
        }
      ]);

      setLeads([
        {
          id: 1,
          name: 'Priya Sharma',
          phone: '+91 98765 43210',
          email: 'priya.sharma@email.com',
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
          id: 3,
          name: 'Anita Patel',
          phone: null,
          email: 'anita.patel@email.com',
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
          assigned_agent_id: 1,
          lead_score: 72,
          created_at: new Date('2024-01-18'),
          updated_at: new Date('2024-01-18'),
          last_contact_at: null
        },
        {
          id: 4,
          name: 'Vikram Singh',
          phone: '+91 76543 21098',
          email: 'vikram.singh@email.com',
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

      setAgents([
        { id: 1, name: 'Amit Verma', email: 'amit@varniya.com', role: 'sales_agent', active: true, created_at: new Date() },
        { id: 2, name: 'Sneha Gupta', email: 'sneha@varniya.com', role: 'sales_agent', active: true, created_at: new Date() }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newActivity = await trpc.createFollowUp.mutate(formData);
      setActivities((prev: FollowUpActivity[]) => [newActivity, ...prev]);
      setShowCreateDialog(false);
      setFormData({
        lead_id: 0,
        agent_id: 1,
        title: '',
        description: null,
        scheduled_at: new Date()
      });
    } catch (error) {
      console.error('Failed to create follow-up activity:', error);
    }
  };

  const handleCompleteActivity = async (activityId: number) => {
    try {
      await trpc.completeFollowUp.mutate(activityId);
      setActivities((prev: FollowUpActivity[]) => 
        prev.map((activity: FollowUpActivity) => 
          activity.id === activityId 
            ? { ...activity, completed: true, completed_at: new Date() }
            : activity
        )
      );
    } catch (error) {
      console.error('Failed to complete activity:', error);
    }
  };

  const generateCalendarDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: CalendarDay[] = [];
    
    // Previous month days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const dayDate = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push({
        date: dayDate,
        isCurrentMonth: false,
        activities: activities.filter((activity: FollowUpActivity) => 
          activity.scheduled_at.toDateString() === dayDate.toDateString()
        )
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      days.push({
        date: dayDate,
        isCurrentMonth: true,
        activities: activities.filter((activity: FollowUpActivity) => 
          activity.scheduled_at.toDateString() === dayDate.toDateString()
        )
      });
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const dayDate = new Date(year, month + 1, day);
      days.push({
        date: dayDate,
        isCurrentMonth: false,
        activities: activities.filter((activity: FollowUpActivity) => 
          activity.scheduled_at.toDateString() === dayDate.toDateString()
        )
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getLeadName = (leadId: number) => {
    const lead = leads.find((l: Lead) => l.id === leadId);
    return lead?.name || `Lead #${leadId}`;
  };

  const getAgentName = (agentId: number) => {
    const agent = agents.find((a: Agent) => a.id === agentId);
    return agent?.name || `Agent #${agentId}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const todayActivities = activities.filter((activity: FollowUpActivity) => 
    activity.scheduled_at.toDateString() === new Date().toDateString()
  );

  const upcomingActivities = activities
    .filter((activity: FollowUpActivity) => 
      activity.scheduled_at > new Date() && !activity.completed
    )
    .sort((a: FollowUpActivity, b: FollowUpActivity) => 
      a.scheduled_at.getTime() - b.scheduled_at.getTime()
    )
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-7 gap-4 mb-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-4">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const calendarDays = generateCalendarDays(currentDate);

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
          <h2 className="text-3xl font-bold text-gray-900">📅 Follow-up Calendar</h2>
          <p className="text-gray-600 mt-1">Schedule and track follow-up activities</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Follow-up Activity</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateActivity} className="space-y-4">
              <div>
                <Label htmlFor="lead">Lead</Label>
                <Select 
                  value={formData.lead_id.toString()} 
                  onValueChange={(value: string) => 
                    setFormData((prev: CreateFollowUpInput) => ({ ...prev, lead_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead: Lead) => (
                      <SelectItem key={lead.id} value={lead.id.toString()}>
                        {lead.name || `Lead #${lead.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="agent">Agent</Label>
                <Select 
                  value={formData.agent_id.toString()} 
                  onValueChange={(value: string) => 
                    setFormData((prev: CreateFollowUpInput) => ({ ...prev, agent_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent: Agent) => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateFollowUpInput) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Activity title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="scheduled_at">Date & Time</Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={formData.scheduled_at.toISOString().slice(0, 16)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateFollowUpInput) => ({ ...prev, scheduled_at: new Date(e.target.value) }))
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateFollowUpInput) => ({ ...prev, description: e.target.value || null }))
                  }
                  placeholder="Activity details..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full">
                Schedule Activity
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Activities */}
      {todayActivities.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Clock className="h-5 w-5" />
              <span>Today's Activities ({todayActivities.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayActivities.map((activity: FollowUpActivity) => (
                <div key={activity.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                      {activity.completed ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {getLeadName(activity.lead_id)} • {formatTime(activity.scheduled_at)}
                    </p>
                    {activity.description && (
                      <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                    )}
                  </div>
                  {!activity.completed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCompleteActivity(activity.id)}
                      className="ml-4"
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day: CalendarDay, index: number) => {
                  const isToday = day.date.toDateString() === new Date().toDateString();
                  const hasActivities = day.activities.length > 0;
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-24 p-1 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        !day.isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''
                      } ${
                        isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      } ${
                        hasActivities ? 'border-purple-300' : ''
                      }`}
                    >
                      <div className="text-sm font-semibold mb-1">
                        {day.date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {day.activities.slice(0, 3).map((activity: FollowUpActivity) => (
                          <div
                            key={activity.id}
                            className={`text-xs p-1 rounded truncate ${
                              activity.completed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {activity.title}
                          </div>
                        ))}
                        {day.activities.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{day.activities.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Activities */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📋 Upcoming Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingActivities.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No upcoming activities</p>
                  </div>
                ) : (
                  upcomingActivities.map((activity: FollowUpActivity) => (
                    <div key={activity.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-900">
                          {activity.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <User className="h-3 w-3" />
                          <span>{getLeadName(activity.lead_id)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <CalendarIcon className="h-3 w-3" />
                          <span>
                            {activity.scheduled_at.toLocaleDateString()} at {formatTime(activity.scheduled_at)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <User className="h-3 w-3" />
                          <span>{getAgentName(activity.agent_id)}</span>
                        </div>
                        {activity.description && (
                          <p className="text-xs text-gray-500 mt-2">
                            {activity.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
