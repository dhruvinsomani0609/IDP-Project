import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Calendar, Building2, FileText, Loader2, ExternalLink } from 'lucide-react';
import type { Tag as TagType } from '../types/database.types';
import { TagService } from '../services/tagService';

interface TagDetailsModalProps {
    tag: TagType;
    isOpen: boolean;
    onClose: () => void;
}

export const TagDetailsModal: React.FC<TagDetailsModalProps> = ({ tag, isOpen, onClose }) => {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadDocuments();
        }
    }, [isOpen, tag.id]);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const docs = await TagService.getDocumentsByTag(tag.id);
            setDocuments(docs);
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Tag className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">{tag.name}</h2>
                            <p className="text-sm text-slate-500">Tag Details</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="
                            p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100
                            transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-slate-300
                        "
                        aria-label="Close modal"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                    {/* Tag Information */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Information</h3>

                        <div className="space-y-4">
                            {/* Description */}
                            <div>
                                <label className="text-sm font-medium text-slate-600">Description</label>
                                <p className="mt-1 text-slate-800">
                                    {tag.description || 'No description provided'}
                                </p>
                            </div>

                            {/* Industry */}
                            {tag.industry && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                        <Building2 className="w-4 h-4" />
                                        Industry
                                    </label>
                                    <p className="mt-1 text-slate-800">{tag.industry}</p>
                                </div>
                            )}

                            {/* Created Date */}
                            <div>
                                <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Created
                                </label>
                                <p className="mt-1 text-slate-800">{formatDate(tag.created_at)}</p>
                            </div>

                            {/* Last Updated */}
                            <div>
                                <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Last Updated
                                </label>
                                <p className="mt-1 text-slate-800">{formatDate(tag.updated_at)}</p>
                            </div>

                            {/* Schema JSON */}
                            {tag.schema_json && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Schema</label>
                                    <pre className="mt-1 p-4 bg-slate-50 rounded-lg text-xs overflow-x-auto">
                                        {JSON.stringify(tag.schema_json, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Associated Documents */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Associated Documents ({documents.length})
                        </h3>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-lg">
                                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No documents associated with this tag yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {documents.map((doc) => (
                                        <motion.div
                                            key={doc.document_id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="
                                                p-4 bg-slate-50 rounded-lg border border-slate-200
                                                hover:bg-slate-100 transition-colors
                                                flex items-center justify-between
                                            "
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                                                    <FileText className="w-5 h-5 text-slate-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-slate-800 truncate">
                                                        {doc.documents?.file_name || 'Unknown file'}
                                                    </h4>
                                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                        <span>{doc.documents?.file_type || 'Unknown type'}</span>
                                                        {doc.documents?.created_at && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{formatDate(doc.documents.created_at)}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {doc.documents?.file_url && (
                                                <a
                                                    href={doc.documents.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="
                                                        flex-shrink-0 p-2 rounded-lg
                                                        text-indigo-600 hover:bg-indigo-50
                                                        transition-colors
                                                    "
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-slate-200 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="
                            w-full px-6 py-3 rounded-lg font-medium
                            bg-slate-200 hover:bg-slate-300 text-slate-700
                            transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-slate-400
                        "
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
