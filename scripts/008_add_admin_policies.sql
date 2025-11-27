-- Add admin bypass policies to allow admins to access all data

-- Users table - allow admins to read and update all users
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

-- Transactions table - allow admins to read all transactions
CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can update all transactions" ON public.transactions
  FOR UPDATE USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

-- Music tasks - allow admins to create, update, delete
CREATE POLICY "Admins can create music tasks" ON public.music_tasks
  FOR INSERT WITH CHECK (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can update music tasks" ON public.music_tasks
  FOR UPDATE USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can delete music tasks" ON public.music_tasks
  FOR DELETE USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

-- Trivia questions - allow admins to create, update, delete
CREATE POLICY "Admins can create trivia questions" ON public.trivia_questions
  FOR INSERT WITH CHECK (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can update trivia questions" ON public.trivia_questions
  FOR UPDATE USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can delete trivia questions" ON public.trivia_questions
  FOR DELETE USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

-- Activation packages - allow admins to create, update, delete
CREATE POLICY "Admins can create packages" ON public.activation_packages
  FOR INSERT WITH CHECK (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can update packages" ON public.activation_packages
  FOR UPDATE USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can delete packages" ON public.activation_packages
  FOR DELETE USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

-- Referrals table - allow admins to read all referrals
CREATE POLICY "Admins can view all referrals" ON public.referrals
  FOR SELECT USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

-- User task completions - allow admins to read all
CREATE POLICY "Admins can view all task completions" ON public.user_task_completions
  FOR SELECT USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );
