-- Enable RLS on app_settings if not already enabled
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can update app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can insert app settings" ON public.app_settings;

-- Create policies that allow admins to manage app_settings
-- Allow anyone to view app settings (they are public configuration)
CREATE POLICY "Anyone can view app settings" ON public.app_settings
  FOR SELECT USING (true);

-- Allow authenticated users with admin email to insert app settings
CREATE POLICY "Admins can insert app settings" ON public.app_settings
  FOR INSERT WITH CHECK (
    auth.jwt()->>'email' = 'admin@earnify.com'
  );

-- Allow authenticated users with admin email to update app settings
CREATE POLICY "Admins can update app settings" ON public.app_settings
  FOR UPDATE USING (
    auth.jwt()->>'email' = 'admin@earnify.com'
  );

-- Allow authenticated users with admin email to delete app settings
CREATE POLICY "Admins can delete app settings" ON public.app_settings
  FOR DELETE USING (
    auth.jwt()->>'email' = 'admin@earnify.com'
  );
