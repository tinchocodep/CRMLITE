import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSuperAdmin } from '../contexts/SuperAdminContext';

/**
 * useCurrentTenant — Returns the effective tenant_id for the current session.
 *
 * Normal users:     returns their userProfile.tenant_id
 * Super admin:      returns userProfile.tenant_id unless they are impersonating
 *                   a tenant (viewingTenant is set), in which case returns
 *                   viewingTenant.id so ALL data hooks see the correct tenant.
 */
export function useCurrentTenant() {
    const { userProfile, isLoading: authLoading } = useAuth();
    const { viewingTenant } = useSuperAdmin();

    const [tenantId, setTenantId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (authLoading) {
            setLoading(true);
            return;
        }

        // Super admin impersonating a tenant → use that tenant's ID
        if (viewingTenant?.id) {
            setTenantId(viewingTenant.id);
            setError(null);
            setLoading(false);
            return;
        }

        // Normal path: use the user's own tenant_id
        if (userProfile?.tenant_id) {
            setTenantId(userProfile.tenant_id);
            setError(null);
        } else if (userProfile) {
            setTenantId(null);
            setError(new Error('User has no tenant_id'));
        } else {
            setTenantId(null);
            setError(null);
        }

        setLoading(false);
    }, [authLoading, userProfile, viewingTenant]);

    return { tenantId, loading, error };
}
