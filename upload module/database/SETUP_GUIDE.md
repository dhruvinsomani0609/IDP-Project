# Supabase Database Setup Guide

## Step 1: Create the Documents Table in Supabase

### Option A: Using Supabase Dashboard (Recommended for Beginners)

1. **Go to Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste the Schema**
   - Open the file: `database/schema.sql`
   - Copy the entire content
   - Paste it into the SQL Editor
   - Click "Run" button

4. **Verify Table Creation**
   - Go to "Table Editor" in the left sidebar
   - You should see a new table called "documents"

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

---

## Step 2: Create Storage Bucket

### Using Supabase Dashboard:

1. **Navigate to Storage**
   - Click on "Storage" in the left sidebar
   - Click "Create a new bucket"

2. **Configure Bucket**
   - **Name**: `documents`
   - **Public bucket**: ❌ Uncheck (keep it private)
   - **File size limit**: 10 MB (or your preferred limit)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png`
     - `image/webp`
     - `application/pdf`

3. **Click "Create bucket"**

---

## Step 3: Verify Row Level Security (RLS)

The schema automatically sets up RLS policies. Verify they're working:

1. **Go to Authentication > Policies**
2. You should see policies for the `documents` table:
   - ✅ Users can view own documents
   - ✅ Users can insert own documents
   - ✅ Users can update own documents
   - ✅ Users can delete own documents

---

## Step 4: Test the Database

### Test Query 1: Check Table Structure

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;
```

### Test Query 2: Check Indexes

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'documents';
```

### Test Query 3: Check RLS Policies

```sql
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'documents';
```

---

## Database Schema Overview

### Documents Table Structure

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `user_id` | UUID | References auth.users (who uploaded) |
| `file_name` | VARCHAR(255) | Name of the file |
| `file_size` | BIGINT | Size in bytes |
| `file_type` | VARCHAR(100) | MIME type (e.g., 'image/jpeg') |
| `file_extension` | VARCHAR(10) | File extension (e.g., '.pdf') |
| `storage_path` | TEXT | Path in Supabase Storage |
| `storage_bucket` | VARCHAR(100) | Bucket name (default: 'documents') |
| `file_url` | TEXT | Public/signed URL |
| `file_hash` | VARCHAR(64) | SHA-256 hash for duplicates |
| `is_duplicate` | BOOLEAN | Is this a duplicate? |
| `duplicate_of` | UUID | References original document |
| `original_file_name` | VARCHAR(255) | Name before renaming |
| `batch_id` | UUID | Groups files uploaded together |
| `upload_session_id` | UUID | Tracks upload sessions |
| `upload_status` | VARCHAR(50) | pending/uploading/completed/failed |
| `processing_status` | VARCHAR(50) | pending/processing/completed/failed |
| `error_message` | TEXT | Error details if failed |
| `created_at` | TIMESTAMP | When record was created |
| `updated_at` | TIMESTAMP | Last update time (auto-updated) |
| `uploaded_at` | TIMESTAMP | When file was uploaded |
| `deleted_at` | TIMESTAMP | Soft delete timestamp |
| `is_deleted` | BOOLEAN | Soft delete flag |

---

## Security Features

### Row Level Security (RLS)

- ✅ **Enabled by default**
- ✅ Users can only see their own documents
- ✅ Users can only upload to their own folder
- ✅ Users can only modify/delete their own files

### Storage Security

- ✅ **Private bucket** - Files are not publicly accessible
- ✅ **User-based folders** - Files stored in `user-id/batch-id/filename`
- ✅ **Signed URLs** - Temporary access to files
- ✅ **File type validation** - Only allowed MIME types

---

## Helper Functions

### 1. Get User Documents

```sql
-- Get all documents for current user
SELECT * FROM public.get_user_documents(
    auth.uid(),  -- user_id
    NULL,        -- batch_id (NULL = all batches)
    50,          -- limit
    0            -- offset
);
```

### 2. Check for Duplicates

```sql
-- Check if file already exists
SELECT * FROM public.check_duplicate_file(
    auth.uid(),                           -- user_id
    'abc123...',                          -- file_hash
    'document.pdf',                       -- file_name
    1024000                               -- file_size
);
```

---

## Next Steps

After setting up the database:

1. ✅ Verify table creation
2. ✅ Create storage bucket
3. ✅ Test RLS policies
4. ➡️ **Proceed to backend integration** (see `BACKEND_INTEGRATION.md`)

---

## Troubleshooting

### Issue: "permission denied for table documents"
**Solution**: Make sure RLS policies are created and you're authenticated

### Issue: "bucket not found"
**Solution**: Create the storage bucket in Supabase Dashboard > Storage

### Issue: "function does not exist"
**Solution**: Re-run the schema.sql file to create helper functions

---

## Important Notes

⚠️ **Security**:
- Never expose your `service_role` key in frontend code
- Always use `anon` key in frontend
- Use RLS policies to protect user data

⚠️ **Storage**:
- Files are stored in: `documents/user-id/batch-id/filename`
- Use signed URLs for temporary access
- Set appropriate file size limits

⚠️ **Performance**:
- Indexes are created for common queries
- Use pagination for large datasets
- Consider archiving old documents
