-- Add deposited_balance column to track funds from deposits only
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deposited_balance DECIMAL(10, 2) DEFAULT 0;

-- Update app_settings table to support more features
INSERT INTO app_settings (key, value) VALUES
  ('min_deposit', '100'),
  ('max_deposit', '100000'),
  ('min_withdrawal', '500'),
  ('max_withdrawal', '50000'),
  ('activation_required_deposit', 'true')
ON CONFLICT (key) DO NOTHING;
