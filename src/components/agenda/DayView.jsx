import React from 'react';
import { format, getHours, getMinutes, differenceInMinutes, isSameDay } from 'date-fns';
import EventCard from './EventCard';

const DayView = ({ currentDate, events, onUpdate, onDelete }) => {
    // Filter events strictly for this day
    const dayEvents = events.filter(e => isSameDay(e.start, currentDate));
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const PIXELS_PER_HOUR = 150; // More vertical space for Day View details

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
            height: `${Math.max(height, 70)}px`, // Enforce minimum height
        };
    };

    // --- Mobile Day View (List) ---
    const MobileDayView = () => {
        const sortedEvents = [...dayEvents].sort((a, b) => a.start - b.start);

        return (
            <div className="flex flex-col h-full overflow-y-auto pb-20 scrollbar-hide md:hidden bg-slate-50 pt-2">
                {sortedEvents.length > 0 ? (
                    sortedEvents.map((event, index) => {
                        // Check if there is a gap greater than 2 hours from previous event to insert a 'Free Time' divider
                        const prevEvent = index > 0 ? sortedEvents[index - 1] : null;
                        const isGap = prevEvent && differenceInMinutes(event.start, prevEvent.end) > 120;

                        // Check if NEXT event has a gap (to extend the line downwards through the gap)
                        const nextEvent = index < sortedEvents.length - 1 ? sortedEvents[index + 1] : null;
                        const isNextGap = nextEvent && differenceInMinutes(nextEvent.start, event.end) > 120;

                        return (
                            <React.Fragment key={event.id}>
                                {isGap && (
                                    <div className="flex items-center justify-center py-6 text-xs text-slate-400 font-medium italic opacity-60 relative">
                                        {/* Optional: Add a subtle tick on the timeline for the gap? No, just the text is fine for now, the line will pass through */}
                                        - Tiempo Libre -
                                    </div>
                                )}
                                <div className="px-3 mb-3 relative pl-6">
                                    {/* Link Line */}
                                    {index !== sortedEvents.length - 1 && (
                                        <div
                                            className={`absolute top-6 left-[11.5px] w-0.5 bg-slate-200 transition-all ${isNextGap ? 'h-[calc(100%+80px)]' : 'h-[calc(100%+12px)]'}`}
                                        />
                                    )}

                                    {/* Timeline Dot */}
                                    <div className="absolute top-4 left-[7.5px] w-2.5 h-2.5 rounded-full border border-slate-50 bg-advanta-green z-10 shadow-sm" />

                                    <div className="rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50 ring-1 ring-slate-100 bg-white">
                                        <EventCard event={event} view="list" onUpdate={onUpdate} onDelete={onDelete} />
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-300">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">☕</span>
                        </div>
                        <p className="font-medium text-lg text-slate-400">Todo libre por hoy</p>
                        <p className="text-sm text-slate-400/70">No tienes actividades programadas.</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
            {/* Desktop: Time Grid View */}
            <div className="hidden md:flex flex-col h-full">
                <div className="flex-1 overflow-y-auto relative h-full scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    <div className="flex relative min-h-[3600px]"> {/* 24h * 150px */}

                        {/* Time Column */}
                        <div className="w-20 flex-shrink-0 border-r border-slate-100 bg-slate-50 text-right pr-4 pt-4 select-none z-10 sticky left-0">
                            {hours.map(hour => (
                                <div key={hour} className="h-[150px] text-sm text-slate-400 font-medium relative -top-3">
                                    {format(new Date().setHours(hour, 0), 'HH:00')}
                                </div>
                            ))}
                        </div>

                        {/* Main Content Info */}
                        <div className="flex-1 relative bg-white">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 z-0">
                                {hours.map(hour => (
                                    <div key={hour} className="h-[150px] border-b border-slate-50 w-full" />
                                ))}
                            </div>

                            {/* Current Time Indicator */}
                            {isSameDay(currentDate, new Date()) && (
                                <div
                                    className="absolute w-full border-t-2 border-advanta-green z-20 pointer-events-none flex items-center"
                                    style={{ top: `${(getHours(new Date()) * PIXELS_PER_HOUR) + ((getMinutes(new Date()) / 60) * PIXELS_PER_HOUR)}px` }}
                                >
                                    <div className="-ml-1 w-2 h-2 rounded-full bg-advanta-green" />
                                    <span className="ml-2 text-xs font-bold text-advanta-green bg-white px-1 rounded shadow-sm">
                                        {format(new Date(), 'HH:mm')}
                                    </span>
                                </div>
                            )}

                            {/* Events Container */}
                            <div className="relative w-full h-full p-2">
                                {dayEvents.length === 0 && (
                                    <div className="absolute top-1/3 left-0 right-0 text-center text-slate-300">
                                        <p className="text-lg">No hay actividades programadas para hoy</p>
                                    </div>
                                )}

                                {(() => {
                                    // Lane algorithm (local scope)
                                    const sortedEvents = [...dayEvents].sort((a, b) => a.start - b.start);
                                    const columns = [];
                                    sortedEvents.forEach(event => {
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

                                    return sortedEvents.map(event => {
                                        const baseStyle = getEventStyle(event);
                                        const width = 100 / totalColumns;
                                        const left = width * event.colIndex;

                                        return (
                                            <div
                                                key={event.id}
                                                className="absolute rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all z-10 hover:z-20 cursor-pointer border-l-4 border-advanta-green"
                                                style={{
                                                    ...baseStyle,
                                                    width: `calc(${width}% - 8px)`, // localized gap
                                                    left: `calc(${left}% + 4px)`,
                                                }}
                                            >
                                                <EventCard event={event} view="day-detail" onUpdate={onUpdate} onDelete={onDelete} />
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile View Render */}
            <MobileDayView />
        </div>
    );
};

export default DayView;
