import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentTenant } from './useCurrentTenant';

export const useLots = () => {
    const [lots, setLots] = useState([]);
    // `loading` = true only on the very first fetch (mounts the skeleton)
    // `refreshing` = true on subsequent silent refreshes (map stays mounted)
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const { tenantId } = useCurrentTenant();

    /**
     * fetchLots — fetches all lots for the current tenant.
     * @param {boolean} silent - if true, uses `refreshing` instead of `loading`
     *   so the map is never unmounted during updates.
     */
    const fetchLots = useCallback(async (silent = false) => {
        if (!tenantId) {
            setLots([]);
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
                .from('lots')
                .select(`
                    *,
                    establishment:establishments(id, name, company:companies(id, legal_name, trade_name, comercial_id, comercial:comerciales(id, name)))
                `)
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setLots(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching lots:', err);
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [tenantId]);

    useEffect(() => {
        // Initial load (non-silent → shows skeleton)
        fetchLots(false);

        // Real-time subscription — uses silent refresh so the map stays mounted.
        // NOTE: mutations (createLot, updateLot, deleteLot) do NOT call fetchLots
        // manually anymore. The realtime event handles the refresh automatically,
        // preventing the double-fetch that was causing the map to flicker.
        const subscription = supabase
            .channel('lots_changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'lots',
                    filter: `tenant_id=eq.${tenantId}`
                },
                () => {
                    fetchLots(true); // silent refresh
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [tenantId, fetchLots]);

    const createLot = useCallback(async (lotData) => {
        if (!tenantId || !user) {
            return { success: false, error: 'Missing tenant or user' };
        }

        try {
            const { data, error: insertError } = await supabase
                .from('lots')
                .insert([{
                    ...lotData,
                    tenant_id: tenantId,
                    created_by: user.id
                }])
                .select(`
                    *,
                    establishment:establishments(id, name, company:companies(id, legal_name, trade_name, comercial_id, comercial:comerciales(id, name)))
                `)
                .single();

            if (insertError) throw insertError;

            // Optimistic update: add the new lot to local state immediately
            setLots(prev => [data, ...prev]);
            return { success: true, data };
        } catch (err) {
            console.error('Error creating lot:', err);
            return { success: false, error: err.message };
        }
    }, [tenantId, user]);

    const updateLot = useCallback(async (id, updates) => {
        try {
            const { data, error: updateError } = await supabase
                .from('lots')
                .update(updates)
                .eq('id', id)
                .eq('tenant_id', tenantId)
                .select(`
                    *,
                    establishment:establishments(id, name, company:companies(id, legal_name, trade_name, comercial_id, comercial:comerciales(id, name)))
                `)
                .single();

            if (updateError) throw updateError;

            // Optimistic update: replace the updated lot in local state immediately
            setLots(prev => prev.map(l => l.id === id ? data : l));
            return { success: true };
        } catch (err) {
            console.error('Error updating lot:', err);
            return { success: false, error: err.message };
        }
    }, [tenantId]);

    const deleteLot = useCallback(async (id) => {
        try {
            const { error: deleteError } = await supabase
                .from('lots')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenantId);

            if (deleteError) throw deleteError;

            // Optimistic update: remove immediately from local state
            setLots(prev => prev.filter(l => l.id !== id));

            // Also trigger a silent re-fetch so derived totals (e.g. hectares per
            // comercial in the Sidebar) sync without waiting for the Realtime event.
            fetchLots(true);

            return { success: true };
        } catch (err) {
            console.error('Error deleting lot:', err);
            return { success: false, error: err.message };
        }
    }, [tenantId, fetchLots]);

    return {
        lots,
        loading,
        refreshing,
        error,
        refetch: fetchLots,
        createLot,
        updateLot,
        deleteLot
    };
};
