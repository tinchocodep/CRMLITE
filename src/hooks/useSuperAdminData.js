/**
 * useSuperAdmin — Data hook for super_admin operations.
 * Reads all tenants and provides module toggle functionality.
 * Should only be called when role === 'super_admin'.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useSuperAdminData() {
    const [tenants, setTenants] = useState([]);
    const [tenantModules, setTenantModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [tenantsRes, modulesRes] = await Promise.all([
                supabase.from('tenants').select('*').order('id'),
                supabase.from('tenant_modules').select('*'),
            ]);

            if (tenantsRes.error) throw tenantsRes.error;
            if (modulesRes.error) throw modulesRes.error;

            setTenants(tenantsRes.data ?? []);
            setTenantModules(modulesRes.data ?? []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    /**
     * Toggle a module for a tenant. Creates or updates the tenant_modules row.
     */
    const toggleModule = useCallback(async (tenantId, moduleKey, enabled) => {
        const { error } = await supabase
            .from('tenant_modules')
            .upsert({ tenant_id: tenantId, module_key: moduleKey, is_enabled: enabled },
                { onConflict: 'tenant_id,module_key' });

        if (error) throw error;

        // Optimistic update
        setTenantModules(prev => {
            const exists = prev.find(m => m.tenant_id === tenantId && m.module_key === moduleKey);
            if (exists) {
                return prev.map(m =>
                    m.tenant_id === tenantId && m.module_key === moduleKey
                        ? { ...m, is_enabled: enabled }
                        : m
                );
            }
            return [...prev, { tenant_id: tenantId, module_key: moduleKey, is_enabled: enabled }];
        });
    }, []);

    /** Returns a Set of enabled module_keys for a given tenantId */
    const getEnabledModules = useCallback((tenantId) => {
        return new Set(
            tenantModules
                .filter(m => m.tenant_id === tenantId && m.is_enabled)
                .map(m => m.module_key)
        );
    }, [tenantModules]);

    return { tenants, tenantModules, loading, error, toggleModule, getEnabledModules, refetch: fetchAll };
}

/** All modules toggleable per tenant. Active = ON, inactive = OFF (but activatable). */
export const AVAILABLE_MODULES = [
    { key: 'crm', label: 'CRM', description: 'Prospectos, Clientes, Contactos' },
    { key: 'cotizador', label: 'Cotizador', description: 'Cotizaciones y pedidos' },
    { key: 'comercial', label: 'Administración', description: 'Stock y comprobantes' },
    { key: 'usuarios', label: 'Usuarios', description: 'Gestión de usuarios' },
    { key: 'visitas', label: 'Visitas', description: 'Registro de visitas a campo' },
    { key: 'campos', label: 'Campos', description: 'Territorios y establecimientos' },
];

