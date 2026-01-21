import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { FilePreviewCard } from './FilePreviewCard';
import { DuplicateDetectionModal } from './DuplicateDetectionModal';
import type { DuplicateAction } from './DuplicateDetectionModal';
import {
    formatFileSize,
    validateFileSize,
    calculateTotalSize,
    findDuplicates,
    generateUniqueFileName,
    renameFile,
} from '../utils/utils';
import type { DuplicateInfo } from '../utils/utils';
import type { UploadState } from '../types/types';

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_FILE_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
};

export const DocumentUpload: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Duplicate detection state
    const [duplicateQueue, setDuplicateQueue] = useState<DuplicateInfo[]>([]);
    const [currentDuplicate, setCurrentDuplicate] = useState<DuplicateInfo | null>(null);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    // Handle file selection with duplicate detection
    const handleFileSelect = useCallback(async (selectedFiles: FileList | null) => {
        if (!selectedFiles) return;

        const newFiles: File[] = [];
        const errors: string[] = [];

        // First pass: validate files
        Array.from(selectedFiles).forEach((file) => {
            // Check file type
            if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
                errors.push(`${file.name}: Invalid file type. Only images and PDFs are allowed.`);
                return;
            }

            // Check file size
            if (!validateFileSize(file, MAX_FILE_SIZE_MB)) {
                errors.push(`${file.name}: File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
                return;
            }

            newFiles.push(file);
        });

        if (errors.length > 0) {
            setErrorMessage(errors.join('\n'));
            setTimeout(() => setErrorMessage(null), 5000);
        }

        if (newFiles.length === 0) return;

        // Check for duplicates
        const duplicates = await findDuplicates(newFiles, files);

        if (duplicates.length > 0) {
            // Store duplicates in queue
            setDuplicateQueue(duplicates);
            setCurrentDuplicate(duplicates[0]);

            // Store non-duplicate files to add later
            const nonDuplicateFiles = newFiles.filter(
                (file) => !duplicates.some((dup) => dup.newFile === file)
            );
            setPendingFiles(nonDuplicateFiles);
        } else {
            // No duplicates, add all files
            setFiles((prev) => [...prev, ...newFiles]);
            setErrorMessage(null);
        }
    }, [files]);

    // Handle drag events
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    }, [handleFileSelect]);

    // Handle file input change
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files);
        // Reset input value to allow selecting the same file again
        e.target.value = '';
    }, [handleFileSelect]);

    // Handle remove file
    const handleRemoveFile = useCallback((index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    }, []);

    // Handle duplicate resolution
    const handleDuplicateResolve = useCallback((action: DuplicateAction) => {
        if (!currentDuplicate) return;

        setFiles((prevFiles) => {
            let updatedFiles = [...prevFiles];

            switch (action) {
                case 'replace':
                    // Replace existing file with new file
                    updatedFiles[currentDuplicate.existingIndex] = currentDuplicate.newFile;
                    break;

                case 'reject':
                    // Do nothing, keep existing file
                    break;

                case 'keep_both':
                    // Rename new file and add it
                    const uniqueName = generateUniqueFileName(
                        currentDuplicate.newFile.name,
                        updatedFiles
                    );
                    const renamedFile = renameFile(currentDuplicate.newFile, uniqueName);
                    updatedFiles.push(renamedFile);
                    break;
            }

            return updatedFiles;
        });

        // Move to next duplicate or finish
        const remainingDuplicates = duplicateQueue.slice(1);

        if (remainingDuplicates.length > 0) {
            setDuplicateQueue(remainingDuplicates);
            setCurrentDuplicate(remainingDuplicates[0]);
        } else {
            // All duplicates resolved, add pending files
            setFiles((prev) => [...prev, ...pendingFiles]);
            setCurrentDuplicate(null);
            setDuplicateQueue([]);
            setPendingFiles([]);
        }
    }, [currentDuplicate, duplicateQueue, pendingFiles]);

    // Handle duplicate modal close
    const handleDuplicateModalClose = useCallback(() => {
        // Cancel duplicate resolution, don't add any files
        setCurrentDuplicate(null);
        setDuplicateQueue([]);
        setPendingFiles([]);
    }, []);

    // Handle upload
    const handleUpload = useCallback(async () => {
        if (files.length === 0) return;

        setUploadState('uploading');

        // Simulate upload process
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setUploadState('success');

        // Clear files after successful upload
        setTimeout(() => {
            setFiles([]);
            setUploadState('idle');
        }, 2000);
    }, [files]);

    const totalSize = calculateTotalSize(files);

    return (
        <div className="w-full max-w-5xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">
                        Upload Documents
                    </h2>
                    <p className="text-slate-600">
                        Upload images (JPEG, PNG, WEBP) and PDF documents. Maximum file size: {MAX_FILE_SIZE_MB}MB
                    </p>
                </div>

                {/* Upload Zone */}
                <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
            relative border-2 border-dashed rounded-xl p-12
            transition-all duration-200 ease-in-out
            ${isDragging
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                        }
          `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={Object.values(ACCEPTED_FILE_TYPES).flat().join(',')}
                        onChange={handleInputChange}
                        className="hidden"
                        aria-label="File upload input"
                    />

                    <div className="flex flex-col items-center justify-center text-center">
                        <div className={`
              mb-4 p-4 rounded-full transition-colors
              ${isDragging ? 'bg-indigo-100' : 'bg-slate-200'}
            `}>
                            <Upload className={`
                w-12 h-12 transition-colors
                ${isDragging ? 'text-indigo-600' : 'text-slate-500'}
              `} />
                        </div>

                        <h3 className="text-xl font-semibold text-slate-700 mb-2">
                            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                        </h3>

                        <p className="text-slate-500 mb-6">
                            or
                        </p>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    fileInputRef.current?.click();
                                }
                            }}
                            className="
                px-6 py-3 bg-indigo-600 hover:bg-indigo-700 
                text-white font-medium rounded-lg
                shadow-sm hover:shadow-md
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              "
                        >
                            Browse Files
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {errorMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-800 mb-1">Upload Error</p>
                                <p className="text-sm text-red-700 whitespace-pre-line">{errorMessage}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Success Message */}
                <AnimatePresence>
                    {uploadState === 'success' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
                        >
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <p className="text-sm font-medium text-green-800">
                                Files uploaded successfully!
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Preview Grid */}
                {files.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-slate-700 mb-4">
                            Selected Files ({files.length})
                        </h3>

                        <motion.div
                            layout
                            className="grid grid-cols-2 md:grid-cols-4 gap-4"
                        >
                            <AnimatePresence>
                                {files.map((file, index) => (
                                    <FilePreviewCard
                                        key={`${file.name}-${file.size}-${index}`}
                                        file={file}
                                        onRemove={() => handleRemoveFile(index)}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                )}

                {/* Action Bar */}
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between"
                    >
                        <div className="text-slate-600">
                            <span className="font-semibold text-slate-700">{files.length}</span> file{files.length !== 1 ? 's' : ''} attached
                            <span className="mx-2">•</span>
                            <span className="font-semibold text-slate-700">{formatFileSize(totalSize)}</span> total
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={uploadState === 'uploading'}
                            className={`
                px-6 py-3 rounded-lg font-medium
                shadow-sm hover:shadow-md
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                flex items-center gap-2
                ${uploadState === 'uploading'
                                    ? 'bg-indigo-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }
              `}
                        >
                            {uploadState === 'uploading' ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Upload Files
                                </>
                            )}
                        </button>
                    </motion.div>
                )}

                {/* Empty State */}
                {files.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-8 text-center text-slate-500"
                    >
                        <p className="text-sm">No files selected yet. Start by uploading some documents!</p>
                    </motion.div>
                )}
            </div>

            {/* Duplicate Detection Modal */}
            {currentDuplicate && (
                <DuplicateDetectionModal
                    duplicate={currentDuplicate}
                    onResolve={handleDuplicateResolve}
                    onClose={handleDuplicateModalClose}
                    queuePosition={duplicateQueue.length - duplicateQueue.indexOf(currentDuplicate)}
                    totalDuplicates={duplicateQueue.length}
                />
            )}
        </div>
    );
};
