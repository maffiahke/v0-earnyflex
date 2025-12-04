-- Add fund_password and phone columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS fund_password TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
