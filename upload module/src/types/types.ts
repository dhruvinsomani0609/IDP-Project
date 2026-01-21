export interface FileWithPreview extends File {
    preview?: string;
}

export type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export interface ValidationError {
    message: string;
    type: 'size' | 'type' | 'duplicate';
}
