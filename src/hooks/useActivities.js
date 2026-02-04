import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useActivities = (daysAhead = 30) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { comercialId, isAdmin, isSupervisor } = useAuth();

    const fetchActivities = async () => {
        try {
            setLoading(true);

            // Calculate date range using local timezone
            const todayDate = new Date();
            const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

            const futureDateObj = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
            const futureDate = `${futureDateObj.getFullYear()}-${String(futureDateObj.getMonth() + 1).padStart(2, '0')}-${String(futureDateObj.getDate()).padStart(2, '0')}`;

            const { data, error: fetchError } = await supabase
                .from('activities')
                .select(`
                    *,
                    company:companies!activities_company_id_fkey(id, legal_name, trade_name),
                    comercial:comerciales!activities_comercial_id_fkey(id, name)
                `)
                .gte('scheduled_date', today)
                .lte('scheduled_date', futureDate)
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

    useEffect(() => {
        if (comercialId || isAdmin || isSupervisor) {
            fetchActivities();
        }
    }, [comercialId, daysAhead, isAdmin, isSupervisor]);

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
                    comercial_id: activityData.comercial_id || userData.comercial_id,
                    created_by: user.id
                }])
                .select()
                .single();

            if (createError) throw createError;
            await fetchActivities();
            return { success: true, data };
        } catch (err) {
            console.error('Error creating activity:', err);
            return { success: false, error: err.message };
        }
    };

    const updateActivity = async (id, updates) => {
        try {
            const { data, error: updateError } = await supabase
                .from('activities')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;
            await fetchActivities();
            return { success: true, data };
        } catch (err) {
            console.error('Error updating activity:', err);
            return { success: false, error: err.message };
        }
    };

    const completeActivity = async (id) => {
        return updateActivity(id, { status: 'completed' });
    };

    const deleteActivity = async (id) => {
        try {
            const { error: deleteError } = await supabase
                .from('activities')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            await fetchActivities();
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
