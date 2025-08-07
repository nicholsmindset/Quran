#!/usr/bin/env tsx

/**
 * Sample Question Bank Generator
 * Creates sample questions for testing the AI system
 */

import { config } from 'dotenv';
import { createServerSupabaseClient } from '../src/lib/supabase';

// Load environment variables
config({ path: '.env.local' });

const supabase = createServerSupabaseClient();

const sampleQuestions = [
  // Al-Fatiha (Surah 1) Questions
  {
    surah: 1,
    ayah: 1,
    questions: [
      {
        prompt: "What is the meaning of 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'?",
        choices: [
          "A. In the name of Allah, the Most Gracious, the Most Merciful",
          "B. Praise be to Allah, Lord of the worlds", 
          "C. Guide us to the straight path",
          "D. You alone we worship and seek help from"
        ],
        answer: "A. In the name of Allah, the Most Gracious, the Most Merciful",
        difficulty: "easy",
        topics: ["basmalah", "allah_attributes", "worship"],
        explanation: "This is the Basmalah, the opening phrase that begins most chapters of the Quran, invoking Allah's mercy and compassion."
      },
      {
        prompt: "Complete the verse: بِسْمِ اللَّهِ الرَّحْمَٰنِ _______",
        choices: [
          "A. الرَّحِيمِ",
          "B. الْغَفُورِ",
          "C. الْعَزِيزِ", 
          "D. الْحَكِيمِ"
        ],
        answer: "A. الرَّحِيمِ",
        difficulty: "easy",
        topics: ["memorization", "allah_attributes"],
        explanation: "الرَّحِيمِ (Ar-Raheem) means 'The Most Merciful' and completes the Basmalah."
      }
    ]
  },
  
  // Al-Fatiha (Surah 1, Ayah 2) Questions  
  {
    surah: 1,
    ayah: 2,
    questions: [
      {
        prompt: "What does 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ' express?",
        choices: [
          "A. Praise and gratitude to Allah, Lord of all worlds",
          "B. A request for guidance",
          "C. Seeking forgiveness from Allah",
          "D. Declaring Allah's mercy"
        ],
        answer: "A. Praise and gratitude to Allah, Lord of all worlds",
        difficulty: "easy", 
        topics: ["praise", "gratitude", "allah_lordship"],
        explanation: "This verse expresses praise and acknowledgment of Allah as the Lord and Sustainer of all creation."
      },
      {
        prompt: "The word 'رَبّ' in this verse primarily means:",
        choices: [
          "A. Lord, Master, and Sustainer",
          "B. Creator only",
          "C. King and Ruler",
          "D. The Most Merciful"
        ],
        answer: "A. Lord, Master, and Sustainer",
        difficulty: "medium",
        topics: ["arabic_vocabulary", "allah_attributes"],
        explanation: "رَبّ (Rabb) encompasses the meanings of Lord, Master, Sustainer, and the One who nourishes and develops His creation."
      }
    ]
  },

  // Al-Ikhlas (Surah 112) Questions
  {
    surah: 112,
    ayah: 1,
    questions: [
      {
        prompt: "What is the central theme of Surah Al-Ikhlas?",
        choices: [
          "A. The absolute unity and uniqueness of Allah",
          "B. The importance of prayer",
          "C. Stories of previous prophets",
          "D. Rules of inheritance"
        ],
        answer: "A. The absolute unity and uniqueness of Allah",
        difficulty: "medium",
        topics: ["tawheed", "monotheism", "allah_unity"],
        explanation: "Surah Al-Ikhlas focuses entirely on the concept of Tawheed - the absolute oneness and uniqueness of Allah."
      },
      {
        prompt: "Complete the verse: قُلْ هُوَ اللَّهُ _______",
        choices: [
          "A. أَحَدٌ",
          "B. الرَّحْمَٰنُ", 
          "C. الْمَلِكُ",
          "D. السَّلَامُ"
        ],
        answer: "A. أَحَدٌ",
        difficulty: "easy",
        topics: ["memorization", "tawheed"],
        explanation: "أَحَدٌ (Ahad) means 'One' and emphasizes Allah's absolute unity and uniqueness."
      }
    ]
  },

  // An-Nas (Surah 114) Questions
  {
    surah: 114,
    ayah: 1,
    questions: [
      {
        prompt: "In 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', what does the word 'أَعُوذُ' mean?",
        choices: [
          "A. I seek refuge",
          "B. I worship",
          "C. I praise", 
          "D. I ask for forgiveness"
        ],
        answer: "A. I seek refuge",
        difficulty: "medium",
        topics: ["seeking_protection", "arabic_vocabulary"],
        explanation: "أَعُوذُ (A'udhu) means 'I seek refuge' or 'I seek protection', indicating turning to Allah for safety."
      },
      {
        prompt: "What is the main purpose of Surah An-Nas?",
        choices: [
          "A. Seeking Allah's protection from evil whispers",
          "B. Praising Allah's creation",
          "C. Describing paradise",
          "D. Teaching prayer times"
        ],
        answer: "A. Seeking Allah's protection from evil whispers", 
        difficulty: "medium",
        topics: ["seeking_protection", "evil", "shaytan"],
        explanation: "Surah An-Nas is a prayer for protection from the whispers of evil, particularly from Shaytan and those who spread corruption."
      }
    ]
  },

  // Al-Kawthar (Surah 108) Questions
  {
    surah: 108,
    ayah: 1,
    questions: [
      {
        prompt: "What does 'الْكَوْثَر' refer to?",
        choices: [
          "A. A river in Paradise given to Prophet Muhammad (PBUH)",
          "B. A mountain near Mecca",
          "C. The Kaaba in Mecca", 
          "D. The first revelation"
        ],
        answer: "A. A river in Paradise given to Prophet Muhammad (PBUH)",
        difficulty: "medium",
        topics: ["paradise", "prophet_muhammad", "divine_gifts"],
        explanation: "Al-Kawthar is described as a river in Paradise that Allah granted to Prophet Muhammad (PBUH) as a special blessing."
      },
      {
        prompt: "This surah emphasizes Allah's _______ to His Prophet:",
        choices: [
          "A. Abundant giving and blessings",
          "B. Commands and obligations",
          "C. Tests and trials",
          "D. Warnings and admonitions"
        ],
        answer: "A. Abundant giving and blessings",
        difficulty: "easy",
        topics: ["divine_gifts", "prophet_muhammad", "gratitude"],
        explanation: "The word 'Kawthar' comes from 'kathrah' meaning abundance, highlighting Allah's generous blessings to His Prophet."
      }
    ]
  }
];

