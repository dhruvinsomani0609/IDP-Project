import { supabase } from '../lib/supabase';
import type {
    Document,
    DocumentInsert,
    DocumentUpdate,
    UploadResult,
    BatchUploadResult
} from '../types/database.types';
import { generateFileHash } from '../utils/utils';

/**
 * Document Service - Handles all database operations for documents
 */
export class DocumentService {
    private static STORAGE_BUCKET = 'documents';

    /**
     * Generate a unique storage path for a file
     */
    private static generateStoragePath(userId: string, batchId: string, fileName: string): string {
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        return `${userId}/${batchId}/${timestamp}-${sanitizedFileName}`;
    }

    /**
     * Upload a single file to Supabase Storage
     */
    static async uploadFileToStorage(
        file: File,
        userId: string,
        batchId: string
    ): Promise<{ path: string; url: string } | null> {
        try {
            const storagePath = this.generateStoragePath(userId, batchId, file.name);

            // Upload file to storage
            const { data, error } = await supabase.storage
                .from(this.STORAGE_BUCKET)
                .upload(storagePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (error) {
                console.error('Storage upload error:', error);
                return null;
            }

            // Get public URL (or signed URL for private buckets)
            const { data: { publicUrl } } = supabase.storage
                .from(this.STORAGE_BUCKET)
                .getPublicUrl(data.path);

            return {
                path: data.path,
                url: publicUrl,
            };
        } catch (error) {
            console.error('Upload to storage failed:', error);
            return null;
        }
    }

    /**
     * Create a document record in the database
     */
    static async createDocument(documentData: DocumentInsert): Promise<UploadResult> {
        try {
            const { data, error } = await supabase
                .from('documents')
                .insert(documentData)
                .select()
                .single();

            if (error) {
                console.error('Database insert error:', error);
                return {
                    success: false,
                    error: error.message,
                };
            }

            return {
                success: true,
                document: data,
            };
        } catch (error) {
            console.error('Create document failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Upload a single file (storage + database)
     */
    static async uploadSingleFile(
        file: File,
        userId: string,
        batchId: string,
        fileHash?: string
    ): Promise<UploadResult> {
        try {
            // 1. Upload to storage
            const storageResult = await this.uploadFileToStorage(file, userId, batchId);
            if (!storageResult) {
                return {
                    success: false,
                    error: 'Failed to upload file to storage',
                };
            }

            // 2. Generate file hash if not provided
            const hash = fileHash || await generateFileHash(file);

            // 3. Get file extension
            const extension = file.name.substring(file.name.lastIndexOf('.'));

            // 4. Create document record
            const documentData: DocumentInsert = {
                user_id: userId,
                file_name: file.name,
                file_size: file.size,
                file_type: file.type,
                file_extension: extension,
                storage_path: storageResult.path,
                storage_bucket: this.STORAGE_BUCKET,
                file_url: storageResult.url,
                file_hash: hash,
                batch_id: batchId,
                upload_status: 'completed',
                uploaded_at: new Date().toISOString(),
            };

            return await this.createDocument(documentData);
        } catch (error) {
            console.error('Upload single file failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Upload multiple files in a batch
     */
    static async uploadBatch(
        files: File[],
        userId: string
    ): Promise<BatchUploadResult> {
        const batchId = crypto.randomUUID();
        const results: UploadResult[] = [];
        const errors: Array<{ fileName: string; error: string }> = [];

        // Upload files sequentially to avoid overwhelming the server
        for (const file of files) {
            const result = await this.uploadSingleFile(file, userId, batchId);
            results.push(result);

            if (!result.success) {
                errors.push({
                    fileName: file.name,
                    error: result.error || 'Unknown error',
                });
            }
        }

        const successfulUploads = results.filter(r => r.success && r.document);
        const documents = successfulUploads.map(r => r.document!);

        return {
            batchId,
            totalFiles: files.length,
            successCount: successfulUploads.length,
            failedCount: errors.length,
            documents,
            errors,
        };
    }

    /**
     * Get all documents for a user
     */
    static async getUserDocuments(
        userId: string,
        batchId?: string,
        limit: number = 50,
        offset: number = 0
    ): Promise<Document[]> {
        try {
            let query = supabase
                .from('documents')
                .select('*')
                .eq('user_id', userId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (batchId) {
                query = query.eq('batch_id', batchId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Get user documents error:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Get user documents failed:', error);
            return [];
        }
    }

    /**
     * Check if a file is a duplicate
     */
    static async checkDuplicate(
        userId: string,
        fileHash: string,
        fileName: string,
        fileSize: number
    ): Promise<Document | null> {
        try {
            const { data, error } = await supabase
                .rpc('check_duplicate_file', {
                    p_user_id: userId,
                    p_file_hash: fileHash,
                    p_file_name: fileName,
                    p_file_size: fileSize,
                });

            if (error) {
                console.error('Check duplicate error:', error);
                return null;
            }

            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('Check duplicate failed:', error);
            return null;
        }
    }

    /**
     * Update document status
     */
    static async updateDocumentStatus(
        documentId: string,
        uploadStatus?: 'pending' | 'uploading' | 'completed' | 'failed',
        processingStatus?: 'pending' | 'processing' | 'completed' | 'failed',
        errorMessage?: string
    ): Promise<boolean> {
        try {
            const updateData: DocumentUpdate = {};

            if (uploadStatus) updateData.upload_status = uploadStatus;
            if (processingStatus) updateData.processing_status = processingStatus;
            if (errorMessage) updateData.error_message = errorMessage;

            const { error } = await supabase
                .from('documents')
                .update(updateData)
                .eq('id', documentId);

            if (error) {
                console.error('Update document status error:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Update document status failed:', error);
            return false;
        }
    }

    /**
     * Soft delete a document
     */
    static async deleteDocument(documentId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('documents')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                })
                .eq('id', documentId);

            if (error) {
                console.error('Delete document error:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Delete document failed:', error);
            return false;
        }
    }

    /**
     * Delete file from storage and database
     */
    static async deleteDocumentCompletely(documentId: string): Promise<boolean> {
        try {
            // 1. Get document to find storage path
            const { data: document, error: fetchError } = await supabase
                .from('documents')
                .select('storage_path')
                .eq('id', documentId)
                .single();

            if (fetchError || !document) {
                console.error('Fetch document error:', fetchError);
                return false;
            }

            // 2. Delete from storage
            const { error: storageError } = await supabase.storage
                .from(this.STORAGE_BUCKET)
                .remove([document.storage_path]);

            if (storageError) {
                console.error('Delete from storage error:', storageError);
                // Continue to delete from database even if storage delete fails
            }

            // 3. Delete from database
            const { error: dbError } = await supabase
                .from('documents')
                .delete()
                .eq('id', documentId);

            if (dbError) {
                console.error('Delete from database error:', dbError);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Delete document completely failed:', error);
            return false;
        }
    }

    /**
     * Get document by ID
     */
    static async getDocumentById(documentId: string): Promise<Document | null> {
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('id', documentId)
                .single();

            if (error) {
                console.error('Get document by ID error:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Get document by ID failed:', error);
            return null;
        }
    }

    /**
     * Get signed URL for private file access
     */
    static async getSignedUrl(storagePath: string, expiresIn: number = 3600): Promise<string | null> {
        try {
            const { data, error } = await supabase.storage
                .from(this.STORAGE_BUCKET)
                .createSignedUrl(storagePath, expiresIn);

            if (error) {
                console.error('Get signed URL error:', error);
                return null;
            }

            return data.signedUrl;
        } catch (error) {
            console.error('Get signed URL failed:', error);
            return null;
        }
    }
}
