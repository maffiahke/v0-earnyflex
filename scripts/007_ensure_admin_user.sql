-- First, make sure the admin user exists in auth.users by updating existing user
-- If admin@earnify.com doesn't exist, this script helps verify the setup

-- Ensure the admin user in the users table has is_admin = true
UPDATE public.users
SET is_admin = true
WHERE email = 'admin@earnify.com';

-- If no rows were updated, the user doesn't exist in public.users yet
-- This is expected - the user will be created during registration/signup
-- When admin@earnify.com signs up or is created, you must manually set is_admin = true
