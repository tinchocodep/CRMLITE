import React, { useMemo } from 'react';
import { format, isToday, isTomorrow, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, MoreVertical } from 'lucide-react';
import { useActivities } from '../hooks/useActivities';

export function RightSidebarAgenda() {
    const { activities, loading } = useActivities(7); // Get next 7 days of activities

    // Group activities by date
    const groupedActivities = useMemo(() => {
        if (!activities || activities.length === 0) return {};

        const groups = {};

        activities.forEach(activity => {
            if (!activity.scheduled_date) return;

            const dateKey = activity.scheduled_date; // YYYY-MM-DD format
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(activity);
        });

        // Sort activities within each date by time
        Object.keys(groups).forEach(dateKey => {
            groups[dateKey].sort((a, b) => {
                const timeA = a.scheduled_time || '00:00';
                const timeB = b.scheduled_time || '00:00';
                return timeA.localeCompare(timeB);
            });
        });

        return groups;
    }, [activities]);

    // Sort dates
    const sortedDates = useMemo(() => {
        return Object.keys(groupedActivities).sort();
    }, [groupedActivities]);

    const getDateLabel = (dateString) => {
        try {
            const date = parseISO(dateString);
            if (isToday(date)) return 'Hoy';
            if (isTomorrow(date)) return 'Mañana';
            return format(date, "d 'de' MMMM yyyy", { locale: es });
        } catch (error) {
            return dateString;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
            case 'alta':
                return 'border-l-[#E76E53]';
            case 'medium':
            case 'media':
                return 'border-l-amber-500';
            case 'low':
            case 'baja':
                return 'border-l-green-500';
            default:
                return 'border-l-slate-300';
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { label: 'Pendiente', bg: 'bg-amber-100', text: 'text-amber-700' },
            completed: { label: 'Completada', bg: 'bg-green-100', text: 'text-green-700' },
            cancelled: { label: 'Cancelada', bg: 'bg-slate-100', text: 'text-slate-600' },
        };

        const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
        return config;
    };

    if (loading) {
        return (
            <aside className="hidden xl:block fixed right-0 top-0 h-screen w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-xl">
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E76E53]"></div>
                </div>
            </aside>
        );
    }

    return (
        <aside className="hidden xl:block fixed right-0 top-0 h-screen w-80 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#E76E53] to-[#CD5643] px-6 py-5 shadow-lg">
                <h2 className="text-white font-bold text-lg tracking-wide">AGENDA</h2>
                <p className="text-white/90 text-sm mt-1">
                    {format(new Date(), "d 'de' MMMM yyyy", { locale: es })}
                </p>
            </div>

            {/* Activities List */}
            <div className="overflow-y-auto h-[calc(100vh-88px)] px-4 py-5 space-y-6">
                {sortedDates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <Clock className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-center text-sm font-medium">
                            No hay actividades programadas
                        </p>
                        <p className="text-slate-400 dark:text-slate-500 text-center text-xs mt-2">
                            Las próximas actividades aparecerán aquí
                        </p>
                    </div>
                ) : (
                    sortedDates.map(dateKey => (
                        <div key={dateKey} className="space-y-3">
                            {/* Date Header */}
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent"></div>
                                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider px-2">
                                    {getDateLabel(dateKey)}
                                </h3>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent"></div>
                            </div>

                            {/* Activity Cards */}
                            <div className="space-y-2.5">
                                {groupedActivities[dateKey].map(activity => {
                                    const statusBadge = getStatusBadge(activity.status);
                                    return (
                                        <div
                                            key={activity.id}
                                            className={`
                                                group relative bg-white dark:bg-slate-800 rounded-xl border-l-4 
                                                ${getPriorityColor(activity.priority)}
                                                shadow-sm hover:shadow-lg transition-all duration-200
                                                border border-slate-100 dark:border-slate-700
                                                overflow-hidden
                                            `}
                                        >
                                            {/* Card Content */}
                                            <div className="px-4 py-3.5">
                                                {/* Title and Menu */}
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug flex-1">
                                                        {activity.title || 'Sin título'}
                                                    </h4>
                                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                                                        <MoreVertical size={14} className="text-slate-400" />
                                                    </button>
                                                </div>

                                                {/* Company Name */}
                                                {activity.company_name && (
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2.5 font-medium">
                                                        {activity.company_name}
                                                    </p>
                                                )}

                                                {/* Footer: Time and Status */}
                                                <div className="flex items-center justify-between gap-3 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700">
                                                    {/* Time */}
                                                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                                        <Clock size={12} className="flex-shrink-0" />
                                                        <span className="text-xs font-medium">
                                                            {activity.scheduled_time || '00:00'}
                                                        </span>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <span className={`
                                                        px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                                                        ${statusBadge.bg} ${statusBadge.text}
                                                    `}>
                                                        {statusBadge.label}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Hover Effect Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-50/50 dark:to-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
}
