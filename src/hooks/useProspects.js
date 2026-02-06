import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentTenant } from './useCurrentTenant';

export const useProspects = () => {
    const [prospects, setProspects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const { tenantId, loading: tenantLoading } = useCurrentTenant();

    // Fetch all prospects for current tenant
    const fetchProspects = async () => {
        try {
            setLoading(true);
            setError(null);

            // RLS policies will automatically filter by:
            // - tenant_id (from user's tenant)
            // - comercial_id (based on user role: admin sees all, supervisor sees team, user sees own)
            const { data, error: fetchError } = await supabase
                .from('companies')
                .select(`
                    *,
                    comercial:comerciales(id, name)
                `)
                .eq('company_type', 'prospect')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            // Transform to match mock data structure
            const transformedData = (data || []).map(company => ({
                id: company.id,
                tradeName: company.trade_name,
                companyName: company.legal_name,
                cuit: company.cuit,
                contact: company.email,
                phone: company.phone,
                city: company.city,
                province: company.province,
                status: mapQualificationToStatus(company.qualification_score),
                prospectStatus: 'active',
                notes: company.notes,
                date: company.created_at,
                isActive: company.is_active,
                comercialId: company.comercial_id,
                comercialName: company.comercial?.name,
                // Keep original fields for updates
                _original: company
            }));

            setProspects(transformedData);
        } catch (err) {
            console.error('Error fetching prospects:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Create new prospect
    const createProspect = async (prospectData) => {
        try {
            setError(null);

            const companyData = {
                company_type: 'prospect',
                legal_name: prospectData.companyName,
                trade_name: prospectData.tradeName,
                cuit: prospectData.cuit,
                email: prospectData.contact,
                phone: prospectData.phone,
                city: prospectData.city,
                province: prospectData.province,
                notes: prospectData.notes,
                prospect_source: prospectData.source || 'manual',
                qualification_score: mapStatusToQualification(prospectData.status),
                comercial_id: prospectData.comercialId,
                tenant_id: tenantId, // CRITICAL: Required for RLS INSERT policy
                is_active: true,
                created_by: user?.id
            };

            const { data, error: insertError } = await supabase
                .from('companies')
                .insert([companyData])
                .select()
                .single();

            if (insertError) throw insertError;

            await fetchProspects(); // Refresh list
            return data;
        } catch (err) {
            console.error('Error creating prospect:', err);
            setError(err.message);
            throw err;
        }
    };

    // Update existing prospect
    const updateProspect = async (id, prospectData) => {
        try {
            setError(null);

            const companyData = {
                legal_name: prospectData.companyName,
                trade_name: prospectData.tradeName,
                cuit: prospectData.cuit,
                email: prospectData.contact,
                phone: prospectData.phone,
                city: prospectData.city,
                province: prospectData.province,
                notes: prospectData.notes,
                qualification_score: mapStatusToQualification(prospectData.status),
                comercial_id: prospectData.comercialId,
                updated_at: new Date().toISOString()
            };

            const { data, error: updateError } = await supabase
                .from('companies')
                .update(companyData)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            await fetchProspects(); // Refresh list
            return data;
        } catch (err) {
            console.error('Error updating prospect:', err);
            setError(err.message);
            throw err;
        }
    };

    // Soft delete prospect
    const deleteProspect = async (id) => {
        try {
            setError(null);

            const { error: deleteError } = await supabase
                .from('companies')
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (deleteError) throw deleteError;

            await fetchProspects(); // Refresh list
        } catch (err) {
            console.error('Error deleting prospect:', err);
            setError(err.message);
            throw err;
        }
    };

    // Convert prospect to client
    const convertToClient = async (id) => {
        try {
            setError(null);

            const { data, error: updateError } = await supabase
                .from('companies')
                .update({
                    company_type: 'client',
                    client_since: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            await fetchProspects(); // Refresh list
            return data;
        } catch (err) {
            console.error('Error converting to client:', err);
            setError(err.message);
            throw err;
        }
    };

    // Helper: Map qualification score to status
    const mapQualificationToStatus = (score) => {
        if (!score) return 'contacted';
        if (score <= 1) return 'contacted';
        if (score === 2) return 'quoted';
        return 'near_closing';
    };

    // Helper: Map status to qualification score
    const mapStatusToQualification = (status) => {
        const mapping = {
            'contacted': 1,
            'quoted': 2,
            'near_closing': 3
        };
        return mapping[status] || 1;
    };

    // Load prospects on mount
    useEffect(() => {
        if (tenantId) {
            fetchProspects();
        } else if (!tenantLoading) {
            setLoading(false);
        }
    }, [tenantId, tenantLoading]);

    return {
        prospects,
        loading,
        error,
        fetchProspects,
        createProspect,
        updateProspect,
        deleteProspect,
        convertToClient
    };
};
