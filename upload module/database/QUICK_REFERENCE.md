# Supabase Integration - Quick Reference

## 📋 Complete Setup Checklist

### Phase 1: Database Setup
- [ ] 1. Open Supabase Dashboard → SQL Editor
- [ ] 2. Run `database/schema.sql`
- [ ] 3. Verify table created: `documents`
- [ ] 4. Check indexes created (6 indexes)
- [ ] 5. Verify RLS policies (4 policies)
- [ ] 6. Create storage bucket: `documents` (private)
- [ ] 7. Verify storage policies (4 policies)

### Phase 2: Code Integration
- [ ] 8. Update `src/lib/supabase.ts` with Database type
- [ ] 9. Import DocumentService in DocumentUpload.tsx
- [ ] 10. Replace handleUpload function
- [ ] 11. Add upload progress UI (optional)
- [ ] 12. Test upload functionality

### Phase 3: Testing
- [ ] 13. Upload single file
- [ ] 14. Upload multiple files
- [ ] 15. Test duplicate detection
- [ ] 16. Verify files in Supabase Storage
- [ ] 17. Verify records in documents table
- [ ] 18. Test with different users

---

## 🗂️ File Structure

```
upload module/
├── database/
│   ├── schema.sql                    # Database schema
│   ├── SETUP_GUIDE.md               # Detailed setup guide
│   └── BACKEND_INTEGRATION.md       # Integration guide
├── src/
│   ├── types/
│   │   └── database.types.ts        # TypeScript types
│   ├── services/
│   │   └── documentService.ts       # Database operations
│   ├── lib/
│   │   └── supabase.ts              # Supabase client
│   └── components/
│       ├── DocumentUpload.tsx       # Upload component
│       └── DocumentList.tsx         # List component (optional)
```

---

## 🔑 Key Files Created

### 1. `database/schema.sql`
- Creates `documents` table
- Sets up indexes for performance
- Configures RLS policies
- Creates helper functions

### 2. `src/types/database.types.ts`
- TypeScript types for database
- Type-safe queries
- Auto-completion support

### 3. `src/services/documentService.ts`
- `uploadSingleFile()` - Upload one file
- `uploadBatch()` - Upload multiple files
- `getUserDocuments()` - Get user's files
- `checkDuplicate()` - Check for duplicates
- `deleteDocument()` - Delete file

---

## 🚀 Quick Start Commands

### 1. Run Database Schema
```sql
-- In Supabase Dashboard > SQL Editor
-- Copy and paste content from database/schema.sql
-- Click "Run"
```

### 2. Create Storage Bucket
```
1. Go to Supabase Dashboard > Storage
2. Click "Create a new bucket"
3. Name: documents
4. Public: ❌ (keep private)
5. Click "Create bucket"
```

### 3. Test Database
```sql
-- Verify table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'documents';

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'documents';
```

---

## 💻 Code Snippets

### Upload Files
```typescript
import { DocumentService } from '../services/documentService';

// Upload batch
const result = await DocumentService.uploadBatch(files, userId);

// Upload single file
const result = await DocumentService.uploadSingleFile(
    file, 
    userId, 
    batchId
);
```

### Get Documents
```typescript
// Get all user documents
const documents = await DocumentService.getUserDocuments(userId);

// Get documents from specific batch
const documents = await DocumentService.getUserDocuments(
    userId, 
    batchId
);
```

### Check Duplicates
```typescript
const duplicate = await DocumentService.checkDuplicate(
    userId,
    fileHash,
    fileName,
    fileSize
);
```

---

## 🔒 Security Features

### Row Level Security (RLS)
✅ Users can only see their own documents  
✅ Users can only upload to their own folder  
✅ Users can only modify their own files  
✅ Automatic user_id validation

### Storage Security
✅ Private bucket (not publicly accessible)  
✅ User-based folder structure  
✅ Signed URLs for temporary access  
✅ File type validation

---

## 📊 Database Schema Overview

### documents Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner (auth.users) |
| file_name | VARCHAR | File name |
| file_size | BIGINT | Size in bytes |
| file_type | VARCHAR | MIME type |
| storage_path | TEXT | Storage location |
| file_hash | VARCHAR | SHA-256 hash |
| batch_id | UUID | Upload batch |
| upload_status | VARCHAR | Status |
| created_at | TIMESTAMP | Created time |

---

## 🐛 Troubleshooting

### "Failed to upload to storage"
```
✓ Check bucket exists
✓ Verify storage policies
✓ Check file size limit
```

### "Permission denied"
```
✓ Run schema.sql to create RLS policies
✓ Verify user is authenticated
✓ Check auth.uid() matches user_id
```

### "Cannot find module"
```
✓ Install @supabase/supabase-js
✓ Check import paths
✓ Restart dev server
```

---

## 📝 Environment Variables

Make sure these are set in `.env`:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## ✅ Testing Checklist

- [ ] Single file upload works
- [ ] Multiple file upload works
- [ ] Files appear in Storage
- [ ] Records appear in database
- [ ] Duplicate detection works
- [ ] Download works
- [ ] Delete works
- [ ] RLS policies work
- [ ] Different users see only their files

---

## 📚 Documentation Links

- **Setup Guide**: `database/SETUP_GUIDE.md`
- **Integration Guide**: `database/BACKEND_INTEGRATION.md`
- **Schema**: `database/schema.sql`
- **Types**: `src/types/database.types.ts`
- **Service**: `src/services/documentService.ts`

---

## 🎯 Next Steps

1. ✅ Complete database setup
2. ✅ Integrate DocumentService
3. ✅ Test upload functionality
4. ➡️ Add document list view
5. ➡️ Implement download/delete
6. ➡️ Deploy to production

---

## 💡 Pro Tips

1. **Always use batch uploads** for multiple files
2. **Generate file hash** for accurate duplicate detection
3. **Use signed URLs** for private file access
4. **Implement soft delete** to allow recovery
5. **Add upload progress** for better UX
6. **Test RLS policies** with different users
7. **Monitor Supabase logs** for errors

---

## 📞 Support

Need help? Check:
1. Supabase Dashboard > Logs
2. Browser Console
3. Database > SQL Editor (test queries)
4. Storage > Policies (verify access)

Happy coding! 🚀
