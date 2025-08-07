import { verifyAuth, hasRole, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { ArabicValidation } from '@/types';

// Arabic text validation for scholars
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);

    if (!authResult.success || !authResult.user) {
      return createErrorResponse(authResult.error || 'Authentication required', 401);
    }

    if (!hasRole(authResult.user, 'scholar')) {
      return createErrorResponse('Scholar role required', 403);
    }

    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return createErrorResponse('Arabic text is required', 400);
    }

    // Arabic text validation logic
    const validation = await validateArabicText(text);

    return createSuccessResponse(validation);

  } catch (error) {
    console.error('Arabic validation API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

async function validateArabicText(text: string): Promise<ArabicValidation> {
  // Arabic Unicode ranges
  const arabicBasic = /[\u0600-\u06FF]/; // Arabic block
  const arabicSupplement = /[\u0750-\u077F]/; // Arabic Supplement
  const arabicExtendedA = /[\u08A0-\u08FF]/; // Arabic Extended-A
  const arabicPresentationForms = /[\uFB50-\uFDFF\uFE70-\uFEFF]/; // Arabic Presentation Forms

  // Diacritics (Tashkeel)
  const diacritics = /[\u064B-\u065F\u0670\u06D6-\u06ED]/;
  
  // Check if text contains Arabic
  const hasArabic = arabicBasic.test(text) || arabicSupplement.test(text) || 
                   arabicExtendedA.test(text) || arabicPresentationForms.test(text);

  if (!hasArabic) {
    return {
      text,
      isValid: false,
      corrections: 'Text does not contain Arabic characters',
      diacritics: 'missing',
      script: 'standard'
    };
  }

  // Check for diacritics
  const diacriticsMatches = text.match(diacritics);
  const diacriticsCount = diacriticsMatches ? diacriticsMatches.length : 0;
  const arabicChars = text.match(/[\u0600-\u06FF]/g) || [];
  const diacriticsRatio = arabicChars.length > 0 ? diacriticsCount / arabicChars.length : 0;

  let diacriticsStatus: 'present' | 'partial' | 'missing';
  if (diacriticsRatio > 0.8) {
    diacriticsStatus = 'present';
  } else if (diacriticsRatio > 0.3) {
    diacriticsStatus = 'partial';
  } else {
    diacriticsStatus = 'missing';
  }

  // Detect script type (simplified detection)
  let scriptType: 'uthmani' | 'standard' | 'mixed' = 'standard';
  
  // Uthmani script typically has more diacritics and specific Unicode ranges
  if (arabicPresentationForms.test(text) && diacriticsRatio > 0.7) {
    scriptType = 'uthmani';
  } else if (arabicPresentationForms.test(text) && arabicBasic.test(text)) {
    scriptType = 'mixed';
  }

  // Basic validation rules
  let isValid = true;
  let corrections: string | undefined;

  // Check for common issues
  if (text.includes('?') || text.includes('□')) {
    isValid = false;
    corrections = 'Text contains missing characters (? or □)';
  }

  // Check for Latin characters mixed with Arabic (except punctuation)
  const latinChars = /[A-Za-z]/g;
  if (latinChars.test(text)) {
    isValid = false;
    corrections = corrections ? 
      corrections + '; Contains Latin characters mixed with Arabic' :
      'Contains Latin characters mixed with Arabic';
  }

  // Check for proper Arabic text direction markers
  const hasRTLMarkers = /[\u200F\u202E]/g.test(text);
  
  // Additional validation for Quranic text
  if (scriptType === 'uthmani' && diacriticsStatus === 'missing') {
    corrections = corrections ?
      corrections + '; Uthmani script should include diacritics' :
      'Uthmani script should include diacritics';
  }

  return {
    text,
    isValid,
    corrections,
    diacritics: diacriticsStatus,
    script: scriptType
  };
}