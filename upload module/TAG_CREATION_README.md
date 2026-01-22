# Tag Creation Workflow - Setup Instructions

## Overview
This implementation adds a multi-step tag creation workflow that allows users to define how data should be extracted from uploaded documents.

## Database Setup

### Step 1: Run the SQL Migration

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `database/migrations/create_tags_tables.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the migration

This will create:
- `tags` table for storing tag definitions
- `tag_documents` junction table for associating tags with documents
- Indexes for optimal query performance
- Row Level Security (RLS) policies for data protection
- Automatic `updated_at` timestamp trigger

### Step 2: Verify Tables

After running the migration, verify the tables were created:

```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tags', 'tag_documents');
```

## Features Implemented

### 1. Multi-Step Tag Creation Modal

After successfully uploading documents, users are presented with a 4-step workflow:

**Step 1: Initial Prompt**
- Confirms successful upload
- Shows number of documents uploaded
- Options: Cancel or Next

**Step 2: Tag Definition**
- **Tag Name** (required): e.g., "Invoice", "Shipping Label"
- **Description** (required): Brief description of what this tag extracts
- **Industry** (optional): Dropdown with predefined industries
- Form validation before proceeding

**Step 3: Sample Document Upload**
- Drag-and-drop or browse to upload a sample document
- Supports: JPEG, PNG, WEBP, PDF (max 10MB)
- File preview after upload
- Note: UI is ready for AI schema suggestion integration

**Step 4: Success**
- Confirmation message
- Auto-closes after 2 seconds
- Returns to upload interface

### 2. Database Integration

All tag data is automatically saved to Supabase:
- Tag metadata stored in `tags` table
- Sample document uploaded to storage
- Documents associated with tag in `tag_documents` table
- User-specific data isolation via RLS policies

### 3. Cancel Functionality

Users can cancel at any step:
- Closes the modal
- Clears all form data
- Resets upload interface
- No data is saved

## File Structure

```
src/
├── components/
│   ├── TagCreationModal.tsx          # Main modal orchestrator
│   ├── TagDefinitionStep.tsx         # Tag details form
│   ├── SampleDocumentUpload.tsx      # Sample doc upload
│   └── DocumentUpload.tsx            # Updated with tag integration
├── services/
│   └── tagService.ts                 # Tag CRUD operations
├── types/
│   ├── database.types.ts             # Updated with tag types
│   └── tag.types.ts                  # Tag workflow types
database/
└── migrations/
    └── create_tags_tables.sql        # Database schema
```

## Usage Flow

1. User uploads documents via `DocumentUpload` component
2. After successful upload, `TagCreationModal` automatically appears
3. User proceeds through the 4-step workflow
4. Tag is created and associated with uploaded documents
5. Modal closes and user returns to upload interface

## Future Enhancements

### AI Schema Suggestion (Not Implemented)

The UI includes a placeholder for AI-powered schema suggestion:
- Step 3 mentions "AI will analyze your document and suggest a schema automatically"
- To implement this, you would need to:
  1. Integrate with an LLM API (Groq, OpenAI, Gemini, etc.)
  2. Send the sample document for analysis
  3. Generate a JSON schema based on document content
  4. Store schema in `tags.schema_json` field
  5. Use schema for data extraction from future documents

## Testing Checklist

- [ ] Upload documents successfully
- [ ] Tag creation modal appears after upload
- [ ] Step 1: Click "Cancel" - modal closes, files cleared
- [ ] Step 1: Click "Next" - proceeds to step 2
- [ ] Step 2: Try submitting without required fields - validation errors appear
- [ ] Step 2: Fill all fields and click "Next" - proceeds to step 3
- [ ] Step 3: Upload sample document - file preview appears
- [ ] Step 3: Click "Next" - data saves, proceeds to step 4
- [ ] Step 4: Success message appears, modal auto-closes
- [ ] Verify data in Supabase `tags` table
- [ ] Verify associations in `tag_documents` table

## Troubleshooting

### Modal doesn't appear after upload
- Check browser console for errors
- Verify user is authenticated (`useAuth` hook)
- Ensure `uploadedDocumentIds` array is populated

### Database errors when saving
- Verify SQL migration was run successfully
- Check RLS policies are enabled
- Ensure user is authenticated

### Sample document upload fails
- Check Supabase storage bucket permissions
- Verify file size is under 10MB
- Ensure file type is supported (JPEG, PNG, WEBP, PDF)

## API Reference

### TagService Methods

```typescript
// Create a new tag
TagService.createTag(userId: string, tagData: Omit<TagInsert, 'user_id'>): Promise<Tag>

// Update an existing tag
TagService.updateTag(tagId: string, updates: TagUpdate): Promise<Tag>

// Get all tags for a user
TagService.getTagsByUser(userId: string): Promise<Tag[]>

// Get a single tag by ID
TagService.getTagById(tagId: string): Promise<Tag | null>

// Delete a tag (soft delete)
TagService.deleteTag(tagId: string): Promise<void>

// Associate documents with a tag
TagService.associateDocumentsWithTag(tagId: string, documentIds: string[]): Promise<void>

// Get documents associated with a tag
TagService.getDocumentsByTag(tagId: string): Promise<any[]>

// Upload a sample document
TagService.uploadSampleDocument(file: File, userId: string, tagId?: string): Promise<string>
```
