-- Minimal seed data

-- Insert a placeholder user profile (link to an existing auth user id manually if needed)
-- insert into public.users(id, email, role) values ('00000000-0000-0000-0000-000000000000', 'demo@example.com', 'teacher');

-- Verse (public domain Arabic text; translation placeholders)
insert into public.verses (surah, ayah, arabic_text, translation_en)
values
  (1, 1, 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'In the name of Allah, the Entirely Merciful, the Especially Merciful');

-- Question (approved)
insert into public.questions (verse_id, prompt, choices, answer, difficulty, approved_at)
select v.id,
       'Which phrase begins Surah Al-Fatiha?',
       array['In the name of Allah, the Compassionate, the Merciful', 'All praise is due to Allah, Lord of the worlds', 'You alone we worship and You alone we ask for help', 'Guide us to the straight path'],
       'In the name of Allah, the Compassionate, the Merciful',
       1,
       now()
from public.verses v where v.surah = 1 and v.ayah = 1
on conflict do nothing;