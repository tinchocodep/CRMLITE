import React from 'react';
import { format, startOfWeek, addDays, getHours, getMinutes, differenceInMinutes, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import EventCard from './EventCard';

const WeekView = ({ currentDate, events, onUpdate, onDelete }) => {
    const startDate = startOfWeek(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    const PIXELS_PER_HOUR = 120; // Increased spacing for better readability

    const getEventStyle = (event) => {
        const start = event.start;
        const end = event.end;
        const startHour = getHours(start);
        const startMin = getMinutes(start);
        const duration = differenceInMinutes(end, start);

        const top = (startHour * PIXELS_PER_HOUR) + ((startMin / 60) * PIXELS_PER_HOUR);
        const height = (duration / 60) * PIXELS_PER_HOUR;

        return {
            top: `${top}px`,
            height: `${Math.max(height, 60)}px`, // Enforce minimum height of 60px
        };
    };

    const MobileWeekView = () => (
        <div className="flex flex-col h-full overflow-y-auto pb-20 scrollbar-hide md:hidden bg-slate-50">
            {weekDays.map((day, i) => {
                const dayEvents = events.filter(e => isSameDay(e.start, day)).sort((a, b) => a.start - b.start);
                const isToday = isSameDay(day, new Date());

                return (
                    <div key={i} className={`mb-2 bg-white border-y border-slate-100 ${isToday ? 'bg-red-50/10' : ''}`}>
                        {/* Mobile Day Header */}
                        <div className={`sticky top-0 z-10 px-4 py-2 flex items-center justify-between border-b border-slate-50/50 backdrop-blur-sm bg-white/90 ${isToday ? 'text-advanta-green' : 'text-slate-500'}`}>
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold capitalize">{format(day, 'EEEE', { locale: es })}</span>
                                <span className="text-sm font-semibold opacity-70">{format(day, 'd MMM')}</span>
                            </div>
                            {isToday && <span className="text-[10px] font-bold bg-advanta-green text-white px-2 py-0.5 rounded-full uppercase">Hoy</span>}
                        </div>

                        {/* Events List */}
                        <div className="p-2 space-y-2 min-h-[60px]">
                            {dayEvents.length > 0 ? (
                                dayEvents.map(event => (
                                    <div key={event.id} className="pl-2 border-l-2 border-advanta-green/30">
                                        <EventCard event={event} view="list" onUpdate={onUpdate} onDelete={onDelete} />
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-300 italic py-2 pl-4">Sin actividades</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <>
            {/* Desktop Time Grid View */}
            <div className="hidden md:flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header: Days of Week */}
                <div className="flex border-b border-slate-200" id="weekHeader">
                    <div className="w-16 flex-shrink-0 border-r border-slate-100 bg-slate-50 sticky left-0 z-30"></div>
                    {weekDays.map((date, i) => (
                        <div
                            key={i}
                            className={`flex-1 text-center py-3 border-r border-slate-100 last:border-r-0 ${isSameDay(date, new Date()) ? 'bg-red-50/30' : ''}`}
                        >
                            <p className={`text-xs font-semibold uppercase mb-1 ${isSameDay(date, new Date()) ? 'text-advanta-green' : 'text-slate-400'}`}>
                                {format(date, 'EEE', { locale: es })}
                            </p>
                            <p className={`text-xl font-bold ${isSameDay(date, new Date()) ? 'text-advanta-green' : 'text-slate-700'}`}>
                                {format(date, 'd')}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Scrollable Time Grid */}
                <div
                    className="flex-1 overflow-y-auto relative h-[600px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
                    onScroll={(e) => {
                        const header = document.getElementById('weekHeader');
                        if (header) header.scrollLeft = e.target.scrollLeft;
                    }}
                >
                    <div className="flex relative min-h-[2880px]"> {/* 24h * 120px */}

                        {/* Time Column */}
                        <div className="w-16 flex-shrink-0 border-r border-slate-100 bg-slate-50 text-right pr-2 pt-2 select-none z-30 sticky left-0">
                            {hours.map(hour => (
                                <div key={hour} className="h-[120px] text-xs text-slate-400 font-medium relative -top-3">
                                    {format(new Date().setHours(hour, 0), 'HH:00')}
                                </div>
                            ))}
                        </div>

                        {/* Days Columns */}
                        <div className="flex flex-1 relative">
                            {/* Horizontal Grid Lines */}
                            <div className="absolute inset-0 z-0">
                                {hours.map(hour => (
                                    <div key={hour} className="h-[120px] border-b border-slate-50 w-full" />
                                ))}
                            </div>

                            {/* Vertical Day Columns */}
                            {weekDays.map((day, i) => {
                                // Lane algorithm for overlapping events
                                const dayEvents = events.filter(e => isSameDay(e.start, day))
                                    .sort((a, b) => a.start - b.start);

                                const columns = [];
                                dayEvents.forEach(event => {
                                    let placed = false;
                                    for (let i = 0; i < columns.length; i++) {
                                        const col = columns[i];
                                        const lastEvent = col[col.length - 1];
                                        if (lastEvent.end <= event.start) {
                                            col.push(event);
                                            event.colIndex = i;
                                            placed = true;
                                            break;
                                        }
                                    }
                                    if (!placed) {
                                        columns.push([event]);
                                        event.colIndex = columns.length - 1;
                                    }
                                });

                                const totalColumns = columns.length;

                                return (
                                    <div
                                        key={i}
                                        className="flex-1 border-r border-slate-100 last:border-r-0 relative z-10 group hover:bg-slate-50/30 transition-colors"
                                    >
                                        {/* Current Time Indicator */}
                                        {isSameDay(day, new Date()) && (
                                            <div
                                                className="absolute w-full border-t-2 border-advanta-green z-20 pointer-events-none"
                                                style={{ top: `${(getHours(new Date()) * PIXELS_PER_HOUR) + ((getMinutes(new Date()) / 60) * PIXELS_PER_HOUR)}px` }}
                                            >
                                                <div className="-mt-1.5 -ml-1.5 w-3 h-3 rounded-full bg-advanta-green shadow-sm" />
                                            </div>
                                        )}

                                        {dayEvents.map(event => {
                                            const baseStyle = getEventStyle(event);
                                            // Calculate metrics with gaps (gap of 4px)
                                            const colWidthPercent = 100 / totalColumns;

                                            return (
                                                <div
                                                    key={event.id}
                                                    className="absolute rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all z-10 hover:z-20 cursor-pointer border border-white/20"
                                                    style={{
                                                        ...baseStyle,
                                                        width: `calc(${colWidthPercent}% - 6px)`,
                                                        left: `calc(${colWidthPercent * event.colIndex}% + 3px)`,
                                                    }}
                                                >
                                                    <EventCard event={event} view="week" onUpdate={onUpdate} onDelete={onDelete} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile View Render */}
            <MobileWeekView />
        </>
    );
};

export default WeekView;
