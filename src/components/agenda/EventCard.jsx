import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, MapPin, Phone, User, CheckCircle2, AlertCircle, X, Maximize2, Trash2, Edit2, Save, Briefcase, CalendarClock, Check } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const priorityConfig = {
    high: {
        label: 'Alta',
        color: 'bg-red-50 border-red-100',
        animation: 'animate-pulse shadow-red-200 shadow-md'
    },
    medium: {
        label: 'Media',
        color: 'bg-orange-50 border-orange-100',
        animation: 'hover:animate-pulse shadow-orange-100'
    },
    low: {
        label: 'Baja',
        color: 'bg-blue-50 border-blue-100',
        animation: 'hover:rotate-1 transition-transform'
    },
};

const typeConfig = {
    visit: { label: 'Visita', color: 'text-brand-red bg-brand-red/10' },
    call: { label: 'Llamada', color: 'text-brand-red bg-brand-red/10' },
    meeting: { label: 'Reunión', color: 'text-brand-red bg-brand-red/10' },
    task: { label: 'Tarea', color: 'text-brand-red bg-brand-red/10' },
};

const opportunityStatusConfig = {
    iniciado: { label: 'Iniciado', icon: '🚀', color: 'from-blue-50 to-blue-100 border-blue-200' },
    presupuestado: { label: 'Presupuestado', icon: '📋', color: 'from-yellow-50 to-yellow-100 border-yellow-200' },
    negociado: { label: 'Negociado', icon: '🤝', color: 'from-orange-50 to-orange-100 border-orange-200' },
    ganado: { label: 'Ganado', icon: '✅', color: 'from-green-50 to-green-100 border-green-200' },
    perdido: { label: 'Perdido', icon: '❌', color: 'from-red-50 to-red-100 border-red-200' }
};

