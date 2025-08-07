'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Languages,
  Shield,
  Clock,
  Users,
  Star,
  FileText,
  Target
} from 'lucide-react';

export function ScholarTrainingGuide() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <BookOpen className="h-7 w-7 text-emerald-600" />
            Scholar Training & Guidelines
          </CardTitle>
          <p className="text-gray-600">
            Complete guide for moderating AI-generated Quranic questions with Islamic authenticity standards
          </p>
        </CardHeader>
      </Card>

      {/* Core Responsibilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Core Responsibilities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Review for Authenticity</span>
              </div>
              <p className="text-sm text-green-700">
                Verify Islamic accuracy, correct Quranic references, and appropriate terminology usage
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Languages className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">Arabic Text Validation</span>
              </div>
              <p className="text-sm text-blue-700">
                Check Arabic text accuracy, diacritics, and Uthmani script compliance
              </p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">24-Hour SLA</span>
              </div>
              <p className="text-sm text-yellow-700">
                Process questions within 24 hours to maintain quality workflow
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-800">Documentation</span>
              </div>
              <p className="text-sm text-purple-700">
                Provide detailed feedback and maintain audit trail for all decisions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Decision Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Decision Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Approve */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 mb-2">Approve</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Use when question meets all Islamic authenticity and accuracy standards
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Correct Quranic reference</Badge>
                  <Badge variant="outline">Accurate translation</Badge>
                  <Badge variant="outline">Appropriate difficulty</Badge>
                  <Badge variant="outline">Clear question format</Badge>
                </div>
              </div>
            </div>

            {/* Edit */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 mb-2">Edit & Approve</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Use when question has potential but needs corrections
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Minor wording issues</Badge>
                  <Badge variant="outline">Difficulty adjustment needed</Badge>
                  <Badge variant="outline">Choice improvements</Badge>
                  <Badge variant="outline">Grammar corrections</Badge>
                </div>
              </div>
            </div>

            {/* Reject */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-2">Reject</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Use when question has fundamental issues that cannot be easily corrected
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="destructive">Incorrect Quranic reference</Badge>
                  <Badge variant="destructive">Translation errors</Badge>
                  <Badge variant="destructive">Theological issues</Badge>
                  <Badge variant="destructive">Inappropriate content</Badge>
                </div>
              </div>
            </div>

            {/* Flag */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-800 mb-2">Flag for Senior Review</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Use when question requires additional scholarly consultation
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Complex theological issues</Badge>
                  <Badge variant="outline">Controversial interpretations</Badge>
                  <Badge variant="outline">Advanced scholarly topics</Badge>
                  <Badge variant="outline">Uncertain accuracy</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Standards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Islamic Authenticity Standards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quranic Reference */}
          <div>
            <h3 className="font-semibold mb-3">Quranic Reference Verification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-green-700">✅ Correct</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Accurate Surah and Ayah numbers</li>
                  <li>• Proper Arabic text (Uthmani preferred)</li>
                  <li>• Authentic translation source</li>
                  <li>• Context preservation</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-red-700">❌ Incorrect</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Wrong verse references</li>
                  <li>• Corrupted Arabic text</li>
                  <li>• Mistranslations</li>
                  <li>• Out of context usage</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Arabic Text */}
          <div>
            <h3 className="font-semibold mb-3">Arabic Text Standards</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Badge className="mb-2">Script Type</Badge>
                  <p className="text-sm text-gray-600">
                    Prefer Uthmani script, accept standard Arabic with proper validation
                  </p>
                </div>
                <div>
                  <Badge className="mb-2">Diacritics</Badge>
                  <p className="text-sm text-gray-600">
                    Full diacritics preferred for accuracy, partial acceptable with verification
                  </p>
                </div>
                <div>
                  <Badge className="mb-2">Validation</Badge>
                  <p className="text-sm text-gray-600">
                    Use validation tools to check for character corruption or encoding issues
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Islamic Terminology */}
          <div>
            <h3 className="font-semibold mb-3">Islamic Terminology Guidelines</h3>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="font-medium text-green-800">Respectful Language:</span>
                <span className="text-green-700 ml-2">Use proper Islamic terms, avoid colloquialisms, maintain respectful tone</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="font-medium text-blue-800">Technical Accuracy:</span>
                <span className="text-blue-700 ml-2">Verify Islamic concepts, theological terms, and scholarly references</span>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="font-medium text-yellow-800">Cultural Sensitivity:</span>
                <span className="text-yellow-700 ml-2">Consider diverse Islamic traditions and interpretations</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SLA Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            24-Hour SLA Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">0-12h</div>
              <div className="text-sm font-medium text-green-800 mb-1">Optimal</div>
              <div className="text-xs text-green-600">Process within first half of SLA period</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 mb-2">12-20h</div>
              <div className="text-sm font-medium text-yellow-800 mb-1">Warning</div>
              <div className="text-xs text-yellow-600">Approaching SLA deadline</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-2">20-24h</div>
              <div className="text-sm font-medium text-red-800 mb-1">Critical</div>
              <div className="text-xs text-red-600">Immediate attention required</div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Priority Guidelines:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• High priority questions: Process within 8 hours</li>
              <li>• Flagged questions: Require senior scholar attention</li>
              <li>• Batch processing: Coordinate with team for efficiency</li>
              <li>• Complex questions: May require extended review time</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Best Practices for Scholars</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 text-green-700">Quality Assurance</h4>
              <ul className="text-sm space-y-2 text-gray-600">
                <li>• Always verify Quranic references against Mushaf</li>
                <li>• Check Arabic text using validation tools</li>
                <li>• Ensure translations are from reputable sources</li>
                <li>• Maintain consistency in terminology</li>
                <li>• Document all changes and reasoning</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3 text-blue-700">Efficiency Tips</h4>
              <ul className="text-sm space-y-2 text-gray-600">
                <li>• Use batch processing for similar questions</li>
                <li>• Create templates for common feedback</li>
                <li>• Flag complex questions early for team review</li>
                <li>• Maintain regular review schedule</li>
                <li>• Collaborate with other scholars on difficult cases</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-semibold text-emerald-800 mb-2">Need Help or Have Questions?</h3>
            <p className="text-emerald-700 mb-4">
              Contact the senior scholar team for guidance on complex moderation decisions
            </p>
            <Button variant="islamic" size="sm">
              Contact Senior Scholars
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}