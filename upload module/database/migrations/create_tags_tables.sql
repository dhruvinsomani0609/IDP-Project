-- Tag Creation Workflow - Database Migration
-- Run this SQL in your Supabase SQL Editor

-- Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    schema_json JSONB,
    sample_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Create tag_documents junction table
CREATE TABLE IF NOT EXISTS public.tag_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    extracted_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tag_id, document_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_created_at ON public.tags(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tag_documents_tag_id ON public.tag_documents(tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_documents_document_id ON public.tag_documents(document_id);

-- Enable Row Level Security
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running the migration)
DROP POLICY IF EXISTS "Users can view their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can create their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can update their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can delete their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can view tag_documents for their tags" ON public.tag_documents;
DROP POLICY IF EXISTS "Users can create tag_documents for their tags" ON public.tag_documents;

-- Create RLS policies for tags table
CREATE POLICY "Users can view their own tags"
    ON public.tags FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
    ON public.tags FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
    ON public.tags FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
    ON public.tags FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS policies for tag_documents table
CREATE POLICY "Users can view tag_documents for their tags"
    ON public.tag_documents FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.tags
        WHERE tags.id = tag_documents.tag_id
        AND tags.user_id = auth.uid()
    ));

CREATE POLICY "Users can create tag_documents for their tags"
    ON public.tag_documents FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.tags
        WHERE tags.id = tag_documents.tag_id
        AND tags.user_id = auth.uid()
    ));

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on tags table
DROP TRIGGER IF EXISTS update_tags_updated_at ON public.tags;
CREATE TRIGGER update_tags_updated_at
    BEFORE UPDATE ON public.tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the tables were created
SELECT 'Tags table created successfully' AS status
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tags');

SELECT 'Tag_documents table created successfully' AS status
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tag_documents');
