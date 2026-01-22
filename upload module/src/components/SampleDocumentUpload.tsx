import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';

interface SampleDocumentUploadProps {
    sampleDocument: File | null;
    onUpload: (file: File) => void;
    onRemove: () => void;
}

const ACCEPTED_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
};

export const SampleDocumentUpload: React.FC<SampleDocumentUploadProps> = ({
    sampleDocument,
    onUpload,
    onRemove,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
            return 'Invalid file type. Only images and PDFs are allowed.';
        }
        if (file.size > 10 * 1024 * 1024) {
            return 'File size exceeds 10MB limit.';
        }
        return null;
    };

    const handleFileSelect = useCallback((file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            setTimeout(() => setError(null), 5000);
            return;
        }
        setError(null);
        onUpload(file);
    }, [onUpload]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

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

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
        e.target.value = '';
    }, [handleFileSelect]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                    AI will analyze your document and suggest a schema automatically
                </h3>
                <p className="text-slate-600">
                    This helps build the perfect structure faster.
                </p>
            </div>

            {!sampleDocument ? (
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
                        accept={Object.values(ACCEPTED_TYPES).flat().join(',')}
                        onChange={handleInputChange}
                        className="hidden"
                        aria-label="Sample document upload input"
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

                        <h4 className="text-xl font-semibold text-slate-700 mb-2">
                            {isDragging ? 'Drop sample document here' : 'Upload a sample document'}
                        </h4>

                        <p className="text-slate-500 mb-6">
                            or
                        </p>

                        <button
                            onClick={() => fileInputRef.current?.click()}
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

                        <p className="text-xs text-slate-400 mt-4">
                            Supports: JPEG, PNG, WEBP, PDF (Max 10MB)
                        </p>
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border-2 border-slate-200 rounded-xl p-6 bg-white"
                >
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                            {sampleDocument.type.startsWith('image/') ? (
                                <ImageIcon className="w-6 h-6 text-indigo-600" />
                            ) : (
                                <FileText className="w-6 h-6 text-indigo-600" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-slate-900 truncate">
                                {sampleDocument.name}
                            </h4>
                            <p className="text-sm text-slate-500">
                                {(sampleDocument.size / 1024).toFixed(2)} KB
                            </p>
                        </div>

                        <button
                            onClick={onRemove}
                            className="
                                flex-shrink-0 p-2 rounded-lg
                                text-slate-400 hover:text-red-600 hover:bg-red-50
                                transition-all duration-200
                                focus:outline-none focus:ring-2 focus:ring-red-500
                            "
                            aria-label="Remove sample document"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                        <p className="text-sm text-red-700">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
