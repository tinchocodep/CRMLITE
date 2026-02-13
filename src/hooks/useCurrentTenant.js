import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to get the current user's tenant_id from AuthContext
 * This avoids making a separate Supabase query and prevents AbortError issues
 */
export function useCurrentTenant() {
    const { userProfile, isLoading: authLoading } = useAuth();
    const [tenantId, setTenantId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Wait for auth to finish loading
        if (authLoading) {
            setLoading(true);
            return;
        }

        // Once auth is loaded, extract tenant_id from userProfile
        if (userProfile?.tenant_id) {
            setTenantId(userProfile.tenant_id);
            setError(null);
        } else if (userProfile) {
            // User is logged in but has no tenant_id
            setTenantId(null);
            setError(new Error('User has no tenant_id'));
        } else {
            // No user logged in
            setTenantId(null);
            setError(null);
        }

        setLoading(false);
    }, [authLoading, userProfile]);

    return { tenantId, loading, error };
}
