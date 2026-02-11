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
        let abortController = new AbortController();

        const fetchTenantId = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get current authenticated user
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError) throw authError;

                // Check if request was aborted
                if (abortController.signal.aborted) return;

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

                // Check if request was aborted before setting state
                if (!abortController.signal.aborted) {
                    setTenantId(data?.tenant_id);
                }
            } catch (err) {
                // Only log errors if not aborted
                if (!abortController.signal.aborted) {
                    console.error('Error fetching tenant_id:', err);
                    setError(err.message);
                    setTenantId(null);
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchTenantId();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            // Cancel previous request
            abortController.abort();
            // Create new controller for new request
            abortController = new AbortController();
            fetchTenantId();
        });

        return () => {
            abortController.abort();
            subscription?.unsubscribe();
        };
    }, []);

    return { tenantId, loading, error };
}
