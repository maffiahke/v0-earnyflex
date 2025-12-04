-- Disable email confirmation requirement for Supabase Auth
-- This allows users to login immediately after registration without verifying email

-- Note: This must be configured in Supabase Dashboard under Authentication > Settings
-- Set "Enable email confirmations" to OFF

-- For reference, this is what needs to be done in the Supabase Dashboard:
-- 1. Go to Authentication > Settings
-- 2. Find "Email Auth" section
-- 3. Toggle OFF "Enable email confirmations"
-- 4. Save changes

-- This SQL file serves as documentation
-- The actual configuration must be done through the Supabase Dashboard
SELECT 'Email confirmation should be disabled in Supabase Dashboard' as note;
