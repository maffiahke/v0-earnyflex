-- Grant admin privileges to admin@earnify.com
-- This script ensures the admin user has full admin access

-- Update the users table to set is_admin = true for admin@earnify.com
UPDATE public.users 
SET is_admin = true
WHERE email = 'admin@earnify.com';

-- If admin@earnify.com doesn't exist in users table yet, create it with the corresponding auth user
-- First, check if the user exists in auth.users and add them to users table if missing
INSERT INTO public.users (id, email, name, referral_code, is_admin, wallet_balance, is_activated)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', 'Admin User'),
  'admin_' || SUBSTRING(id::TEXT, 1, 8),
  true,
  0,
  true
FROM auth.users
WHERE email = 'admin@earnify.com'
  AND id NOT IN (SELECT id FROM public.users WHERE email = 'admin@earnify.com')
ON CONFLICT (email) DO UPDATE SET is_admin = true;

-- Verify the admin user is properly set up
SELECT id, email, name, is_admin, created_at 
FROM public.users 
WHERE email = 'admin@earnify.com';
