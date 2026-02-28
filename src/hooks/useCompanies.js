import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentTenant } from './useCurrentTenant';
import { useRoleBasedFilter } from './useRoleBasedFilter';

const PAGE_SIZE = 50;

export const useCompanies = (type = null) => {
    const { user, isLoading: authLoading, comercialId, comercialIdLoaded, isAdmin } = useAuth();
    const { tenantId, loading: tenantLoading } = useCurrentTenant();
    const { applyRoleFilter, selectedComercialId } = useRoleBasedFilter();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [searchTerm, setSearchTermInternal] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState(''); // 350ms debounce

    // Debounce: delay the actual query until user stops typing
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 350);
        return () => clearTimeout(timer);
    }, [searchTerm]);

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

    // Public setter: resets to page 0 whenever search changes
    const setSearchTerm = useCallback((term) => {
        setSearchTermInternal(term);
        setPage(0);
    }, []);

    const fetchCompanies = useCallback(async (currentPage, currentSearch) => {
        try {
            if (!tenantId) {
                setCompanies([]);
                setLoading(false);
                return;
            }

            setLoading(true);

            const essentialFields = [
                'id',
                'created_at',
                'trade_name',
                'legal_name',
                'cuit',
                'company_type',
                'status',
                'qualification_score',
                'comercial_id',
                'business_unit_id',
                'tenant_id',
                'is_active',
                'city',
                'province',
                'file_number',
                'phone',
                'email',
                'comerciales(name)',
                'business_units(name)'
            ].join(',');

            const isSearching = currentSearch && currentSearch.trim().length > 0;

            // Always request exact count
            let query = supabase
                .from('companies')
                .select(essentialFields, { count: 'exact' })
                .eq('is_active', true)
                .eq('tenant_id', tenantId);

            if (type) query = query.eq('company_type', type);
            query = applyRoleFilter(query);
            query = query.order('created_at', { ascending: false });

            if (isSearching) {
                // Global search: bypass pagination, filter server-side with ilike
                const term = `%${currentSearch.trim()}%`;
                query = query.or(`trade_name.ilike.${term},legal_name.ilike.${term},cuit.ilike.${term}`);
                // No .range() — return all matches
            } else {
                // Paginated browse: only fetch current page
                const from = currentPage * PAGE_SIZE;
                const to = from + PAGE_SIZE - 1;
                query = query.range(from, to);
            }

            const { data, count, error: fetchError } = await query;

            if (fetchError) {
                // PGRST303 = "Requested range not satisfiable" (page beyond total records)
                // Reset to page 0 instead of crashing
                if (fetchError.code === 'PGRST303') {
                    setPage(0);
                    return;
                }
                throw fetchError;
            }

            const normalized = (data || []).map(company => ({
                ...company,
                comercial_name: company.comerciales?.name || null,
                business_unit_name: company.business_units?.name || null,
            }));

            setCompanies(normalized);
            setTotalCount(count ?? 0);
            setError(null);
        } catch (err) {
            console.error('Error fetching companies:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [tenantId, type, applyRoleFilter]);

    useEffect(() => {
        // Wait for auth to finish loading before fetching
        if (authLoading) {
            setLoading(true);
            return;
        }

        // Wait for tenant to finish loading before proceeding
        if (tenantLoading) {
            setLoading(true);
            return;
        }

        // If no user or tenantId after loading finished, stop
        if (!user || !tenantId) {
            setLoading(false);
            return;
        }

        // OPTIMIZATION: Admin users don't need to wait for comercialId
        // They can see all data regardless of comercial_id
        if (isAdmin) {
            fetchCompanies(page, searchTerm);
            return;
        }

        // For non-admin users, wait for comercialId to be loaded
        if (!comercialIdLoaded) {
            setLoading(true);
            return;
        }

        fetchCompanies(page, debouncedSearch);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        // fetchCompanies is intentionally excluded: it's a useCallback that depends on
        // applyRoleFilter (which changes reference every render), including it would
        // cause an infinite loop. The remaining deps already cover all re-fetch triggers.
    }, [type, user, tenantId, tenantLoading, selectedComercialId, authLoading, comercialIdLoaded, isAdmin, page, debouncedSearch]);

    const createCompany = async (companyData) => {
        try {

            // Don't create if tenant_id is not available
            if (!tenantId) {
                console.error('❌ [createCompany] Tenant ID not available!');
                throw new Error('Tenant ID not available');
            }

            // Get current user's data for created_by
            const { data: { user: authUser } } = await supabase.auth.getUser();

            const dataToInsert = {
                ...companyData,
                tenant_id: tenantId,
                created_by: authUser?.id,
                is_active: true
            };


            const { data, error: insertError } = await supabase
                .from('companies')
                .insert([dataToInsert])
                .select()
                .single();

            if (insertError) {
                console.error('❌ [createCompany] Insert error:', insertError);

                // Provide user-friendly error messages
                if (insertError.code === '23505') {
                    if (
                        insertError.message.includes('companies_cuit_key') ||
                        insertError.message.includes('companies_cuit_active_per_tenant_idx')
                    ) {
                        throw new Error('Ya existe una empresa activa con este CUIT');
                    }
                    throw new Error('Ya existe una empresa con estos datos');
                }

                throw insertError;
            }

            await fetchCompanies(page, debouncedSearch);
            return { success: true, data };
        } catch (err) {
            console.error('❌ [createCompany] Error creating company:', err);
            return { success: false, error: err.message };
        }
    };

    /**
     * Generate the next available file_number for a new client
     * Format: LEG-XXXX (e.g., LEG-0001, LEG-0002)
     */
    const generateNextFileNumber = async () => {
        try {
            // Get the highest file_number from all clients in this tenant
            const { data, error } = await supabase
                .from('companies')
                .select('file_number')
                .eq('tenant_id', tenantId)
                .eq('company_type', 'client')
                .not('file_number', 'is', null)
                .order('file_number', { ascending: false })
                .limit(1);

            if (error) throw error;

            let nextNumber = 1;

            // If clients exist, extract the number and increment
            if (data && data.length > 0 && data[0].file_number) {
                // Extract number from format "LEG-0001" -> 1
                const match = data[0].file_number.match(/LEG-(\d+)/);
                if (match) {
                    const currentMax = parseInt(match[1], 10);
                    nextNumber = isNaN(currentMax) ? 1 : currentMax + 1;
                }
            }

            // Format as LEG-XXXX with 4-digit padding
            return `LEG-${String(nextNumber).padStart(4, '0')}`;
        } catch (err) {
            console.error('Error generating file_number:', err);
            // Fallback to timestamp-based number if query fails
            const fallbackNumber = Date.now() % 10000;
            return `LEG-${String(fallbackNumber).padStart(4, '0')}`;
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

            await fetchCompanies(page, debouncedSearch);
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

            await fetchCompanies(page, debouncedSearch);
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

            await fetchCompanies(page, searchTerm);
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
        // Pagination
        page,
        setPage,
        totalCount,
        pageSize: PAGE_SIZE,
        // Search (server-side)
        searchTerm,
        setSearchTerm,
        // Actions
        refetch: () => fetchCompanies(page, searchTerm),
        createCompany,
        updateCompany,
        deleteCompany,
        convertToClient,
        generateNextFileNumber,
        mapQualificationToStatus,
        mapStatusToQualification
    };
};

