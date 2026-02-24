import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentTenant } from './useCurrentTenant';

/**
 * useTenantModules
 *
 * Fetches the enabled module keys for the effective tenant.
 * Respects super_admin impersonation via useCurrentTenant.
 * Returns a Set<string> for O(1) lookups.
 *
 * Policy: Whitelist — a module is only visible if it has an
 * entry in `tenant_modules` with `is_enabled = true`.
 */
export function useTenantModules() {
    const { tenantId, loading: tenantLoading } = useCurrentTenant();
    const [enabledModules, setEnabledModules] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Wait for tenant to fully resolve
        if (tenantLoading) return;

        if (!tenantId) {
            setEnabledModules(new Set());
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        const fetchModules = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('tenant_modules')
                    .select('module_key')
                    .eq('tenant_id', tenantId)
                    .eq('is_enabled', true);

                if (error) throw error;

                if (!cancelled) {
                    const moduleKeys = new Set(data.map(row => row.module_key));
                    setEnabledModules(moduleKeys);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('[useTenantModules] Error fetching modules:', err);
                    // On error, show nothing — fail safe (whitelist policy)
                    setEnabledModules(new Set());
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchModules();

        return () => { cancelled = true; };
    }, [tenantId, tenantLoading]);

    return { enabledModules, isLoading };
}
