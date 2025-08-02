
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dashboard } from '@/components/Dashboard';
import { LeadsPage } from '@/components/LeadsPage';
import { ActiveDeals } from '@/components/ActiveDeals';
import { Pipeline } from '@/components/Pipeline';
import { Calendar } from '@/components/Calendar';
import { DesignBank } from '@/components/DesignBank';
import { BrowsersPage } from '@/components/BrowsersPage';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Target, 
  Workflow, 
  CalendarDays, 
  Palette, 
  MousePointer,
  AlertTriangle
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Varniya CRM
              </h1>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Diamond Sales
              </Badge>
            </div>
            
            {/* API Status Warning */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-800 font-medium">
                    Demo Mode - Backend handlers are stubs
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white p-1 rounded-lg shadow-sm">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center space-x-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="leads"
              className="flex items-center space-x-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
            >
              <Users className="h-4 w-4" />
              <span>Leads</span>
            </TabsTrigger>
            <TabsTrigger 
              value="deals"
              className="flex items-center space-x-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
            >
              <Target className="h-4 w-4" />
              <span>Active Deals</span>
            </TabsTrigger>
            <TabsTrigger 
              value="pipeline"
              className="flex items-center space-x-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
            >
              <Workflow className="h-4 w-4" />
              <span>Pipeline</span>
            </TabsTrigger>
            <TabsTrigger 
              value="calendar"
              className="flex items-center space-x-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
            >
              <CalendarDays className="h-4 w-4" />
              <span>Calendar</span>
            </TabsTrigger>
            <TabsTrigger 
              value="design-bank"
              className="flex items-center space-x-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
            >
              <Palette className="h-4 w-4" />
              <span>Design Bank</span>
            </TabsTrigger>
            <TabsTrigger 
              value="browsers"
              className="flex items-center space-x-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
            >
              <MousePointer className="h-4 w-4" />
              <span>Browsers</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>
          
          <TabsContent value="leads">
            <LeadsPage />
          </TabsContent>
          
          <TabsContent value="deals">
            <ActiveDeals />
          </TabsContent>
          
          <TabsContent value="pipeline">
            <Pipeline />
          </TabsContent>
          
          <TabsContent value="calendar">
            <Calendar />
          </TabsContent>

          <TabsContent value="design-bank">
            <DesignBank />
          </TabsContent>
          
          <TabsContent value="browsers">
            <BrowsersPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
