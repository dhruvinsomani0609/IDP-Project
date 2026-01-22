import { supabase } from '../lib/supabase';
import type { Tag, TagInsert, TagUpdate, TagDocumentInsert } from '../types/database.types';

export class TagService {
    /**
     * Create a new tag
     */
    static async createTag(userId: string, tagData: Omit<TagInsert, 'user_id'>): Promise<Tag> {
        const { data, error } = await supabase
            .from('tags')
            .insert({
                ...tagData,
                user_id: userId,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating tag:', error);
            throw new Error(`Failed to create tag: ${error.message}`);
        }

        return data;
    }

    /**
     * Update an existing tag
     */
    static async updateTag(tagId: string, updates: TagUpdate): Promise<Tag> {
        const { data, error } = await supabase
            .from('tags')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', tagId)
            .select()
            .single();

        if (error) {
            console.error('Error updating tag:', error);
            throw new Error(`Failed to update tag: ${error.message}`);
        }

        return data;
    }

    /**
     * Get all tags for a user
     */
    static async getTagsByUser(userId: string): Promise<Tag[]> {
        const { data, error } = await supabase
            .from('tags')
            .select('*')
            .eq('user_id', userId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tags:', error);
            throw new Error(`Failed to fetch tags: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Get a single tag by ID
     */
    static async getTagById(tagId: string): Promise<Tag | null> {
        const { data, error } = await supabase
            .from('tags')
            .select('*')
            .eq('id', tagId)
            .eq('is_deleted', false)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned
                return null;
            }
            console.error('Error fetching tag:', error);
            throw new Error(`Failed to fetch tag: ${error.message}`);
        }

        return data;
    }

    /**
     * Delete a tag (soft delete)
     */
    static async deleteTag(tagId: string): Promise<void> {
        const { error } = await supabase
            .from('tags')
            .update({
                is_deleted: true,
                updated_at: new Date().toISOString(),
            })
            .eq('id', tagId);

        if (error) {
            console.error('Error deleting tag:', error);
            throw new Error(`Failed to delete tag: ${error.message}`);
        }
    }

    /**
     * Associate documents with a tag
     */
    static async associateDocumentsWithTag(
        tagId: string,
        documentIds: string[]
    ): Promise<void> {
        const tagDocuments: TagDocumentInsert[] = documentIds.map((documentId) => ({
            tag_id: tagId,
            document_id: documentId,
        }));

        const { error } = await supabase
            .from('tag_documents')
            .insert(tagDocuments);

        if (error) {
            console.error('Error associating documents with tag:', error);
            throw new Error(`Failed to associate documents: ${error.message}`);
        }
    }

    /**
     * Get documents associated with a tag
     */
    static async getDocumentsByTag(tagId: string) {
        const { data, error } = await supabase
            .from('tag_documents')
            .select(`
                *,
                documents:document_id (
                    id,
                    file_name,
                    file_type,
                    file_url,
                    created_at
                )
            `)
            .eq('tag_id', tagId);

        if (error) {
            console.error('Error fetching tag documents:', error);
            throw new Error(`Failed to fetch tag documents: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Upload a sample document for AI analysis
     * Returns the document ID after successful upload
     */
    static async uploadSampleDocument(
        file: File,
        userId: string,
        tagId?: string
    ): Promise<string> {
        // Generate unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/samples/${Date.now()}_${file.name}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            console.error('Error uploading sample document:', uploadError);
            throw new Error(`Failed to upload sample: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);

        // Insert document record
        const { data: docData, error: docError } = await supabase
            .from('documents')
            .insert({
                user_id: userId,
                file_name: file.name,
                file_size: file.size,
                file_type: file.type,
                file_extension: fileExt || null,
                storage_path: fileName,
                storage_bucket: 'documents',
                file_url: urlData.publicUrl,
                upload_status: 'completed',
            })
            .select()
            .single();

        if (docError) {
            console.error('Error creating document record:', docError);
            throw new Error(`Failed to create document record: ${docError.message}`);
        }

        // If tagId is provided, update the tag with sample_document_id
        if (tagId) {
            await this.updateTag(tagId, {
                sample_document_id: docData.id,
            });
        }

        return docData.id;
    }
}
