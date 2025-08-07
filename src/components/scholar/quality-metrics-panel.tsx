'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Target,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Download
} from 'lucide-react';

interface QualityMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  description: string;
  category: 'accuracy' | 'efficiency' | 'quality' | 'collaboration';
}

interface QualityMetricsPanelProps {
  scholarId: string;
  stats: any;
}

export function QualityMetricsPanel({ scholarId, stats }: QualityMetricsPanelProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'accuracy' | 'efficiency' | 'quality' | 'collaboration'>('all');
  const [metrics, setMetrics] = useState<QualityMetric[]>([]);

  useEffect(() => {
    const sampleMetrics: QualityMetric[] = [
      {
        id: 'accuracy_rate',
        name: 'Accuracy Rate',
        value: 94.5,
        target: 90,
        trend: 'up',
        trendValue: 2.3,
        description: 'Percentage of correctly reviewed questions',
        category: 'accuracy'
      },
      {
        id: 'consistency_score',
        name: 'Consistency Score',
        value: 91.2,
        target: 85,
        trend: 'up',
        trendValue: 1.8,
        description: 'Consistency in applying review criteria',
        category: 'quality'
      }
    ];
    setMetrics(sampleMetrics);
  }, [scholarId, selectedPeriod, selectedCategory]);

  const filteredMetrics = selectedCategory === 'all' 
    ? metrics 
    : metrics.filter(m => m.category === selectedCategory);

  return (
    <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
            <Award className="h-5 w-5" />
            Quality Performance Metrics
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 justify-between">
            <div className="flex gap-1">
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className="text-xs"
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-1">
              {(['all', 'accuracy', 'efficiency', 'quality', 'collaboration'] as const).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-xs"
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMetrics.map((metric) => (
              <div key={metric.id} className="p-4 bg-white bg-opacity-70 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-emerald-800">{metric.name}</h4>
                  <div className={`flex items-center gap-1 text-xs ${
                    metric.trend === 'up' ? 'text-green-600' :
                    metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    <TrendingUp className="h-3 w-3" />
                    {metric.trendValue > 0 ? '+' : ''}{metric.trendValue}%
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-emerald-700">
                      {metric.value}%
                    </span>
                    <span className="text-xs text-emerald-600 mb-1">
                      Target: {metric.target}%
                    </span>
                  </div>
                  
                  <Progress 
                    value={(metric.value / 100) * 100} 
                    className="h-2"
                  />
                  
                  <p className="text-xs text-emerald-600 mt-1">
                    {metric.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-blue-800">
                <BarChart3 className="h-4 w-4" />
                AI-Powered Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-blue-800 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Strengths
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Exceptional accuracy in Fiqh-related questions</li>
                    <li>• Consistently meets SLA requirements</li>
                    <li>• Strong peer collaboration and mentoring</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-blue-800 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Recommendations
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Consider additional hadith authentication training</li>
                    <li>• Participate in contemporary issues workshops</li>
                    <li>• Share expertise through mentorship program</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-md">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-blue-700">
                    <strong>Next Review:</strong> Your performance will be evaluated in 2 weeks
                  </p>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    Schedule 1:1
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}