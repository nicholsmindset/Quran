'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
// Simple select component for moderation dashboard
const SimpleSelect = ({ value, onValueChange, children, ...props }: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  [key: string]: any;
}) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    {...props}
  >
    {children}
  </select>
);
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
  Calendar
} from 'lucide-react';
import { Question, ModerationBatch, ScholarStats } from '@/types';
import { cn } from '@/lib/cn';

interface ModerationDashboardProps {
  scholarId: string;
}

interface FilterState {
  status: 'all' | 'pending' | 'flagged';
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
  priority: 'all' | 'low' | 'medium' | 'high';
  surah: string;
  search: string;
}

export function ModerationDashboard({ scholarId }: ModerationDashboardProps) {
  const [filters, setFilters] = useState<FilterState>({
    status: 'pending',
    difficulty: 'all',
    priority: 'all',
    surah: '',
    search: ''
  });
  
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch pending questions with filters
  const { data: questionsData, isLoading: loadingQuestions, refetch } = useQuery({
    queryKey: ['moderation-questions', filters, scholarId],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });
      
      const response = await fetch(`/api/scholar/questions?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    },
  });

  // Fetch scholar statistics
  const { data: statsData } = useQuery({
    queryKey: ['scholar-stats', scholarId],
    queryFn: async () => {
      const response = await fetch(`/api/scholar/stats/${scholarId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  // Fetch current batches
  const { data: batchesData } = useQuery({
    queryKey: ['moderation-batches', scholarId],
    queryFn: async () => {
      const response = await fetch(`/api/scholar/batches/${scholarId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch batches');
      return response.json();
    },
  });

  // Create batch mutation
  const createBatchMutation = useMutation({
    mutationFn: async (questionIds: string[]) => {
      const response = await fetch('/api/scholar/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ questionIds, scholarId }),
      });
      
      if (!response.ok) throw new Error('Failed to create batch');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-batches'] });
      setSelectedQuestions([]);
      setBatchMode(false);
    },
  });

  const questions = questionsData?.data || [];
  const stats = statsData?.data || null;
  const batches = batchesData?.data || [];

  // Calculate SLA progress
  const calculateSLAProgress = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const elapsed = now.getTime() - created.getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    return Math.min((elapsed / twentyFourHours) * 100, 100);
  };

  const getSLAStatus = (progress: number) => {
    if (progress < 50) return { color: 'bg-green-500', status: 'Good' };
    if (progress < 75) return { color: 'bg-yellow-500', status: 'Warning' };
    return { color: 'bg-red-500', status: 'Critical' };
  };

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
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questions.length}</div>
            <p className="text-xs text-muted-foreground">
              {questions.filter((q: Question) => calculateSLAProgress(q.createdAt.toString()) > 75).length} urgent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h SLA Status</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats ? `${stats.currentSLA}%` : '95%'}
            </div>
            <p className="text-xs text-muted-foreground">
              On-time completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? stats.approved + stats.rejected + stats.edited : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Questions reviewed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches.length}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Moderation Queue
            </CardTitle>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBatchMode(!batchMode)}
              >
                {batchMode ? 'Exit Batch Mode' : 'Batch Process'}
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
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <SimpleSelect
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="flagged">Flagged</option>
              </SimpleSelect>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Difficulty</label>
              <SimpleSelect
                value={filters.difficulty}
                onValueChange={(value) => handleFilterChange('difficulty', value)}
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </SimpleSelect>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Priority</label>
              <SimpleSelect
                value={filters.priority}
                onValueChange={(value) => handleFilterChange('priority', value)}
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </SimpleSelect>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Surah</label>
              <Input
                type="number"
                placeholder="Surah number"
                value={filters.surah}
                onChange={(e) => handleFilterChange('surah', e.target.value)}
                min="1"
                max="114"
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
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Batch Mode Controls */}
          {batchMode && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Batch Mode: {selectedQuestions.length} questions selected
                  </p>
                  <p className="text-xs text-blue-600">
                    Select questions to process as a batch with shared deadline
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedQuestions.length === questions.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => createBatchMutation.mutate(selectedQuestions)}
                    disabled={selectedQuestions.length === 0 || createBatchMutation.isPending}
                  >
                    Create Batch ({selectedQuestions.length})
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-4">
            {loadingQuestions ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading questions...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 mx-auto mb-4 text-green-500" />
                <p className="text-muted-foreground">No questions pending review</p>
              </div>
            ) : (
              questions.map((question: Question) => {
                const slaProgress = calculateSLAProgress(question.createdAt.toString());
                const slaStatus = getSLAStatus(slaProgress);
                const isSelected = selectedQuestions.includes(question.id);
                
                return (
                  <Card key={question.id} className={cn(
                    "transition-all duration-200",
                    batchMode && isSelected && "ring-2 ring-blue-500",
                    slaProgress > 75 && "border-red-300 bg-red-50"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          {batchMode && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleQuestionSelect(question.id)}
                              className="rounded border-gray-300"
                            />
                          )}
                          
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={
                                question.priority === 'high' ? 'destructive' :
                                question.priority === 'medium' ? 'default' : 'secondary'
                              }>
                                {question.priority} priority
                              </Badge>
                              
                              <Badge variant="outline">
                                Surah {(question as any).verses?.surah}:{(question as any).verses?.ayah}
                              </Badge>
                              
                              <Badge variant={
                                question.difficulty === 'hard' ? 'destructive' :
                                question.difficulty === 'medium' ? 'default' : 'secondary'
                              }>
                                {question.difficulty}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                              Created {new Date(question.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* SLA Progress */}
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={cn("w-2 h-2 rounded-full", slaStatus.color)} />
                              <span className="text-xs font-medium">{slaStatus.status}</span>
                            </div>
                            <Progress 
                              value={slaProgress} 
                              className="w-20 h-2"
                            />
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Navigate to question review
                              window.location.href = `/scholar/review/${question.id}`;
                            }}
                          >
                            Review
                          </Button>
                        </div>
                      </div>

                      {/* Question Preview */}
                      <div className="space-y-2">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium mb-2">Question:</p>
                          <p className="text-sm">{question.prompt}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {question.choices.map((choice, index) => (
                            <div
                              key={index}
                              className={cn(
                                "p-2 text-xs rounded border",
                                choice === question.answer 
                                  ? "bg-green-50 border-green-200 text-green-800"
                                  : "bg-gray-50 border-gray-200"
                              )}
                            >
                              {String.fromCharCode(65 + index)}. {choice}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}