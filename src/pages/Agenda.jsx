import React, { useState, useEffect, useRef } from 'react';
import { format, addDays, startOfWeek, addMonths, subMonths, subWeeks, addWeeks, subDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import EventCard from '../components/agenda/EventCard';
import WeekView from '../components/agenda/WeekView';
import DayView from '../components/agenda/DayView';
import CreateEventModal from '../components/agenda/CreateEventModal';
import { ComercialFilter } from '../components/shared/ComercialFilter';
import { useActivities } from '../hooks/useActivities';
import { useOpportunities } from '../hooks/useOpportunities';
import { useCompanies } from '../hooks/useCompanies';
import { useRoleBasedFilter } from '../hooks/useRoleBasedFilter';
import { useUsers } from '../hooks/useUsers';
import { useToast } from '../contexts/ToastContext';
import { useSystemToast } from '../hooks/useSystemToast';
import { combineEventsAndOpportunities } from '../utils/agendaHelpers';


const Agenda = () => {
    const { activities: rawEvents, loading, createActivity, updateActivity, deleteActivity } = useActivities(30);
    const { opportunities, loading: opportunitiesLoading } = useOpportunities();
    const { companies } = useCompanies(); // Fetch all companies (clients and prospects)
    const { users } = useUsers(); // Get all users for CreateEventModal
    const { showToast } = useToast();
    const { showError } = useSystemToast();
    const hasShownInitialToast = useRef(false);


    // Role-based filtering
    const {
        comerciales,
        selectedComercialId,
        setSelectedComercialId,
        canFilter,
        showAllOption,
        filterDataByRole,
        loading: filterLoading
    } = useRoleBasedFilter();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month'); // month, week, day, list

    // Combine activities and opportunities into normalized events
    const normalizedEvents = React.useMemo(() => {
        return combineEventsAndOpportunities(rawEvents, opportunities);
    }, [rawEvents, opportunities]);

    // Apply role-based filter to normalized events
    const events = React.useMemo(() => {
        return filterDataByRole(normalizedEvents);
    }, [normalizedEvents, selectedComercialId, filterDataByRole]);

    const nextDate = () => {
        if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
        if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
        if (view === 'day') setCurrentDate(addDays(currentDate, 1));
    };

    const prevDate = () => {
        if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
        if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
        if (view === 'day') setCurrentDate(subDays(currentDate, 1));
    };

    const today = () => setCurrentDate(new Date());

    // Memoize getDaysInMonth to avoid recalculating on every render
    const getDaysInMonth = React.useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        // Pre-group events by date for O(1) lookup instead of filtering on each iteration
        const eventsByDate = events.reduce((acc, event) => {
            if (!event.start) return acc;
            try {
                const dateKey = format(event.start, 'yyyy-MM-dd');
                if (!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push(event);
            } catch {
                // Skip events with invalid dates
            }
            return acc;
        }, {});

        const dateFormat = "d";
        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, dateFormat);
                const cloneDay = day;

                // O(1) lookup instead of O(n) filter
                const dateKey = format(cloneDay, 'yyyy-MM-dd');
                const dayEvents = eventsByDate[dateKey] || [];

                days.push(
                    <div
                        className={`min-h-[80px] md:min-h-[120px] border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 md:p-2 relative transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800
              ${!isSameMonth(day, monthStart) ? "bg-slate-50 dark:bg-slate-950 text-slate-300 dark:text-slate-600" : "text-slate-700 dark:text-slate-300"}
              ${isSameDay(day, new Date()) ? "bg-red-50/30 dark:bg-red-900/20" : ""}
            `}
                        key={day}
                        onClick={() => { setView('day'); setCurrentDate(cloneDay); }}
                    >
                        <span className={`text-xs md:text-sm font-medium block mb-1 md:mb-2 ${isSameDay(day, new Date()) ? "text-advanta-green dark:text-red-400" : ""}`}>
                            {formattedDate}
                        </span>

                        {/* Desktop View: Full Cards */}
                        <div className="hidden md:block space-y-1">
                            {dayEvents.slice(0, 3).map(event => (
                                <EventCard key={event.id} event={event} view="month" onUpdate={updateActivity} onDelete={deleteActivity} />
                            ))}
                            {dayEvents.length > 3 && (
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 pl-1">+{dayEvents.length - 3} más</div>
                            )}
                        </div>

                        {/* Mobile View: Priority Dots */}
                        <div className="md:hidden flex flex-wrap gap-1 content-start pt-1">
                            {dayEvents.map(event => {
                                const bgClass = event.priority === 'high' ? 'bg-red-500' :
                                    event.priority === 'medium' ? 'bg-orange-500' :
                                        'bg-blue-500';

                                return (
                                    <div
                                        key={event.id}
                                        className={`w-2 h-2 rounded-full ${bgClass}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-700 rounded-none md:rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700" key={day}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="space-y-px">{rows}</div>;
    }, [currentDate, events, updateActivity, deleteActivity]);

    // Weekdays header
    const renderWeekDays = () => {
        const days = [];
        let startDate = startOfWeek(currentDate);

        for (let i = 0; i < 7; i++) {
            days.push(
                <div className="col-span-1 text-center py-2 md:py-3" key={i}>
                    {/* Desktop: Full Name */}
                    <span className="hidden md:block text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
                        {format(addDays(startDate, i), "EEEE", { locale: es })}
                    </span>
                    {/* Mobile: Short Name (1 letter) */}
                    <span className="md:hidden text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                        {format(addDays(startDate, i), "EEEEE", { locale: es })}
                    </span>
                </div>
            );
        }

        return <div className="grid grid-cols-7 mb-2 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-10">{days}</div>;
    };

    // Filters State
    const [filters, setFilters] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth(),
        quincena: 'all', // all, 1, 2
        day: 'all'
    });

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const filterEvents = (events) => {
        return events.filter(event => {
            // Use the normalized 'start' property (already converted from scheduled_date)
            if (!event.start) return false; // Skip events without normalized start date

            let eventDate;
            try {
                eventDate = event.start; // Already a Date object from normalization
                // Check if date is valid
                if (isNaN(eventDate.getTime())) return false;
            } catch {
                return false; // Skip events with invalid dates
            }

            const eventYear = eventDate.getFullYear();
            const eventMonth = eventDate.getMonth();
            const eventDay = eventDate.getDate();

            if (filters.year !== 'all' && eventYear !== parseInt(filters.year)) return false;
            if (filters.month !== 'all' && eventMonth !== parseInt(filters.month)) return false;

            if (filters.quincena !== 'all') {
                const isFirstHalf = eventDay <= 15;
                if (filters.quincena === '1' && !isFirstHalf) return false;
                if (filters.quincena === '2' && isFirstHalf) return false;
            }

            if (filters.day !== 'all' && eventDay !== parseInt(filters.day)) return false;

            return true;
        });
    };

    const renderFilters = () => (
        <div className="flex flex-wrap gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 items-center shadow-sm">
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Año:</span>
                <select
                    value={filters.year}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-advanta-green/20 outline-none"
                >
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Mes:</span>
                <select
                    value={filters.month}
                    onChange={(e) => handleFilterChange('month', e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-advanta-green/20 outline-none"
                >
                    {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>{format(new Date(2024, i, 1), 'MMMM', { locale: es })}</option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Quincena:</span>
                <select
                    value={filters.quincena}
                    onChange={(e) => handleFilterChange('quincena', e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-advanta-green/20 outline-none"
                >
                    <option value="all">Todas</option>
                    <option value="1">1ª Quincena (1-15)</option>
                    <option value="2">2ª Quincena (16-31)</option>
                </select>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Día:</span>
                <select
                    value={filters.day}
                    onChange={(e) => handleFilterChange('day', e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-advanta-green/20 outline-none"
                >
                    <option value="all">Todos</option>
                    {Array.from({ length: 31 }, (_, i) => (
                        <option key={i} value={i + 1}>{i + 1}</option>
                    ))}
                </select>
            </div>
        </div>
    );

    const renderList = () => {
        const filteredEvents = filterEvents(events);
        return (
            <div className="space-y-4">
                {renderFilters()}
                {filteredEvents.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">No hay actividades que coincidan con los filtros.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map(event => (
                            <EventCard key={event.id} event={event} view="list" onUpdate={updateActivity} onDelete={deleteActivity} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Create Event Logic
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleCreateEvent = async (newEvent) => {
        const result = await createActivity(newEvent);
        if (result.success) {
            setIsCreateModalOpen(false);

            // Show toast for the newly created activity
            const activityDateTime = new Date(`${newEvent.scheduled_date}T${newEvent.scheduled_time}`);
            const now = new Date();
            const diffMinutes = Math.floor((activityDateTime - now) / 60000);

            let priority = 'medium';
            let timeText = '';

            if (activityDateTime < now) {
                priority = 'critical';
                timeText = 'vencida';
            } else if (diffMinutes <= 60) {
                priority = 'high';
                timeText = `en ${diffMinutes} min`;
            } else {
                const hours = Math.floor(diffMinutes / 60);
                timeText = `en ${hours} hora${hours > 1 ? 's' : ''}`;
            }

            showToast({
                id: `activity-created-${result.data.id}`,
                type: 'activity_created',
                priority,
                title: `${newEvent.activity_type || 'Actividad'} ${timeText}`,
                description: `${newEvent.title} - ${newEvent.scheduled_time}`,
                timestamp: activityDateTime,
                timeAgo: timeText,
                icon: null,
                color: priority === 'critical' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600',
                action: '/agenda'
            });
        } else {
            showError('Error al crear actividad: ' + result.error);
        }
    };

    // Show toast for closest upcoming activity when entering Agenda page (only once)
    useEffect(() => {
        if (hasShownInitialToast.current || !rawEvents || rawEvents.length === 0) return;

        const now = new Date();
        const in60Min = new Date(now.getTime() + 60 * 60 * 1000);

        // Find upcoming activities within next 60 minutes
        const upcomingActivities = rawEvents
            .filter(activity => {
                if (!activity.scheduled_date || !activity.scheduled_time || activity.status === 'completed') return false;
                const activityDateTime = new Date(`${activity.scheduled_date}T${activity.scheduled_time}`);
                return activityDateTime >= now && activityDateTime <= in60Min;
            })
            .sort((a, b) => {
                const dateA = new Date(`${a.scheduled_date}T${a.scheduled_time}`);
                const dateB = new Date(`${b.scheduled_date}T${b.scheduled_time}`);
                return dateA - dateB;
            });

        // Show toast for the closest one only
        if (upcomingActivities.length > 0) {
            const closest = upcomingActivities[0];
            const activityDateTime = new Date(`${closest.scheduled_date}T${closest.scheduled_time}`);
            const diffMinutes = Math.floor((activityDateTime - now) / 60000);

            showToast({
                id: `upcoming-activity-${closest.id}`,
                type: 'upcoming_activity',
                priority: 'high',
                title: `${closest.activity_type || 'Actividad'} en ${diffMinutes} min`,
                description: `${closest.title} - ${closest.scheduled_time}`,
                timestamp: activityDateTime,
                timeAgo: `en ${diffMinutes} min`,
                icon: null,
                color: 'bg-orange-100 text-orange-600',
                action: '/agenda'
            });

            hasShownInitialToast.current = true;
        }
    }, [rawEvents, showToast]);

    return (
        <div className="h-full flex flex-col gap-0 md:gap-6 p-0 md:p-0 xl:px-6 xl:pt-6">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 md:p-4 border-b border-slate-200 dark:border-slate-700 md:border md:border-slate-200 md:dark:border-slate-700 shadow-sm md:rounded-xl gap-4 md:gap-0 sticky top-0 md:static z-20">

                {/* Date Navigation */}
                <div className="flex items-center justify-between w-full md:w-auto gap-4 order-1 md:order-none">
                    <button onClick={prevDate} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500 dark:text-slate-400 hover:text-advanta-green dark:hover:text-red-400">
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 capitalize flex-1 text-center md:min-w-[200px]">
                        {view === 'week'
                            ? `${format(startOfWeek(currentDate), 'd')} - ${format(endOfWeek(currentDate), 'd')} ${format(currentDate, 'MMM', { locale: es })}`
                            : format(currentDate, view === 'day' ? "d 'de' MMMM" : 'MMMM yyyy', { locale: es })
                        }
                    </h2>
                    <button onClick={nextDate} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500 dark:text-slate-400 hover:text-advanta-green dark:hover:text-red-400">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* View Switcher */}
                <div className="flex bg-slate-100/80 dark:bg-slate-700/80 p-1 rounded-xl gap-1 overflow-x-auto max-w-full w-full md:w-auto order-3 md:order-none no-scrollbar">
                    <button onClick={() => setView('month')} className={`flex-1 md:flex-none px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap text-center ${view === 'month' ? 'bg-white dark:bg-slate-600 shadow text-advanta-green dark:text-red-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Mes</button>
                    <button onClick={() => setView('week')} className={`flex-1 md:flex-none px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap text-center ${view === 'week' ? 'bg-white dark:bg-slate-600 shadow text-advanta-green dark:text-red-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Semana</button>
                    <button onClick={() => setView('day')} className={`flex-1 md:flex-none px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap text-center ${view === 'day' ? 'bg-white dark:bg-slate-600 shadow text-advanta-green dark:text-red-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Día</button>
                    <button onClick={() => setView('list')} className={`flex-1 md:flex-none px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap text-center ${view === 'list' ? 'bg-white dark:bg-slate-600 shadow text-advanta-green dark:text-red-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Lista</button>
                </div>

                {/* Comercial Filter (Admin & Supervisor only) */}
                {canFilter && (
                    <div className="w-full md:w-auto order-4 md:order-none">
                        <ComercialFilter
                            comerciales={comerciales}
                            selectedComercialId={selectedComercialId}
                            onComercialChange={setSelectedComercialId}
                            showAllOption={showAllOption}
                            loading={filterLoading}
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 w-full md:w-auto order-2 md:order-none">
                    <button onClick={today} className="flex-1 md:flex-none px-5 py-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 md:border-transparent hover:border-slate-300 dark:hover:border-slate-500 text-sm font-bold rounded-xl transition-all">
                        Hoy
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-r from-[#44C12B] to-[#4BA323] text-white text-sm font-bold rounded-xl shadow-lg shadow-advanta-green/20 hover:shadow-advanta-green/40 hover:from-[#3a9120] hover:to-[#3d8a1f] transition-all"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span className="inline">Nuevo</span>
                    </button>
                </div>
            </div>

            {/* Calendar Content */}
            <div className="flex-1 overflow-auto h-full min-h-0 bg-white dark:bg-slate-900 rounded-none md:rounded-xl border-0 md:border border-slate-200 md:dark:border-slate-700 shadow-none md:shadow-sm p-0 md:p-2 relative">
                {view === 'month' && (
                    <div className="h-full overflow-auto p-0 md:p-2">
                        {renderWeekDays()}
                        {getDaysInMonth}
                    </div>
                )}
                {view === 'list' && <div className="p-4">{renderList()}</div>}

                {view === 'week' && <WeekView currentDate={currentDate} events={events} onUpdate={updateActivity} onDelete={deleteActivity} />}

                {view === 'day' && <DayView currentDate={currentDate} events={events} onUpdate={updateActivity} onDelete={deleteActivity} />}
            </div>

            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateEvent}
                companies={companies}
                comerciales={users
                    .filter(u => u.is_active && u.comercial) // Only active users with comercial assigned
                    .map(u => u.comercial) // Extract comercial object
                    .filter((c, index, self) => c && self.findIndex(t => t.id === c.id) === index) // Remove duplicates
                }
            />
        </div>
    );
};

export default Agenda;
