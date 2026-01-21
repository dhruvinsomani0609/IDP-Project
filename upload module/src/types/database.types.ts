// Database types for the documents table
export interface Database {
    public: {
        Tables: {
            documents: {
                Row: {
                    id: string;
                    user_id: string;
                    file_name: string;
                    file_size: number;
                    file_type: string;
                    file_extension: string | null;
                    storage_path: string;
                    storage_bucket: string;
                    file_url: string | null;
                    file_hash: string | null;
                    is_duplicate: boolean;
                    duplicate_of: string | null;
                    original_file_name: string | null;
                    batch_id: string | null;
                    upload_session_id: string | null;
                    upload_status: 'pending' | 'uploading' | 'completed' | 'failed';
                    processing_status: 'pending' | 'processing' | 'completed' | 'failed';
                    error_message: string | null;
                    created_at: string;
                    updated_at: string;
                    uploaded_at: string | null;
                    deleted_at: string | null;
                    is_deleted: boolean;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    file_name: string;
                    file_size: number;
                    file_type: string;
                    file_extension?: string | null;
                    storage_path: string;
                    storage_bucket?: string;
                    file_url?: string | null;
                    file_hash?: string | null;
                    is_duplicate?: boolean;
                    duplicate_of?: string | null;
                    original_file_name?: string | null;
                    batch_id?: string | null;
                    upload_session_id?: string | null;
                    upload_status?: 'pending' | 'uploading' | 'completed' | 'failed';
                    processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
                    error_message?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    uploaded_at?: string | null;
                    deleted_at?: string | null;
                    is_deleted?: boolean;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    file_name?: string;
                    file_size?: number;
                    file_type?: string;
                    file_extension?: string | null;
                    storage_path?: string;
                    storage_bucket?: string;
                    file_url?: string | null;
                    file_hash?: string | null;
                    is_duplicate?: boolean;
                    duplicate_of?: string | null;
                    original_file_name?: string | null;
                    batch_id?: string | null;
                    upload_session_id?: string | null;
                    upload_status?: 'pending' | 'uploading' | 'completed' | 'failed';
                    processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
                    error_message?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    uploaded_at?: string | null;
                    deleted_at?: string | null;
                    is_deleted?: boolean;
                };
            };
        };
        Functions: {
            get_user_documents: {
                Args: {
                    p_user_id?: string;
                    p_batch_id?: string;
                    p_limit?: number;
                    p_offset?: number;
                };
                Returns: {
                    id: string;
                    file_name: string;
                    file_size: number;
                    file_type: string;
                    file_url: string | null;
                    upload_status: string;
                    created_at: string;
                }[];
            };
            check_duplicate_file: {
                Args: {
                    p_user_id: string;
                    p_file_hash: string;
                    p_file_name: string;
                    p_file_size: number;
                };
                Returns: {
                    id: string;
                    file_name: string;
                    file_size: number;
                    created_at: string;
                    is_exact_match: boolean;
                }[];
            };
        };
    };
}

// Type aliases for easier use
export type Document = Database['public']['Tables']['documents']['Row'];
export type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
export type DocumentUpdate = Database['public']['Tables']['documents']['Update'];

// Upload status types
export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Document with file object (for upload)
export interface DocumentWithFile {
    file: File;
    metadata: Omit<DocumentInsert, 'user_id' | 'storage_path'>;
}

// Upload result
export interface UploadResult {
    success: boolean;
    document?: Document;
    error?: string;
}

// Batch upload result
export interface BatchUploadResult {
    batchId: string;
    totalFiles: number;
    successCount: number;
    failedCount: number;
    documents: Document[];
    errors: Array<{ fileName: string; error: string }>;
}
