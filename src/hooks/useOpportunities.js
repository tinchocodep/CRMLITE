import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentTenant } from './useCurrentTenant';


export const useOpportunities = (refreshKey = 'default') => {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { comercialId, isAdmin, isSupervisor, isLoading: authLoading, comercialIdLoaded } = useAuth();
    const { tenantId, loading: tenantLoading } = useCurrentTenant();
    // Ref-based lock: prevents concurrent/duplicate createOpportunity calls
    const isCreatingRef = useRef(false);

    const fetchOpportunities = async ({ silent = false } = {}) => {
        try {
            // Don't fetch if tenant_id is not available yet
            if (!tenantId) {
                setOpportunities([]);
                setLoading(false);
                return;
            }

            if (!silent) setLoading(true);
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
            console.error('[Opp] fetchOpportunities error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    // Fetch opportunities on mount and when auth state changes
    useEffect(() => {
        // Wait for auth to finish loading before fetching
        if (authLoading) {
            setLoading(true);
            return;
        }

        // For non-admin/non-supervisor users, wait for comercialId to be loaded
        if (!isAdmin && !isSupervisor && !comercialIdLoaded) {
            setLoading(true);
            return;
        }

        if (tenantId && (comercialId || isAdmin || isSupervisor)) {
            fetchOpportunities();
        } else if (!tenantLoading) {
            setLoading(false);
        }

        // Cleanup function to ensure fresh data on next mount
        return () => {
            // This ensures the component will fetch fresh data when remounted
        };
    }, [comercialId, isAdmin, isSupervisor, refreshKey, tenantId, tenantLoading, authLoading, comercialIdLoaded]);

    // Unique channel name per instance to prevent Supabase from deduplicating channels
    const channelNameRef = useRef(`opportunities-rt-${Date.now()}-${Math.random()}`);
    // Debounce timer: consolidates rapid Realtime events into a single refetch
    const rtDebounceRef = useRef(null);
    // Ref to always hold the latest fetchOpportunities (avoids stale closure in realtime)
    const fetchOpportunitiesRef = useRef(fetchOpportunities);
    useEffect(() => {
        fetchOpportunitiesRef.current = fetchOpportunities;
    });

    // Realtime subscription: auto-refresh when opportunities change (insert/update/delete)
    useEffect(() => {
        if (!tenantId) return;

        const channel = supabase
            .channel(channelNameRef.current)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'opportunities',
            }, () => {
                clearTimeout(rtDebounceRef.current);
                rtDebounceRef.current = setTimeout(() => {
                    fetchOpportunitiesRef.current({ silent: true });
                }, 50);
            })
            .subscribe();

        return () => {
            clearTimeout(rtDebounceRef.current);
            supabase.removeChannel(channel);
        };
    }, [tenantId]);

    // Helper function to create activities from opportunity dates
    const createActivitiesFromOpportunity = async (opportunity, opportunityId) => {
        try {
            const activities = [];

            // Get current user data
            const { data: { user } } = await supabase.auth.getUser();
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('tenant_id, comercial_id')
                .eq('id', user.id)
                .single();

            if (userError) throw userError;

            const comercialId = opportunity.comercial_id || userData.comercial_id;

            // 1. Create activity for close date
            if (opportunity.close_date) {
                activities.push({
                    title: `🎯 Cierre: ${opportunity.opportunity_name || 'Oportunidad'}`,
                    activity_type: 'meeting',
                    priority: 'high',
                    scheduled_date: opportunity.close_date,
                    scheduled_time: '09:00',
                    duration: 60,
                    company_id: opportunity.company_id || null,
                    comercial_id: comercialId || null,
                    description: `Fecha de cierre de oportunidad: ${opportunity.opportunity_name || ''}. Monto: $${opportunity.amount || 'N/A'}`,
                    status: 'pending',
                    opportunity_id: opportunityId,
                    auto_generated: true,
                    tenant_id: userData.tenant_id
                });
            }

            // 2. Create activity for next action date (if both date AND description exist)
            if (opportunity.next_action_date && opportunity.next_action) {
                activities.push({
                    title: `📋 ${opportunity.next_action}`,
                    activity_type: 'task',
                    priority: 'medium',
                    scheduled_date: opportunity.next_action_date,
                    scheduled_time: '10:00',
                    duration: 30,
                    company_id: opportunity.company_id || null,
                    comercial_id: comercialId || null,
                    description: `Próxima acción para: ${opportunity.opportunity_name || ''}. ${opportunity.next_action}`,
                    status: 'pending',
                    opportunity_id: opportunityId,
                    auto_generated: true,
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
            console.error('[Opp] createActivitiesFromOpportunity error:', err);
        }
    };


    const createOpportunity = async (opportunityData) => {
        // Synchronous ref lock — prevents duplicate DB inserts from double-clicks
        if (isCreatingRef.current) {
            console.warn('[CREATE_OPP] BLOCKED — creation already in progress');
            return { success: false, error: 'Creation already in progress' };
        }
        isCreatingRef.current = true;
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
            console.error('[Opp] createOpportunity error:', err);
            return { success: false, error: err.message };
        } finally {
            // Release lock after 1s cooldown to absorb any residual rapid clicks
            setTimeout(() => { isCreatingRef.current = false; }, 1000);
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


            // Check if probability reached 60% or status changed to 'won'
            const previousProbability = currentOpp?.probability || 0;
            const newProbability = updates.probability !== undefined ? updates.probability : previousProbability;
            const previousStatus = currentOpp?.status || '';
            const newStatus = updates.status !== undefined ? updates.status : previousStatus;

            // Auto-create quotation if:
            // 1. Probability reaches 60% (and was below before), OR
            // 2. Status changes to 'won'
            const shouldCreateQuotation =
                (newProbability >= 60 && previousProbability < 60) ||
                (newStatus === 'won' && previousStatus !== 'won');

            if (shouldCreateQuotation) {
                try {
                    // Check if quotation already exists for this opportunity
                    const { data: existingQuotations } = await supabase
                        .from('quotations')
                        .select('id, quotation_number')
                        .eq('opportunity_id', numericId);

                    if (!existingQuotations || existingQuotations.length === 0) {

                        // Get user data for tenant_id
                        const { data: { user: authUser } } = await supabase.auth.getUser();
                        const { data: userData } = await supabase
                            .from('users')
                            .select('tenant_id, comercial_id')
                            .eq('id', authUser.id)
                            .single();

                        // Generate quotation number
                        const currentYear = new Date().getFullYear();
                        const prefix = `COT-${currentYear}-`;
                        const { data: lastQuotation } = await supabase
                            .from('quotations')
                            .select('quotation_number')
                            .eq('tenant_id', userData.tenant_id)
                            .like('quotation_number', `${prefix}%`)
                            .order('quotation_number', { ascending: false })
                            .limit(1);

                        let nextNumber = 1;
                        if (lastQuotation && lastQuotation.length > 0) {
                            const lastNumber = parseInt(lastQuotation[0].quotation_number.split('-')[2]);
                            nextNumber = lastNumber + 1;
                        }
                        const quotationNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`;

                        // Calculate delivery date (30 days from now if not specified)
                        const deliveryDate = currentOpp.close_date ||
                            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                        // Calculate totals
                        const subtotal = currentOpp.amount || 0;
                        const tax = subtotal * 0.21;
                        const total = subtotal + tax;

                        // Create quotation
                        const { data: newQuotation, error: quotationError } = await supabase
                            .from('quotations')
                            .insert([{
                                quotation_number: quotationNumber,
                                opportunity_id: numericId,
                                company_id: currentOpp.company_id,
                                tenant_id: userData.tenant_id,
                                comercial_id: currentOpp.comercial_id || userData.comercial_id,
                                client_name: currentOpp.company?.trade_name || currentOpp.company?.legal_name || 'Cliente',
                                client_cuit: currentOpp.company?.cuit,
                                sale_type: 'own',
                                payment_condition: '30d',
                                delivery_date: deliveryDate,
                                origin_address: 'Depósito Central',
                                destination_address: 'A definir',
                                status: newStatus === 'won' ? 'draft' : 'draft',
                                subtotal,
                                tax,
                                total,
                                notes: `Cotización generada automáticamente desde oportunidad: ${currentOpp.opportunity_name}`
                            }])
                            .select()
                            .single();

                        if (quotationError) throw quotationError;

                        // Create quotation line
                        const { error: lineError } = await supabase
                            .from('quotation_lines')
                            .insert([{
                                quotation_id: newQuotation.id,
                                product_name: currentOpp.product_type || 'Producto',
                                quantity: 1,
                                unit_price: subtotal,
                                subtotal,
                                tax_rate: 21,
                                total,
                                line_order: 0
                            }]);

                        if (lineError) throw lineError;

                        // Return quotation data for notification
                        data.autoCreatedQuotation = {
                            quotationNumber: newQuotation.quotation_number,
                            total: newQuotation.total
                        };
                    } else {
                        data.existingQuotation = existingQuotations[0];
                    }
                } catch (quotationError) {
                    // Don't fail the opportunity update if quotation creation fails
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
            console.error('[Opp] updateOpportunity error:', err);
            return { success: false, error: err.message };
        }
    };

    const deleteOpportunity = async (id) => {
        try {

            const { data, error: deleteError } = await supabase
                .from('opportunities')
                .delete()
                .eq('id', id)
                .select();

            if (deleteError) {
                console.error('[DIAG deleteOpp] DB error:', deleteError);
                throw deleteError;
            }

            // Optimistic: remove from local state immediately
            setOpportunities(prev => {
                const filtered = prev.filter(o => String(o.id) !== String(id));
                return filtered;
            });
            // Then refetch to ensure consistency
            fetchOpportunities();
            return { success: true };
        } catch (err) {
            console.error('[DIAG deleteOpp] error:', err);
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
