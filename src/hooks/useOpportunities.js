import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentTenant } from './useCurrentTenant';
import { saveQuotation, getQuotationsByOpportunity } from '../services/quotationsService';

export const useOpportunities = (refreshKey = 'default') => {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { comercialId, isAdmin, isSupervisor } = useAuth();
    const { tenantId, loading: tenantLoading } = useCurrentTenant();

    const fetchOpportunities = async () => {
        try {
            // Don't fetch if tenant_id is not available yet
            if (!tenantId) {
                setOpportunities([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('opportunities')
                .select(`
                    *,
                    comercial:comerciales!comercial_id(id, name, email),
                    company:companies!company_id(id, trade_name, legal_name, company_type, cuit),
                    contact:contacts!contact_id(id, first_name, last_name, email, phone)
                `)
                .eq('tenant_id', tenantId)
                .order('close_date', { ascending: true });

            if (fetchError) throw fetchError;

            console.log('📊 Raw opportunities data from DB:', data);

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

            console.log('✨ Transformed opportunities data:', transformedData);

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
        if (tenantId && (comercialId || isAdmin || isSupervisor)) {
            fetchOpportunities();
        } else if (!tenantLoading) {
            setLoading(false);
        }

        // Cleanup function to ensure fresh data on next mount
        return () => {
            // This ensures the component will fetch fresh data when remounted
        };
    }, [comercialId, isAdmin, isSupervisor, refreshKey, tenantId, tenantLoading]);

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
                    tenant_id: userData.tenant_id
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
                    tenant_id: userData.tenant_id
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
                    comercial_id: opportunityData.comercial_id || userData.comercial_id
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
            // Ensure ID is a number (convert from string if needed)
            const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

            if (isNaN(numericId)) {
                throw new Error(`Invalid opportunity ID: ${id}`);
            }

            // Get current opportunity data to check previous probability
            const { data: currentOpp } = await supabase
                .from('opportunities')
                .select('*, company:companies!company_id(id, trade_name, legal_name, cuit)')
                .eq('id', numericId)
                .single();

            const { data, error: updateError } = await supabase
                .from('opportunities')
                .update(updates)
                .eq('id', numericId)
                .select()
                .single();

            if (updateError) throw updateError;

            // Check if probability reached 60% or more
            const previousProbability = currentOpp?.probability || 0;
            const newProbability = updates.probability !== undefined ? updates.probability : previousProbability;

            // Auto-create quotation if probability reaches 60% and no quotation exists yet
            if (newProbability >= 60 && previousProbability < 60) {
                const existingQuotations = getQuotationsByOpportunity(numericId);

                if (existingQuotations.length === 0) {
                    console.log('🎯 Probability reached 60%! Auto-creating quotation...');

                    // Create quotation from opportunity data
                    const newQuotation = saveQuotation({
                        opportunityId: numericId,
                        clientId: currentOpp.company_id,
                        clientName: currentOpp.company?.trade_name || currentOpp.company?.legal_name || 'Cliente',
                        saleType: 'Venta Directa',
                        paymentCondition: 'A definir',
                        deliveryDate: currentOpp.close_date || new Date().toISOString().split('T')[0],
                        originAddress: '',
                        destinationAddress: '',
                        status: 'draft',
                        lines: [{
                            id: 1,
                            productName: currentOpp.product_type || 'Producto',
                            quantity: 1,
                            unitPrice: currentOpp.amount || 0,
                            total: currentOpp.amount || 0
                        }],
                        subtotal: currentOpp.amount || 0,
                        tax: (currentOpp.amount || 0) * 0.21,
                        total: (currentOpp.amount || 0) * 1.21,
                        notes: `Cotización generada automáticamente desde oportunidad: ${currentOpp.opportunity_name}`
                    });

                    console.log('✅ Auto-created quotation:', newQuotation);

                    // Show notification (will be handled by the component)
                    if (window.showToast) {
                        window.showToast({
                            id: `auto-quotation-${numericId}`,
                            title: '🎉 Cotización Creada Automáticamente',
                            description: `Se creó la cotización ${newQuotation.quotationNumber} porque la oportunidad alcanzó 60% de probabilidad`,
                            priority: 'high',
                            timeAgo: 'Ahora'
                        });
                    }
                }
            }

            // Delete old auto-generated activities for this opportunity
            await supabase
                .from('activities')
                .delete()
                .eq('opportunity_id', numericId)
                .eq('auto_generated', true);

            // Create new activities from updated dates
            await createActivitiesFromOpportunity(updates, numericId);

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
