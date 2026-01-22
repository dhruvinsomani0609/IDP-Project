import { motion } from 'framer-motion';
import { INDUSTRIES, type TagFormData } from '../types/tag.types';

interface TagDefinitionStepProps {
    formData: TagFormData;
    onChange: (data: Partial<TagFormData>) => void;
    errors: Partial<Record<keyof TagFormData, string>>;
}

export const TagDefinitionStep: React.FC<TagDefinitionStepProps> = ({
    formData,
    onChange,
    errors,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                    Define how data should be extracted from documents of this type
                </h3>
                <p className="text-slate-600">
                    Provide details about the tag to help organize and extract data from your documents.
                </p>
            </div>

            {/* Tag Name */}
            <div>
                <label htmlFor="tag-name" className="block text-sm font-medium text-slate-700 mb-2">
                    Tag Name <span className="text-red-500">*</span>
                </label>
                <input
                    id="tag-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                    placeholder="e.g., Invoice, Shipping Label, Insurance Claim"
                    className={`
                        w-full px-4 py-3 rounded-lg border
                        ${errors.name ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'}
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                        transition-all duration-200
                    `}
                />
                {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
            </div>

            {/* Description */}
            <div>
                <label htmlFor="tag-description" className="block text-sm font-medium text-slate-700 mb-2">
                    Description <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="tag-description"
                    value={formData.description}
                    onChange={(e) => onChange({ description: e.target.value })}
                    placeholder="Brief description of what this tag extracts"
                    rows={4}
                    className={`
                        w-full px-4 py-3 rounded-lg border
                        ${errors.description ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'}
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                        transition-all duration-200
                        resize-none
                    `}
                />
                {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
            </div>

            {/* Industry */}
            <div>
                <label htmlFor="tag-industry" className="block text-sm font-medium text-slate-700 mb-2">
                    Industry <span className="text-slate-400">(Optional)</span>
                </label>
                <select
                    id="tag-industry"
                    value={formData.industry}
                    onChange={(e) => onChange({ industry: e.target.value })}
                    className="
                        w-full px-4 py-3 rounded-lg border border-slate-300 bg-white
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                        transition-all duration-200
                        cursor-pointer
                    "
                >
                    <option value="">Select Industry</option>
                    {INDUSTRIES.map((industry) => (
                        <option key={industry} value={industry}>
                            {industry}
                        </option>
                    ))}
                </select>
            </div>
        </motion.div>
    );
};
