import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Loader2, AlertCircle } from 'lucide-react';
import { TagCard } from './TagCard';
import { TagDetailsModal } from './TagDetailsModal';
import { TagService } from '../services/tagService';
import { useAuth } from '../contexts/AuthContext';
import type { Tag as TagType } from '../types/database.types';

export const TagDashboard: React.FC = () => {
    const { user } = useAuth();
    const [tags, setTags] = useState<TagType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTag, setSelectedTag] = useState<TagType | null>(null);

    useEffect(() => {
        if (user) {
            loadTags();
        }
    }, [user]);

    const loadTags = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const userTags = await TagService.getTagsByUser(user.id);
            setTags(userTags);
        } catch (err) {
            console.error('Error loading tags:', err);
            setError('Failed to load tags. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTagClick = (tag: TagType) => {
        setSelectedTag(tag);
    };

    const handleCloseModal = () => {
        setSelectedTag(null);
    };

    if (loading) {
        return (
            <div className="w-full max-w-6xl mx-auto p-6">
                <div className="bg-white rounded-xl shadow-lg p-12">
                    <div className="flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                        <p className="text-slate-600">Loading your tags...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Tag className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800">My Tags</h2>
                    </div>
                    <p className="text-slate-600">
                        Manage and view all your document extraction tags
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
                    >
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-800 mb-1">Error</p>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </motion.div>
                )}

                {/* Tags Grid */}
                {tags.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16 bg-slate-50 rounded-xl"
                    >
                        <Tag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">No tags yet</h3>
                        <p className="text-slate-500 mb-6">
                            Upload documents and create your first tag to get started
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        <AnimatePresence>
                            {tags.map((tag) => (
                                <TagCard
                                    key={tag.id}
                                    tag={tag}
                                    onClick={() => handleTagClick(tag)}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            {/* Tag Details Modal */}
            {selectedTag && (
                <TagDetailsModal
                    tag={selectedTag}
                    isOpen={!!selectedTag}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};
