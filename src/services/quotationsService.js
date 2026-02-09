/**
 * Quotations Service
 * Manages quotations in localStorage with persistence across pages
 */

const QUOTATIONS_STORAGE_KEY = 'crm_quotations';

/**
 * Get all quotations from localStorage
 */
export const getAllQuotations = () => {
    try {
        const quotationsJson = localStorage.getItem(QUOTATIONS_STORAGE_KEY);
        return quotationsJson ? JSON.parse(quotationsJson) : [];
    } catch (error) {
        console.error('Error loading quotations:', error);
        return [];
    }
};

/**
 * Save a new quotation
 */
export const saveQuotation = (quotationData) => {
    try {
        const quotations = getAllQuotations();

        // Generate quotation number if not provided
        if (!quotationData.quotationNumber) {
            const year = new Date().getFullYear();
            const nextNumber = quotations.length + 1;
            quotationData.quotationNumber = `COT-${year}-${String(nextNumber).padStart(3, '0')}`;
        }

        // Generate ID if not provided
        if (!quotationData.id) {
            quotationData.id = `quot-${Date.now()}`;
        }

        // Add timestamp
        if (!quotationData.createdAt) {
            quotationData.createdAt = new Date().toISOString();
        }

        // Default status
        if (!quotationData.status) {
            quotationData.status = 'draft';
        }

        const newQuotation = {
            ...quotationData,
            updatedAt: new Date().toISOString()
        };

        quotations.push(newQuotation);
        localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(quotations));

        console.log('✅ Quotation saved:', newQuotation);
        return newQuotation;
    } catch (error) {
        console.error('Error saving quotation:', error);
        throw error;
    }
};

/**
 * Update an existing quotation
 */
export const updateQuotation = (quotationId, updates) => {
    try {
        const quotations = getAllQuotations();
        const index = quotations.findIndex(q => q.id === quotationId);

        if (index === -1) {
            throw new Error(`Quotation ${quotationId} not found`);
        }

        quotations[index] = {
            ...quotations[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(quotations));

        console.log('✅ Quotation updated:', quotations[index]);
        return quotations[index];
    } catch (error) {
        console.error('Error updating quotation:', error);
        throw error;
    }
};

/**
 * Get quotations by opportunity ID
 */
export const getQuotationsByOpportunity = (opportunityId) => {
    const quotations = getAllQuotations();
    return quotations.filter(q => q.opportunityId === opportunityId);
};

/**
 * Get quotation by ID
 */
export const getQuotationById = (quotationId) => {
    const quotations = getAllQuotations();
    return quotations.find(q => q.id === quotationId);
};

/**
 * Delete a quotation
 */
export const deleteQuotation = (quotationId) => {
    try {
        const quotations = getAllQuotations();
        const filtered = quotations.filter(q => q.id !== quotationId);
        localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(filtered));

        console.log('✅ Quotation deleted:', quotationId);
        return true;
    } catch (error) {
        console.error('Error deleting quotation:', error);
        throw error;
    }
};
