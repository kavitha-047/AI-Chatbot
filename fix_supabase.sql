-- 1. Ensure 'conversations' table has 'title' column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='title') THEN
        ALTER TABLE public.conversations ADD COLUMN title TEXT;
    END IF;
END $$;

-- 2. Ensure 'messages' table has 'conversation_id' column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='conversation_id') THEN
        ALTER TABLE public.messages ADD COLUMN conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Enable RLS and Add Public Policies (to ensure access)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Conversations" ON public.conversations;
CREATE POLICY "Public Read Conversations" ON public.conversations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Conversations" ON public.conversations;
CREATE POLICY "Public Insert Conversations" ON public.conversations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Messages" ON public.messages;
CREATE POLICY "Public Read Messages" ON public.messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Messages" ON public.messages;
CREATE POLICY "Public Insert Messages" ON public.messages FOR INSERT WITH CHECK (true);

-- 4. Force Schema Cache Reload (PostgREST)
-- Adding and immediately dropping a dummy column is a trick to force PostgREST to reload the schema cache
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS _temp_reload_cache BOOLEAN;
ALTER TABLE public.conversations DROP COLUMN IF EXISTS _temp_reload_cache;
