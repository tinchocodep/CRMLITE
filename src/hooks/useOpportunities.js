import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useOpportunities = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { comercialId, isAdmin, isSupervisor } = useAuth();

    const fetchOpportunities = async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('active_opportunities')
                .select('*')
                .order('close_date', { ascending: true });

            if (fetchError) throw fetchError;
            setOpportunities(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching opportunities:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (comercialId || isAdmin || isSupervisor) {
            fetchOpportunities();
        }
    }, [comercialId, isAdmin, isSupervisor]);

    const createOpportunity = async (opportunityData) => {
        try {
            // Get current user's tenant_id
            const { data: { user } } = await supabase.auth.getUser();
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('tenant_id')
                .eq('id', user.id)
                .single();

            if (userError) throw userError;

            const { data, error: createError } = await supabase
                .from('opportunities')
                .insert([{
                    ...opportunityData,
                    tenant_id: userData.tenant_id,
                    comercial_id: opportunityData.comercial_id || comercialId || null,
                    created_by: user.id
                }])
                .select()
                .single();

            if (createError) throw createError;
            await fetchOpportunities();
            return { success: true, data };
        } catch (err) {
            console.error('Error creating opportunity:', err);
            return { success: false, error: err.message };
        }
    };

    const updateOpportunity = async (id, updates) => {
        try {
            const { data, error: updateError } = await supabase
                .from('opportunities')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;
            await fetchOpportunities();
            return { success: true, data };
        } catch (err) {
            console.error('Error updating opportunity:', err);
            return { success: false, error: err.message };
        }
    };

    const deleteOpportunity = async (id) => {
        try {
            const { error: deleteError } = await supabase
                .from('opportunities')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            await fetchOpportunities();
            return { success: true };
        } catch (err) {
            console.error('Error deleting opportunity:', err);
            return { success: false, error: err.message };
        }
    };

    return {
        opportunities,
        loading,
        error,
        refetch: fetchOpportunities,
        createOpportunity,
        updateOpportunity,
        deleteOpportunity
    };
};
