-- Add package_id to users table to track active package
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS active_package_id UUID REFERENCES public.activation_packages(id);

-- Add package_id to music_tasks table for package-specific tasks
ALTER TABLE public.music_tasks ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.activation_packages(id);

-- Add package_id to trivia_questions table for package-specific tasks  
ALTER TABLE public.trivia_questions ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.activation_packages(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_active_package ON public.users(active_package_id);
CREATE INDEX IF NOT EXISTS idx_music_tasks_package ON public.music_tasks(package_id);
CREATE INDEX IF NOT EXISTS idx_trivia_questions_package ON public.trivia_questions(package_id);

COMMENT ON COLUMN public.users.active_package_id IS 'References the activation package the user currently has active';
COMMENT ON COLUMN public.music_tasks.package_id IS 'If set, only users with this package can access this task. NULL means available to all.';
COMMENT ON COLUMN public.trivia_questions.package_id IS 'If set, only users with this package can access this question. NULL means available to all.';
