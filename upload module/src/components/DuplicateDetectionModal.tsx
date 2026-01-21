import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, FileText } from 'lucide-react';
import { formatFileSize, isImageFile } from '../utils/utils';
import type { DuplicateInfo } from '../utils/utils';

export type DuplicateAction = 'replace' | 'reject' | 'keep_both';

interface DuplicateDetectionModalProps {
    duplicate: DuplicateInfo;
    onResolve: (action: DuplicateAction) => void;
    onClose: () => void;
    queuePosition?: number;
    totalDuplicates?: number;
}

export const DuplicateDetectionModal: React.FC<DuplicateDetectionModalProps> = ({
    duplicate,
    onResolve,
    onClose,
    queuePosition = 1,
    totalDuplicates = 1,
}) => {
    const [existingPreview, setExistingPreview] = useState<string | null>(null);
    const [newPreview, setNewPreview] = useState<string | null>(null);

    useEffect(() => {
        // Generate previews for images
        if (isImageFile(duplicate.existingFile)) {
            const url = URL.createObjectURL(duplicate.existingFile);
            setExistingPreview(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [duplicate.existingFile]);

    useEffect(() => {
        if (isImageFile(duplicate.newFile)) {
            const url = URL.createObjectURL(duplicate.newFile);
            setNewPreview(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [duplicate.newFile]);

    const handleAction = (action: DuplicateAction) => {
        onResolve(action);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-white" />
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    Duplicate Document Detected
                                </h2>
                                {totalDuplicates > 1 && (
                                    <p className="text-sm text-white/90">
                                        {queuePosition} of {totalDuplicates} duplicates
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                        <p className="text-slate-600 mb-6">
                            A file with the same name and size already exists. What would you like to do?
                        </p>

                        {/* Comparison Grid */}
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            {/* Existing File */}
                            <div className="border-2 border-slate-200 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                                    Existing File
                                </h3>

                                {/* Preview */}
                                <div className="aspect-video bg-slate-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                    {existingPreview ? (
                                        <img
                                            src={existingPreview}
                                            alt={duplicate.existingFile.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <FileText className="w-16 h-16 text-slate-400" />
                                    )}
                                </div>

                                {/* Details */}
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-xs text-slate-500">Name</p>
                                        <p className="text-sm font-medium text-slate-700 truncate" title={duplicate.existingFile.name}>
                                            {duplicate.existingFile.name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Size</p>
                                        <p className="text-sm font-medium text-slate-700">
                                            {formatFileSize(duplicate.existingFile.size)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Type</p>
                                        <p className="text-sm font-medium text-slate-700">
                                            {duplicate.existingFile.type || 'Unknown'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* New File */}
                            <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                    New File
                                </h3>

                                {/* Preview */}
                                <div className="aspect-video bg-white rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                    {newPreview ? (
                                        <img
                                            src={newPreview}
                                            alt={duplicate.newFile.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <FileText className="w-16 h-16 text-slate-400" />
                                    )}
                                </div>

                                {/* Details */}
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-xs text-slate-500">Name</p>
                                        <p className="text-sm font-medium text-slate-700 truncate" title={duplicate.newFile.name}>
                                            {duplicate.newFile.name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Size</p>
                                        <p className="text-sm font-medium text-slate-700">
                                            {formatFileSize(duplicate.newFile.size)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Type</p>
                                        <p className="text-sm font-medium text-slate-700">
                                            {duplicate.newFile.type || 'Unknown'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Match Type Info */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6">
                            <p className="text-sm text-slate-600">
                                <span className="font-semibold">Match Type:</span>{' '}
                                {duplicate.matchType === 'exact' ? (
                                    <span className="text-red-600">Exact duplicate (same content)</span>
                                ) : (
                                    <span className="text-amber-600">Same name and size (content may differ)</span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => handleAction('replace')}
                                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                <div className="text-center">
                                    <p className="font-semibold">Replace</p>
                                    <p className="text-xs opacity-90">Use new file</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleAction('reject')}
                                className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                                <div className="text-center">
                                    <p className="font-semibold">Reject</p>
                                    <p className="text-xs opacity-90">Keep existing</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleAction('keep_both')}
                                className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            >
                                <div className="text-center">
                                    <p className="font-semibold">Keep Both</p>
                                    <p className="text-xs opacity-90">Rename new file</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
