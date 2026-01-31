import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, User, MapPin, Check, Cloud, Flame, Snowflake } from 'lucide-react';
import { format, addHours, addMinutes } from 'date-fns';

const priorityConfig = {
    high: {
        id: 'high',
        label: 'Urgente',
        logo: '/logo_urgente.png',
        color: 'bg-red-50 border-red-200',
        activeColor: 'bg-red-100 border-red-500 ring-2 ring-red-500/20'
    },
    medium: {
        id: 'medium',
        label: 'Tibio',
        logo: '/logo_tibio.png',
        color: 'bg-orange-50 border-orange-200',
        activeColor: 'bg-orange-100 border-orange-500 ring-2 ring-orange-500/20'
    },
    low: {
        id: 'low',
        label: 'Frío',
        logo: '/logo_frio.png',
        color: 'bg-blue-50 border-blue-200',
        activeColor: 'bg-blue-100 border-blue-500 ring-2 ring-blue-500/20'
    },
};

const typeConfig = [
    { id: 'visit', label: 'Visita', color: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200' },
    { id: 'call', label: 'Llamada', color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' },
    { id: 'meeting', label: 'Reunión', color: 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200' },
    { id: 'reminder', label: 'Recordatorio', color: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' },
    { id: 'task', label: 'Tarea', color: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' },
    { id: 'quote', label: 'Cotizar', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' },
];

const durationOptions = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hora' },
    { value: 90, label: '1.5 horas' },
    { value: 120, label: '2 horas' },
    { value: 180, label: '3 horas' },
];

const CreateEventModal = ({ isOpen, onClose, onCreate }) => {
    if (!isOpen) return null;

    const [newEvent, setNewEvent] = useState({
        title: '',
        priority: 'medium',
        type: 'visit',
        start: format(new Date(), "yyyy-MM-dd'T'HH:00"),
        duration: 60, // minutes
        client: '',
        description: '',
        assignedTo: 'Martin G.' // Current user as default
    });

    // Calculate end time based on duration
    const getEndTime = () => {
        const startDate = new Date(newEvent.start);
        return addMinutes(startDate, newEvent.duration);
    };

    const handleSubmit = () => {
        if (!newEvent.title || !newEvent.client) {
            alert('Por favor completa el título y el cliente.');
            return;
        }

        const createdEvent = {
            id: Date.now(),
            ...newEvent,
            start: new Date(newEvent.start),
            end: getEndTime(),
            status: 'pending'
        };

        onCreate(createdEvent);
        onClose();
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Nuevo Evento</h2>
                        <p className="text-sm text-slate-500">Agenda una nueva actividad en el calendario</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">

                    {/* 1. Title - FIRST */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Título del Evento</label>
                        <input
                            type="text"
                            placeholder="Ej: Visita Comercial TechSolutions"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            className="w-full text-lg font-bold p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand-red/50 focus:bg-white focus:outline-none transition-all placeholder:font-normal"
                            autoFocus
                        />
                    </div>

                    {/* 2. Client/Company - SECOND (like classification in clients) */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Cliente / Empresa</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                value={newEvent.client}
                                onChange={(e) => setNewEvent({ ...newEvent, client: e.target.value })}
                                className="w-full pl-10 p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-red/20 outline-none font-medium"
                            />
                        </div>
                    </div>

                    {/* 3. Priority Selection - COMPACT (single row) */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Prioridad</label>
                        <div className="flex gap-3">
                            {Object.values(priorityConfig).map((p) => {
                                const isActive = newEvent.priority === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => setNewEvent({ ...newEvent, priority: p.id })}
                                        className={`
                                            flex-1 relative cursor-pointer rounded-xl p-3 border-2 transition-all duration-200 flex items-center gap-2 justify-center
                                            ${isActive ? p.activeColor : `${p.color} border-transparent hover:scale-[1.02]`}
                                        `}
                                    >
                                        <img
                                            src={p.logo}
                                            alt={p.label}
                                            className={`w-6 h-6 object-contain transition-transform ${isActive ? 'scale-110' : 'grayscale-[0.3]'}`}
                                        />
                                        <span className={`text-sm font-bold ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                                            {p.label}
                                        </span>
                                        {isActive && (
                                            <Check size={14} strokeWidth={3} className="text-brand-red absolute top-2 right-2" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 4. Type Selection - with Recordatorio */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Tipo de Actividad</label>
                        <div className="flex flex-wrap gap-2">
                            {typeConfig.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setNewEvent({ ...newEvent, type: t.id })}
                                    className={`
                                        px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all
                                        ${newEvent.type === t.id ? t.color.replace('bg-', 'bg-opacity-100 ring-2 ring-offset-1 ring-slate-200') : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}
                                    `}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 5. Date & Duration (instead of end date) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Fecha y Hora</label>
                            <input
                                type="datetime-local"
                                value={newEvent.start}
                                onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 focus:border-brand-red outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Duración</label>
                            <select
                                value={newEvent.duration}
                                onChange={(e) => setNewEvent({ ...newEvent, duration: parseInt(e.target.value) })}
                                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 focus:border-brand-red outline-none"
                            >
                                {durationOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Detalle / Notas</label>
                        <textarea
                            placeholder="Describe brevemente el objetivo de la reunión o detalles importantes..."
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-red focus:ring-1 focus:ring-brand-red/50 outline-none text-sm min-h-[100px] resize-none"
                        />
                    </div>

                    {/* Footer / Asignar a (instead of Asignado por) */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-3 bg-slate-100/50 px-4 py-2 rounded-full">
                            <User size={16} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Asignar a: <span className="text-slate-800">{newEvent.assignedTo}</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-8 py-2.5 rounded-xl bg-brand-red text-white font-bold shadow-lg shadow-brand-red/30 hover:shadow-brand-red/50 hover:bg-red-700 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                Crear Evento
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
};

export default CreateEventModal;
