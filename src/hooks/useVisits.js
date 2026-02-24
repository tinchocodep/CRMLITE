import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentTenant } from './useCurrentTenant';
import { useEstablishments } from './useEstablishments';
import { useLots } from './useLots';

/**
 * useVisits — Dedicated hook for the Visitas module.
 * Fetches only activities with activity_type = 'visit'.
 * Also exposes establishments and lots for optional territory cross-referencing.
 *
 * Design decision: We do NOT modify useActivities to avoid breaking the Agenda module.
 */
export const useVisits = () => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { comercialId, isAdmin, isSupervisor } = useAuth();
    const { tenantId, loading: tenantLoading } = useCurrentTenant();

    // Territory data for optional cross-referencing
    const { establishments } = useEstablishments();
    const { lots } = useLots();

    const fetchVisits = useCallback(async () => {
        // Guard: wait for tenant to resolve
        if (!tenantId) {
            setVisits([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            let query = supabase
                .from('activities')
                .select(`
                    *,
                    company:companies!activities_company_id_fkey(id, legal_name, trade_name),
                    comercial:comerciales!activities_comercial_id_fkey(id, name)
                `)
                .eq('tenant_id', tenantId)
                .eq('activity_type', 'visit'); // ← Core filter: only visits

            // Role-based scoping: comerciales see only their own visits
            if (!isAdmin && !isSupervisor && comercialId) {
                query = query.eq('comercial_id', comercialId);
            }

            const { data, error: fetchError } = await query
                .order('scheduled_date', { ascending: false })
                .order('scheduled_time', { ascending: false });

            if (fetchError) throw fetchError;

            // Normalize data shape
            const normalized = (data || []).map(visit => ({
                ...visit,
                clientName: visit.company?.trade_name || visit.company?.legal_name || 'Sin nombre',
                comercialName: visit.comercial?.name || 'Sin asignar',
            }));

            setVisits(normalized);
            setError(null);
        } catch (err) {
            console.error('Error fetching visits:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [tenantId, isAdmin, isSupervisor, comercialId]);

    useEffect(() => {
        if (tenantId && (comercialId || isAdmin || isSupervisor)) {
            fetchVisits();
        } else if (!tenantLoading) {
            setLoading(false);
        }
    }, [fetchVisits, tenantId, tenantLoading, comercialId, isAdmin, isSupervisor]);

    /**
     * Given a company_id, returns the establishment linked to that company (if any).
     * Used to render the optional territory badge on each VisitCard.
     */
    const getEstablishmentForCompany = useCallback(
        (companyId) => establishments.find(e => e.company_id === companyId) ?? null,
        [establishments]
    );

    /**
     * Given an establishment_id, returns the lots associated with it.
     */
    const getLotsForEstablishment = useCallback(
        (establishmentId) => lots.filter(l => l.establishment_id === establishmentId),
        [lots]
    );

    /**
     * Updates a visit's status in Supabase (completed ↔ pending toggle).
     * Propagates the change to the Agenda automatically via refetch.
     */
    const completeVisit = useCallback(async (visitId, newStatus = 'completed') => {
        try {
            const { error: updateError } = await supabase
                .from('activities')
                .update({ status: newStatus })
                .eq('id', visitId)
                .eq('tenant_id', tenantId);

            if (updateError) throw updateError;
            await fetchVisits();
            return { success: true };
        } catch (err) {
            console.error('Error updating visit status:', err);
            return { success: false, error: err.message };
        }
    }, [tenantId, fetchVisits]);

    /**
     * Hard-deletes a visit from Supabase.
     * The deletion is tenant-scoped for safety.
     */
    const deleteVisit = useCallback(async (visitId) => {
        try {
            const { error: deleteError } = await supabase
                .from('activities')
                .delete()
                .eq('id', visitId)
                .eq('tenant_id', tenantId);

            if (deleteError) throw deleteError;
            await fetchVisits();
            return { success: true };
        } catch (err) {
            console.error('Error deleting visit:', err);
            return { success: false, error: err.message };
        }
    }, [tenantId, fetchVisits]);

    return {
        visits,
        loading,
        error,
        refetch: fetchVisits,
        completeVisit,
        deleteVisit,
        // Territory helpers
        establishments,
        lots,
        getEstablishmentForCompany,
        getLotsForEstablishment,
    };
};
