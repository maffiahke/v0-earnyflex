-- Insert default app settings
INSERT INTO public.app_settings (key, value) VALUES
  ('app_name', '"Earnify"'),
  ('currency_symbol', '"KSh"'),
  ('referral_bonus', '100'),
  ('welcome_bonus', '50'),
  ('daily_checkin_reward', '10'),
  ('min_withdrawal', '500'),
  ('max_withdrawal', '50000'),
  ('min_deposit', '100'),
  ('max_deposit', '100000'),
  ('mpesa_details', '{"number": "0712345678", "name": "Earnify Payments"}'),
  ('bank_details', '{"name": "Earnify Ltd", "account": "1234567890", "bank": "KCB Bank"}'),
  ('social_proof_names', '["John Mwangi", "Mary Achieng", "David Kamau", "Grace Wanjiru", "Peter Ochieng", "Jane Njeri", "Samuel Kipchoge", "Lucy Wairimu"]'),
  ('social_proof_counties', '["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Kakamega", "Nyeri"]'),
  ('social_proof_messages', '["just earned", "completed a task worth", "withdrew", "joined Earnify and got"]')
ON CONFLICT (key) DO NOTHING;

-- Insert default activation packages
INSERT INTO public.activation_packages (name, price, description, benefits) VALUES
  ('Starter Package', 500, 'Perfect for beginners', '["Unlock withdrawals", "Daily bonus tasks", "Priority support"]'),
  ('Premium Package', 1000, 'Best value for money', '["Unlock withdrawals", "Daily bonus tasks", "Priority support", "2x referral bonus", "Exclusive tasks"]'),
  ('VIP Package', 2500, 'Maximum earning potential', '["Unlock withdrawals", "Daily bonus tasks", "Priority support", "3x referral bonus", "Exclusive tasks", "Weekly cashback"]')
ON CONFLICT DO NOTHING;

-- Insert sample music tasks
INSERT INTO public.music_tasks (title, artist, duration, reward, audio_url) VALUES
  ('Afrobeat Vibes', 'Burna Boy', 180, 50, 'https://example.com/audio1.mp3'),
  ('Gengetone Mix', 'Sailors', 150, 40, 'https://example.com/audio2.mp3'),
  ('Bongo Flava', 'Diamond Platnumz', 200, 55, 'https://example.com/audio3.mp3'),
  ('Amapiano Session', 'Kabza De Small', 240, 75, 'https://example.com/audio4.mp3')
ON CONFLICT DO NOTHING;

-- Insert sample trivia questions
INSERT INTO public.trivia_questions (question, options, correct_answer, reward) VALUES
  ('What is the capital city of Kenya?', '["Nairobi", "Mombasa", "Kisumu", "Nakuru"]', 0, 30),
  ('Who is known as the father of the Kenyan nation?', '["Jomo Kenyatta", "Daniel Moi", "Mwai Kibaki", "Uhuru Kenyatta"]', 0, 30),
  ('Which is the largest lake in Kenya?', '["Lake Victoria", "Lake Turkana", "Lake Naivasha", "Lake Nakuru"]', 0, 30),
  ('What is the currency of Kenya?', '["Kenyan Shilling", "Kenyan Dollar", "Kenyan Pound", "Kenyan Rand"]', 0, 30),
  ('In which year did Kenya gain independence?', '["1963", "1960", "1965", "1970"]', 0, 30)
ON CONFLICT DO NOTHING;

-- Create default admin user (will be created on first admin signup)
-- Admin credentials: admin@earnify.com / admin123
