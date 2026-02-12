import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentTenant } from './useCurrentTenant';

export const useQuotations = () => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user, comercialId } = useAuth();
    const { tenantId, loading: tenantLoading } = useCurrentTenant();

    const fetchQuotations = async () => {
        try {
            if (!tenantId) {
                setQuotations([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('quotations')
                .select(`
                    *,
                    comercial:comerciales!comercial_id(id, name, email),
                    company:companies!company_id(id, trade_name, legal_name, cuit),
                    opportunity:opportunities!opportunity_id(id, opportunity_name),
                    lines:quotation_lines(*)
                `)
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            setQuotations(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching quotations:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId && user) {
            fetchQuotations();
        } else if (!tenantLoading) {
            setLoading(false);
        }
    }, [tenantId, user, tenantLoading]);

    /**
     * Generate next quotation number for the year
     * Format: COT-YYYY-XXX
     */
    const generateQuotationNumber = async () => {
        try {
            const currentYear = new Date().getFullYear();
            const prefix = `COT-${currentYear}-`;

            // Get the last quotation number for this year
            const { data, error } = await supabase
                .from('quotations')
                .select('quotation_number')
                .eq('tenant_id', tenantId)
                .like('quotation_number', `${prefix}%`)
                .order('quotation_number', { ascending: false })
                .limit(1);

            if (error) throw error;

            let nextNumber = 1;
            if (data && data.length > 0) {
                // Extract the number from the last quotation (e.g., "COT-2026-009" -> 9)
                const lastNumber = parseInt(data[0].quotation_number.split('-')[2]);
                nextNumber = lastNumber + 1;
            }

            return `${prefix}${String(nextNumber).padStart(3, '0')}`;
        } catch (err) {
            console.error('Error generating quotation number:', err);
            // Fallback to timestamp-based number
            return `COT-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`;
        }
    };

    /**
     * Create a new quotation
     */
    const createQuotation = async (quotationData) => {
        try {
            if (!tenantId) {
                throw new Error('Tenant ID is required');
            }

            // Get user data for tenant_id and comercial_id
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('tenant_id, comercial_id')
                .eq('id', user.id)
                .single();

            if (userError) throw userError;

            // Generate quotation number
            const quotationNumber = await generateQuotationNumber();

            // Prepare quotation data
            const { lines, ...quotationFields } = quotationData;

            const newQuotation = {
                ...quotationFields,
                quotation_number: quotationNumber,
                tenant_id: userData.tenant_id,
                comercial_id: quotationData.comercial_id || userData.comercial_id
            };

            console.log('📝 Creating quotation:', newQuotation);

            // Insert quotation
            const { data: createdQuotation, error: quotationError } = await supabase
                .from('quotations')
                .insert([newQuotation])
                .select()
                .single();

            if (quotationError) throw quotationError;

            // Insert quotation lines if provided
            if (lines && lines.length > 0) {
                const quotationLines = lines.map((line, index) => ({
                    quotation_id: createdQuotation.id,
                    product_sap_code: line.productSapCode || line.sapCode,
                    product_name: line.productName || line.name,
                    quantity: line.quantity,
                    volume: line.volume,
                    unit: line.unit || 'Unid.',
                    unit_price: line.unitPrice || line.estimatedPrice,
                    subtotal: line.subtotal,
                    tax_rate: line.taxRate || 21,
                    total: line.total,
                    line_order: index
                }));

                const { error: linesError } = await supabase
                    .from('quotation_lines')
                    .insert(quotationLines);

                if (linesError) throw linesError;
            }

            console.log('✅ Quotation created successfully:', createdQuotation);

            // Refresh quotations list
            await fetchQuotations();

            return { success: true, data: createdQuotation };
        } catch (err) {
            console.error('❌ Error creating quotation:', err);
            return { success: false, error: err.message };
        }
    };

    /**
     * Update an existing quotation
     */
    const updateQuotation = async (id, updates) => {
        try {
            const { data, error } = await supabase
                .from('quotations')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Quotation updated successfully:', data);

            // Refresh quotations list
            await fetchQuotations();

            return { success: true, data };
        } catch (err) {
            console.error('❌ Error updating quotation:', err);
            return { success: false, error: err.message };
        }
    };

    /**
     * Delete a quotation
     */
    const deleteQuotation = async (id) => {
        try {
            const { error } = await supabase
                .from('quotations')
                .delete()
                .eq('id', id);

            if (error) throw error;

            console.log('✅ Quotation deleted successfully');

            // Refresh quotations list
            await fetchQuotations();

            return { success: true };
        } catch (err) {
            console.error('❌ Error deleting quotation:', err);
            return { success: false, error: err.message };
        }
    };

    /**
     * Get quotations for a specific opportunity
     */
    const getQuotationsByOpportunity = (opportunityId) => {
        return quotations.filter(q => q.opportunity_id === opportunityId);
    };

    return {
        quotations,
        loading,
        error,
        createQuotation,
        updateQuotation,
        deleteQuotation,
        getQuotationsByOpportunity,
        refetch: fetchQuotations
    };
};
