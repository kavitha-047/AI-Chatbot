-- Database Schema for AI ChatBot

-- 1. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT,
    user_id UUID -- Optional: Link to auth.users if auth is used
);

-- 2. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('user', 'bot', 'system')) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB -- For storing extra info like model name, tokens, etc.
);

-- 3. Enable Full-Text Search on messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS fts tsvector;
CREATE INDEX IF NOT EXISTS messages_fts_idx ON public.messages USING GIN (fts);

-- 4. RLS Policies (Row Level Security)
-- Note: For simplicity in the initial setup, we'll allow public access if needed,
-- but it's better to secure it with auth.
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now (WARNING: Change this for production)
CREATE POLICY "Public Read Conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Public Insert Conversations" ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Public Insert Messages" ON public.messages FOR INSERT WITH CHECK (true);
