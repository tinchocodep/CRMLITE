import { useState, useEffect, useMemo, useRef } from 'react';
import { useActivities } from './useActivities';
import { useOpportunities } from './useOpportunities';
import { useCompanies } from './useCompanies';
import { Calendar, Briefcase, UserCheck, Map, AlertCircle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

/**
 * Custom hook to generate smart notifications from multiple data sources
 * Returns prioritized notifications for upcoming/overdue activities, 
 * incomplete opportunities, follow-ups, and more
 */
export const useNotifications = () => {
    const { activities } = useActivities();
    const { opportunities } = useOpportunities();
    const { companies } = useCompanies();
    const { showToast } = useToast();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [dismissedIds, setDismissedIds] = useState(() => {
        // Load dismissed IDs from localStorage
        try {
            const stored = localStorage.getItem('dismissedNotifications');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Track which notifications have been shown as toasts in this session
    const shownToastIds = useRef(new Set());

    // Helper: Calculate time ago string
    const getTimeAgo = (date) => {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Ahora';
        if (minutes < 60) return `Hace ${minutes} min`;
        if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
        return `Hace ${days} día${days > 1 ? 's' : ''}`;
    };

    // Helper: Calculate time until
    const getTimeUntil = (date) => {
        const now = new Date();
        const diff = date - now;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);

        if (minutes < 1) return 'Ahora';
        if (minutes < 60) return `en ${minutes} min`;
        if (hours < 24) return `en ${hours} hora${hours > 1 ? 's' : ''}`;
        return `en ${Math.floor(hours / 24)} día${Math.floor(hours / 24) > 1 ? 's' : ''}`;
    };

    // Dismiss a notification
    const dismissNotification = (notificationId) => {
        const newDismissedIds = [...dismissedIds, notificationId];
        setDismissedIds(newDismissedIds);

        // Persist to localStorage
        try {
            localStorage.setItem('dismissedNotifications', JSON.stringify(newDismissedIds));
        } catch (err) {
            console.error('Failed to save dismissed notifications:', err);
        }
    };

    // Clear old dismissed IDs (older than 7 days)
    useEffect(() => {
        const cleanupDismissed = () => {
            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            // For simplicity, we'll just clear all after 7 days
            // In production, you'd want to store timestamps with each ID
            try {
                const stored = localStorage.getItem('dismissedNotifications');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // Clear if too many (> 100)
                    if (parsed.length > 100) {
                        localStorage.removeItem('dismissedNotifications');
                        setDismissedIds([]);
                    }
                }
            } catch {
                // Ignore errors
            }
        };

        cleanupDismissed();
    }, []);

    // 1. Upcoming Activities (within next 60 minutes)
    const getUpcomingActivityNotifications = useMemo(() => {
        if (!activities || activities.length === 0) return [];

        const now = new Date();
        const in60Min = new Date(now.getTime() + 60 * 60 * 1000);

        return activities
            .filter(activity => {
                if (!activity.scheduled_date || !activity.scheduled_time) return false;
                const activityDateTime = new Date(`${activity.scheduled_date}T${activity.scheduled_time}`);
                return activityDateTime >= now && activityDateTime <= in60Min && activity.status !== 'completed';
            })
            .map(activity => {
                const activityDateTime = new Date(`${activity.scheduled_date}T${activity.scheduled_time}`);
                return {
                    id: `upcoming-activity-${activity.id}`,
                    type: 'upcoming_activity',
                    priority: 'high',
                    title: `${activity.activity_type || 'Actividad'} ${getTimeUntil(activityDateTime)}`,
                    description: `${activity.activity_type || 'Actividad'} con ${activity.client || 'Cliente'} - ${activity.scheduled_time}`,
                    timestamp: activityDateTime,
                    timeAgo: getTimeUntil(activityDateTime),
                    icon: Calendar,
                    color: 'bg-blue-100 text-blue-600',
                    action: '/agenda',
                    relatedId: activity.id
                };
            });
    }, [activities]);

    // 2. Overdue Activities
    const getOverdueActivityNotifications = useMemo(() => {
        if (!activities || activities.length === 0) return [];

        const now = new Date();

        return activities
            .filter(activity => {
                if (!activity.scheduled_date) return false;
                const activityDateTime = new Date(`${activity.scheduled_date}T${activity.scheduled_time || '00:00'}`);
                return activityDateTime < now && activity.status !== 'completed';
            })
            .map(activity => {
                const activityDateTime = new Date(`${activity.scheduled_date}T${activity.scheduled_time || '00:00'}`);
                return {
                    id: `overdue-activity-${activity.id}`,
                    type: 'overdue_activity',
                    priority: 'critical',
                    title: 'Actividad vencida',
                    description: `${activity.activity_type || 'Actividad'} con ${activity.client || 'Cliente'} - Vencida ${getTimeAgo(activityDateTime)}`,
                    timestamp: activityDateTime,
                    timeAgo: getTimeAgo(activityDateTime),
                    icon: AlertCircle,
                    color: 'bg-red-100 text-red-600',
                    action: '/agenda',
                    relatedId: activity.id
                };
            });
    }, [activities]);

    // 3. Incomplete Opportunities (missing next_action or overdue)
    const getIncompleteOpportunityNotifications = useMemo(() => {
        if (!opportunities || opportunities.length === 0) return [];

        const now = new Date();

        return opportunities
            .filter(opp => {
                // Not closed yet
                if (opp.status === 'ganado' || opp.status === 'perdido') return false;

                // Missing required fields
                const missingFields = !opp.next_action || !opp.next_action_date;

                // Overdue next action
                const nextActionOverdue = opp.next_action_date &&
                    new Date(opp.next_action_date) < now;

                return missingFields || nextActionOverdue;
            })
            .map(opp => {
                const reason = !opp.next_action || !opp.next_action_date
                    ? 'Falta próxima acción'
                    : 'Acción vencida';

                return {
                    id: `incomplete-opp-${opp.id}`,
                    type: 'incomplete_opportunity',
                    priority: 'medium',
                    title: 'Oportunidad requiere atención',
                    description: `${opp.opportunityName || 'Oportunidad'} - ${reason}`,
                    timestamp: new Date(opp.updated_at || opp.created_at),
                    timeAgo: getTimeAgo(new Date(opp.updated_at || opp.created_at)),
                    icon: Briefcase,
                    color: 'bg-amber-100 text-amber-600',
                    action: '/oportunidades',
                    relatedId: opp.id
                };
            });
    }, [opportunities]);

    // 4. Stale Opportunities (close date approaching but low probability)
    const getStaleOpportunityNotifications = useMemo(() => {
        if (!opportunities || opportunities.length === 0) return [];

        const now = new Date();
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        return opportunities
            .filter(opp => {
                if (!opp.closeDate) return false;
                if (opp.status === 'ganado' || opp.status === 'perdido') return false;

                const closeDate = new Date(opp.closeDate);
                return closeDate <= in7Days &&
                    closeDate >= now &&
                    opp.probability < 50;
            })
            .map(opp => {
                const closeDate = new Date(opp.closeDate);
                const daysUntil = Math.ceil((closeDate - new Date()) / (24 * 60 * 60 * 1000));

                return {
                    id: `stale-opp-${opp.id}`,
                    type: 'stale_opportunity',
                    priority: 'medium',
                    title: 'Oportunidad por cerrar',
                    description: `${opp.opportunityName || 'Oportunidad'} cierra en ${daysUntil} día${daysUntil > 1 ? 's' : ''} - ${opp.probability}% probabilidad`,
                    timestamp: closeDate,
                    timeAgo: `Cierra ${getTimeUntil(closeDate)}`,
                    icon: Briefcase,
                    color: 'bg-orange-100 text-orange-600',
                    action: '/oportunidades',
                    relatedId: opp.id
                };
            });
    }, [opportunities]);

    // 5. Follow-up Reminders (no contact in 14+ days)
    const getFollowUpNotifications = useMemo(() => {
        if (!companies || companies.length === 0) return [];

        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

        return companies
            .filter(company => {
                // Only prospects and active clients
                if (company.company_type !== 'prospect' && company.company_type !== 'client') return false;

                const lastContact = company.last_contact_date
                    ? new Date(company.last_contact_date)
                    : null;

                return !lastContact || lastContact < twoWeeksAgo;
            })
            .slice(0, 5) // Limit to 5 most urgent
            .map(company => {
                const lastContact = company.last_contact_date
                    ? new Date(company.last_contact_date)
                    : null;

                const daysSince = lastContact
                    ? Math.floor((new Date() - lastContact) / (24 * 60 * 60 * 1000))
                    : 30;

                return {
                    id: `followup-${company.id}`,
                    type: 'follow_up',
                    priority: 'medium',
                    title: 'Seguimiento pendiente',
                    description: `Contactar a ${company.trade_name || company.legal_name} - Sin contacto hace ${daysSince} días`,
                    timestamp: lastContact || new Date(company.created_at),
                    timeAgo: lastContact ? getTimeAgo(lastContact) : 'Nunca',
                    icon: UserCheck,
                    color: 'bg-purple-100 text-purple-600',
                    action: company.company_type === 'prospect' ? '/prospectos' : '/clientes',
                    relatedId: company.id
                };
            });
    }, [companies]);

    // Aggregate all notifications
    useEffect(() => {
        const allNotifications = [
            ...getUpcomingActivityNotifications,
            ...getOverdueActivityNotifications,
            ...getIncompleteOpportunityNotifications,
            ...getStaleOpportunityNotifications,
            ...getFollowUpNotifications
        ];

        // Filter out dismissed notifications
        const active = allNotifications.filter(n => !dismissedIds.includes(n.id));

        // Sort by priority then timestamp (newest first within same priority)
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        const sorted = active.sort((a, b) => {
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            // Newer notifications first (descending timestamp)
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        setNotifications(sorted);
        setUnreadCount(sorted.length);
    }, [
        getUpcomingActivityNotifications,
        getOverdueActivityNotifications,
        getIncompleteOpportunityNotifications,
        getStaleOpportunityNotifications,
        getFollowUpNotifications,
        dismissedIds
    ]);

    // DISABLED: Automatic toast notifications
    // Toasts will now be triggered manually:
    // 1. When creating a new activity
    // 2. When entering the Agenda page (show closest activity only)
    /*
    useEffect(() => {
        if (notifications.length === 0) return;



        // Only show toasts for high and critical priority notifications
        const toastableNotifications = notifications.filter(
            n => (n.priority === 'high' || n.priority === 'critical') && !shownToastIds.current.has(n.id)
        );



        toastableNotifications.forEach(notification => {

            showToast(notification);
            shownToastIds.current.add(notification.id);
        });
    }, [notifications, showToast]);
    */

    return {
        notifications,
        unreadCount,
        dismissNotification
    };
};
