-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Referrals table policies
CREATE POLICY "Users can view their referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id);

-- Transactions table policies
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Music tasks policies (public read)
CREATE POLICY "Anyone can view active music tasks" ON public.music_tasks
  FOR SELECT USING (is_active = TRUE);

-- Trivia questions policies (public read)
CREATE POLICY "Anyone can view active trivia questions" ON public.trivia_questions
  FOR SELECT USING (is_active = TRUE);

-- User task completions policies
CREATE POLICY "Users can view their own completions" ON public.user_task_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions" ON public.user_task_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activation packages policies (public read)
CREATE POLICY "Anyone can view active packages" ON public.activation_packages
  FOR SELECT USING (is_active = TRUE);

-- App settings policies (public read)
CREATE POLICY "Anyone can view app settings" ON public.app_settings
  FOR SELECT USING (TRUE);
