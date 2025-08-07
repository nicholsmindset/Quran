'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
  Users,
  MessageCircle,
  Video,
  Phone,
  UserCheck,
  Clock,
  AlertCircle,
  Send,
  Eye,
  HandHeart,
  BookOpen,
  Star,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  ArrowRight,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface Scholar {
  id: string;
  name: string;
  email: string;
  specialization: string[];
  status: 'online' | 'away' | 'busy' | 'offline';
  avatar?: string;
  currentWorkload: number;
  rating: number;
  responseTime: string;
  location: string;
  languages: string[];
}

interface Consultation {
  id: string;
  questionId: string;
  requestedBy: string;
  requestedFrom: string;
  topic: string;
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  deadline?: Date;
  question: string;
  context?: string;
}

interface CollaborationPanelProps {
  scholarId: string;
  collaborationData: any;
}

export function CollaborationPanel({ scholarId, collaborationData }: CollaborationPanelProps) {
  const [activeTab, setActiveTab] = useState<'scholars' | 'consultations' | 'help'>('scholars');
  const [onlineScholars, setOnlineScholars] = useState<Scholar[]>([]);
  const [consultationRequests, setConsultationRequests] = useState<Consultation[]>([]);
  const [helpRequests, setHelpRequests] = useState<Consultation[]>([]);
  const [newConsultation, setNewConsultation] = useState({
    topic: '',
    question: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    targetScholar: ''
  });

  useEffect(() => {
    // Simulate real-time scholar presence
    const sampleScholars: Scholar[] = [
      {
        id: 'dr_ahmad',
        name: 'Dr. Ahmad Hassan',
        email: 'ahmad.hassan@quran.edu',
        specialization: ['Fiqh', 'Hadith', 'Arabic Grammar'],
        status: 'online',
        currentWorkload: 12,
        rating: 4.9,
        responseTime: '~5 min',
        location: 'Cairo, Egypt',
        languages: ['Arabic', 'English']
      },
      {
        id: 'sheikh_omar',
        name: 'Sheikh Omar Ali',
        email: 'omar.ali@quran.edu',
        specialization: ['Tafsir', 'Quranic Sciences'],
        status: 'busy',
        currentWorkload: 18,
        rating: 4.8,
        responseTime: '~15 min',
        location: 'Medina, Saudi Arabia',
        languages: ['Arabic', 'English', 'Urdu']
      },
      {
        id: 'dr_fatima',
        name: 'Dr. Fatima Khan',
        email: 'fatima.khan@quran.edu',
        specialization: ['Aqeedah', 'Islamic History'],
        status: 'online',
        currentWorkload: 8,
        rating: 4.7,
        responseTime: '~3 min',
        location: 'Islamabad, Pakistan',
        languages: ['English', 'Urdu', 'Arabic']
      },
      {
        id: 'imam_yusuf',
        name: 'Imam Yusuf Ibrahim',
        email: 'yusuf.ibrahim@quran.edu',
        specialization: ['Contemporary Issues', 'Islamic Ethics'],
        status: 'away',
        currentWorkload: 15,
        rating: 4.6,
        responseTime: '~30 min',
        location: 'London, UK',
        languages: ['English', 'Arabic']
      }
    ];

    const sampleConsultations: Consultation[] = [
      {
        id: 'cons_1',
        questionId: 'q_123',
        requestedBy: 'current_user',
        requestedFrom: 'dr_ahmad',
        topic: 'Hadith Authentication',
        status: 'pending',
        priority: 'high',
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
        deadline: new Date(Date.now() + 2 * 60 * 60 * 1000),
        question: 'Need verification of hadith chain authenticity for this question about prayer timing',
        context: 'The question involves a weak hadith that might mislead learners'
      },
      {
        id: 'cons_2',
        questionId: 'q_456',
        requestedBy: 'sheikh_omar',
        requestedFrom: 'current_user',
        topic: 'Fiqh Ruling Clarification',
        status: 'accepted',
        priority: 'medium',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        question: 'Could you help clarify the madhab differences on this purification issue?',
        context: 'Question has multiple valid perspectives that need expert input'
      }
    ];

    const sampleHelpRequests: Consultation[] = [
      {
        id: 'help_1',
        questionId: 'q_789',
        requestedBy: 'new_scholar_1',
        requestedFrom: 'current_user',
        topic: 'Question Quality Guidelines',
        status: 'pending',
        priority: 'low',
        createdAt: new Date(Date.now() - 45 * 60 * 1000),
        question: 'New to the platform, could use guidance on our quality standards',
        context: 'Junior scholar needs mentoring on moderation best practices'
      }
    ];

    setOnlineScholars(sampleScholars);
    setConsultationRequests(sampleConsultations.filter(c => c.requestedBy === 'current_user'));
    setHelpRequests(sampleHelpRequests);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <div className="w-3 h-3 bg-green-500 rounded-full" />;
      case 'busy': return <div className="w-3 h-3 bg-red-500 rounded-full" />;
      case 'away': return <div className="w-3 h-3 bg-yellow-500 rounded-full" />;
      default: return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'busy': return 'text-red-600';
      case 'away': return 'text-yellow-600';
      default: return 'text-gray-500';
    }
  };

  const handleConsultationRequest = (scholarId: string) => {
    if (!newConsultation.question.trim() || !newConsultation.topic.trim()) {
      alert('Please fill in topic and question');
      return;
    }

    const consultation: Consultation = {
      id: Date.now().toString(),
      questionId: 'current_question',
      requestedBy: 'current_user',
      requestedFrom: scholarId,
      topic: newConsultation.topic,
      status: 'pending',
      priority: newConsultation.priority,
      createdAt: new Date(),
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      question: newConsultation.question
    };

    setConsultationRequests(prev => [...prev, consultation]);
    setNewConsultation({ topic: '', question: '', priority: 'medium', targetScholar: '' });
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Users className="h-5 w-5" />
          Scholar Collaboration Hub
          <Badge variant="outline" className="ml-auto text-purple-600 border-purple-200">
            {onlineScholars.filter(s => s.status === 'online').length} online
          </Badge>
        </CardTitle>
        
        <div className="flex space-x-1 bg-purple-100 p-1 rounded-lg">
          {[
            { id: 'scholars', label: 'Online Scholars', icon: Users },
            { id: 'consultations', label: 'My Requests', icon: MessageSquare },
            { id: 'help', label: 'Help Others', icon: HandHeart }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-white shadow-sm text-purple-800"
                    : "text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.id === 'consultations' && consultationRequests.length > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {consultationRequests.length}
                  </Badge>
                )}
                {tab.id === 'help' && helpRequests.length > 0 && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                    {helpRequests.length}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Online Scholars Tab */}
        {activeTab === 'scholars' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {onlineScholars.map((scholar) => (
                <Card key={scholar.id} className="bg-white border border-purple-100">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10 bg-purple-100 text-purple-600">
                            {scholar.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1">
                            {getStatusIcon(scholar.status)}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{scholar.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className={getStatusColor(scholar.status)}>
                              {scholar.status ? scholar.status.charAt(0).toUpperCase() + scholar.status.slice(1) : 'Unknown'}
                            </span>
                            <span>•</span>
                            <span>{scholar.responseTime}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span>{scholar.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Video className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {scholar.specialization.map((spec, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <span>{scholar.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Workload: {scholar.currentWorkload}/25</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Languages: {scholar.languages.join(', ')}
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={() => {
                          setNewConsultation(prev => ({ ...prev, targetScholar: scholar.id }));
                          setActiveTab('consultations');
                        }}
                        disabled={scholar.status === 'offline'}
                      >
                        <HelpCircle className="h-3 w-3 mr-1" />
                        Request Consultation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Consultations Tab */}
        {activeTab === 'consultations' && (
          <div className="space-y-4">
            {/* New Consultation Request */}
            <Card className="bg-white border border-purple-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Request Expert Consultation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Topic</label>
                    <Input
                      placeholder="e.g., Hadith Authentication, Fiqh Ruling"
                      value={newConsultation.topic}
                      onChange={(e) => setNewConsultation(prev => ({ ...prev, topic: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Priority</label>
                    <select
                      className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={newConsultation.priority}
                      onChange={(e) => setNewConsultation(prev => ({ ...prev, priority: e.target.value as any }))}
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority - Urgent</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Question Details</label>
                  <textarea
                    className="w-full p-2 border rounded-md resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={3}
                    placeholder="Describe your question or the specific help you need..."
                    value={newConsultation.question}
                    onChange={(e) => setNewConsultation(prev => ({ ...prev, question: e.target.value }))}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    💡 Be specific about your question to get the best help
                  </div>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => handleConsultationRequest(newConsultation.targetScholar || onlineScholars[0]?.id)}
                    disabled={!newConsultation.topic.trim() || !newConsultation.question.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Request
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Consultations */}
            <div className="space-y-3">
              <h4 className="font-medium text-purple-800 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                My Consultation Requests
              </h4>
              
              {consultationRequests.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No active consultation requests</p>
                </div>
              ) : (
                consultationRequests.map((consultation) => {
                  const scholar = onlineScholars.find(s => s.id === consultation.requestedFrom);
                  return (
                    <Card key={consultation.id} className="bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {consultation.topic}
                            </h5>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>To: {scholar?.name || 'Unknown Scholar'}</span>
                              <span>•</span>
                              <span>{consultation.createdAt.toLocaleTimeString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={consultation.status === 'pending' ? 'secondary' : 
                                      consultation.status === 'accepted' ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              {consultation.status}
                            </Badge>
                            <Badge 
                              variant={consultation.priority === 'high' ? 'destructive' : 'outline'}
                              className="text-xs"
                            >
                              {consultation.priority}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {consultation.question}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {consultation.deadline && (
                              <>
                                <Clock className="h-3 w-3" />
                                <span>Deadline: {consultation.deadline.toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            {consultation.status === 'accepted' && (
                              <Button variant="default" size="sm" className="text-xs">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Continue Discussion
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Help Others Tab */}
        {activeTab === 'help' && (
          <div className="space-y-4">
            <div className="text-center py-6">
              <HandHeart className="h-12 w-12 mx-auto mb-4 text-purple-500" />
              <h3 className="text-lg font-medium text-purple-800 mb-2">
                Help Fellow Scholars
              </h3>
              <p className="text-sm text-purple-600 mb-4">
                Share your expertise and strengthen our scholarly community
              </p>
            </div>
            
            {helpRequests.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-sm text-muted-foreground">
                  No pending help requests at the moment
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {helpRequests.map((request) => (
                  <Card key={request.id} className="bg-white border border-orange-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="font-medium text-gray-900 flex items-center gap-2">
                            {request.topic}
                            <Badge variant="outline" className="text-xs">
                              Help Request
                            </Badge>
                          </h5>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>From: {request.requestedBy}</span>
                            <span>•</span>
                            <span>{request.createdAt.toLocaleTimeString()}</span>
                          </div>
                        </div>
                        
                        <Badge 
                          variant={request.priority === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {request.priority} priority
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {request.question}
                      </p>
                      
                      {request.context && (
                        <div className="p-2 bg-orange-50 rounded-md mb-3">
                          <p className="text-xs text-orange-700">
                            <strong>Context:</strong> {request.context}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          <Lightbulb className="h-3 w-3 inline mr-1" />
                          Your expertise can help a fellow scholar
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="text-xs">
                            Decline
                          </Button>
                          <Button variant="default" size="sm" className="text-xs">
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Accept & Help
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Mentorship Program */}
            <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="h-6 w-6 text-orange-600" />
                  <div>
                    <h4 className="font-medium text-orange-800">Scholar Mentorship Program</h4>
                    <p className="text-sm text-orange-600">Guide new scholars and earn recognition</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-orange-700">
                    <div>• Mentor junior scholars</div>
                    <div>• Share best practices</div>
                    <div>• Build scholarly community</div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="text-orange-700 border-orange-300">
                    <Star className="h-3 w-3 mr-1" />
                    Join Program
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Global Collaboration Stats */}
        <div className="pt-4 border-t border-purple-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-purple-800">
                {collaborationData?.totalConsultations || 24}
              </div>
              <div className="text-xs text-muted-foreground">This Month</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-800">
                {collaborationData?.avgResponseTime || '12m'}
              </div>
              <div className="text-xs text-muted-foreground">Avg Response</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-800">
                {collaborationData?.satisfactionRate || '96%'}
              </div>
              <div className="text-xs text-muted-foreground">Satisfaction</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}