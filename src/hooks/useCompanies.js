import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useCompanies = (type = null) => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { comercialId, isAdmin, isSupervisor } = useAuth();

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('companies_full')
                .select('*')
                .eq('is_active', true);

            // Filter by type if specified
            if (type) {
                query = query.eq('company_type', type);
            }

            // Apply RLS - Supabase will handle this automatically
            const { data, error: fetchError } = await query.order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setCompanies(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching companies:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (comercialId || isAdmin || isSupervisor) {
            fetchCompanies();
        }
    }, [comercialId, type, isAdmin, isSupervisor]);

    const createCompany = async (companyData) => {
        try {
            // Get current user's tenant_id and comercial_id
            const { data: { user } } = await supabase.auth.getUser();
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('tenant_id, comercial_id')
                .eq('id', user.id)
                .single();

            if (userError) throw userError;

            const { data, error: createError } = await supabase
                .from('companies')
                .insert([{
                    ...companyData,
                    tenant_id: userData.tenant_id,
                    comercial_id: companyData.comercial_id || userData.comercial_id,
                    created_by: user.id
                }])
                .select()
                .single();

            if (createError) throw createError;
            await fetchCompanies(); // Refresh list
            return { success: true, data };
        } catch (err) {
            console.error('Error creating company:', err);
            return { success: false, error: err.message };
        }
    };

    const updateCompany = async (id, updates) => {
        try {
            const { data, error: updateError } = await supabase
                .from('companies')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;
            await fetchCompanies(); // Refresh list
            return { success: true, data };
        } catch (err) {
            console.error('Error updating company:', err);
            return { success: false, error: err.message };
        }
    };

    const deleteCompany = async (id) => {
        try {
            const { error: deleteError } = await supabase
                .from('companies')
                .update({ is_active: false })
                .eq('id', id);

            if (deleteError) throw deleteError;
            await fetchCompanies(); // Refresh list
            return { success: true };
        } catch (err) {
            console.error('Error deleting company:', err);
            return { success: false, error: err.message };
        }
    };

    const convertToClient = async (companyId, clientData) => {
        try {
            const { data, error: convertError } = await supabase
                .rpc('convert_prospect_to_client', {
                    p_company_id: companyId,
                    p_client_since: clientData.client_since || new Date().toISOString().split('T')[0],
                    p_payment_terms: clientData.payment_terms,
                    p_credit_limit: clientData.credit_limit
                });

            if (convertError) throw convertError;
            await fetchCompanies(); // Refresh list
            return { success: true, data };
        } catch (err) {
            console.error('Error converting to client:', err);
            return { success: false, error: err.message };
        }
    };

    return {
        companies,
        loading,
        error,
        refetch: fetchCompanies,
        createCompany,
        updateCompany,
        deleteCompany,
        convertToClient
    };
};
