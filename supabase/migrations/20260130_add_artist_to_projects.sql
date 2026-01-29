-- Add artist column to projects table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'artist') THEN
        ALTER TABLE public.projects ADD COLUMN artist text;
    END IF;
END $$;
