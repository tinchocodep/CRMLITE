import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useCompanies = (type = null) => {
    const { user } = useAuth();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper: Map qualification score to status (memoized)
    const mapQualificationToStatus = useCallback((score) => {
        if (!score) return 'contacted';
        if (score <= 1) return 'contacted';
        if (score === 2) return 'quoted';
        return 'near_closing';
    }, []);

    // Helper: Map status to qualification score (memoized)
    const mapStatusToQualification = useCallback((status) => {
        const mapping = {
            'contacted': 1,
            'quoted': 2,
            'near_closing': 3
        };
        return mapping[status] || 1;
    }, []);

    const fetchCompanies = async () => {
        try {
            setLoading(true);

            // Build query
            let query = supabase
                .from('companies')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            // Filter by type if specified
            if (type) {
                query = query.eq('company_type', type);
            }

            const { data, error: fetchError } = await query;

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
        if (user) {
            fetchCompanies();
        }
    }, [type, user]);

    const createCompany = async (companyData) => {
        try {
            // Get current user's data for created_by
            const { data: { user: authUser } } = await supabase.auth.getUser();

            const { data, error: insertError } = await supabase
                .from('companies')
                .insert([{
                    ...companyData,
                    created_by: authUser?.id,
                    is_active: true
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            await fetchCompanies();
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
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            await fetchCompanies();
            return { success: true, data };
        } catch (err) {
            console.error('Error updating company:', err);
            return { success: false, error: err.message };
        }
    };

    const deleteCompany = async (id) => {
        try {
            // Soft delete - mark as inactive
            const { error: deleteError } = await supabase
                .from('companies')
                .update({
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (deleteError) throw deleteError;

            await fetchCompanies();
            return { success: true };
        } catch (err) {
            console.error('Error deleting company:', err);
            return { success: false, error: err.message };
        }
    };

    const convertToClient = async (companyId, clientData) => {
        try {
            const { data, error: updateError } = await supabase
                .from('companies')
                .update({
                    company_type: 'client',
                    ...clientData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', companyId)
                .select()
                .single();

            if (updateError) throw updateError;

            await fetchCompanies();
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
        convertToClient,
        mapQualificationToStatus,
        mapStatusToQualification
    };
};
