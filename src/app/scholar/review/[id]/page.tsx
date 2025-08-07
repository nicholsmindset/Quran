'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { QuestionReview } from '@/components/scholar/question-review';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function QuestionReviewPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  
  const questionId = params?.id as string;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (!user) {
        router.push('/auth');
        return;
      }

      if (user.role !== 'scholar') {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, loading, mounted, router]);

  // Fetch question details
  const { data: questionData, isLoading: loadingQuestion, error } = useQuery({
    queryKey: ['question-review', questionId],
    queryFn: async () => {
      const response = await fetch(`/api/questions/${questionId}/details`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch question details');
      }
      
      return response.json();
    },
    enabled: !!questionId && !!user,
  });

  const handleComplete = () => {
    router.push('/scholar');
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'scholar') {
    return null;
  }

  if (loadingQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => router.push('/scholar')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-emerald-600">Loading question details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !questionData?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => router.push('/scholar')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Question Not Found
              </h2>
              <p className="text-gray-600 mb-6">
                The question you're trying to review could not be found or may have already been processed.
              </p>
              <Button
                onClick={() => router.push('/scholar')}
                variant="islamic"
              >
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const question = questionData.data.question;
  const verse = questionData.data.verse;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/scholar')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <QuestionReview
          question={question}
          verse={verse}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}