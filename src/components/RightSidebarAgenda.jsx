import React, { useMemo, useState, useRef, useEffect } from 'react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, MoreVertical, Check, CalendarClock, Trash2 } from 'lucide-react';
import { useActivities } from '../hooks/useActivities';
import { useOpportunities } from '../hooks/useOpportunities';
import { ConfirmDialog } from './ConfirmDialog';
import { combineEventsAndOpportunities } from '../utils/agendaHelpers';

export function RightSidebarAgenda({ isMainSidebarExpanded }) {
    const { activities: rawActivities, loading, updateActivity, deleteActivity } = useActivities(7);
    const { opportunities, loading: opportunitiesLoading } = useOpportunities();
    const [openMenuId, setOpenMenuId] = useState(null);
    const [showDatePickerId, setShowDatePickerId] = useState(null);
    const [tempDate, setTempDate] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, activityId: null });
    const menuRef = useRef(null);

    // Combine activities and opportunities
    const combinedEvents = useMemo(() => {
        return combineEventsAndOpportunities(rawActivities, opportunities);
    }, [rawActivities, opportunities]);

    // Convert combined events back to activity format for the sidebar
    const activities = useMemo(() => {
        return combinedEvents.map(event => ({
            ...event,
            scheduled_date: event.start ? format(event.start, 'yyyy-MM-dd') : null,
            scheduled_time: event.start ? format(event.start, 'HH:mm') : null,
            company_name: event.client
        }));
    }, [combinedEvents]);


    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
                setShowDatePickerId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                return 'border-l-[#87a330]';
            case 'medium':
            case 'media':
                return 'border-l-[#87a330]/60';
            case 'low':
            case 'baja':
                return 'border-l-[#87a330]/30';
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
        return statusConfig[status?.toLowerCase()] || statusConfig.pending;
    };

    const toggleMenu = (activityId, e) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === activityId ? null : activityId);
        setShowDatePickerId(null);
    };

    const handleMarkAsDone = async (activityId, e) => {
        e.stopPropagation();
        try {
            await deleteActivity(activityId);
            setOpenMenuId(null);
        } catch (error) {
            console.error('Error marking activity as done:', error);
        }
    };

    const handleDelete = (activityId, e) => {
        e.stopPropagation();
        setConfirmDialog({ isOpen: true, activityId });
    };

    const confirmDelete = async () => {
        try {
            await deleteActivity(confirmDialog.activityId);
            setOpenMenuId(null);
        } catch (error) {
            console.error('Error deleting activity:', error);
        }
    };

    const handleShowDatePicker = (activity, e) => {
        e.stopPropagation();
        setShowDatePickerId(activity.id);
        setTempDate(activity.scheduled_date || '');
        setOpenMenuId(null);
    };

    const handleDateChange = async (activityId, e) => {
        e.stopPropagation();
        if (!tempDate) return;
        try {
            await updateActivity(activityId, { scheduled_date: tempDate });
            setShowDatePickerId(null);
            setTempDate('');
        } catch (error) {
            console.error('Error updating date:', error);
            alert('Error al cambiar la fecha: ' + error.message);
        }
    };


    if (loading) {
        return (
            <aside className={`fixed top-0 h-screen w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-xl transition-all duration-300 ${isMainSidebarExpanded ? 'right-[-256px]' : 'right-0 hidden lg:block'}`}>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#87a330]"></div>
                </div>
            </aside>
        );
    }

    return (
        <>
            <aside className={`fixed top-0 h-screen w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden transition-all duration-300 ${isMainSidebarExpanded ? 'right-[-256px]' : 'right-0 hidden lg:block'}`}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 text-center">
                    <h2 className="text-slate-800 dark:text-slate-100 font-bold text-sm tracking-wide uppercase">Agenda</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                        {format(new Date(), "d 'de' MMMM yyyy", { locale: es })}
                    </p>
                </div>

                {/* Activities List */}
                <div className="overflow-y-auto h-[calc(100vh-76px)] px-3 py-4 space-y-4">
                    {sortedDates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                <Clock className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-center text-xs font-medium">
                                No hay actividades
                            </p>
                            <p className="text-slate-400 dark:text-slate-500 text-center text-[10px] mt-1">
                                Próximas actividades aquí
                            </p>
                        </div>
                    ) : (
                        sortedDates.map(dateKey => (
                            <div key={dateKey} className="space-y-2">
                                {/* Date Header */}
                                <div className="flex items-center gap-2">
                                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                                    <h3 className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider px-1.5">
                                        {getDateLabel(dateKey)}
                                    </h3>
                                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                                </div>

                                {/* Activity Cards */}
                                <div className="space-y-1.5">
                                    {groupedActivities[dateKey].map(activity => {
                                        const statusBadge = getStatusBadge(activity.status);
                                        return (
                                            <div
                                                key={activity.id}
                                                className={`
                                                    group relative bg-white dark:bg-slate-800 rounded-lg border-l-3 
                                                    ${getPriorityColor(activity.priority)}
                                                    shadow-sm hover:shadow-md transition-all duration-200
                                                    border border-slate-100 dark:border-slate-700
                                                    overflow-hidden
                                                `}
                                            >
                                                {/* Card Content */}
                                                <div className="px-3 py-2.5">
                                                    {/* Title and Menu */}
                                                    <div className="flex items-start justify-between gap-1.5 mb-1.5">
                                                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight flex-1 line-clamp-2">
                                                            {activity.title || 'Sin título'}
                                                        </h4>
                                                        <button
                                                            onClick={(e) => toggleMenu(activity.id, e)}
                                                            className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all"
                                                        >
                                                            <MoreVertical size={12} className="text-slate-400 hover:text-advanta-green dark:hover:text-red-400" />
                                                        </button>
                                                    </div>

                                                    {/* Company Name */}
                                                    {activity.company_name && (
                                                        <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-2 font-medium truncate">
                                                            {activity.company_name}
                                                        </p>
                                                    )}

                                                    {/* Footer: Time and Status */}
                                                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                                        {/* Time */}
                                                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                                            <Clock size={10} className="flex-shrink-0" />
                                                            <span className="text-[10px] font-medium">
                                                                {activity.scheduled_time || '00:00'}
                                                            </span>
                                                        </div>

                                                        {/* Status Badge */}
                                                        <span className={`
                                                            px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide
                                                            ${statusBadge.bg} ${statusBadge.text}
                                                        `}>
                                                            {statusBadge.label}
                                                        </span>
                                                    </div>

                                                    {/* Inline Dropdown Menu */}
                                                    {openMenuId === activity.id && (
                                                        <div
                                                            ref={menuRef}
                                                            className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 space-y-1"
                                                        >
                                                            <button
                                                                onClick={(e) => handleMarkAsDone(activity.id, e)}
                                                                className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-medium text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                                            >
                                                                <Check size={12} />
                                                                Marcar como hecha
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleShowDatePicker(activity, e)}
                                                                className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                            >
                                                                <CalendarClock size={12} />
                                                                Cambiar fecha
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDelete(activity.id, e)}
                                                                className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                            >
                                                                <Trash2 size={12} />
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Inline Date Picker */}
                                                    {showDatePickerId === activity.id && (
                                                        <div
                                                            ref={menuRef}
                                                            className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 space-y-2"
                                                        >
                                                            <input
                                                                type="date"
                                                                value={tempDate}
                                                                onChange={(e) => setTempDate(e.target.value)}
                                                                className="w-full px-2 py-1 text-[11px] border border-slate-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-advanta-green focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setShowDatePickerId(null);
                                                                        setTempDate('');
                                                                    }}
                                                                    className="flex-1 px-2 py-1 text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                                                >
                                                                    Cancelar
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleDateChange(activity.id, e)}
                                                                    className="flex-1 px-2 py-1 text-[10px] bg-gradient-to-r from-[#87a330] to-green-600 hover:from-[#6a8532] hover:to-green-700 text-white rounded transition-colors font-bold"
                                                                >
                                                                    Guardar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Hover Effect Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-50/30 dark:to-slate-700/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false, activityId: null })}
                onConfirm={confirmDelete}
                title="Eliminar actividad"
                message="¿Estás seguro de eliminar esta actividad? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
            />
        </>
    );
}
