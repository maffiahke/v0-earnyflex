-- Insert default admin user with is_admin flag
INSERT INTO public.users (id, email, name, is_admin, balance, wallet_balance, activation_status, referral_code, referrer_id)
VALUES (
  gen_random_uuid(),
  'admin@earnify.com',
  'Admin',
  true,
  0,
  0,
  true,
  'ADMIN001',
  NULL
)
ON CONFLICT (email) DO UPDATE SET is_admin = true;
