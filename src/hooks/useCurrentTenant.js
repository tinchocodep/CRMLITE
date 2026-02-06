import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook to get the current user's tenant_id
 * This provides a second layer of security on top of RLS (Row Level Security)
 * 
 * @returns {Object} { tenantId, loading, error }
 */
export function useCurrentTenant() {
    const [tenantId, setTenantId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTenantId = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get current authenticated user
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError) throw authError;

                if (!user) {
                    setTenantId(null);
                    setLoading(false);
                    return;
                }

                // Fetch user's tenant_id from the users table
                const { data, error: fetchError } = await supabase
                    .from('users')
                    .select('tenant_id')
                    .eq('id', user.id)
                    .single();

                if (fetchError) throw fetchError;

                setTenantId(data?.tenant_id);
            } catch (err) {
                console.error('Error fetching tenant_id:', err);
                setError(err.message);
                setTenantId(null);
            } finally {
                setLoading(false);
            }
        };

        fetchTenantId();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchTenantId();
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    return { tenantId, loading, error };
}