async function insertSampleQuestions() {
  console.log('🚀 Inserting sample questions for testing...');
  
  let totalInserted = 0;
  let totalErrors = 0;

  for (const verseData of sampleQuestions) {
    try {
      // Get the verse ID
      const { data: verse, error: verseError } = await supabase
        .from('verses')
        .select('id')
        .eq('surah', verseData.surah)
        .eq('ayah', verseData.ayah)
        .single();

      if (verseError || !verse) {
        console.log(`❌ Verse ${verseData.surah}:${verseData.ayah} not found`);
        totalErrors++;
        continue;
      }

      // Insert questions for this verse
      for (const questionData of verseData.questions) {
        const { error: insertError } = await supabase
          .from('questions')
          .insert({
            verse_id: verse.id,
            prompt: questionData.prompt,
            choices: questionData.choices,
            answer: questionData.answer,
            difficulty: questionData.difficulty,
            topics: questionData.topics,
            explanation: questionData.explanation,
            question_type: questionData.prompt.includes('Complete the verse') ? 'fill_blank' : 'mcq',
            ai_generated: false, // These are manually created samples
            created_by: 'sample-script',
            confidence_score: 0.95,
            // Pre-approve sample questions
            approved_at: new Date().toISOString()
          });

        if (insertError) {
          console.log(`❌ Error inserting question for ${verseData.surah}:${verseData.ayah}:`, insertError.message);
          totalErrors++;
        } else {
          totalInserted++;
          console.log(`✅ Inserted question for Surah ${verseData.surah}:${verseData.ayah}`);
        }
      }

    } catch (error) {
      console.error(`❌ Error processing verse ${verseData.surah}:${verseData.ayah}:`, error);
      totalErrors++;
    }
  }

  console.log(`\n📊 Sample Questions Summary:`);
  console.log(`✅ Successfully inserted: ${totalInserted} questions`);
  console.log(`❌ Errors encountered: ${totalErrors}`);
  
  if (totalInserted > 0) {
    console.log(`\n🎯 You can now test the system with these pre-approved questions!`);
    console.log(`🔍 View them at: /api/questions/approved`);
  }
}

async function main() {
  try {
    await insertSampleQuestions();
    console.log('\n✅ Sample questions insertion completed!');
  } catch (error) {
    console.error('❌ Sample questions insertion failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}