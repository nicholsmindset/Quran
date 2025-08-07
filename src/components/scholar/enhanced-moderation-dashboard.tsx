'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  BarChart3,
  Calendar,
  Users,
  BookOpen,
  Star,
  TrendingUp,
  Target,
  Zap,
  Bell,
  Eye,
  FileText,
  Download,
  Settings,
  Layers,
  Play,
  Pause,
  SkipForward,
  Timer,
  Award,
  MessageCircle,
  Flag,
  Save,
  Undo2
} from 'lucide-react';
import { Question, ModerationBatch, ScholarStats, User } from '@/types';
import { cn } from '@/lib/cn';
import { PrayerTimeWidget } from './prayer-time-widget';
import { IslamicCalendarWidget } from './islamic-calendar-widget';
import { RealtimeNotifications } from './realtime-notifications';
import { BulkOperationsPanel } from './bulk-operations-panel';
import { CollaborationPanel } from './collaboration-panel';
import { QualityMetricsPanel } from './quality-metrics-panel';
import { ProfessionalGrowthPanel } from './professional-growth-panel';

// Simple select component for moderation dashboard
const SimpleSelect = ({ value, onValueChange, children, placeholder, ...props }: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  [key: string]: any;
}) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
    {...props}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {children}
  </select>
);

interface EnhancedModerationDashboardProps {
  scholarId: string;
  user: User;
}

interface FilterState {
  status: 'all' | 'pending' | 'flagged' | 'priority' | 'overdue';
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
  priority: 'all' | 'low' | 'medium' | 'high';
  surah: string;
  topic: 'all' | 'aqeedah' | 'fiqh' | 'seerah' | 'tafsir' | 'hadith' | 'akhlaq';
  timeRange: 'today' | 'week' | 'month' | 'all';
  search: string;
  assignedTo: 'all' | 'me' | 'unassigned';
}

interface ViewMode {
  layout: 'card' | 'table' | 'kanban';
  density: 'comfortable' | 'compact' | 'spacious';
  groupBy: 'none' | 'priority' | 'difficulty' | 'topic' | 'status';
}

