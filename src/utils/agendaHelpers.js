// Helper function to convert opportunities to calendar events
export const convertOpportunityToEvent = (opportunity) => {
    if (!opportunity.close_date) return null;

    try {
        // Parse close_date (format: "YYYY-MM-DD")
        const [year, month, day] = opportunity.close_date.split('-').map(Number);
        if (!year || !month || !day) {
            console.warn('Invalid close_date format for opportunity:', opportunity.id);
            return null;
        }

        // Set opportunity time to 12:00 PM by default
        const start = new Date(year, month - 1, day, 12, 0, 0, 0);
        const end = new Date(start.getTime() + 60 * 60000); // 1 hour duration

        // Get company name
        const companyName = opportunity.company?.trade_name ||
            opportunity.company?.legal_name ||
            opportunity.business_unit ||
            'Sin empresa';

        // Map status to icon
        const statusIcons = {
            'iniciado': '🚀',
            'presupuestado': '📋',
            'negociado': '🤝',
            'ganado': '✅',
            'perdido': '❌'
        };

        const statusIcon = statusIcons[opportunity.status] || '💼';

        return {
            id: `opp-${opportunity.id}`,
            title: `${statusIcon} ${opportunity.opportunity_name || 'Oportunidad sin nombre'}`,
            description: `${companyName} - ${opportunity.product_type || 'Sin producto'}`,
            start,
            end,
            priority: opportunity.probability >= 70 ? 'high' :
                opportunity.probability >= 40 ? 'medium' : 'low',
            status: opportunity.status,
            activity_type: 'Oportunidad',
            client: companyName,
            comercial_id: opportunity.comercial_id,
            comercial_name: opportunity.comercial?.name || 'Sin asignar',
            eventType: 'opportunity',
            opportunityData: opportunity // Keep original opportunity data
        };
    } catch (error) {
        console.error('Error converting opportunity to event:', opportunity.id, error);
        return null;
    }
};

// Helper function to combine activities and opportunities into events
export const combineEventsAndOpportunities = (activities, opportunities) => {
    // Normalize activities
    const normalizedActivities = activities.map(event => {
        // If event already has start/end, use as is
        if (event.start && event.end) {
            return { ...event, eventType: 'activity' };
        }

        // If event has scheduled_date/time (Supabase), convert to start/end
        if (event.scheduled_date) {
            try {
                const [year, month, day] = event.scheduled_date.split('-').map(Number);
                if (!year || !month || !day) {
                    console.warn('Invalid scheduled_date format for event:', event.id);
                    return null;
                }

                const [hours, minutes] = (event.scheduled_time || '09:00').split(':').map(Number);
                const start = new Date(year, month - 1, day, hours, minutes, 0, 0);
                const durationMinutes = event.duration_minutes || 60;
                const end = new Date(start.getTime() + durationMinutes * 60000);

                return {
                    ...event,
                    start,
                    end,
                    eventType: 'activity'
                };
            } catch (error) {
                console.error('Error normalizing event:', event.id, error);
                return null;
            }
        }

        console.warn('Event missing date fields:', event.id);
        return null;
    }).filter(Boolean);

    // Convert opportunities to events
    const opportunityEvents = (opportunities || [])
        .map(convertOpportunityToEvent)
        .filter(Boolean);

    // Combine and return
    return [...normalizedActivities, ...opportunityEvents];
};