const EventCard = ({ event, view = 'day', onUpdate, onDelete }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState('');

    // Normalize event data to handle both Supabase format (scheduled_date/time) and mock format (start/end)
    const normalizedEvent = React.useMemo(() => {
        // If event already has start/end (mock data), use as is
        if (event.start && event.end) {
            return event;
        }

        // If event has scheduled_date/time (Supabase data), convert to start/end
        if (event.scheduled_date) {
            try {
                // Parse date manually to avoid timezone issues
                // scheduled_date is in format "YYYY-MM-DD"
                const [year, month, day] = event.scheduled_date.split('-').map(Number);
                const [hours, minutes] = (event.scheduled_time || '09:00').split(':').map(Number);

                // Create date in local timezone
                const start = new Date(year, month - 1, day, hours, minutes, 0, 0);

                // Calculate end time (default 1 hour duration)
                const durationMinutes = event.duration_minutes || 60;
                const end = new Date(start.getTime() + durationMinutes * 60000);

                return {
                    ...event,
                    start,
                    end
                };
            } catch (error) {
                console.error('Error normalizing event dates:', error);
                // Return event with default dates to prevent crashes
                const now = new Date();
                return {
                    ...event,
                    start: now,
                    end: new Date(now.getTime() + 3600000) // +1 hour
                };
            }
        }

        // Fallback: return event with current time to prevent crashes
        const now = new Date();
        return {
            ...event,
            start: now,
            end: new Date(now.getTime() + 3600000)
        };
    }, [event]);

    // Local state for editing fields - FIXED: Don't re-initialize on every render
    const [editedEvent, setEditedEvent] = useState(() => ({ ...normalizedEvent }));
    const [isEditing, setIsEditing] = useState(false);

    // Update editedEvent only when the event ID changes (new event loaded)
    React.useEffect(() => {
        setEditedEvent({ ...normalizedEvent });
    }, [event.id]); // Only update when event ID changes, not on every render

    // Default to 'medium' priority if not set (activities from DB don't have priority yet)
    const config = priorityConfig[editedEvent.priority || 'medium'];
    const isCompactView = view === 'month';

    const handleDelete = async (e) => {
        e.stopPropagation();

        if (!onDelete) {
            console.error('onDelete prop is required for EventCard');
            alert('Error: No se puede eliminar la actividad');
            return;
        }

        if (window.confirm('¿Estás seguro de que deseas eliminar esta actividad?')) {
            try {
                console.log('Deleting event:', event.id);
                await onDelete(event.id);
                setShowDetails(false);
            } catch (error) {
                console.error('Error deleting activity:', error);
                alert('Error al eliminar la actividad');
            }
        }
    };

    // Quick complete action
    const handleQuickComplete = async (e) => {
        e.stopPropagation();
        try {
            await onDelete(event.id);
        } catch (error) {
            console.error('Error completing activity:', error);
        }
    };

    // Quick date change action - Save button instead of auto-save
    const handleDateChangeSave = async () => {
        if (!tempDate) {
            console.log('No temp date selected');
            return;
        }

        console.log('Saving date change:', {
            eventId: event.id,
            oldDate: editedEvent.scheduled_date,
            newDate: tempDate
        });

        try {
            // Only send the fields that exist in the database
            const updatedEvent = {
                scheduled_date: tempDate
            };

            console.log('Calling onUpdate with:', updatedEvent);
            await onUpdate(event.id, updatedEvent);

            console.log('Date updated successfully');
            setShowDatePicker(false);
            setTempDate('');
        } catch (error) {
            console.error('Error updating date:', error);
            alert('Error al cambiar la fecha: ' + error.message);
        }
    };



    const handleSave = async (e) => {
        e.stopPropagation();

        if (!onUpdate) {
            console.error('onUpdate prop is required for EventCard');
            return;
        }

        try {
            // Prepare update data
            const updateData = {
                title: editedEvent.title,
                priority: editedEvent.priority,
                activity_type: editedEvent.type,
                description: editedEvent.description
            };

            console.log('EventCard - Saving changes:', updateData);
            await onUpdate(editedEvent.id, updateData);
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving activity:', error);
            alert('Error al guardar los cambios');
        }
    };

    // Calculate Duration
    const durationMinutes = (editedEvent.end - editedEvent.start) / (1000 * 60);
    const durationString = `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60 > 0 ? (durationMinutes % 60) + 'm' : ''}`;

    const FullDetailContent = ({ isFloating = false, onClose }) => (
        <div
            className={`
                group relative overflow-hidden bg-white/80 dark:bg-slate-800/90 backdrop-blur-md border border-white/60 dark:border-slate-700 
                ${isFloating ? 'w-[500px] max-w-[95vw] shadow-2xl rounded-3xl animate-in zoom-in-95 fade-in duration-200' : 'hover:border-brand-red/30 dark:hover:border-red-500/30 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer h-full'}
                ${isFloating ? 'p-6' : 'p-1.5'}
            `}
            onClick={(e) => {
                if (!isFloating) setShowDetails(true);
                e.stopPropagation();
            }}
        >
            {/* Priority Ambient Glow */}
            <div className={`absolute -right-8 -top-8 rounded-full blur-3xl opacity-20 transition-all duration-500
                ${editedEvent.priority === 'high' ? 'bg-red-500 w-40 h-40' : editedEvent.priority === 'medium' ? 'bg-orange-400 w-32 h-32' : 'bg-blue-300 w-24 h-24'}
            `} />

            {/* Action Buttons (Top Right) */}
            {isFloating && (
                <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
                    {!isEditing ? (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                                className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 hover:text-brand-red dark:hover:text-red-400 transition-colors"
                                title="Editar Actividad"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Eliminar Actividad"
                            >
                                <Trash2 size={18} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onClose(); }}
                                className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-brand-red text-white text-xs font-bold shadow-md hover:bg-red-700 transition-colors"
                            >
                                <Save size={14} />
                                Guardar
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditedEvent({ ...event }); // Reset changes
                                    setIsEditing(false);
                                }}
                                className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </>
                    )}
                </div>
            )}

            <div className="relative z-10 flex flex-col h-full">

                {/* --- HEADER SECTION --- */}
                {/* Flex Container for Badges */}
                <div className={`flex items-center justify-between mb-2 ${isFloating ? 'mr-32' : 'gap-1'}`}>
                    {/* Priority Badge */}
                    {isEditing ? (
                        <select
                            value={editedEvent.priority}
                            onChange={(e) => setEditedEvent({ ...editedEvent, priority: e.target.value })}
                            className="text-[10px] font-bold uppercase rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-2 py-1 focus:ring-1 focus:ring-brand-red dark:focus:ring-red-500 outline-none"
                        >
                            <option value="low">Baja</option>
                            <option value="medium">Media</option>
                            <option value="high">Alta</option>
                        </select>
                    ) : (
                        <div className={`
                            flex items-center gap-1.5 rounded-full border transition-all duration-500 max-w-full
                            ${config.color} ${isFloating ? `${config.animation} px-3 py-1` : 'px-1.5 py-0.5 border-transparent bg-transparent'}
                        `}>
                            {/* Show label only if floating or wide enough (simplified logic: always show but smaller in grid) */}
                            <span className={`text-[9px] font-bold uppercase tracking-wide opacity-90 truncate ${editedEvent.priority === 'high' ? 'text-red-700' :
                                editedEvent.priority === 'medium' ? 'text-orange-700' :
                                    'text-blue-700'
                                } ${!isFloating ? 'text-[8px] leading-none' : ''}`}>
                                {config.label}
                            </span>
                        </div>
                    )}

                    {/* Type Badge */}
                    {isFloating && (
                        isEditing ? (
                            <select
                                value={editedEvent.type}
                                onChange={(e) => setEditedEvent({ ...editedEvent, type: e.target.value })}
                                className="text-xs font-bold rounded-full border border-slate-200 bg-slate-50 px-2 py-1 focus:ring-1 focus:ring-brand-red outline-none"
                            >
                                {Object.entries(typeConfig).map(([key, value]) => (
                                    <option key={key} value={key}>{value.label}</option>
                                ))}
                            </select>
                        ) : (
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${typeConfig[editedEvent.type || 'task']?.color || 'bg-gray-100 text-gray-600'}`}>
                                {typeConfig[editedEvent.type || 'task']?.label || 'Tarea'}
                            </span>
                        )
                    )}

                    {/* Opportunity Link Indicator with Status */}
                    {editedEvent.auto_generated && editedEvent.opportunity_id && editedEvent.opportunity_status && (
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r border shadow-sm ${opportunityStatusConfig[editedEvent.opportunity_status]?.color || 'from-purple-50 to-pink-50 border-purple-200'}`}>
                            <span className="text-sm">
                                {opportunityStatusConfig[editedEvent.opportunity_status]?.icon || '💼'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                                {opportunityStatusConfig[editedEvent.opportunity_status]?.label || 'Oportunidad'}
                            </span>
                        </div>
                    )}

                    {!isFloating && (
                        <div className="ml-auto text-slate-400 hover:text-brand-red transition-colors opacity-0 group-hover:opacity-100">
                            <Maximize2 size={14} />
                        </div>
                    )}
                </div>

                {/* --- TITLE --- */}
                {isEditing ? (
                    <input
                        value={editedEvent.title}
                        onChange={(e) => setEditedEvent({ ...editedEvent, title: e.target.value })}
                        className="w-full text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-300 dark:border-slate-600 focus:border-brand-red dark:focus:border-red-500 focus:outline-none bg-transparent mb-2 pb-1 pr-24"
                        placeholder="Título de la actividad"
                    />
                ) : (
                    <h3 className={`font-bold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-brand-red dark:group-hover:text-red-400 transition-colors ${isFloating ? 'text-xl mb-1 pr-32' : 'text-sm leading-tight mb-0.5 line-clamp-2'}`}>
                        {editedEvent.title}
                    </h3>
                )}

                {/* --- FLOATING CONTENT --- */}
                {isFloating ? (
                    <div className="mt-4 space-y-4">

                        {/* 1. Time & Duration */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Inicio & Fin</label>
                                <div className={`flex items-center gap-2 p-2 rounded-xl border ${isEditing ? 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 ring-1 ring-slate-200 dark:ring-slate-600' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-600'}`}>
                                    <Clock size={16} className="text-slate-400 dark:text-slate-500" />
                                    {isEditing ? (
                                        <div className="flex gap-1 items-center">
                                            <input
                                                type="time"
                                                value={format(editedEvent.start, 'HH:mm')}
                                                onChange={() => { }} // This is a mock specific, implies date logic
                                                className="bg-transparent text-xs font-semibold focus:outline-none w-16 text-slate-700 dark:text-slate-300"
                                            />
                                            <span className="text-slate-400 dark:text-slate-500">-</span>
                                            <input
                                                type="time"
                                                value={format(editedEvent.end, 'HH:mm')}
                                                onChange={() => { }}
                                                className="bg-transparent text-xs font-semibold focus:outline-none w-16 text-slate-700 dark:text-slate-300"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{format(editedEvent.start, 'HH:mm')} - {format(editedEvent.end, 'HH:mm')}</span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Tiempo Estimado</label>
                                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
                                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-brand-red dark:border-t-red-500 animate-spin opacity-50" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{durationString}</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Client & Location */}
                        <div className="grid grid-cols-2 gap-4">


                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Asignado Por</label>
                                <div className="flex items-center gap-3 p-2 bg-slate-100/50 rounded-xl border border-slate-100">
                                    <User size={16} className="text-slate-400" />
                                    <span className="text-sm font-medium text-slate-500 select-none truncate">
                                        {editedEvent.assignedBy || 'Sistema'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Description */}
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Detalle de la Idea</label>
                            {isEditing ? (
                                <textarea
                                    value={editedEvent.description}
                                    onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
                                    className="w-full p-3 bg-white rounded-xl border border-slate-300 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none text-sm text-slate-600 min-h-[100px]"
                                />
                            ) : (
                                <div className="p-3 bg-white dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-h-[120px] overflow-y-auto">
                                    {editedEvent.description}
                                </div>
                            )}
                        </div>


                        {/* 4. Footer Info (Static Location) */}
                        <div className="flex items-center gap-4 pt-2 border-t border-slate-100 mt-4">
                            {(editedEvent.type === 'visit' || editedEvent.type === 'meeting') && (
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <MapPin size={14} />
                                    <span>Oficina Central</span>
                                </div>
                            )}

                            {/* Quick Action Buttons - Only in floating view */}
                            {isFloating && (
                                <div className="ml-auto flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowDatePicker(true);
                                        }}
                                        className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 transition-colors shadow-sm"
                                        title="Cambiar fecha"
                                    >
                                        <CalendarClock size={16} />
                                    </button>
                                    <button
                                        onClick={handleQuickComplete}
                                        className="p-2 rounded-full bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800 transition-colors shadow-sm"
                                        title="Marcar como completada"
                                    >
                                        <Check size={16} />
                                    </button>
                                </div>
                            )}

                            <div className="ml-auto text-xs text-slate-300 font-mono">
                                ID: {editedEvent.id}
                            </div>
                        </div>
                    </div>
                ) : (
                    // --- COMPACT STANDARD CONTENT (Day/Week/List) ---
                    <div className="mt-auto pt-1 flex items-end justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 text-[9px] text-slate-500 font-medium leading-none">
                                <Clock size={10} className="text-slate-400" />
                                <span className="truncate">{format(editedEvent.start, 'HH:mm')} - {format(editedEvent.end, 'HH:mm')}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5 truncate leading-none">
                                <User size={10} />
                                <span className="truncate">{editedEvent.company?.trade_name || editedEvent.company?.legal_name || 'Sin cliente'}</span>
                            </div>
                        </div>
                        {/* Three-dot menu button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDetails(true);
                            }}
                            className="flex-shrink-0 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-brand-red dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Opciones"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="12" cy="5" r="1"></circle>
                                <circle cx="12" cy="19" r="1"></circle>
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const TriggerCard = () => {
        if (isCompactView) {
            return (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowDetails(true);
                    }}
                    className="group relative bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg p-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex items-center gap-2 hover:border-brand-red/30 dark:hover:border-red-500/30"
                >
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate leading-tight group-hover:text-brand-red dark:group-hover:text-red-400 transition-colors">{editedEvent.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{format(editedEvent.start, 'HH:mm')}</p>
                    </div>
                </div>
            );
        }
        return <FullDetailContent />;
    };

    return (
        <>
            <TriggerCard />

            {showDetails && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/30 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setShowDetails(false)}
                >
                    <div onClick={e => e.stopPropagation()}>
                        <FullDetailContent isFloating={true} onClose={() => setShowDetails(false)} />
                    </div>
                </div>,
                document.body
            )}

            {/* Date Picker Modal */}
            {showDatePicker && createPortal(
                <div
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
                    onClick={() => setShowDatePicker(false)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full"
                    >
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                            Cambiar Fecha
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            {editedEvent.title}
                        </p>
                        <input
                            type="date"
                            value={tempDate || editedEvent.scheduled_date}
                            onChange={(e) => setTempDate(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                            autoFocus
                        />
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => {
                                    setShowDatePicker(false);
                                    setTempDate('');
                                }}
                                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDateChangeSave}
                                className="flex-1 px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700 transition-colors font-bold"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default EventCard;
