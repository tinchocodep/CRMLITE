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

/**
 * All toggleable modules per tenant.
 * These map 1:1 with sidebarModules in VerticalSidebar.jsx.
 * Inactive modules simply don't appear in the sidebar.
 */
export const AVAILABLE_MODULES = [
    { key: 'crm', label: 'CRM', description: 'Prospectos, Clientes, Contactos' },
    { key: 'cotizador', label: 'Cotizador', description: 'Cotizaciones y pedidos' },
    { key: 'comercial', label: 'Administracion', description: 'Stock y comprobantes' },
    { key: 'usuarios', label: 'Usuarios', description: 'Gestion de usuarios' },
    { key: 'visitas', label: 'Actividades', description: 'Registro de actividades' },
    { key: 'campos', label: 'Campos', description: 'Territorios y establecimientos' },
    { key: 'logistica', label: 'Logistica', description: 'Gestion logistica' },
    { key: 'rrhh', label: 'RRHH', description: 'Recursos Humanos' },
    { key: 'reportes', label: 'Reportes', description: 'Reportes y analitica avanzada' },
];
