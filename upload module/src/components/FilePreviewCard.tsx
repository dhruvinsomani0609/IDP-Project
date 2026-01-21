import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, FileText } from 'lucide-react';
import { formatFileSize, isImageFile } from '../utils/utils';

interface FilePreviewCardProps {
    file: File;
    onRemove: () => void;
}

export const FilePreviewCard: React.FC<FilePreviewCardProps> = ({ file, onRemove }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (isImageFile(file)) {
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);

            // Cleanup
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [file]);

    const truncateFileName = (name: string, maxLength: number = 20) => {
        if (name.length <= maxLength) return name;
        const extension = name.split('.').pop();
        const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
        const truncated = nameWithoutExt.substring(0, maxLength - 3 - (extension?.length || 0));
        return `${truncated}...${extension}`;
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.02 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className={`
        relative rounded-lg overflow-hidden border-2 transition-all duration-200
        ${isHovered ? 'border-indigo-600 shadow-md' : 'border-slate-200 shadow-sm'}
        bg-white
      `}
        >
            {/* Preview Area */}
            <div className="aspect-square bg-slate-100 flex items-center justify-center">
                {preview ? (
                    <img
                        src={preview}
                        alt={file.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <FileText className="w-12 h-12 text-slate-400" />
                )}
            </div>

            {/* File Info */}
            <div className="p-3 bg-white">
                <p className="text-sm font-medium text-slate-700 truncate" title={file.name}>
                    {truncateFileName(file.name)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                    {formatFileSize(file.size)}
                </p>
            </div>

            {/* Remove Button */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                onClick={onRemove}
                className="
          absolute top-2 right-2 
          bg-red-500 hover:bg-red-600 
          text-white rounded-full p-1.5
          shadow-lg transition-colors
          focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2
        "
                aria-label="Remove file"
            >
                <X className="w-4 h-4" />
            </motion.button>
        </motion.div>
    );
};
