'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  BookOpen,
  Calendar,
  Award,
  Clock,
  Target,
  TrendingUp,
  Trophy,
  Star,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  Users2,
  MessageSquare,
  Share2,
  Flame
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface StudentGroupViewProps {
  groups: any[];
  user: any;
}

export function StudentGroupView({ groups: initialGroups, user }: StudentGroupViewProps) {
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Fetch updated groups and assignments
  const { data: studentData, isLoading } = useQuery({
    queryKey: ['student-groups', user?.id],
    queryFn: async () => {
      const [groupsRes, assignmentsRes] = await Promise.all([
        fetch('/api/groups/student'),
        fetch('/api/assignments/student')
      ]);
      
      const [groups, assignments] = await Promise.all([
        groupsRes.json(),
        assignmentsRes.json()
      ]);
      
      return {
        groups: groups.groups || [],
        assignments: assignments.assignments || [],
        upcomingDeadlines: assignments.upcomingDeadlines || []
      };
    },
    initialData: {
      groups: initialGroups,
      assignments: [],
      upcomingDeadlines: []
    },
    refetchInterval: 30000
  });

  if (isLoading && !initialGroups?.length) {
    return <StudentGroupSkeleton />;
  }

  if (!studentData?.groups?.length) {
    return <NoGroupsState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Learning Groups</h2>
          <p className="text-muted-foreground">
            Track your progress and compete with classmates
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Users2 className="h-4 w-4 mr-2" />
            Join Group
          </Button>
          
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Class Chat
          </Button>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Groups Joined"
          value={studentData?.groups?.length || 0}
          icon={Users}
          color="emerald"
        />
        
        <StatCard
          title="Assignments Due"
          value={studentData?.upcomingDeadlines?.length || 0}
          icon={Clock}
          color="orange"
        />
        
        <StatCard
          title="Completed Today"
          value={calculateTodayCompleted(studentData?.assignments)}
          icon={CheckCircle}
          color="blue"
        />
        
        <StatCard
          title="Class Rank"
          value={calculateClassRank(studentData?.groups, user?.id)}
          icon={Trophy}
          color="purple"
        />
      </div>

      {/* Upcoming Assignments Alert */}
      {studentData?.upcomingDeadlines?.length > 0 && (
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900">
                  {studentData.upcomingDeadlines.length} Assignment{studentData.upcomingDeadlines.length > 1 ? 's' : ''} Due Soon
                </h3>
                <p className="text-sm text-orange-700">
                  Don't miss your deadlines! Complete them to maintain your streak.
                </p>
              </div>
              
              <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Groups Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {studentData?.groups?.map((group: any) => (
          <StudentGroupCard
            key={group.id}
            group={group}
            assignments={studentData.assignments.filter((a: any) => a.groupId === group.id)}
            onSelect={setSelectedGroup}
            isSelected={selectedGroup === group.id}
          />
        ))}
      </div>

      {/* Selected Group Details */}
      <AnimatePresence>
        {selectedGroup && (
          <StudentGroupDetails
            groupId={selectedGroup}
            onClose={() => setSelectedGroup(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  const colorClasses = {
    emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    blue: 'bg-blue-100 text-blue-600 border-blue-200',
    purple: 'bg-purple-100 text-purple-600 border-purple-200',
    orange: 'bg-orange-100 text-orange-600 border-orange-200'
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
      <Card className={`transition-islamic hover:shadow-md ${colorClasses[color as keyof typeof colorClasses]}`}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-white/50">
              <Icon className="h-6 w-6" />
            </div>
            
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm font-medium">{title}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StudentGroupCard({ 
  group, 
  assignments, 
  onSelect, 
  isSelected 
}: {
  group: any;
  assignments: any[];
  onSelect: (id: string) => void;
  isSelected: boolean;
}) {
  const activeAssignments = assignments.filter(a => a.isActive && !a.completed);
  const completedAssignments = assignments.filter(a => a.completed);
  const completionRate = assignments.length > 0 
    ? Math.round((completedAssignments.length / assignments.length) * 100) 
    : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card 
        className={`cursor-pointer transition-all duration-300 ${
          isSelected 
            ? 'ring-2 ring-emerald-500 border-emerald-300 shadow-lg' 
            : 'hover:shadow-md hover:border-emerald-200'
        }`}
        onClick={() => onSelect(group.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-emerald-100 text-emerald-600">
                  {group.name?.charAt(0) || 'G'}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <CardTitle className="text-lg">{group.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {group.teacher?.email?.split('@')[0] || 'Teacher'}
                </p>
              </div>
            </div>
            
            {activeAssignments.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {activeAssignments.length} due
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Progress Overview */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-medium">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>

            {/* Assignment Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{assignments.length}</div>
                <div className="text-xs text-blue-700">Total</div>
              </div>
              
              <div className="p-2 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{completedAssignments.length}</div>
                <div className="text-xs text-green-700">Done</div>
              </div>
              
              <div className="p-2 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">{activeAssignments.length}</div>
                <div className="text-xs text-orange-700">Pending</div>
              </div>
            </div>

            {/* Recent Assignment */}
            {activeAssignments.length > 0 && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activeAssignments[0].title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due {formatRelativeDate(activeAssignments[0].dueDate)}
                    </p>
                  </div>
                  
                  <Button size="sm" variant="islamic" className="ml-2">
                    <PlayCircle className="h-3 w-3 mr-1" />
                    Start
                  </Button>
                </div>
              </div>
            )}

            {/* Class Ranking */}
            <div className="flex items-center justify-between pt-2 border-t border-muted/50">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4" />
                <span>Class Rank: #3</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>95% avg</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StudentGroupDetails({ 
  groupId, 
  onClose 
}: {
  groupId: string;
  onClose: () => void;
}) {
  const { data: groupDetails, isLoading } = useQuery({
    queryKey: ['student-group-details', groupId],
    queryFn: async () => {
      const [groupRes, leaderboardRes, assignmentsRes] = await Promise.all([
        fetch(`/api/groups/${groupId}`),
        fetch(`/api/groups/${groupId}/leaderboard`),
        fetch(`/api/groups/${groupId}/assignments`)
      ]);
      
      const [group, leaderboard, assignments] = await Promise.all([
        groupRes.json(),
        leaderboardRes.json(),
        assignmentsRes.json()
      ]);
      
      return {
        group: group.data,
        leaderboard: leaderboard.data || [],
        assignments: assignments.data || []
      };
    }
  });

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 border-emerald-200 bg-emerald-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-emerald-600" />
              <span>{groupDetails?.group?.name} - Class View</span>
            </CardTitle>
            
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Class Leaderboard */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center">
                <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                Class Leaderboard
              </h3>
              
              <div className="space-y-2">
                {groupDetails?.leaderboard?.slice(0, 5).map((student: any, index: number) => (
                  <div 
                    key={student.userId} 
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                      index === 1 ? 'bg-gray-50 border border-gray-200' :
                      index === 2 ? 'bg-orange-50 border border-orange-200' :
                      'bg-white/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-200 text-yellow-800' :
                      index === 1 ? 'bg-gray-200 text-gray-800' :
                      index === 2 ? 'bg-orange-200 text-orange-800' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      #{index + 1}
                    </div>
                    
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {student.studentName?.charAt(0) || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {student.studentName || 'Anonymous Student'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {student.averageScore}% • {student.assignmentsCompleted} completed
                      </p>
                    </div>
                    
                    {index < 3 && (
                      <div className="text-right">
                        {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                        {index === 1 && <Award className="h-4 w-4 text-gray-500" />}
                        {index === 2 && <Star className="h-4 w-4 text-orange-500" />}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Assignments */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
                Recent Assignments
              </h3>
              
              <div className="space-y-3">
                {groupDetails?.assignments?.slice(0, 4).map((assignment: any) => (
                  <div key={assignment.id} className="p-3 bg-white/50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm truncate">{assignment.title}</h4>
                      
                      <Badge 
                        variant={assignment.completed ? 'success' : assignment.overdue ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {assignment.completed ? 'Done' : assignment.overdue ? 'Overdue' : 'Pending'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {assignment.questionIds?.length || 0} questions
                      </span>
                      <span>
                        Due {formatRelativeDate(assignment.dueDate)}
                      </span>
                    </div>
                    
                    {assignment.completed && (
                      <div className="mt-2 pt-2 border-t border-muted/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Your Score:</span>
                          <Badge variant="secondary" className="text-xs">
                            {assignment.score || 0}%
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 mt-6 pt-4 border-t">
            <Button variant="islamic">
              <BookOpen className="h-4 w-4 mr-2" />
              View All Assignments
            </Button>
            
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              My Progress
            </Button>
            
            <Button variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share Achievement
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function NoGroupsState() {
  return (
    <Card className="p-12 text-center">
      <div className="space-y-4">
        <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto">
          <Users2 className="h-12 w-12 text-blue-600" />
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-2">Join Your First Group</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Ask your teacher for a group invitation code to start learning with your classmates.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3">
          <Button variant="islamic" size="lg">
            <Users2 className="h-5 w-5 mr-2" />
            Join Group
          </Button>
          
          <Button variant="outline" size="lg">
            <BookOpen className="h-5 w-5 mr-2" />
            Continue Solo Learning
          </Button>
        </div>
      </div>
    </Card>
  );
}

function StudentGroupSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="flex space-x-2">
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded"></div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-80 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}

// Helper Functions
function calculateTodayCompleted(assignments: any[]): number {
  if (!assignments) return 0;
  
  const today = new Date().toDateString();
  return assignments.filter(a => 
    a.completedAt && new Date(a.completedAt).toDateString() === today
  ).length;
}

function calculateClassRank(groups: any[], userId: string): string {
  // Simplified rank calculation
  if (!groups?.length) return 'N/A';
  
  // Would normally calculate from leaderboard data
  return '#3';
}

function formatRelativeDate(dateString: string): string {
  if (!dateString) return 'No due date';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Tomorrow';
  if (diffInDays === -1) return 'Yesterday';
  if (diffInDays > 0) return `in ${diffInDays} days`;
  return `${Math.abs(diffInDays)} days ago`;
}