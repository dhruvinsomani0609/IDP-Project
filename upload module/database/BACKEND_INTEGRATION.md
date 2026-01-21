# Backend Integration Guide

## Overview

This guide shows you how to integrate the Supabase database with your document upload module.

---

## Step 1: Database Setup (Complete This First!)

Before proceeding, make sure you've completed the database setup:

1. ✅ Run the SQL schema (`database/schema.sql`) in Supabase
2. ✅ Create the storage bucket named `documents`
3. ✅ Verify RLS policies are active
4. ✅ Test the database with sample queries

See `database/SETUP_GUIDE.md` for detailed instructions.

---

## Step 2: Update Supabase Client

Make sure your Supabase client is properly configured:

### File: `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

---

## Step 3: Update DocumentUpload Component

Now integrate the DocumentService into your upload component:

### File: `src/components/DocumentUpload.tsx`

Add these imports at the top:

```typescript
import { DocumentService } from '../services/documentService';
import { useAuth } from '../contexts/AuthContext';
```

Update the `handleUpload` function:

```typescript
// Replace the existing handleUpload function with this:
const handleUpload = useCallback(async () => {
    if (files.length === 0) return;
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setErrorMessage('You must be logged in to upload files');
        return;
    }

    setUploadState('uploading');
    setErrorMessage(null);

    try {
        // Upload all files in batch
        const result = await DocumentService.uploadBatch(files, user.id);

        if (result.failedCount > 0) {
            // Some files failed
            const errorMessages = result.errors
                .map(e => `${e.fileName}: ${e.error}`)
                .join('\n');
            setErrorMessage(`${result.failedCount} file(s) failed to upload:\n${errorMessages}`);
        }

        if (result.successCount > 0) {
            // Some or all files succeeded
            setUploadState('success');
            
            // Clear files after successful upload
            setTimeout(() => {
                setFiles([]);
                setUploadState('idle');
            }, 2000);
        } else {
            // All files failed
            setUploadState('idle');
        }
    } catch (error) {
        console.error('Upload error:', error);
        setErrorMessage('An unexpected error occurred during upload');
        setUploadState('idle');
    }
}, [files]);
```

---

## Step 4: Add Upload Progress (Optional but Recommended)

For better UX, add upload progress tracking:

### Add state for progress:

```typescript
const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    fileName: string;
}>({ current: 0, total: 0, fileName: '' });
```

### Update handleUpload with progress:

```typescript
const handleUpload = useCallback(async () => {
    if (files.length === 0) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setErrorMessage('You must be logged in to upload files');
        return;
    }

    setUploadState('uploading');
    setErrorMessage(null);

    try {
        const batchId = crypto.randomUUID();
        const results = [];
        const errors = [];

        // Upload files one by one with progress
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Update progress
            setUploadProgress({
                current: i + 1,
                total: files.length,
                fileName: file.name,
            });

            const result = await DocumentService.uploadSingleFile(
                file,
                user.id,
                batchId
            );

            if (result.success) {
                results.push(result.document);
            } else {
                errors.push({
                    fileName: file.name,
                    error: result.error || 'Unknown error',
                });
            }
        }

        // Handle results
        if (errors.length > 0) {
            const errorMessages = errors
                .map(e => `${e.fileName}: ${e.error}`)
                .join('\n');
            setErrorMessage(`${errors.length} file(s) failed:\n${errorMessages}`);
        }

        if (results.length > 0) {
            setUploadState('success');
            setTimeout(() => {
                setFiles([]);
                setUploadState('idle');
                setUploadProgress({ current: 0, total: 0, fileName: '' });
            }, 2000);
        } else {
            setUploadState('idle');
        }
    } catch (error) {
        console.error('Upload error:', error);
        setErrorMessage('An unexpected error occurred');
        setUploadState('idle');
    }
}, [files]);
```

### Add progress display in JSX:

```typescript
{/* Upload Progress */}
{uploadState === 'uploading' && uploadProgress.total > 0 && (
    <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
    >
        <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-800">
                Uploading {uploadProgress.current} of {uploadProgress.total}
            </p>
            <p className="text-xs text-blue-600">
                {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
            </p>
        </div>
        <p className="text-xs text-blue-600 truncate">
            {uploadProgress.fileName}
        </p>
        <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                    width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                }}
            />
        </div>
    </motion.div>
)}
```

