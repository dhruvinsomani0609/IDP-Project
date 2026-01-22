-- ============================================
-- SUPABASE DATABASE SCHEMA FOR DOCUMENT UPLOAD MODULE
-- ============================================

-- 1. Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User information (links to Supabase auth.users)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- File metadata
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL, -- Size in bytes
    file_type VARCHAR(100) NOT NULL, -- MIME type (e.g., 'image/jpeg', 'application/pdf')
    file_extension VARCHAR(10), -- e.g., '.jpg', '.pdf'
    
    -- Storage information
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    storage_bucket VARCHAR(100) DEFAULT 'documents', -- Storage bucket name
    file_url TEXT, -- Public URL if file is public
    
    -- Duplicate detection
    file_hash VARCHAR(64), -- SHA-256 hash for duplicate detection
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_of UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    original_file_name VARCHAR(255), -- Original name before renaming
    
    -- Upload batch information
    batch_id UUID, -- Group files uploaded together
    upload_session_id UUID, -- Track upload sessions
    
    -- Document processing status
    upload_status VARCHAR(50) DEFAULT 'pending', -- pending, uploading, completed, failed
    processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT, -- Store error details if upload/processing fails
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_at TIMESTAMP WITH TIME ZONE,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 2. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_batch_id ON public.documents(batch_id);
CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON public.documents(file_hash);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_upload_status ON public.documents(upload_status);
CREATE INDEX IF NOT EXISTS idx_documents_is_deleted ON public.documents(is_deleted) WHERE is_deleted = FALSE;

-- 3. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies

-- Policy: Users can view their own documents
CREATE POLICY "Users can view own documents"
    ON public.documents
    FOR SELECT
    USING (auth.uid() = user_id AND is_deleted = FALSE);

-- Policy: Users can insert their own documents
CREATE POLICY "Users can insert own documents"
    ON public.documents
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own documents
CREATE POLICY "Users can update own documents"
    ON public.documents
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own documents (soft delete)
CREATE POLICY "Users can delete own documents"
    ON public.documents
    FOR DELETE
    USING (auth.uid() = user_id);


-- 8. Create storage policies for the documents bucket
-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload own documents"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Users can view their own documents
CREATE POLICY "Users can view own documents"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Users can update their own documents
CREATE POLICY "Users can update own documents"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete own documents"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 9. Create helper function to get user's documents
CREATE OR REPLACE FUNCTION public.get_user_documents(
    p_user_id UUID DEFAULT NULL,
    p_batch_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    file_name VARCHAR,
    file_size BIGINT,
    file_type VARCHAR,
    file_url TEXT,
    upload_status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.file_name,
        d.file_size,
        d.file_type,
        d.file_url,
        d.upload_status,
        d.created_at
    FROM public.documents d
    WHERE 
        d.is_deleted = FALSE
        AND (p_user_id IS NULL OR d.user_id = p_user_id)
        AND (p_batch_id IS NULL OR d.batch_id = p_batch_id)
    ORDER BY d.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to check for duplicate files
CREATE OR REPLACE FUNCTION public.check_duplicate_file(
    p_user_id UUID,
    p_file_hash VARCHAR,
    p_file_name VARCHAR,
    p_file_size BIGINT
)
RETURNS TABLE (
    id UUID,
    file_name VARCHAR,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE,
    is_exact_match BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.file_name,
        d.file_size,
        d.created_at,
        (d.file_hash = p_file_hash) as is_exact_match
    FROM public.documents d
    WHERE 
        d.user_id = p_user_id
        AND d.is_deleted = FALSE
        AND (
            d.file_hash = p_file_hash
            OR (d.file_name = p_file_name AND d.file_size = p_file_size)
        )
    ORDER BY d.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if table was created successfully
-- SELECT * FROM information_schema.tables WHERE table_name = 'documents';

-- Check indexes
-- SELECT * FROM pg_indexes WHERE tablename = 'documents';

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'documents';