// Tag creation workflow types

export type TagCreationStep = 'initial' | 'definition' | 'sample' | 'complete';

export interface TagFormData {
    name: string;
    description: string;
    industry: string;
}

export interface TagCreationState {
    currentStep: TagCreationStep;
    formData: TagFormData;
    sampleDocument: File | null;
    uploadedDocumentIds: string[];
}

// Industry options for the dropdown
export const INDUSTRIES = [
    'Finance',
    'Healthcare',
    'Insurance',
    'Legal',
    'Logistics',
    'Real Estate',
    'Retail',
    'Technology',
    'Other',
] as const;

export type Industry = typeof INDUSTRIES[number];
