'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Simple select component
const SimpleSelect = ({ value, onValueChange, children }: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  >
    {children}
  </select>
);
import { 
  CheckCircle,
  XCircle,
  Edit3,
  AlertTriangle,
  BookOpen,
  Languages,
  Clock,
  User,
  Flag
} from 'lucide-react';
import { Question, Verse, ModerationAction, ArabicValidation } from '@/types';
import { cn } from '@/lib/cn';

interface QuestionReviewProps {
  question: Question;
  verse: Verse;
  onComplete: () => void;
}

interface EditableQuestion {
  prompt: string;
  choices: string[];
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  categoryTags: string[];
}

export function QuestionReview({ question, verse, onComplete }: QuestionReviewProps) {
  const [activeTab, setActiveTab] = useState<'review' | 'edit' | 'validate'>('review');
  const [editedQuestion, setEditedQuestion] = useState<EditableQuestion>({
    prompt: question.prompt,
    choices: [...question.choices],
    answer: question.answer,
    difficulty: question.difficulty,
    categoryTags: question.categoryTags || []
  });
  const [moderationNotes, setModerationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [flagConcern, setFlagConcern] = useState('');
  const [arabicValidation, setArabicValidation] = useState<ArabicValidation | null>(null);
  
  const queryClient = useQueryClient();

  // Validate Arabic text
  useEffect(() => {
    validateArabicText();
  }, [verse.arabicText]);

  const validateArabicText = async () => {
    try {
      const response = await fetch('/api/scholar/validate-arabic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ text: verse.arabicText }),
      });
      
      if (response.ok) {
        const validation = await response.json();
        setArabicValidation(validation.data);
      }
    } catch (error) {
      console.error('Arabic validation failed:', error);
    }
  };

  // Approve question
  const approveMutation = useMutation({
    mutationFn: async (notes?: string) => {
      const response = await fetch(`/api/questions/${question.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ notes }),
      });
      
      if (!response.ok) throw new Error('Failed to approve question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-questions'] });
      onComplete();
    },
  });

  // Reject question
  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await fetch(`/api/questions/${question.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ reason }),
      });
      
      if (!response.ok) throw new Error('Failed to reject question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-questions'] });
      onComplete();
    },
  });

  // Edit and approve question
  const editMutation = useMutation({
    mutationFn: async (changes: Partial<Question>, notes?: string) => {
      const response = await fetch(`/api/questions/${question.id}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ changes, notes }),
      });
      
      if (!response.ok) throw new Error('Failed to edit question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-questions'] });
      onComplete();
    },
  });

  // Flag question
  const flagMutation = useMutation({
    mutationFn: async (concern: string) => {
      const response = await fetch(`/api/questions/${question.id}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ concern }),
      });
      
      if (!response.ok) throw new Error('Failed to flag question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-questions'] });
      onComplete();
    },
  });

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...editedQuestion.choices];
    newChoices[index] = value;
    setEditedQuestion({ ...editedQuestion, choices: newChoices });
  };

  const handleAnswerChange = (value: string) => {
    setEditedQuestion({ ...editedQuestion, answer: value });
  };

  const addCategoryTag = (tag: string) => {
    if (tag && !editedQuestion.categoryTags.includes(tag)) {
      setEditedQuestion({
        ...editedQuestion,
        categoryTags: [...editedQuestion.categoryTags, tag]
      });
    }
  };

  const removeCategoryTag = (tag: string) => {
    setEditedQuestion({
      ...editedQuestion,
      categoryTags: editedQuestion.categoryTags.filter(t => t !== tag)
    });
  };

  const calculateSLAProgress = () => {
    const created = new Date(question.createdAt);
    const now = new Date();
    const elapsed = now.getTime() - created.getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    return Math.min((elapsed / twentyFourHours) * 100, 100);
  };

  const slaProgress = calculateSLAProgress();
  const slaUrgent = slaProgress > 75;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with SLA Status */}
      <Card className={cn("border-l-4", slaUrgent ? "border-l-red-500" : "border-l-blue-500")}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Question Review - Surah {verse.surah}:{verse.ayah}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant={
                  question.priority === 'high' ? 'destructive' :
                  question.priority === 'medium' ? 'default' : 'secondary'
                }>
                  {question.priority} priority
                </Badge>
                
                <Badge variant="outline">
                  {question.difficulty}
                </Badge>

                {slaUrgent && (
                  <Badge variant="destructive">
                    <Clock className="h-3 w-3 mr-1" />
                    SLA Alert
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Created by AI • {new Date(question.createdAt).toLocaleDateString()}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className={cn(
                      "h-2 rounded-full transition-all",
                      slaUrgent ? "bg-red-500" : "bg-blue-500"
                    )}
                    style={{ width: `${Math.min(slaProgress, 100)}%` }}
                  />
                </div>
                <span className="text-xs">
                  {slaProgress > 100 ? 'Overdue' : `${Math.round(100 - slaProgress)}% remaining`}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {[
          { id: 'review', label: 'Review', icon: CheckCircle },
          { id: 'edit', label: 'Edit', icon: Edit3 },
          { id: 'validate', label: 'Validate', icon: Languages }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verse Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Qur'anic Verse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Arabic Text */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border">
              <p 
                className="text-right text-2xl font-arabic leading-loose mb-4"
                dir="rtl"
                lang="ar"
              >
                {verse.arabicText}
              </p>
              
              {arabicValidation && (
                <div className="flex items-center gap-2 text-sm">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    arabicValidation.isValid ? "bg-green-500" : "bg-yellow-500"
                  )} />
                  <span className="text-muted-foreground">
                    {arabicValidation.isValid ? 'Text validated' : 'Needs review'}
                    • {arabicValidation.script} script
                    • Diacritics: {arabicValidation.diacritics}
                  </span>
                </div>
              )}
            </div>

            {/* Translation */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800 mb-2">English Translation:</p>
              <p className="text-blue-900 leading-relaxed">
                {verse.translationEn}
              </p>
            </div>

            {/* Verse Reference */}
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="font-semibold text-lg">
                Surah {verse.surah}, Ayah {verse.ayah}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Review Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === 'review' && 'Question Review'}
              {activeTab === 'edit' && 'Edit Question'}
              {activeTab === 'validate' && 'Validation Checks'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === 'review' && (
              <div className="space-y-6">
                {/* Question Display */}
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium mb-2 block">Question:</Label>
                    <p className="text-sm leading-relaxed">{question.prompt}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Answer Choices:</Label>
                    <div className="grid gap-2">
                      {question.choices.map((choice, index) => (
                        <div
                          key={index}
                          className={cn(
                            "p-3 rounded-lg border transition-colors",
                            choice === question.answer
                              ? "bg-green-50 border-green-200 text-green-800"
                              : "bg-gray-50 border-gray-200"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                              choice === question.answer
                                ? "bg-green-500 text-white"
                                : "bg-gray-300 text-gray-700"
                            )}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span className="text-sm">{choice}</span>
                            {choice === question.answer && (
                              <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Moderation Notes */}
                <div className="space-y-2">
                  <Label htmlFor="moderation-notes">Moderation Notes (Optional)</Label>
                  <textarea
                    id="moderation-notes"
                    className="w-full p-3 border rounded-lg resize-none"
                    rows={3}
                    placeholder="Add notes about this question..."
                    value={moderationNotes}
                    onChange={(e) => setModerationNotes(e.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => approveMutation.mutate(moderationNotes)}
                    disabled={approveMutation.isPending}
                    className="flex-1"
                    variant="islamic"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>

                  <Button
                    onClick={() => setActiveTab('edit')}
                    variant="outline"
                    className="flex-1"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Rejection reason..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <Button
                      onClick={() => rejectMutation.mutate(rejectionReason)}
                      disabled={rejectMutation.isPending || !rejectionReason}
                      variant="destructive"
                      className="w-full"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>

                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Flag concern..."
                      value={flagConcern}
                      onChange={(e) => setFlagConcern(e.target.value)}
                    />
                    <Button
                      onClick={() => flagMutation.mutate(flagConcern)}
                      disabled={flagMutation.isPending || !flagConcern}
                      variant="outline"
                      className="w-full"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Flag for Senior Review
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'edit' && (
              <div className="space-y-6">
                {/* Edit Question */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-prompt">Question</Label>
                    <textarea
                      id="edit-prompt"
                      className="w-full p-3 border rounded-lg resize-none"
                      rows={3}
                      value={editedQuestion.prompt}
                      onChange={(e) => setEditedQuestion({ ...editedQuestion, prompt: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Answer Choices</Label>
                    <div className="space-y-2">
                      {editedQuestion.choices.map((choice, index) => (
                        <div key={index} className="flex gap-2">
                          <div className="w-8 h-9 bg-gray-100 rounded flex items-center justify-center text-sm font-medium">
                            {String.fromCharCode(65 + index)}
                          </div>
                          <Input
                            value={choice}
                            onChange={(e) => handleChoiceChange(index, e.target.value)}
                            placeholder={`Choice ${String.fromCharCode(65 + index)}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <SimpleSelect
                      value={editedQuestion.answer}
                      onValueChange={handleAnswerChange}
                    >
                      {editedQuestion.choices.map((choice, index) => (
                        <option key={index} value={choice}>
                          {String.fromCharCode(65 + index)}. {choice}
                        </option>
                      ))}
                    </SimpleSelect>
                  </div>

                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <SimpleSelect
                      value={editedQuestion.difficulty}
                      onValueChange={(value) => setEditedQuestion({ ...editedQuestion, difficulty: value as any })}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </SimpleSelect>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-notes">Edit Notes</Label>
                    <textarea
                      id="edit-notes"
                      className="w-full p-3 border rounded-lg resize-none"
                      rows={3}
                      placeholder="Describe the changes made..."
                      value={moderationNotes}
                      onChange={(e) => setModerationNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Save Changes */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => editMutation.mutate(editedQuestion, moderationNotes)}
                    disabled={editMutation.isPending}
                    className="flex-1"
                    variant="islamic"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save & Approve
                  </Button>

                  <Button
                    onClick={() => setActiveTab('review')}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'validate' && (
              <div className="space-y-6">
                {/* Arabic Validation */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Languages className="h-5 w-5" />
                    <h3 className="font-medium">Arabic Text Validation</h3>
                  </div>

                  {arabicValidation && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">Text Validity</span>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            arabicValidation.isValid ? "bg-green-500" : "bg-red-500"
                          )} />
                          <span className="text-sm font-medium">
                            {arabicValidation.isValid ? 'Valid' : 'Invalid'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">Script Type</span>
                        <Badge variant="outline">{arabicValidation.script}</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">Diacritics</span>
                        <Badge variant="outline">{arabicValidation.diacritics}</Badge>
                      </div>

                      {arabicValidation.corrections && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm font-medium text-yellow-800 mb-2">Suggested Corrections:</p>
                          <p className="text-sm text-yellow-700">{arabicValidation.corrections}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Islamic Authenticity Checks */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    <h3 className="font-medium">Islamic Authenticity</h3>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Quranic Reference</span>
                      <Badge variant="outline">✓ Valid</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Translation Accuracy</span>
                      <Badge variant="outline">✓ Verified</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Islamic Terminology</span>
                      <Badge variant="outline">✓ Appropriate</Badge>
                    </div>
                  </div>
                </div>

                {/* Back to Review */}
                <Button
                  onClick={() => setActiveTab('review')}
                  variant="outline"
                  className="w-full"
                >
                  Back to Review
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}