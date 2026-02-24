import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentTenant } from './useCurrentTenant';

export const useEstablishments = () => {
    const [establishments, setEstablishments] = useState([]);
    // `loading` = true only on the very first fetch
    // `refreshing` = true on subsequent silent refreshes
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const { tenantId } = useCurrentTenant();

    /**
     * fetchEstablishments
     * @param {boolean} silent - if true, uses `refreshing` so the UI stays stable
     */
    const fetchEstablishments = useCallback(async (silent = false) => {
        if (!tenantId) {
            setEstablishments([]);
            setLoading(false);
            return;
        }

        try {
            if (silent) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const { data, error: fetchError } = await supabase
                .from('establishments')
                .select(`
                    *,
                    company:companies(id, legal_name, trade_name, cuit)
                `)
                .eq('tenant_id', tenantId)
                .order('name');

            if (fetchError) throw fetchError;
            setEstablishments(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching establishments:', err);
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [tenantId]);

    useEffect(() => {
        fetchEstablishments(false);
    }, [fetchEstablishments]);

    const createEstablishment = useCallback(async (establishmentData) => {
        if (!tenantId || !user) {
            return { success: false, error: 'Missing tenant or user' };
        }

        try {
            const { data, error: insertError } = await supabase
                .from('establishments')
                .insert([{
                    ...establishmentData,
                    tenant_id: tenantId,
                    created_by: user.id
                }])
                .select()
                .single();

            if (insertError) throw insertError;
            // Silent refresh — no loading spinner
            await fetchEstablishments(true);
            return { success: true, data };
        } catch (err) {
            console.error('Error creating establishment:', err);
            return { success: false, error: err.message };
        }
    }, [tenantId, user, fetchEstablishments]);

    const updateEstablishment = useCallback(async (id, updates) => {
        try {
            const { error: updateError } = await supabase
                .from('establishments')
                .update(updates)
                .eq('id', id)
                .eq('tenant_id', tenantId);

            if (updateError) throw updateError;
            // Silent refresh
            await fetchEstablishments(true);
            return { success: true };
        } catch (err) {
            console.error('Error updating establishment:', err);
            return { success: false, error: err.message };
        }
    }, [tenantId, fetchEstablishments]);

    const deleteEstablishment = useCallback(async (id) => {
        try {
            const { error: deleteError } = await supabase
                .from('establishments')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenantId);

            if (deleteError) throw deleteError;
            // Silent refresh
            await fetchEstablishments(true);
            return { success: true };
        } catch (err) {
            console.error('Error deleting establishment:', err);
            return { success: false, error: err.message };
        }
    }, [tenantId, fetchEstablishments]);

    return {
        establishments,
        loading,
        refreshing,
        error,
        refetch: fetchEstablishments,
        createEstablishment,
        updateEstablishment,
        deleteEstablishment
    };
};