export function EnhancedModerationDashboard({ scholarId, user }: EnhancedModerationDashboardProps) {
  const [filters, setFilters] = useState<FilterState>({
    status: 'pending',
    difficulty: 'all',
    priority: 'all',
    surah: '',
    topic: 'all',
    timeRange: 'today',
    search: '',
    assignedTo: 'me'
  });
  
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>({
    layout: 'card',
    density: 'comfortable',
    groupBy: 'priority'
  });
  const [workSession, setWorkSession] = useState({
    isActive: false,
    startTime: null as Date | null,
    targetCount: 20,
    processedCount: 0
  });
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [savedWork, setSavedWork] = useState<any[]>([]);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  const queryClient = useQueryClient();

  // Enhanced query for questions with real-time updates
  const { data: questionsData, isLoading: loadingQuestions, refetch } = useQuery({
    queryKey: ['enhanced-moderation-questions', filters, scholarId],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });
      params.append('enhanced', 'true'); // Request enhanced data
      
      const response = await fetch(`/api/scholar/questions?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    },
    refetchInterval: isOfflineMode ? false : 30000, // Real-time updates every 30s
  });

  // Enhanced scholar statistics with performance insights
  const { data: enhancedStatsData } = useQuery({
    queryKey: ['enhanced-scholar-stats', scholarId],
    queryFn: async () => {
      const response = await fetch(`/api/scholar/stats/${scholarId}?enhanced=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch enhanced stats');
      return response.json();
    },
    refetchInterval: 60000, // Update stats every minute
  });

  // Collaboration data - other scholars working on similar questions
  const { data: collaborationData } = useQuery({
    queryKey: ['scholar-collaboration', scholarId],
    queryFn: async () => {
      const response = await fetch(`/api/scholar/collaboration/${scholarId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch collaboration data');
      return response.json();
    },
    refetchInterval: 45000,
  });

  const questions = questionsData?.data || [];
  const enhancedStats = enhancedStatsData?.data || null;
  const collaboration = collaborationData?.data || null;

  // Real-time SLA calculations with advanced metrics
  const calculateAdvancedSLA = (createdAt: string, priority: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const elapsed = now.getTime() - created.getTime();
    
    // Adjust SLA based on priority
    const slaHours = priority === 'high' ? 12 : priority === 'medium' ? 18 : 24;
    const slaMs = slaHours * 60 * 60 * 1000;
    
    const progress = Math.min((elapsed / slaMs) * 100, 100);
    const remainingTime = Math.max(slaMs - elapsed, 0);
    
    return {
      progress,
      remainingTime,
      slaHours,
      isOverdue: elapsed > slaMs,
      urgencyLevel: progress > 90 ? 'critical' : progress > 75 ? 'high' : progress > 50 ? 'medium' : 'low'
    };
  };

  // Smart question grouping and sorting
  const processedQuestions = useMemo(() => {
    const processed = [...questions];
    
    // Apply smart sorting
    processed.sort((a, b) => {
      const aSLA = calculateAdvancedSLA(a.createdAt.toString(), a.priority);
      const bSLA = calculateAdvancedSLA(b.createdAt.toString(), b.priority);
      
      // Prioritize by urgency, then by priority, then by creation time
      if (aSLA.urgencyLevel !== bSLA.urgencyLevel) {
        const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return urgencyOrder[bSLA.urgencyLevel as keyof typeof urgencyOrder] - urgencyOrder[aSLA.urgencyLevel as keyof typeof urgencyOrder];
      }
      
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      }
      
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    
    // Group by selected criteria
    if (viewMode.groupBy !== 'none') {
      const groups: Record<string, any[]> = {};
      processed.forEach(question => {
        const key = viewMode.groupBy === 'priority' ? question.priority :
                   viewMode.groupBy === 'difficulty' ? question.difficulty :
                   viewMode.groupBy === 'status' ? question.status :
                   viewMode.groupBy === 'topic' ? (question.categoryTags?.[0] || 'uncategorized') :
                   'all';
        if (!groups[key]) groups[key] = [];
        groups[key].push(question);
      });
      return groups;
    }
    
    return { all: processed };
  }, [questions, viewMode.groupBy]);

  // Enhanced bulk operations mutation
  const bulkOperationMutation = useMutation({
    mutationFn: async ({ action, questionIds, data }: { action: string; questionIds: string[]; data?: any }) => {
      const response = await fetch('/api/scholar/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ action, questionIds, data, scholarId }),
      });
      
      if (!response.ok) throw new Error('Bulk operation failed');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-moderation-questions'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-scholar-stats'] });
      setSelectedQuestions([]);
      
      // Update work session progress
      if (workSession.isActive) {
        setWorkSession(prev => ({
          ...prev,
          processedCount: prev.processedCount + data.processedCount
        }));
      }
    },
  });

  // Work session management
  const startWorkSession = () => {
    setWorkSession({
      isActive: true,
      startTime: new Date(),
      targetCount: 20,
      processedCount: 0
    });
  };

  const pauseWorkSession = () => {
    setWorkSession(prev => ({ ...prev, isActive: false }));
  };

  const endWorkSession = () => {
    setWorkSession({
      isActive: false,
      startTime: null,
      targetCount: 20,
      processedCount: 0
    });
  };

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveEnabled && selectedQuestions.length > 0) {
      const saveTimeout = setTimeout(() => {
        setSavedWork(prev => [...prev, { 
          timestamp: new Date(), 
          selections: selectedQuestions,
          filters: filters
        }]);
      }, 30000); // Auto-save every 30 seconds
      
      return () => clearTimeout(saveTimeout);
    }
  }, [selectedQuestions, filters, autoSaveEnabled]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault();
            setSelectedQuestions(questions.map((q: Question) => q.id));
            break;
          case 'r':
            e.preventDefault();
            refetch();
            break;
          case 's':
            e.preventDefault();
            // Manual save
            setSavedWork(prev => [...prev, { 
              timestamp: new Date(), 
              selections: selectedQuestions,
              filters: filters
            }]);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [questions, selectedQuestions, filters, refetch]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map((q: Question) => q.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Islamic Header with Prayer Times & Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-emerald-800">
                  بسم الله الرحمن الرحيم
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Scholar Moderation Dashboard - {user?.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="islamic" className="text-sm px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Level {enhancedStats?.scholarLevel || 1}
                </Badge>
                {workSession.isActive && (
                  <Badge variant="gold" className="text-sm px-3 py-1 animate-pulse">
                    <Timer className="h-3 w-3 mr-1" />
                    Session Active
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
        
        <div className="space-y-4">
          <PrayerTimeWidget />
          <IslamicCalendarWidget />
        </div>
      </div>

      {/* Real-time Performance Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Status</CardTitle>
            <div className="flex items-center gap-1">
              <div className={cn("w-2 h-2 rounded-full", 
                questions.filter((q: Question) => calculateAdvancedSLA(q.createdAt.toString(), q.priority).urgencyLevel === 'critical').length > 0 ? "bg-red-500 animate-pulse" : "bg-green-500"
              )} />
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questions.length}</div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>Total pending</span>
              <span className="text-red-600 font-medium">
                {questions.filter((q: Question) => calculateAdvancedSLA(q.createdAt.toString(), q.priority).isOverdue).length} overdue
              </span>
            </div>
            <Progress 
              value={Math.max(0, 100 - (questions.length / 50) * 100)} 
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Target</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workSession.processedCount}/{workSession.targetCount}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {Math.round((workSession.processedCount / workSession.targetCount) * 100)}% complete
            </div>
            <Progress 
              value={(workSession.processedCount / workSession.targetCount) * 100} 
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {enhancedStats?.currentSLA || 95}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              24h compliance
            </div>
            <div className="flex items-center mt-2">
              <div className={cn("w-2 h-2 rounded-full mr-2",
                (enhancedStats?.currentSLA || 95) > 90 ? "bg-green-500" : 
                (enhancedStats?.currentSLA || 95) > 75 ? "bg-yellow-500" : "bg-red-500"
              )} />
              <span className="text-xs">
                {(enhancedStats?.currentSLA || 95) > 90 ? 'Excellent' : 
                 (enhancedStats?.currentSLA || 95) > 75 ? 'Good' : 'Needs Improvement'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {enhancedStats?.qualityScore || 92}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Accuracy rating
            </div>
            <div className="flex items-center mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={cn("h-3 w-3", 
                    i < Math.floor(((enhancedStats?.qualityScore || 92) / 100) * 5) 
                      ? "text-yellow-400 fill-current" 
                      : "text-gray-300"
                  )} 
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collaboration</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {collaboration?.activeScholars || 3}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Online now
            </div>
            <div className="flex -space-x-2 mt-2">
              {Array.from({ length: Math.min(collaboration?.activeScholars || 3, 4) }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-xs font-medium text-emerald-600"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Session Control Panel */}
      {!isOfflineMode && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium text-blue-800">
                    Work Session {workSession.isActive ? 'Active' : 'Inactive'}
                  </p>
                  <p className="text-sm text-blue-600">
                    {workSession.startTime && workSession.isActive ? 
                      `Started ${new Date(workSession.startTime).toLocaleTimeString()} • ${workSession.processedCount}/${workSession.targetCount} completed` :
                      'Start a focused review session with productivity tracking'
                    }
                  </p>
                </div>
                {workSession.isActive && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.floor((Date.now() - (workSession.startTime?.getTime() || 0)) / 60000)}m
                    </div>
                    <div className="text-xs text-muted-foreground">elapsed</div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {!workSession.isActive ? (
                  <Button onClick={startWorkSession} variant="islamic" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Start Session
                  </Button>
                ) : (
                  <>
                    <Button onClick={pauseWorkSession} variant="outline" size="sm">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                    <Button onClick={endWorkSession} variant="destructive" size="sm">
                      <SkipForward className="h-4 w-4 mr-2" />
                      End Session
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Notifications */}
      <RealtimeNotifications scholarId={scholarId} />

      {/* Enhanced Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Enhanced Moderation Queue
            </CardTitle>
            
            <div className="flex flex-wrap gap-2">
              {/* View Controls */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                {[{ id: 'card', icon: Layers }, { id: 'table', icon: FileText }, { id: 'kanban', icon: BarChart3 }].map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setViewMode(prev => ({ ...prev, layout: id as any }))}
                    className={cn(
                      "p-2 rounded-md transition-all",
                      viewMode.layout === id ? "bg-white shadow-sm" : "hover:bg-gray-200"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
              
              <Button
                variant={isOfflineMode ? "destructive" : "outline"}
                size="sm"
                onClick={() => setIsOfflineMode(!isOfflineMode)}
              >
                {isOfflineMode ? 'Online Mode' : 'Offline Mode'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={loadingQuestions}
              >
                <RefreshCw className={cn("h-4 w-4", loadingQuestions && "animate-spin")} />
                Refresh
              </Button>

              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Customize
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Enhanced Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <SimpleSelect
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="priority">High Priority</option>
                <option value="overdue">Overdue</option>
                <option value="flagged">Flagged</option>
              </SimpleSelect>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Topic Focus</label>
              <SimpleSelect
                value={filters.topic}
                onValueChange={(value) => handleFilterChange('topic', value)}
              >
                <option value="all">All Topics</option>
                <option value="aqeedah">Aqeedah</option>
                <option value="fiqh">Fiqh</option>
                <option value="seerah">Seerah</option>
                <option value="tafsir">Tafsir</option>
                <option value="hadith">Hadith</option>
                <option value="akhlaq">Akhlaq</option>
              </SimpleSelect>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Difficulty</label>
              <SimpleSelect
                value={filters.difficulty}
                onValueChange={(value) => handleFilterChange('difficulty', value)}
              >
                <option value="all">All Levels</option>
                <option value="easy">Beginner</option>
                <option value="medium">Intermediate</option>
                <option value="hard">Advanced</option>
              </SimpleSelect>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Assignment</label>
              <SimpleSelect
                value={filters.assignedTo}
                onValueChange={(value) => handleFilterChange('assignedTo', value)}
              >
                <option value="all">All Questions</option>
                <option value="me">Assigned to Me</option>
                <option value="unassigned">Unassigned</option>
              </SimpleSelect>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Time Range</label>
              <SimpleSelect
                value={filters.timeRange}
                onValueChange={(value) => handleFilterChange('timeRange', value)}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </SimpleSelect>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Surah</label>
              <Input
                type="number"
                placeholder="1-114"
                value={filters.surah}
                onChange={(e) => handleFilterChange('surah', e.target.value)}
                min="1"
                max="114"
                className="focus:ring-emerald-500"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Group By Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Group by:</span>
                <SimpleSelect
                  value={viewMode.groupBy}
                  onValueChange={(value) => setViewMode(prev => ({ ...prev, groupBy: value as any }))}
                >
                  <option value="none">None</option>
                  <option value="priority">Priority</option>
                  <option value="difficulty">Difficulty</option>
                  <option value="topic">Topic</option>
                  <option value="status">Status</option>
                </SimpleSelect>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Density:</span>
                <SimpleSelect
                  value={viewMode.density}
                  onValueChange={(value) => setViewMode(prev => ({ ...prev, density: value as any }))}
                >
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="spacious">Spacious</option>
                </SimpleSelect>
              </div>
            </div>
            
            {selectedQuestions.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedQuestions.length} selected
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedQuestions([])}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Bulk Operations Panel */}
          {selectedQuestions.length > 0 && (
            <BulkOperationsPanel 
              selectedQuestions={selectedQuestions}
              onBulkOperation={bulkOperationMutation.mutate}
              isLoading={bulkOperationMutation.isPending}
            />
          )}

          {/* Auto-save indicator */}
          {autoSaveEnabled && (
            <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
              <Save className="h-3 w-3" />
              <span>Auto-save enabled • Last saved: {savedWork.length > 0 ? new Date(savedWork[savedWork.length - 1].timestamp).toLocaleTimeString() : 'Never'}</span>
              {savedWork.length > 0 && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  <Undo2 className="h-3 w-3 mr-1" />
                  Restore
                </Button>
              )}
            </div>
          )}

          {/* Questions Display */}
          <div className="space-y-6">
            {loadingQuestions ? (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-emerald-500" />
                <p className="text-muted-foreground text-lg">Loading questions...</p>
                <p className="text-sm text-muted-foreground mt-2">Fetching latest moderation queue</p>
              </div>
            ) : Object.keys(processedQuestions).length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
                <p className="text-lg font-medium text-emerald-800">Excellence achieved!</p>
                <p className="text-muted-foreground mt-2">No questions pending review with current filters</p>
                <div className="flex justify-center gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setFilters({
                      status: 'all',
                      difficulty: 'all',
                      priority: 'all',
                      surah: '',
                      topic: 'all',
                      timeRange: 'all',
                      search: '',
                      assignedTo: 'all'
                    })}
                  >
                    Clear Filters
                  </Button>
                  <Button variant="islamic">
                    <Eye className="h-4 w-4 mr-2" />
                    View All Questions
                  </Button>
                </div>
              </div>
            ) : (
              Object.entries(processedQuestions).map(([groupKey, groupQuestions]) => (
                <div key={groupKey} className="space-y-4">
                  {viewMode.groupBy !== 'none' && (
                    <div className="flex items-center gap-3 py-2 border-b border-emerald-100">
                      <h3 className="font-semibold text-lg capitalize text-emerald-800">
                        {groupKey === 'all' ? 'All Questions' : groupKey}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {groupQuestions.length} questions
                      </Badge>
                    </div>
                  )}
                  
                  <div className={cn(
                    "grid gap-4",
                    viewMode.layout === 'card' ? "grid-cols-1" : 
                    viewMode.layout === 'table' ? "grid-cols-1" :
                    "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  )}>
                    {groupQuestions.map((question: Question) => {
                      const slaData = calculateAdvancedSLA(question.createdAt.toString(), question.priority);
                      const isSelected = selectedQuestions.includes(question.id);
                      
                      return (
                        <QuestionCard
                          key={question.id}
                          question={question}
                          slaData={slaData}
                          isSelected={isSelected}
                          viewMode={viewMode}
                          onSelect={() => handleQuestionSelect(question.id)}
                          onQuickAction={(action: string) => {
                            if (workSession.isActive) {
                              setWorkSession(prev => ({ ...prev, processedCount: prev.processedCount + 1 }));
                            }
                            // Handle quick actions
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Collaboration Panel */}
      <CollaborationPanel 
        scholarId={scholarId} 
        collaborationData={collaboration}
      />

      {/* Quality Metrics Panel */}
      <QualityMetricsPanel 
        scholarId={scholarId} 
        stats={enhancedStats}
      />

      {/* Professional Growth Panel */}
      <ProfessionalGrowthPanel 
        scholarId={scholarId} 
        stats={enhancedStats}
      />
    </div>
  );
}

// Enhanced Question Card Component
interface QuestionCardProps {
  question: Question;
  slaData: any;
  isSelected: boolean;
  viewMode: ViewMode;
  onSelect: () => void;
  onQuickAction: (action: string) => void;
}

function QuestionCard({ question, slaData, isSelected, viewMode, onSelect, onQuickAction }: QuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <Card 
      className={cn(
        "transition-all duration-200 cursor-pointer hover:shadow-md",
        isSelected && "ring-2 ring-emerald-500 bg-emerald-50",
        slaData.urgencyLevel === 'critical' && "border-red-300 bg-red-50",
        slaData.urgencyLevel === 'high' && "border-yellow-300 bg-yellow-50",
        viewMode.density === 'compact' ? "" : 
        viewMode.density === 'spacious' ? "p-6" : "p-4"
      )}
      onClick={onSelect}
    >
      <CardContent className={cn(
        viewMode.density === 'compact' ? "p-3" : 
        viewMode.density === 'spacious' ? "p-6" : "p-4"
      )}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={
                  question.priority === 'high' ? 'destructive' :
                  question.priority === 'medium' ? 'default' : 'secondary'
                }>
                  {question.priority}
                </Badge>
                
                <Badge variant="outline" className="text-xs">
                  Surah {(question as any).verses?.surah}:{(question as any).verses?.ayah}
                </Badge>
                
                <Badge variant={
                  question.difficulty === 'hard' ? 'destructive' :
                  question.difficulty === 'medium' ? 'default' : 'secondary'
                }>
                  {question.difficulty}
                </Badge>

                {question.categoryTags?.[0] && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                    {question.categoryTags[0]}
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Created {new Date(question.createdAt).toLocaleDateString()} • AI Generated
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* SLA Urgency Indicator */}
            <div className="text-right">
              <div className="flex items-center gap-1 mb-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  slaData.urgencyLevel === 'critical' ? "bg-red-500 animate-pulse" :
                  slaData.urgencyLevel === 'high' ? "bg-yellow-500" :
                  slaData.urgencyLevel === 'medium' ? "bg-blue-500" : "bg-green-500"
                )} />
                <span className="text-xs font-medium capitalize">{slaData.urgencyLevel}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {slaData.isOverdue ? 'Overdue' : 
                 `${Math.floor(slaData.remainingTime / (1000 * 60 * 60))}h ${Math.floor((slaData.remainingTime % (1000 * 60 * 60)) / (1000 * 60))}m left`
                }
              </div>
              <Progress 
                value={slaData.progress} 
                className={cn(
                  "w-20 h-1 mt-1",
                  slaData.urgencyLevel === 'critical' ? "[&>div]:bg-red-500" :
                  slaData.urgencyLevel === 'high' ? "[&>div]:bg-yellow-500" : "[&>div]:bg-blue-500"
                )}
              />
            </div>
          </div>
        </div>

        {/* Question Preview */}
        <div className="space-y-3">
          <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-800">Question:</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? 'Collapse' : 'Expand'}
              </Button>
            </div>
            <p className={cn(
              "text-sm leading-relaxed text-gray-700",
              !isExpanded && "line-clamp-2"
            )}>
              {question.prompt}
            </p>
          </div>
          
          {isExpanded && (
            <div className="grid grid-cols-1 gap-2">
              {question.choices.map((choice, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-2 text-xs rounded-lg border transition-all",
                    choice === question.answer 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-medium"
                      : "bg-gray-50 border-gray-200 text-gray-600"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                      choice === question.answer 
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    )}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{choice}</span>
                    {choice === question.answer && (
                      <CheckCircle className="h-3 w-3 text-emerald-600 ml-auto" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
          <div className="flex gap-2">
            <Button 
              variant="islamic" 
              size="sm" 
              className="text-xs px-3 py-1"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction('approve');
                window.location.href = `/scholar/review/${question.id}`;
              }}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Quick Approve
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs px-3 py-1"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/scholar/review/${question.id}`;
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              Review
            </Button>
          </div>
          
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs p-1 h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction('flag');
              }}
            >
              <Flag className="h-3 w-3" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs p-1 h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction('message');
              }}
            >
              <MessageCircle className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}