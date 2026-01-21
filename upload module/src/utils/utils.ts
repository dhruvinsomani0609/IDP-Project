/**
 * Format bytes to human-readable file size
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Check if file is an image
 */
export const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
};

/**
 * Check if file is a PDF
 */
export const isPDFFile = (file: File): boolean => {
    return file.type === 'application/pdf';
};

/**
 * Validate file size
 */
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
};

/**
 * Check if file already exists in the list
 */
export const isDuplicateFile = (file: File, existingFiles: File[]): boolean => {
    return existingFiles.some(
        (existingFile) =>
            existingFile.name === file.name && existingFile.size === file.size
    );
};

/**
 * Calculate total size of all files
 */
export const calculateTotalSize = (files: File[]): number => {
    return files.reduce((total, file) => total + file.size, 0);
};

/**
 * Generate file hash for accurate duplicate detection
 */
export const generateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Enhanced duplicate detection with hash comparison
 */
export interface DuplicateInfo {
    newFile: File;
    existingFile: File;
    existingIndex: number;
    matchType: 'exact' | 'name-size' | 'hash';
}

export const findDuplicates = async (
    newFiles: File[],
    existingFiles: File[]
): Promise<DuplicateInfo[]> => {
    const duplicates: DuplicateInfo[] = [];

    for (const newFile of newFiles) {
        // First check: name + size (fast)
        const nameSizeMatch = existingFiles.findIndex(
            (existing) =>
                existing.name === newFile.name &&
                existing.size === newFile.size
        );

        if (nameSizeMatch !== -1) {
            // Second check: hash comparison (accurate)
            const newHash = await generateFileHash(newFile);
            const existingHash = await generateFileHash(existingFiles[nameSizeMatch]);

            duplicates.push({
                newFile,
                existingFile: existingFiles[nameSizeMatch],
                existingIndex: nameSizeMatch,
                matchType: newHash === existingHash ? 'exact' : 'name-size',
            });
        }
    }

    return duplicates;
};

/**
 * Generate unique filename for "keep both" scenario
 */
export const generateUniqueFileName = (fileName: string, existingFiles: File[]): string => {
    const extension = fileName.substring(fileName.lastIndexOf('.'));
    const baseName = fileName.substring(0, fileName.lastIndexOf('.'));

    let counter = 1;
    let newName = fileName;

    while (existingFiles.some(f => f.name === newName)) {
        newName = `${baseName} (${counter})${extension}`;
        counter++;
    }

    return newName;
};

/**
 * Create a new File object with different name
 */
export const renameFile = (file: File, newName: string): File => {
    return new File([file], newName, {
        type: file.type,
        lastModified: file.lastModified,
    });
};
