-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_code TEXT;
  referrer_user_id UUID;
  welcome_bonus_amount DECIMAL(10, 2);
BEGIN
  -- Generate unique referral code
  ref_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  
  -- Get welcome bonus from settings
  SELECT (value::TEXT)::DECIMAL INTO welcome_bonus_amount
  FROM public.app_settings
  WHERE key = 'welcome_bonus';
  
  -- Insert user profile
  INSERT INTO public.users (
    id,
    name,
    email,
    referral_code,
    referred_by,
    wallet_balance,
    is_admin
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    ref_code,
    (NEW.raw_user_meta_data->>'referred_by')::UUID,
    welcome_bonus_amount,
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::BOOLEAN, FALSE)
  );
  
  -- If user was referred, create referral record
  IF (NEW.raw_user_meta_data->>'referred_by') IS NOT NULL THEN
    referrer_user_id := (NEW.raw_user_meta_data->>'referred_by')::UUID;
    
    INSERT INTO public.referrals (referrer_id, referred_id)
    VALUES (referrer_user_id, NEW.id);
  END IF;
  
  -- Create welcome bonus transaction
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    status,
    description
  ) VALUES (
    NEW.id,
    'bonus',
    welcome_bonus_amount,
    'completed',
    'Welcome bonus'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
