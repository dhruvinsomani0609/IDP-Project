import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle } from 'lucide-react';
import { TagDefinitionStep } from './TagDefinitionStep';
import { SampleDocumentUpload } from './SampleDocumentUpload';
import { TagService } from '../services/tagService';
import type { TagCreationStep, TagFormData } from '../types/tag.types';

interface TagCreationModalProps {
    isOpen: boolean;
    uploadedDocumentIds: string[];
    userId: string;
    onClose: () => void;
    onComplete: () => void;
}

export const TagCreationModal: React.FC<TagCreationModalProps> = ({
    isOpen,
    uploadedDocumentIds,
    userId,
    onClose,
    onComplete,
}) => {
    const [currentStep, setCurrentStep] = useState<TagCreationStep>('initial');
    const [formData, setFormData] = useState<TagFormData>({
        name: '',
        description: '',
        industry: '',
    });
    const [sampleDocument, setSampleDocument] = useState<File | null>(null);
    const [errors, setErrors] = useState<Partial<Record<keyof TagFormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleFormChange = useCallback((updates: Partial<TagFormData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
        // Clear errors for updated fields
        setErrors((prev) => {
            const newErrors = { ...prev };
            Object.keys(updates).forEach((key) => {
                delete newErrors[key as keyof TagFormData];
            });
            return newErrors;
        });
    }, []);

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof TagFormData, string>> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tag name is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = useCallback(async () => {
        if (currentStep === 'initial') {
            setCurrentStep('definition');
        } else if (currentStep === 'definition') {
            if (validateForm()) {
                setCurrentStep('sample');
            }
        } else if (currentStep === 'sample') {
            // Save tag to database
            setIsSubmitting(true);
            setSubmitError(null);

            try {
                // Create the tag
                const tag = await TagService.createTag(userId, {
                    name: formData.name,
                    description: formData.description,
                    industry: formData.industry || null,
                });

                // Upload sample document if provided
                if (sampleDocument) {
                    await TagService.uploadSampleDocument(sampleDocument, userId, tag.id);
                }

                // Associate uploaded documents with the tag
                if (uploadedDocumentIds.length > 0) {
                    await TagService.associateDocumentsWithTag(tag.id, uploadedDocumentIds);
                }

                setCurrentStep('complete');

                // Auto-close after 2 seconds
                setTimeout(() => {
                    onComplete();
                }, 2000);
            } catch (error) {
                console.error('Error saving tag:', error);
                setSubmitError(error instanceof Error ? error.message : 'Failed to save tag');
            } finally {
                setIsSubmitting(false);
            }
        }
    }, [currentStep, formData, sampleDocument, userId, uploadedDocumentIds, onComplete]);

    const handleCancel = useCallback(() => {
        // Reset everything and close
        setCurrentStep('initial');
        setFormData({ name: '', description: '', industry: '' });
        setSampleDocument(null);
        setErrors({});
        setSubmitError(null);
        onClose();
    }, [onClose]);

    const handleSampleUpload = useCallback((file: File) => {
        setSampleDocument(file);
    }, []);

    const handleSampleRemove = useCallback(() => {
        setSampleDocument(null);
    }, []);

    const getStepNumber = (): number => {
        switch (currentStep) {
            case 'initial': return 1;
            case 'definition': return 2;
            case 'sample': return 3;
            case 'complete': return 4;
            default: return 1;
        }
    };

    const canProceed = (): boolean => {
        if (currentStep === 'sample') {
            return sampleDocument !== null;
        }
        return true;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCancel}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">
                            {currentStep === 'complete' ? 'Tag Created!' : 'Create Tag'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Step {getStepNumber()} of 4
                        </p>
                    </div>
                    <button
                        onClick={handleCancel}
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

                {/* Progress Bar */}
                <div className="h-1 bg-slate-100">
                    <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: `${(getStepNumber() / 4) * 100}%` }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-indigo-600"
                    />
                </div>

                {/* Content */}
                <div className="px-8 py-6 max-h-[60vh] overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {currentStep === 'initial' && (
                            <motion.div
                                key="initial"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-center py-8"
                            >
                                <h3 className="text-xl font-semibold text-slate-800 mb-4">
                                    Documents uploaded successfully!
                                </h3>
                                <p className="text-slate-600 mb-2">
                                    You've uploaded {uploadedDocumentIds.length} document{uploadedDocumentIds.length !== 1 ? 's' : ''}.
                                </p>
                                <p className="text-slate-600">
                                    Would you like to create a tag to organize and extract data from these documents?
                                </p>
                            </motion.div>
                        )}

                        {currentStep === 'definition' && (
                            <TagDefinitionStep
                                key="definition"
                                formData={formData}
                                onChange={handleFormChange}
                                errors={errors}
                            />
                        )}

                        {currentStep === 'sample' && (
                            <SampleDocumentUpload
                                key="sample"
                                sampleDocument={sampleDocument}
                                onUpload={handleSampleUpload}
                                onRemove={handleSampleRemove}
                            />
                        )}

                        {currentStep === 'complete' && (
                            <motion.div
                                key="complete"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-12"
                            >
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                                    Tag Created Successfully!
                                </h3>
                                <p className="text-slate-600">
                                    Your tag "{formData.name}" has been created and associated with your documents.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Error Message */}
                    {submitError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
                        >
                            <p className="text-sm text-red-700">{submitError}</p>
                        </motion.div>
                    )}
                </div>

                {/* Footer */}
                {currentStep !== 'complete' && (
                    <div className="px-8 py-6 border-t border-slate-200 flex items-center justify-between">
                        <button
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            className="
                                px-6 py-3 rounded-lg font-medium
                                text-slate-700 bg-slate-100 hover:bg-slate-200
                                transition-all duration-200
                                focus:outline-none focus:ring-2 focus:ring-slate-300
                                disabled:opacity-50 disabled:cursor-not-allowed
                            "
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={isSubmitting || (currentStep === 'sample' && !canProceed())}
                            className="
                                px-6 py-3 rounded-lg font-medium
                                bg-indigo-600 hover:bg-indigo-700 text-white
                                shadow-sm hover:shadow-md
                                transition-all duration-200
                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                                disabled:opacity-50 disabled:cursor-not-allowed
                                flex items-center gap-2
                            "
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                currentStep === 'sample' ? 'Save & Continue' : 'Next'
                            )}
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
