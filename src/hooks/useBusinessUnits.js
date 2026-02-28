import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentTenant } from './useCurrentTenant';

/**
 * Hook for managing Business Units (Unidades de Negocio)
 * CRUD operations with tenant isolation
 */
const useBusinessUnits = () => {
    const { tenantId } = useCurrentTenant();
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUnits = useCallback(async () => {
        if (!tenantId) return;

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('business_units')
                .select(`
                    id, name, created_at, updated_at,
                    business_unit_members (
                        id, comercial_id,
                        comerciales:comercial_id ( id, name, email )
                    )
                `)
                .eq('tenant_id', tenantId)
                .order('name');

            if (fetchError) throw fetchError;

            // Transform data to a more usable shape
            const transformed = (data || []).map(unit => ({
                ...unit,
                members: (unit.business_unit_members || []).map(m => ({
                    id: m.comercial_id,
                    name: m.comerciales?.name || 'Desconocido',
                    email: m.comerciales?.email || '',
                    memberId: m.id,
                })),
            }));

            setUnits(transformed);
        } catch (err) {
            console.error('Error fetching business units:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        fetchUnits();
    }, [fetchUnits]);

    /**
     * Create a new business unit with members
     * @param {string} name - Unit name
     * @param {string[]} comercialIds - Array of comercial UUIDs
     * @returns {Object} Created unit
     */
    const createUnit = async (name, comercialIds = []) => {
        if (!tenantId) throw new Error('No tenant context');
        if (!name?.trim()) throw new Error('El nombre es requerido');
        if (comercialIds.length < 2) throw new Error('Se requieren al menos 2 comerciales');

        try {
            // 1. Create the business unit
            const { data: unit, error: unitError } = await supabase
                .from('business_units')
                .insert({ name: name.trim(), tenant_id: tenantId })
                .select('id, name')
                .single();

            if (unitError) throw unitError;

            // 2. Create members
            const membersToInsert = comercialIds.map(cId => ({
                business_unit_id: unit.id,
                comercial_id: cId,
                tenant_id: tenantId,
            }));

            const { error: membersError } = await supabase
                .from('business_unit_members')
                .insert(membersToInsert);

            if (membersError) throw membersError;

            // 3. Refresh
            await fetchUnits();

            return unit;
        } catch (err) {
            console.error('Error creating business unit:', err);
            throw err;
        }
    };

    /**
     * Update an existing business unit name and/or members
     * @param {number} unitId - Unit ID
     * @param {string} name - New name
     * @param {string[]} comercialIds - New member IDs (replaces all)
     */
    const updateUnit = async (unitId, name, comercialIds = []) => {
        if (!tenantId) throw new Error('No tenant context');

        try {
            // 1. Update name
            if (name) {
                const { error: nameError } = await supabase
                    .from('business_units')
                    .update({ name: name.trim(), updated_at: new Date().toISOString() })
                    .eq('id', unitId)
                    .eq('tenant_id', tenantId);

                if (nameError) throw nameError;
            }

            // 2. Replace members: delete all, re-insert
            const { error: deleteError } = await supabase
                .from('business_unit_members')
                .delete()
                .eq('business_unit_id', unitId);

            if (deleteError) throw deleteError;

            if (comercialIds.length > 0) {
                const membersToInsert = comercialIds.map(cId => ({
                    business_unit_id: unitId,
                    comercial_id: cId,
                    tenant_id: tenantId,
                }));

                const { error: insertError } = await supabase
                    .from('business_unit_members')
                    .insert(membersToInsert);

                if (insertError) throw insertError;
            }

            await fetchUnits();
        } catch (err) {
            console.error('Error updating business unit:', err);
            throw err;
        }
    };

    /**
     * Delete a business unit (cascade deletes members)
     * @param {number} unitId - Unit ID
     */
    const deleteUnit = async (unitId) => {
        if (!tenantId) throw new Error('No tenant context');

        try {
            const { error: deleteError } = await supabase
                .from('business_units')
                .delete()
                .eq('id', unitId)
                .eq('tenant_id', tenantId);

            if (deleteError) throw deleteError;

            await fetchUnits();
        } catch (err) {
            console.error('Error deleting business unit:', err);
            throw err;
        }
    };

    return {
        units,
        loading,
        error,
        fetchUnits,
        createUnit,
        updateUnit,
        deleteUnit,
    };
};

export default useBusinessUnits;