---

## Step 5: View Uploaded Documents

Create a component to display uploaded documents:

### File: `src/components/DocumentList.tsx`

```typescript
import { useEffect, useState } from 'react';
import { DocumentService } from '../services/documentService';
import { useAuth } from '../contexts/AuthContext';
import type { Document } from '../types/database.types';
import { formatFileSize } from '../utils/utils';
import { FileText, Download, Trash2 } from 'lucide-react';

export const DocumentList: React.FC = () => {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadDocuments();
        }
    }, [user]);

    const loadDocuments = async () => {
        if (!user) return;
        
        setLoading(true);
        const docs = await DocumentService.getUserDocuments(user.id);
        setDocuments(docs);
        setLoading(false);
    };

    const handleDelete = async (documentId: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        
        const success = await DocumentService.deleteDocument(documentId);
        if (success) {
            setDocuments(docs => docs.filter(d => d.id !== documentId));
        }
    };

    const handleDownload = async (doc: Document) => {
        if (doc.file_url) {
            window.open(doc.file_url, '_blank');
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading documents...</div>;
    }

    if (documents.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500">
                No documents uploaded yet.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">
                Your Documents ({documents.length})
            </h2>
            
            <div className="grid gap-4">
                {documents.map((doc) => (
                    <div
                        key={doc.id}
                        className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <FileText className="w-10 h-10 text-indigo-600 flex-shrink-0" />
                            
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 truncate">
                                    {doc.file_name}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {formatFileSize(doc.file_size)} • {' '}
                                    {new Date(doc.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleDownload(doc)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Download"
                            >
                                <Download className="w-5 h-5 text-slate-600" />
                            </button>
                            
                            <button
                                onClick={() => handleDelete(doc.id)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
```

---

## Step 6: Test the Integration

### Test Checklist:

1. **Upload Test**:
   - ✅ Upload a single file
   - ✅ Upload multiple files
   - ✅ Check Supabase Storage for uploaded files
   - ✅ Check documents table for records

2. **Duplicate Test**:
   - ✅ Upload the same file twice
   - ✅ Verify duplicate detection works
   - ✅ Test replace/reject/keep both options

3. **View Test**:
   - ✅ Verify uploaded documents appear in list
   - ✅ Test download functionality
   - ✅ Test delete functionality

4. **Security Test**:
   - ✅ Verify users can only see their own files
   - ✅ Test with different user accounts
   - ✅ Verify RLS policies are working

---

## Common Issues & Solutions

### Issue: "Failed to upload file to storage"

**Possible Causes**:
- Storage bucket doesn't exist
- Storage policies not configured
- File size exceeds limit

**Solution**:
1. Verify bucket exists in Supabase Dashboard > Storage
2. Check storage policies are created (see schema.sql)
3. Check file size limits in bucket settings

### Issue: "Permission denied for table documents"

**Possible Causes**:
- RLS policies not created
- User not authenticated
- Policy conditions not met

**Solution**:
1. Re-run schema.sql to create RLS policies
2. Verify user is logged in
3. Check policy conditions match your use case

### Issue: "Cannot read properties of null (reading 'id')"

**Possible Causes**:
- User not authenticated
- Auth context not available

**Solution**:
1. Wrap component in AuthProvider
2. Check user is logged in before uploading
3. Add proper error handling

---

## Next Steps

After integration:

1. ✅ Test all upload scenarios
2. ✅ Add error handling and user feedback
3. ✅ Implement document list view
4. ✅ Add download functionality
5. ✅ Test with multiple users
6. ➡️ **Deploy to production**

---

## Production Checklist

Before deploying:

- [ ] Environment variables are set correctly
- [ ] RLS policies are enabled and tested
- [ ] Storage bucket is configured properly
- [ ] File size limits are appropriate
- [ ] Error handling is comprehensive
- [ ] User feedback is clear
- [ ] Security is verified
- [ ] Performance is acceptable

---

## Support

If you encounter issues:

1. Check Supabase logs in Dashboard > Logs
2. Check browser console for errors
3. Verify database schema is correct
4. Test with Supabase SQL Editor
5. Review RLS policies

Happy coding! 🚀
