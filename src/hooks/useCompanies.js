import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentTenant } from './useCurrentTenant';
import { useRoleBasedFilter } from './useRoleBasedFilter';

export const useCompanies = (type = null) => {
    const { user, isLoading: authLoading, comercialId, comercialIdLoaded, isAdmin } = useAuth();
    const { tenantId, loading: tenantLoading } = useCurrentTenant();
    const { applyRoleFilter, selectedComercialId } = useRoleBasedFilter();
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
            // Don't fetch if tenant_id is not available yet
            if (!tenantId) {
                setCompanies([]);
                setLoading(false);
                return;
            }

            setLoading(true);

            // Build query with tenant filter
            let query = supabase
                .from('companies')
                .select('*')
                .eq('is_active', true)
                .eq('tenant_id', tenantId);

            // Filter by type if specified
            if (type) {
                query = query.eq('company_type', type);
            }

            // Apply role-based filter (admin sees all, comercial sees only theirs)
            query = applyRoleFilter(query);

            // Execute query
            query = query.order('created_at', { ascending: false });

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
        // Wait for auth to finish loading before fetching
        if (authLoading) {
            setLoading(true);
            return;
        }

        // For non-admin users, wait for comercialId to be loaded
        // Admin can see all, so they don't strictly need comercialId
        if (!isAdmin && !comercialIdLoaded) {
            console.log('⏳ [useCompanies] Waiting for comercialId to load...');
            setLoading(true);
            return;
        }

        if (user && tenantId) {
            fetchCompanies();
        } else if (!tenantLoading) {
            setLoading(false);
        }
    }, [type, user, tenantId, tenantLoading, selectedComercialId, authLoading, comercialIdLoaded, isAdmin]);

    const createCompany = async (companyData) => {
        try {
            console.log('🔍 [createCompany] Starting with data:', companyData);
            console.log('🔍 [createCompany] Current tenantId:', tenantId);

            // Don't create if tenant_id is not available
            if (!tenantId) {
                console.error('❌ [createCompany] Tenant ID not available!');
                throw new Error('Tenant ID not available');
            }

            // Get current user's data for created_by
            const { data: { user: authUser } } = await supabase.auth.getUser();
            console.log('🔍 [createCompany] Auth user:', authUser?.id);

            const dataToInsert = {
                ...companyData,
                tenant_id: tenantId,
                created_by: authUser?.id,
                is_active: true
            };

            console.log('📝 [createCompany] Data to insert:', dataToInsert);

            const { data, error: insertError } = await supabase
                .from('companies')
                .insert([dataToInsert])
                .select()
                .single();

            if (insertError) {
                console.error('❌ [createCompany] Insert error:', insertError);

                // Provide user-friendly error messages
                if (insertError.code === '23505') {
                    if (insertError.message.includes('companies_cuit_key')) {
                        throw new Error('Ya existe una empresa con este CUIT');
                    }
                    throw new Error('Ya existe una empresa con estos datos');
                }

                throw insertError;
            }

            console.log('✅ [createCompany] Successfully created company:', data);
            await fetchCompanies();
            return { success: true, data };
        } catch (err) {
            console.error('❌ [createCompany] Error creating company:', err);
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
                .eq('tenant_id', tenantId)
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
                .eq('id', id)
                .eq('tenant_id', tenantId);

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
                .eq('tenant_id', tenantId)
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
        loading: loading || tenantLoading,
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

