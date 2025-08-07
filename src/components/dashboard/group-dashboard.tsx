'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Settings,
  BookOpen,
  TrendingUp,
  Calendar,
  Award,
  Clock,
  UserPlus,
  Copy,
  Eye,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Target,
  Flame,
  Star,
  ChevronRight,
  Send,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface GroupDashboardProps {
  groups: any[];
  user: any;
}

export function GroupDashboard({ groups: initialGroups, user }: GroupDashboardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch updated groups data
  const { data: groupsData, isLoading } = useQuery({
    queryKey: ['teacher-groups', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/groups');
      const data = await response.json();
      return data.groups || [];
    },
    initialData: initialGroups,
    refetchInterval: 30000
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: { name: string; description?: string }) => {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData)
      });
      if (!response.ok) throw new Error('Failed to create group');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-groups'] });
      setShowCreateForm(false);
      toast({
        title: 'Group Created',
        description: 'Your new group has been created successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create group',
        variant: 'destructive'
      });
    }
  });

  if (isLoading && !initialGroups?.length) {
    return <GroupDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Group */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Groups</h2>
          <p className="text-muted-foreground">
            Manage your classes and track student progress
          </p>
        </div>
        
        <Button 
          onClick={() => setShowCreateForm(true)}
          variant="islamic"
          className="group"
        >
          <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          Create New Group
        </Button>
      </div>

      {/* Groups Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Groups"
          value={groupsData?.length || 0}
          icon={Users}
          color="emerald"
        />
        
        <StatCard
          title="Total Students"
          value={groupsData?.reduce((sum: number, group: any) => sum + (group.statistics?.totalMembers || 0), 0) || 0}
          icon={UserPlus}
          color="blue"
        />
        
        <StatCard
          title="Active Assignments"
          value={groupsData?.reduce((sum: number, group: any) => sum + (group.statistics?.activeAssignments || 0), 0) || 0}
          icon={BookOpen}
          color="purple"
        />
        
        <StatCard
          title="This Week"
          value="85%"
          subtitle="Avg Completion"
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Groups List */}
      {groupsData?.length === 0 ? (
        <EmptyGroupsState onCreateGroup={() => setShowCreateForm(true)} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {groupsData?.map((group: any) => (
            <GroupCard
              key={group.id}
              group={group}
              onSelect={setSelectedGroup}
              isSelected={selectedGroup === group.id}
            />
          ))}
        </div>
      )}

      {/* Selected Group Details */}
      <AnimatePresence>
        {selectedGroup && (
          <GroupDetailsPanel
            groupId={selectedGroup}
            onClose={() => setSelectedGroup(null)}
          />
        )}
      </AnimatePresence>

      {/* Create Group Form Modal */}
      <CreateGroupModal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={(data) => createGroupMutation.mutate(data)}
        isLoading={createGroupMutation.isPending}
      />
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color 
}: {
  title: string;
  value: string | number;
  subtitle?: string;
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
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={`transition-islamic hover:shadow-md ${colorClasses[color as keyof typeof colorClasses]}`}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-white/50">
              <Icon className="h-6 w-6" />
            </div>
            
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm font-medium">{title}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function GroupCard({ 
  group, 
  onSelect, 
  isSelected 
}: {
  group: any;
  onSelect: (id: string) => void;
  isSelected: boolean;
}) {
  const { toast } = useToast();

  const copyInviteCode = () => {
    if (group.invite_code) {
      navigator.clipboard.writeText(group.invite_code);
      toast({
        title: 'Invite Code Copied',
        description: 'Share this code with your students to join the group.'
      });
    }
  };

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
            <CardTitle className="text-lg truncate">{group.name}</CardTitle>
            
            <div className="flex items-center space-x-2">
              {group.statistics?.activeAssignments > 0 && (
                <Badge variant="success" className="text-xs">
                  {group.statistics.activeAssignments} active
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  copyInviteCode();
                }}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {group.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {group.description}
            </p>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Group Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-2 bg-muted/30 rounded-lg">
                <div className="text-xl font-bold text-emerald-600">
                  {group.statistics?.totalMembers || 0}
                </div>
                <div className="text-xs text-muted-foreground">Students</div>
              </div>
              
              <div className="text-center p-2 bg-muted/30 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {group.statistics?.totalAssignments || 0}
                </div>
                <div className="text-xs text-muted-foreground">Assignments</div>
              </div>
            </div>

            {/* Progress Indicator */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Group Activity</span>
                <span className="font-medium">
                  {Math.round((group.statistics?.activeAssignments || 0) * 20)}%
                </span>
              </div>
              <Progress 
                value={(group.statistics?.activeAssignments || 0) * 20} 
                className="h-2"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 pt-2 border-t border-muted/50">
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              
              <Button variant="outline" size="sm" className="flex-1">
                <BarChart3 className="h-3 w-3 mr-1" />
                Analytics
              </Button>
              
              <Button variant="outline" size="sm" className="flex-1">
                <Settings className="h-3 w-3 mr-1" />
                Manage
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function GroupDetailsPanel({ 
  groupId, 
  onClose 
}: {
  groupId: string;
  onClose: () => void;
}) {
  const { data: groupDetails, isLoading } = useQuery({
    queryKey: ['group-details', groupId],
    queryFn: async () => {
      const [groupRes, progressRes] = await Promise.all([
        fetch(`/api/groups/${groupId}`),
        fetch(`/api/groups/${groupId}/progress`)
      ]);
      
      const [group, progress] = await Promise.all([
        groupRes.json(),
        progressRes.json()
      ]);
      
      return { group: group.data, progress: progress.data };
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
              <span>{groupDetails?.group?.name} - Detailed View</span>
            </CardTitle>
            
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Group Progress Overview */}
            <div>
              <h3 className="font-semibold mb-4">Class Progress Overview</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <span className="text-sm">Average Completion Rate</span>
                  <Badge variant="success">
                    {groupDetails?.progress?.completionRate || 0}%
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <span className="text-sm">Average Score</span>
                  <Badge variant="secondary">
                    {groupDetails?.progress?.averageScore || 0}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              
              <div className="space-y-2">
                {groupDetails?.progress?.overallProgress?.slice(0, 5).map((student: any, index: number) => (
                  <div key={student.userId} className="flex items-center space-x-3 p-2 rounded-lg bg-white/50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {student.studentName?.charAt(0) || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {student.studentName || 'Student'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {student.assignmentsCompleted} assignments • {student.averageScore}% avg
                      </p>
                    </div>
                    
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 mt-6 pt-4 border-t">
            <Link href={`/teacher/groups/${groupId}`}>
              <Button variant="islamic">
                <BarChart3 className="h-4 w-4 mr-2" />
                Full Analytics
              </Button>
            </Link>
            
            <Link href={`/teacher/groups/${groupId}/assignments`}>
              <Button variant="outline">
                <BookOpen className="h-4 w-4 mr-2" />
                Manage Assignments
              </Button>
            </Link>
            
            <Button variant="outline">
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyGroupsState({ onCreateGroup }: { onCreateGroup: () => void }) {
  return (
    <Card className="p-12 text-center">
      <div className="space-y-4">
        <div className="p-4 bg-emerald-100 rounded-full w-fit mx-auto">
          <Users className="h-12 w-12 text-emerald-600" />
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-2">Create Your First Group</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start building your Islamic learning community by creating a group for your students.
          </p>
        </div>
        
        <Button onClick={onCreateGroup} variant="islamic" size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Create New Group
        </Button>
      </div>
    </Card>
  );
}

function CreateGroupModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string }) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create New Group</CardTitle>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Group Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="e.g., Grade 8 Quran Study"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded-md h-20 resize-none"
                  placeholder="Optional description for your group"
                />
              </div>
            </CardContent>
            
            <div className="flex items-center space-x-3 p-6 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="islamic" disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

function GroupDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded"></div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}