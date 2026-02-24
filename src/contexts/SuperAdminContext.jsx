/**
 * SuperAdminContext — Impersonation layer for super_admin users.
 *
 * When a super_admin "enters" a tenant, viewingTenantId is set to that
 * tenant's ID. All data hooks that use tenant_id should prefer this value
 * over the user's own tenant_id when set.
 *
 * Stored in sessionStorage so a page refresh keeps the impersonation active.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

const SuperAdminContext = createContext(null);

const SESSION_KEY = 'sailo_viewing_tenant';

export function SuperAdminProvider({ children }) {
    const [viewingTenant, setViewingTenant] = useState(() => {
        try {
            const stored = sessionStorage.getItem(SESSION_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    /** Enter a tenant as the super_admin. Pass { id, name } */
    const enterTenant = useCallback((tenant) => {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(tenant));
        setViewingTenant(tenant);
    }, []);

    /** Return to Sailo admin view */
    const exitTenant = useCallback(() => {
        sessionStorage.removeItem(SESSION_KEY);
        setViewingTenant(null);
    }, []);

    return (
        <SuperAdminContext.Provider value={{ viewingTenant, enterTenant, exitTenant }}>
            {children}
        </SuperAdminContext.Provider>
    );
}

export function useSuperAdmin() {
    const ctx = useContext(SuperAdminContext);
    if (!ctx) throw new Error('useSuperAdmin must be used inside SuperAdminProvider');
    return ctx;
}
