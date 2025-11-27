-- Drop the old recursive policies that check is_admin from users table
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can update all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can create music tasks" ON public.music_tasks;
DROP POLICY IF EXISTS "Admins can update music tasks" ON public.music_tasks;
DROP POLICY IF EXISTS "Admins can delete music tasks" ON public.music_tasks;
DROP POLICY IF EXISTS "Admins can create trivia questions" ON public.trivia_questions;
DROP POLICY IF EXISTS "Admins can update trivia questions" ON public.trivia_questions;
DROP POLICY IF EXISTS "Admins can delete trivia questions" ON public.trivia_questions;
DROP POLICY IF EXISTS "Admins can create packages" ON public.activation_packages;
DROP POLICY IF EXISTS "Admins can update packages" ON public.activation_packages;
DROP POLICY IF EXISTS "Admins can delete packages" ON public.activation_packages;
DROP POLICY IF EXISTS "Admins can view all referrals" ON public.referrals;
DROP POLICY IF EXISTS "Admins can view all task completions" ON public.user_task_completions;

-- Create non-recursive admin policies using email-based checks
-- Users table policies
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'admin@earnify.com'
  );

CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    auth.jwt() ->> 'email' = 'admin@earnify.com'
  );

CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE USING (
    auth.jwt() ->> 'email' = 'admin@earnify.com'
  );

-- Transactions table policies
CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'admin@earnify.com'
  );

CREATE POLICY "Admins can update all transactions" ON public.transactions
  FOR UPDATE USING (
    auth.jwt() ->> 'email' = 'admin@earnify.com'
  );

-- Music tasks policies
CREATE POLICY "Admins can create music tasks" ON public.music_tasks
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' = 'admin@earnify.com'
  );

CREATE POLICY "Admins can update music tasks" ON public.music_tasks
  FOR UPDATE USING (
    auth.jwt() ->> 'email' = 'admin@earnify.com'
  );

CREATE POLICY "Admins can delete music tasks" ON public.music_tasks
  FOR DELETE USING (
    auth.jwt() ->> 'email' = 'admin@earnify.com'
  );

-- Trivia questions policies
CREATE POLICY "Admins can create trivia questions" ON public.trivia_questions
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' = 'admin@earnify.com'
  );

CREATE POLICY "Admins can update trivia questions" ON public.trivia_questions
  FOR UPDATE USING (
    auth.jwt() ->> 'email' = 'admin@earnify.com'
  );

CREATE POLICY "Admins can delete trivia questions" ON public.trivia_questions
  FOR DELETE USING (
    auth.jwt() ->> 'email' = 'admin@earnify.com'
  );

-- Activation packages policies
CREATE POLICY "Admins can create packages" ON public.activation_packages
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' = 'admin@earnify.com'
  );

CREATE POLICY "Admins can update packages" ON public.activation_packages
  FOR UPDATE USING (
    auth.jwt() ->> 'email' = 'admin@earnify.com'
  );

CREATE POLICY "Admins can delete packages" ON public.activation_packages
  FOR DELETE USING (
    auth.jwt() ->> 'email' = 'admin@earnify.com'
  );

-- Referrals table policies
CREATE POLICY "Admins can view all referrals" ON public.referrals
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'admin@earnify.com'
  );

-- User task completions policies
CREATE POLICY "Admins can view all task completions" ON public.user_task_completions
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'admin@earnify.com'
  );
