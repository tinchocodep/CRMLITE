import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentTenant } from './useCurrentTenant';

export const useActivities = (daysAhead = 30) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { comercialId, isAdmin, isSupervisor, isLoading: authLoading, comercialIdLoaded } = useAuth();
    const { tenantId, loading: tenantLoading } = useCurrentTenant();
    // Unique channel name per instance to prevent Supabase from deduplicating channels
    // across components (e.g. Agenda.jsx and RightSidebarAgenda both using useActivities)
    const channelNameRef = useRef(`activities-rt-${Date.now()}-${Math.random()}`);
    // Debounce timer: consolidates rapid Realtime events into a single refetch
    const rtDebounceRef = useRef(null);

    const fetchActivities = async ({ silent = false } = {}) => {
        try {
            // Don't fetch if tenant_id is not available yet
            if (!tenantId) {
                setActivities([]);
                setLoading(false);
                return;
            }

            if (!silent) setLoading(true);

            // Calculate date range using local timezone
            const todayDate = new Date();
            const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

            const futureDateObj = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
            const futureDate = `${futureDateObj.getFullYear()}-${String(futureDateObj.getMonth() + 1).padStart(2, '0')}-${String(futureDateObj.getDate()).padStart(2, '0')}`;

            // Build query
            let query = supabase
                .from('activities')
                .select(`
                    *,
                    company:companies!activities_company_id_fkey(id, legal_name, trade_name),
                    comercial:comerciales!activities_comercial_id_fkey(id, name)
                `)
                .eq('tenant_id', tenantId)
                .neq('status', 'completed')  // Exclude completed activities from agenda
                .gte('scheduled_date', today)
                .lte('scheduled_date', futureDate);

            // Filter by comercial_id for non-admin/non-supervisor users
            // Admins and supervisors see all activities in their tenant
            // Regular comerciales see only their own activities
            if (!isAdmin && !isSupervisor && comercialId) {
                query = query.eq('comercial_id', comercialId);
            }

            const { data, error: fetchError } = await query
                .order('scheduled_date', { ascending: true })
                .order('scheduled_time', { ascending: true });

            if (fetchError) throw fetchError;

            // Format data to match expected structure
            const formattedData = (data || []).map(activity => ({
                ...activity,
                client: activity.company?.trade_name || activity.company?.legal_name || 'Sin nombre',
                comercial_name: activity.comercial?.name || 'Sin asignar'
            }));

            setActivities(formattedData);
            setError(null);
        } catch (err) {
            console.error('Error fetching activities:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Ref to always hold the latest fetchActivities (avoids stale closure in realtime)
    const fetchActivitiesRef = useRef(fetchActivities);
    useEffect(() => {
        fetchActivitiesRef.current = fetchActivities;
    });

    useEffect(() => {
        // Wait for auth to finish loading before fetching
        if (authLoading) {
            setLoading(true);
            return;
        }

        // For non-admin/non-supervisor users, wait for comercialId to be loaded
        if (!isAdmin && !isSupervisor && !comercialIdLoaded) {
            setLoading(true);
            return;
        }

        if (tenantId && (comercialId || isAdmin || isSupervisor)) {
            fetchActivities();
        } else if (!tenantLoading) {
            setLoading(false);
        }
    }, [comercialId, daysAhead, isAdmin, isSupervisor, tenantId, tenantLoading, authLoading, comercialIdLoaded]);

    // Realtime subscription: auto-refresh when activities change (insert/update/delete)
    useEffect(() => {
        if (!tenantId) return;

        const channel = supabase
            .channel(channelNameRef.current)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'activities',
            }, () => {
                // Debounce: wait 300ms after last event so concurrent inserts
                // (e.g. opportunity creating 2 activities at once) share one refetch
                clearTimeout(rtDebounceRef.current);
                rtDebounceRef.current = setTimeout(() => {
                    fetchActivitiesRef.current({ silent: true });
                }, 50);
            })
            .subscribe();

        return () => {
            clearTimeout(rtDebounceRef.current);
            supabase.removeChannel(channel);
        };
    }, [tenantId]);

    const createActivity = async (activityData) => {
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
                .from('activities')
                .insert([{
                    ...activityData,
                    tenant_id: userData.tenant_id,
                    comercial_id: activityData.comercial_id || userData.comercial_id
                }])
                .select()
                .single();

            if (createError) throw createError;
            // Optimistic: add to local state immediately
            setActivities(prev => [data, ...prev]);
            return { success: true, data };
        } catch (err) {
            console.error('Error creating activity:', err);
            return { success: false, error: err.message };
        }
    };

    const updateActivity = async (id, updates) => {
        try {
            const { error: updateError } = await supabase
                .from('activities')
                .update(updates)
                .eq('id', id);

            if (updateError) throw updateError;
            // Optimistic: patch local state immediately
            setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
            return { success: true };
        } catch (err) {
            console.error('Error updating activity:', err);
            return { success: false, error: err.message };
        }
    };

    const completeActivity = async (id) => {
        return updateActivity(id, { status: 'completed' });
    };

    const deleteActivity = async (id) => {
        // TRUE optimistic: remove from UI immediately, before the async DB call
        setActivities(prev => prev.filter(a => a.id !== id));
        try {
            const { error: deleteError } = await supabase
                .from('activities')
                .delete()
                .eq('id', id);

            if (deleteError) {
                // Rollback: re-add the deleted item via fresh fetch
                fetchActivities({ silent: true });
                throw deleteError;
            }
            return { success: true };
        } catch (err) {
            console.error('Error deleting activity:', err);
            return { success: false, error: err.message };
        }
    };

    return {
        activities,
        loading,
        error,
        refetch: fetchActivities,
        createActivity,
        updateActivity,
        completeActivity,
        deleteActivity
    };
};
