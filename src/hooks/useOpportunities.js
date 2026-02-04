import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useOpportunities = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { comercialId, isAdmin, isSupervisor } = useAuth();

    const fetchOpportunities = async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('opportunities')
                .select(`
                    *,
                    comercial:comerciales!comercial_id(id, name, email),
                    company:companies!company_id(id, trade_name, legal_name, company_type),
                    contact:contacts!contact_id(id, first_name, last_name, email, phone)
                `)
                .order('close_date', { ascending: true });

            if (fetchError) throw fetchError;

            // Transform data to match OpportunityCard expectations
            const transformedData = (data || []).map(opp => ({
                ...opp,
                opportunityName: opp.opportunity_name,
                productType: opp.product_type,
                closeDate: opp.close_date,
                nextAction: opp.next_action,
                nextActionDate: opp.next_action_date,
                comercial: opp.comercial ? {
                    id: opp.comercial.id,
                    name: opp.comercial.name,
                    email: opp.comercial.email
                } : null,
                linkedEntity: opp.company ? {
                    type: opp.company.company_type,
                    id: opp.company.id,
                    name: opp.company.trade_name || opp.company.legal_name
                } : null,
                contact: opp.contact ? {
                    id: opp.contact.id,
                    name: `${opp.contact.first_name || ''} ${opp.contact.last_name || ''}`.trim() || 'Sin nombre',
                    email: opp.contact.email,
                    phone: opp.contact.phone
                } : null
            }));

            setOpportunities(transformedData);
            setError(null);
        } catch (err) {
            console.error('Error fetching opportunities:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (comercialId || isAdmin || isSupervisor) {
            fetchOpportunities();
        }
    }, [comercialId, isAdmin, isSupervisor]);

    const createOpportunity = async (opportunityData) => {
        try {
            // Get current user's tenant_id and comercial_id
            const { data: { user } } = await supabase.auth.getUser();
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('tenant_id, comercial_id')
                .eq('id', user.id)
                .single();

            if (userError) throw userError;

            const { data, error: createError } = await supabase
                .from('opportunities')
                .insert([{
                    ...opportunityData,
                    tenant_id: userData.tenant_id,
                    comercial_id: opportunityData.comercial_id || userData.comercial_id,
                    created_by: user.id
                }])
                .select()
                .single();

            if (createError) throw createError;
            await fetchOpportunities();
            return { success: true, data };
        } catch (err) {
            console.error('Error creating opportunity:', err);
            return { success: false, error: err.message };
        }
    };

    const updateOpportunity = async (id, updates) => {
        try {
            const { data, error: updateError } = await supabase
                .from('opportunities')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;
            await fetchOpportunities();
            return { success: true, data };
        } catch (err) {
            console.error('Error updating opportunity:', err);
            return { success: false, error: err.message };
        }
    };

    const deleteOpportunity = async (id) => {
        try {
            const { error: deleteError } = await supabase
                .from('opportunities')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            await fetchOpportunities();
            return { success: true };
        } catch (err) {
            console.error('Error deleting opportunity:', err);
            return { success: false, error: err.message };
        }
    };

    return {
        opportunities,
        loading,
        error,
        refetch: fetchOpportunities,
        createOpportunity,
        updateOpportunity,
        deleteOpportunity
    };
};
