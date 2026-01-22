import { motion } from 'framer-motion';
import { Tag, FileText, Calendar, Building2 } from 'lucide-react';
import type { Tag as TagType } from '../types/database.types';

interface TagCardProps {
    tag: TagType;
    onClick: () => void;
}

export const TagCard: React.FC<TagCardProps> = ({ tag, onClick }) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={onClick}
            className="
                bg-white rounded-xl p-6 shadow-md hover:shadow-xl
                border-2 border-slate-200 hover:border-indigo-400
                cursor-pointer transition-all duration-200
                group
            "
        >
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <Tag className="w-6 h-6 text-indigo-600" />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-800 mb-1 truncate group-hover:text-indigo-600 transition-colors">
                        {tag.name}
                    </h3>

                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                        {tag.description || 'No description provided'}
                    </p>

                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        {tag.industry && (
                            <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                <span>{tag.industry}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(tag.created_at)}</span>
                        </div>

                        {tag.sample_document_id && (
                            <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                <span>Sample attached</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
