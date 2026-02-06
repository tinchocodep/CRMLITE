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
                    company:companies!company_id(id, trade_name, legal_name, company_type, cuit),
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
                    name: opp.company.trade_name || opp.company.legal_name,
                    cuit: opp.company.cuit
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


    // Fetch opportunities on mount and when auth state changes
    useEffect(() => {
        if (comercialId || isAdmin || isSupervisor) {
            fetchOpportunities();
        }

        // Cleanup function to ensure fresh data on next mount
        return () => {
            // This ensures the component will fetch fresh data when remounted
        };
    }, [comercialId, isAdmin, isSupervisor]);

    // Helper function to create activities from opportunity dates
    const createActivitiesFromOpportunity = async (opportunity, opportunityId) => {
        try {
            const activities = [];

            // Get current user data
            const { data: { user } } = await supabase.auth.getUser();
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('tenant_id')
                .eq('id', user.id)
                .single();

            if (userError) throw userError;

            // 1. Create activity for close date
            if (opportunity.close_date) {
                activities.push({
                    title: `🎯 Cierre: ${opportunity.opportunity_name}`,
                    activity_type: 'meeting',
                    priority: 'high',
                    scheduled_date: opportunity.close_date,
                    scheduled_time: '09:00', // Default time
                    duration_minutes: 60,
                    company_id: opportunity.company_id,
                    comercial_id: opportunity.comercial_id,
                    description: `Fecha de cierre de oportunidad: ${opportunity.opportunity_name}\nMonto: $${opportunity.amount || 'N/A'}`,
                    status: 'pending',
                    opportunity_id: opportunityId,
                    auto_generated: true,
                    opportunity_status: opportunity.status || 'iniciado', // NEW: Store opportunity status
                    tenant_id: userData.tenant_id,
                    created_by: user.id
                });
            }

            // 2. Create activity for next action date (if exists)
            if (opportunity.next_action_date && opportunity.next_action) {
                activities.push({
                    title: `📋 ${opportunity.next_action}`,
                    activity_type: 'task',
                    priority: 'medium',
                    scheduled_date: opportunity.next_action_date,
                    scheduled_time: '10:00', // Default time
                    duration_minutes: 30,
                    company_id: opportunity.company_id,
                    comercial_id: opportunity.comercial_id,
                    description: `Próxima acción para: ${opportunity.opportunity_name}\n\n${opportunity.next_action}`,
                    status: 'pending',
                    opportunity_id: opportunityId,
                    auto_generated: true,
                    opportunity_status: opportunity.status || 'iniciado', // NEW: Store opportunity status
                    tenant_id: userData.tenant_id,
                    created_by: user.id
                });
            }

            // Insert all activities
            if (activities.length > 0) {
                const { error: insertError } = await supabase
                    .from('activities')
                    .insert(activities);

                if (insertError) throw insertError;
            }
        } catch (err) {
            console.error('Error creating activities from opportunity:', err);
        }
    };

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

            // Create activities from opportunity dates
            await createActivitiesFromOpportunity(opportunityData, data.id);

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

            // Delete old auto-generated activities for this opportunity
            await supabase
                .from('activities')
                .delete()
                .eq('opportunity_id', id)
                .eq('auto_generated', true);

            // Create new activities from updated dates
            await createActivitiesFromOpportunity(updates, id);

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
