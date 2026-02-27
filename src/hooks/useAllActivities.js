import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentTenant } from './useCurrentTenant';

/**
 * useAllActivities — Fetches ALL activities for the Actividades page.
 * Unlike useActivities (Agenda), this does NOT filter by date range or exclude completed.
 * Provides completeActivity, updateActivity, deleteActivity mutations.
 */
export const useAllActivities = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { comercialId, isAdmin, isSupervisor, isLoading: authLoading, comercialIdLoaded } = useAuth();
    const { tenantId, loading: tenantLoading } = useCurrentTenant();

    const channelNameRef = useRef(`all-activities-rt-${Date.now()}-${Math.random()}`);
    const rtDebounceRef = useRef(null);

    const fetchActivities = useCallback(async ({ silent = false } = {}) => {
        if (!tenantId) {
            setActivities([]);
            setLoading(false);
            return;
        }

        try {
            if (!silent) setLoading(true);

            let query = supabase
                .from('activities')
                .select(`
                    *,
                    company:companies!activities_company_id_fkey(id, legal_name, trade_name),
                    contact:contacts!activities_contact_id_fkey(id, first_name, last_name),
                    comercial:comerciales!activities_comercial_id_fkey(id, name)
                `)
                .eq('tenant_id', tenantId);

            // Role-based scoping
            if (!isAdmin && !isSupervisor && comercialId) {
                query = query.eq('comercial_id', comercialId);
            }

            const { data, error: fetchError } = await query
                .order('scheduled_date', { ascending: false })
                .order('scheduled_time', { ascending: false });

            if (fetchError) throw fetchError;

            const formatted = (data || []).map(activity => ({
                ...activity,
                clientName: activity.company?.trade_name || activity.company?.legal_name || 'Sin asignar',
                contactName: activity.contact
                    ? `${activity.contact.first_name} ${activity.contact.last_name}`
                    : null,
                comercialName: activity.comercial?.name || 'Sin asignar',
            }));

            setActivities(formatted);
            setError(null);
        } catch (err) {
            console.error('[useAllActivities] Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [tenantId, isAdmin, isSupervisor, comercialId]);

    // Fetch on mount and when dependencies change
    useEffect(() => {
        if (authLoading) { setLoading(true); return; }
        if (!isAdmin && !isSupervisor && !comercialIdLoaded) { setLoading(true); return; }

        if (tenantId && (comercialId || isAdmin || isSupervisor)) {
            fetchActivities();
        } else if (!tenantLoading) {
            setLoading(false);
        }
    }, [comercialId, isAdmin, isSupervisor, tenantId, tenantLoading, authLoading, comercialIdLoaded, fetchActivities]);

    // Realtime
    const fetchRef = useRef(fetchActivities);
    useEffect(() => { fetchRef.current = fetchActivities; });

    useEffect(() => {
        if (!tenantId) return;
        const channel = supabase
            .channel(channelNameRef.current)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => {
                clearTimeout(rtDebounceRef.current);
                rtDebounceRef.current = setTimeout(() => fetchRef.current({ silent: true }), 50);
            })
            .subscribe();
        return () => {
            clearTimeout(rtDebounceRef.current);
            supabase.removeChannel(channel);
        };
    }, [tenantId]);

    // ─── Mutations ──────────────────────────────────────────────────────────────

    const updateActivity = useCallback(async (id, updates) => {
        try {
            const { error: updateError } = await supabase
                .from('activities')
                .update(updates)
                .eq('id', id)
                .eq('tenant_id', tenantId);

            if (updateError) throw updateError;
            setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
            return { success: true };
        } catch (err) {
            console.error('[useAllActivities] Error updating:', err);
            return { success: false, error: err.message };
        }
    }, [tenantId]);

    const completeActivity = useCallback(async (id, currentStatus) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        return updateActivity(id, { status: newStatus });
    }, [updateActivity]);

    const deleteActivity = useCallback(async (id) => {
        setActivities(prev => prev.filter(a => a.id !== id));
        try {
            const { error: deleteError } = await supabase
                .from('activities')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenantId);

            if (deleteError) {
                fetchActivities({ silent: true }); // rollback
                throw deleteError;
            }
            return { success: true };
        } catch (err) {
            console.error('[useAllActivities] Error deleting:', err);
            return { success: false, error: err.message };
        }
    }, [tenantId, fetchActivities]);

    return {
        activities,
        loading,
        error,
        refetch: fetchActivities,
        updateActivity,
        completeActivity,
        deleteActivity,
    };
};
