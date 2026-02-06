import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentTenant } from './useCurrentTenant';

export const useComerciales = () => {
    const [comerciales, setComerciales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user, isAdmin } = useAuth();
    const { tenantId } = useCurrentTenant();

    const fetchComerciales = async () => {
        if (!tenantId) {
            setComerciales([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const { data, error: fetchError } = await supabase
                .from('comerciales')
                .select(`
                    id,
                    name,
                    email,
                    phone,
                    is_active,
                    created_at,
                    tenant_id,
                    user_id,
                    user:users(id, email, full_name, role)
                `)
                .eq('tenant_id', tenantId)
                .order('name');

            if (fetchError) throw fetchError;

            setComerciales(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching comerciales:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchComerciales();
        }
    }, [tenantId]);

    const createComercial = async (comercialData) => {
        if (!isAdmin) {
            return { success: false, error: 'Unauthorized' };
        }

        try {
            const { data, error: createError } = await supabase
                .from('comerciales')
                .insert([{
                    name: comercialData.name,
                    email: comercialData.email,
                    phone: comercialData.phone || null,
                    tenant_id: tenantId,
                    is_active: true,
                    user_id: comercialData.userId || null
                }])
                .select()
                .single();

            if (createError) throw createError;

            await fetchComerciales();
            return { success: true, data };
        } catch (err) {
            console.error('Error creating comercial:', err);
            return { success: false, error: err.message };
        }
    };

    const updateComercial = async (comercialId, updates) => {
        if (!isAdmin) {
            return { success: false, error: 'Unauthorized' };
        }

        try {
            const { error: updateError } = await supabase
                .from('comerciales')
                .update({
                    name: updates.name,
                    email: updates.email,
                    phone: updates.phone || null,
                    is_active: updates.is_active !== undefined ? updates.is_active : true
                })
                .eq('id', comercialId);

            if (updateError) throw updateError;

            await fetchComerciales();
            return { success: true };
        } catch (err) {
            console.error('Error updating comercial:', err);
            return { success: false, error: err.message };
        }
    };

    const toggleComercialActive = async (comercialId, isActive) => {
        if (!isAdmin) {
            return { success: false, error: 'Unauthorized' };
        }

        try {
            const { error: updateError } = await supabase
                .from('comerciales')
                .update({ is_active: isActive })
                .eq('id', comercialId);

            if (updateError) throw updateError;

            await fetchComerciales();
            return { success: true };
        } catch (err) {
            console.error('Error toggling comercial active:', err);
            return { success: false, error: err.message };
        }
    };

    const linkUserToComercial = async (comercialId, userId) => {
        if (!isAdmin) {
            return { success: false, error: 'Unauthorized' };
        }

        try {
            // Update comercial with user_id
            const { error: comercialError } = await supabase
                .from('comerciales')
                .update({ user_id: userId })
                .eq('id', comercialId);

            if (comercialError) throw comercialError;

            // Update user with comercial_id
            const { error: userError } = await supabase
                .from('users')
                .update({ comercial_id: comercialId })
                .eq('id', userId);

            if (userError) throw userError;

            await fetchComerciales();
            return { success: true };
        } catch (err) {
            console.error('Error linking user to comercial:', err);
            return { success: false, error: err.message };
        }
    };

    return {
        comerciales,
        loading,
        error,
        refetch: fetchComerciales,
        createComercial,
        updateComercial,
        toggleComercialActive,
        linkUserToComercial
    };
};
