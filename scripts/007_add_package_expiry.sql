-- Add package expiry tracking to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS package_activated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS package_expiry_date TIMESTAMPTZ;

-- Add duration_days to packages table
ALTER TABLE activation_packages 
ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 30;

-- Update Starter Package to 21 days, others to 30 days
UPDATE activation_packages 
SET duration_days = 21 
WHERE name = 'Starter Package';

UPDATE activation_packages 
SET duration_days = 30 
WHERE name IN ('Premium Package', 'VIP Package');

-- Create function to check if package is expired
CREATE OR REPLACE FUNCTION is_package_expired(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  expiry_date TIMESTAMPTZ;
BEGIN
  SELECT package_expiry_date INTO expiry_date
  FROM users
  WHERE id = user_id;
  
  IF expiry_date IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN expiry_date < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
