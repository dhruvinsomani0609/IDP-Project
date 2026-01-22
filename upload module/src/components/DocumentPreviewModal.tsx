import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';

interface DocumentPreviewModalProps {
    file: File;
    onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ file, onClose }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [zoom, setZoom] = useState(100);
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';

    useEffect(() => {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';

        return () => {
            URL.revokeObjectURL(url);
            document.body.style.overflow = 'unset';
        };
    }, [file]);

    // Handle escape key to close
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleDownload = () => {
        if (!previewUrl) return;

        const link = document.createElement('a');
        link.href = previewUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 25, 200));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 25, 50));
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Backdrop with blur */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative z-10 max-w-7xl max-h-[95vh] w-full mx-4 flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-white rounded-t-xl px-6 py-4 flex items-center justify-between shadow-lg">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-slate-800 truncate" title={file.name}>
                                {file.name}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {file.type} • {(file.size / 1024).toFixed(2)} KB
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 ml-4">
                            {isImage && (
                                <>
                                    <button
                                        onClick={handleZoomOut}
                                        disabled={zoom <= 50}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Zoom Out"
                                    >
                                        <ZoomOut className="w-5 h-5 text-slate-700" />
                                    </button>
                                    <span className="text-sm font-medium text-slate-600 min-w-[3rem] text-center">
                                        {zoom}%
                                    </span>
                                    <button
                                        onClick={handleZoomIn}
                                        disabled={zoom >= 200}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Zoom In"
                                    >
                                        <ZoomIn className="w-5 h-5 text-slate-700" />
                                    </button>
                                </>
                            )}

                            <button
                                onClick={handleDownload}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Download"
                            >
                                <Download className="w-5 h-5 text-slate-700" />
                            </button>

                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Close (Esc)"
                            >
                                <X className="w-5 h-5 text-red-600" />
                            </button>
                        </div>
                    </div>

                    {/* Preview Content */}
                    <div className="bg-slate-100 rounded-b-xl overflow-auto flex-1 flex items-center justify-center p-6">
                        {previewUrl && (
                            <>
                                {isImage && (
                                    <motion.img
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        src={previewUrl}
                                        alt={file.name}
                                        style={{
                                            width: `${zoom}%`,
                                            maxWidth: 'none',
                                        }}
                                        className="rounded-lg shadow-2xl object-contain"
                                    />
                                )}

                                {isPDF && (
                                    <iframe
                                        src={previewUrl}
                                        title={file.name}
                                        className="w-full h-full rounded-lg shadow-2xl bg-white"
                                        style={{ minHeight: '70vh' }}
                                    />
                                )}

                                {!isImage && !isPDF && (
                                    <div className="text-center">
                                        <div className="bg-white rounded-xl p-8 shadow-lg">
                                            <p className="text-slate-600 mb-4">
                                                Preview not available for this file type
                                            </p>
                                            <button
                                                onClick={handleDownload}
                                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-2"
                                            >
                                                <Download className="w-5 h-5" />
                                                Download File
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};