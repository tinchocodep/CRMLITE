import React, { useState } from 'react';
import { format, addDays, startOfWeek, addMonths, subMonths, subWeeks, addWeeks, subDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import EventCard from '../components/agenda/EventCard';
import WeekView from '../components/agenda/WeekView';
import DayView from '../components/agenda/DayView';
import CreateEventModal from '../components/agenda/CreateEventModal';
import { useActivities } from '../hooks/useActivities';


const Agenda = () => {
    const { activities: rawEvents, loading, createActivity } = useActivities(30);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month'); // month, week, day, list

    // Normalize events to ensure they all have start/end properties
    // This handles both Supabase format (scheduled_date/time) and mock format (start/end)
    const events = React.useMemo(() => {
        return rawEvents.map(event => {
            // If event already has start/end, use as is
            if (event.start && event.end) {
                return event;
            }

            // If event has scheduled_date/time (Supabase), convert to start/end
            if (event.scheduled_date) {
                try {
                    const date = new Date(event.scheduled_date);
                    if (isNaN(date.getTime())) {
                        // Invalid date, skip this event
                        console.warn('Invalid scheduled_date for event:', event.id);
                        return null;
                    }

                    const [hours, minutes] = (event.scheduled_time || '09:00').split(':');
                    const start = new Date(date);
                    start.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                    // Calculate end time
                    const durationMinutes = event.duration_minutes || 60;
                    const end = new Date(start.getTime() + durationMinutes * 60000);

                    return {
                        ...event,
                        start,
                        end
                    };
                } catch (error) {
                    console.error('Error normalizing event:', event.id, error);
                    return null;
                }
            }

            // Event has neither format, skip it
            console.warn('Event missing date fields:', event.id);
            return null;
        }).filter(Boolean); // Remove null events
    }, [rawEvents]);

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

    const getDaysInMonth = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const dateFormat = "d";
        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, dateFormat);
                const cloneDay = day;
                // Handle both Supabase data (scheduled_date) and mock data (start)
                // Also filter out events with invalid/null dates
                const dayEvents = events.filter(e => {
                    const eventDate = e.scheduled_date || e.start;
                    if (!eventDate) return false; // Skip events without dates
                    try {
                        return isSameDay(new Date(eventDate), cloneDay);
                    } catch {
                        return false; // Skip events with invalid dates
                    }
                });

                days.push(
                    <div
                        className={`min-h-[80px] md:min-h-[120px] border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 md:p-2 relative transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800
              ${!isSameMonth(day, monthStart) ? "bg-slate-50 dark:bg-slate-950 text-slate-300 dark:text-slate-600" : "text-slate-700 dark:text-slate-300"}
              ${isSameDay(day, new Date()) ? "bg-red-50/30 dark:bg-red-900/20" : ""}
            `}
                        key={day}
                        onClick={() => { setView('day'); setCurrentDate(cloneDay); }}
                    >
                        <span className={`text-xs md:text-sm font-medium block mb-1 md:mb-2 ${isSameDay(day, new Date()) ? "text-brand-red dark:text-red-400" : ""}`}>
                            {formattedDate}
                        </span>

                        {/* Desktop View: Full Cards */}
                        <div className="hidden md:block space-y-1">
                            {dayEvents.slice(0, 3).map(event => (
                                <EventCard key={event.id} event={event} view="month" />
                            ))}
                            {dayEvents.length > 3 && (
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 pl-1">+{dayEvents.length - 3} más</div>
                            )}
                        </div>

                        {/* Mobile View: Logos */}
                        <div className="md:hidden flex flex-wrap gap-1 content-start pt-1">
                            {dayEvents.map(event => {
                                const logo = event.priority === 'high' ? '/logo_urgente.png' :
                                    event.priority === 'medium' ? '/logo_tibio.png' :
                                        '/logo_frio.png';
                                const bgClass = event.priority === 'high' ? 'bg-red-100 ring-1 ring-red-200' :
                                    event.priority === 'medium' ? 'bg-orange-100 ring-1 ring-orange-200' :
                                        'bg-blue-100 ring-1 ring-blue-200';

                                return (
                                    <div
                                        key={event.id}
                                        className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${bgClass}`}
                                    >
                                        <img
                                            src={logo}
                                            alt={event.priority}
                                            className="w-4 h-4 object-contain"
                                        />
                                    </div>
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
    };

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
            // Handle both Supabase data (scheduled_date) and mock data (start)
            const eventDateValue = event.scheduled_date || event.start;
            if (!eventDateValue) return false; // Skip events without dates

            let eventDate;
            try {
                eventDate = new Date(eventDateValue);
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
        <div className="flex flex-wrap gap-4 bg-white/60 p-4 rounded-xl border border-white/50 mb-4 items-center">
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Año:</span>
                <select
                    value={filters.year}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-brand-red/20 outline-none"
                >
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Mes:</span>
                <select
                    value={filters.month}
                    onChange={(e) => handleFilterChange('month', e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-brand-red/20 outline-none"
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
                    className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-brand-red/20 outline-none"
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
                    className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-brand-red/20 outline-none"
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
                            <EventCard key={event.id} event={event} view="list" />
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
        } else {
            alert('Error al crear actividad: ' + result.error);
        }
    };

    return (
        <div className="h-full flex flex-col gap-0 md:gap-6">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white/95 dark:bg-slate-800/95 md:bg-white/50 md:dark:bg-slate-800/50 backdrop-blur-sm p-4 md:p-2 border-b border-slate-200 dark:border-slate-700 md:border md:border-white/50 md:dark:border-slate-700/50 shadow-sm md:shadow-md md:rounded-2xl gap-4 md:gap-0 sticky top-0 md:static z-20">

                {/* Date Navigation */}
                <div className="flex items-center justify-between w-full md:w-auto gap-4 order-1 md:order-none">
                    <button onClick={prevDate} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500 dark:text-slate-400 hover:text-brand-red dark:hover:text-red-400">
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 capitalize flex-1 text-center md:min-w-[200px]">
                        {view === 'week'
                            ? `${format(startOfWeek(currentDate), 'd')} - ${format(endOfWeek(currentDate), 'd')} ${format(currentDate, 'MMM', { locale: es })}`
                            : format(currentDate, view === 'day' ? "d 'de' MMMM" : 'MMMM yyyy', { locale: es })
                        }
                    </h2>
                    <button onClick={nextDate} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500 dark:text-slate-400 hover:text-brand-red dark:hover:text-red-400">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* View Switcher */}
                <div className="flex bg-slate-100/80 dark:bg-slate-700/80 p-1 rounded-xl gap-1 overflow-x-auto max-w-full w-full md:w-auto order-3 md:order-none no-scrollbar">
                    <button onClick={() => setView('month')} className={`flex-1 md:flex-none px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap text-center ${view === 'month' ? 'bg-white dark:bg-slate-600 shadow text-brand-red dark:text-red-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Mes</button>
                    <button onClick={() => setView('week')} className={`flex-1 md:flex-none px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap text-center ${view === 'week' ? 'bg-white dark:bg-slate-600 shadow text-brand-red dark:text-red-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Semana</button>
                    <button onClick={() => setView('day')} className={`flex-1 md:flex-none px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap text-center ${view === 'day' ? 'bg-white dark:bg-slate-600 shadow text-brand-red dark:text-red-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Día</button>
                    <button onClick={() => setView('list')} className={`flex-1 md:flex-none px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap text-center ${view === 'list' ? 'bg-white dark:bg-slate-600 shadow text-brand-red dark:text-red-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Lista</button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 w-full md:w-auto order-2 md:order-none">
                    <button onClick={today} className="flex-1 md:flex-none px-5 py-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 md:border-transparent hover:border-slate-300 dark:hover:border-slate-500 text-sm font-bold rounded-xl transition-all">
                        Hoy
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-brand-red text-white text-sm font-bold rounded-xl shadow-lg shadow-brand-red/20 hover:shadow-brand-red/40 hover:bg-red-700 transition-all"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span className="inline">Nuevo</span>
                    </button>
                </div>
            </div>

            {/* Calendar Content */}
            <div className="flex-1 overflow-auto h-full min-h-0 bg-white dark:bg-slate-900 md:bg-white/40 md:dark:bg-slate-900/40 backdrop-blur-sm rounded-none md:rounded-2xl border-0 md:border border-white/40 md:dark:border-slate-700/40 shadow-none md:shadow-sm p-0 md:p-1 relative">
                {view === 'month' && (
                    <div className="h-full overflow-auto p-0 md:p-2">
                        {renderWeekDays()}
                        {getDaysInMonth()}
                    </div>
                )}
                {view === 'list' && <div className="p-4">{renderList()}</div>}

                {view === 'week' && <WeekView currentDate={currentDate} events={events} />}

                {view === 'day' && <DayView currentDate={currentDate} events={events} />}
            </div>

            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateEvent}
            />
        </div>
    );
};

export default Agenda;
