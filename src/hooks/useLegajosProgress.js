import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook to fetch and calculate legajo progress for all companies
 * Returns companies with their document completion status
 */
export const useLegajosProgress = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    // Total required documents per company
    const TOTAL_DOCS = 6;

    const fetchLegajosProgress = async () => {
        try {
            setLoading(true);

            // Get all companies (without file_number since it doesn't exist)
            const { data: companiesData, error: companiesError } = await supabase
                .from('companies')
                .select('id, trade_name, legal_name, file_number')
                .order('trade_name');

            if (companiesError) throw companiesError;

            // Get all file attachments for companies
            const { data: attachments, error: attachmentsError } = await supabase
                .from('file_attachments')
                .select('entity_id, document_type, status')
                .eq('entity_type', 'company')
                .eq('status', 'active');

            if (attachmentsError) throw attachmentsError;

            // Calculate progress for each company
            const companiesWithProgress = companiesData.map(company => {
                // Count active documents for this company
                const companyDocs = attachments.filter(
                    att => att.entity_id === company.id
                );

                const progress = {
                    current: companyDocs.length,
                    total: TOTAL_DOCS
                };

                const legajoStatus = progress.current === progress.total ? 'complete' : 'incomplete';

                return {
                    ...company,
                    progress,
                    legajoStatus
                };
            });

            setCompanies(companiesWithProgress);
        } catch (err) {
            console.error('Error fetching legajos progress:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLegajosProgress();
    }, []);

    return {
        companies,
        loading,
        refresh: fetchLegajosProgress
    };
};
