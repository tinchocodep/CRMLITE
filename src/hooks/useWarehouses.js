import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentTenant } from './useCurrentTenant';

/**
 * useWarehouses — CRUD de depósitos por tenant.
 * La tabla `warehouses` tiene RLS: cada usuario solo ve los de su tenant.
 */
export const useWarehouses = () => {
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { tenantId, loading: tenantLoading } = useCurrentTenant();

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchWarehouses = useCallback(async () => {
        if (!tenantId) {
            setWarehouses([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('warehouses')
                .select('id, name, address, notes, is_active, created_at')
                .eq('tenant_id', tenantId)
                .eq('is_active', true)
                .order('name', { ascending: true });

            if (fetchError) throw fetchError;
            setWarehouses(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching warehouses:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        if (!tenantLoading) fetchWarehouses();
    }, [tenantId, tenantLoading, fetchWarehouses]);

    // ── Create ────────────────────────────────────────────────────────────────
    /**
     * Guarda un nuevo depósito para el tenant actual.
     * Si ya existe un depósito con ese nombre (case-insensitive), lo devuelve sin duplicar.
     * @param {string} name - Nombre del depósito
     * @param {string} [address] - Dirección opcional
     * @param {string} [notes]   - Notas opcionales
     * @returns {{ success: boolean, data?: object, error?: string }}
     */
    const createWarehouse = async (name, address = '', notes = '') => {
        if (!tenantId) return { success: false, error: 'Sin tenant activo' };
        const trimmedName = name.trim();
        if (!trimmedName) return { success: false, error: 'El nombre es requerido' };

        try {
            // Intento de upsert: si ya existe el mismo nombre para el tenant, no falla
            const { data, error: insertError } = await supabase
                .from('warehouses')
                .insert([{ tenant_id: tenantId, name: trimmedName, address: address.trim() || null, notes: notes.trim() || null }])
                .select()
                .single();

            if (insertError) {
                // Código 23505 = unique_violation (nombre duplicado)
                if (insertError.code === '23505') {
                    return { success: false, error: `Ya existe un depósito llamado "${trimmedName}"` };
                }
                throw insertError;
            }

            await fetchWarehouses();
            return { success: true, data };
        } catch (err) {
            console.error('Error creating warehouse:', err);
            return { success: false, error: err.message };
        }
    };

    // ── Delete (soft) ─────────────────────────────────────────────────────────
    const deleteWarehouse = async (id) => {
        try {
            const { error: updateError } = await supabase
                .from('warehouses')
                .update({ is_active: false })
                .eq('id', id);

            if (updateError) throw updateError;
            await fetchWarehouses();
            return { success: true };
        } catch (err) {
            console.error('Error deleting warehouse:', err);
            return { success: false, error: err.message };
        }
    };

    return {
        warehouses,
        loading,
        error,
        createWarehouse,
        deleteWarehouse,
        refetch: fetchWarehouses,
    };
};
