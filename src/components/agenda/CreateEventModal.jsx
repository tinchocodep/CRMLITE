import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, User, MapPin, Check, Cloud, Flame, Snowflake, ChevronDown, UserPlus } from 'lucide-react';
import { format, addHours, addMinutes } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const priorityConfig = {
    high: {
        id: 'high',
        label: 'Alta',
        logo: '/logo_urgente.png',
        color: 'bg-red-50 border-red-200',
        activeColor: 'bg-red-100 border-red-500 ring-2 ring-red-500/20'
    },
    medium: {
        id: 'medium',
        label: 'Media',
        logo: '/logo_tibio.png',
        color: 'bg-orange-50 border-orange-200',
        activeColor: 'bg-orange-100 border-orange-500 ring-2 ring-orange-500/20'
    },
    low: {
        id: 'low',
        label: 'Baja',
        logo: '/logo_frio.png',
        color: 'bg-blue-50 border-blue-200',
        activeColor: 'bg-blue-100 border-blue-500 ring-2 ring-blue-500/20'
    },
};

const typeConfig = [
    { id: 'visit', label: 'Visita', color: 'bg-brand-red/10 text-brand-red border-brand-red/20 hover:bg-brand-red/20' },
    { id: 'call', label: 'Llamada', color: 'bg-brand-red/10 text-brand-red border-brand-red/20 hover:bg-brand-red/20' },
    { id: 'meeting', label: 'Reunión', color: 'bg-brand-red/10 text-brand-red border-brand-red/20 hover:bg-brand-red/20' },
    { id: 'reminder', label: 'Recordatorio', color: 'bg-brand-red/10 text-brand-red border-brand-red/20 hover:bg-brand-red/20' },
    { id: 'task', label: 'Tarea', color: 'bg-brand-red/10 text-brand-red border-brand-red/20 hover:bg-brand-red/20' },
    { id: 'quote', label: 'Cotizar', color: 'bg-brand-red/10 text-brand-red border-brand-red/20 hover:bg-brand-red/20' },
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
    const { user } = useAuth();
    const [teamMembers, setTeamMembers] = useState([]);

    if (!isOpen) return null;

    const [newEvent, setNewEvent] = useState({
        title: '',
        priority: 'medium',
        type: 'visit',
        start: format(new Date(), "yyyy-MM-dd'T'HH:00"),
        duration: 60, // minutes
        client: '',
        description: '',
        assignedTo: [] // Will be set after users load
    });

    const [showUserSelector, setShowUserSelector] = useState(false);

    // Fetch team members from Supabase
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('id, name, email')
                    .order('name');

                if (error) throw error;

                const currentUserId = user?.id;
                const formattedUsers = data.map(u => ({
                    id: u.id,
                    name: u.name || u.email.split('@')[0],
                    email: u.email,
                    isCurrentUser: u.id === currentUserId,
                    avatar: null
                }));

                setTeamMembers(formattedUsers);

                // Set current user as default assignee
                if (currentUserId && newEvent.assignedTo.length === 0) {
                    setNewEvent(prev => ({
                        ...prev,
                        assignedTo: [currentUserId]
                    }));
                }
            } catch (error) {
                console.error('Error fetching users:', error);
                setTeamMembers([]);
            }
        };

        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen, user]);

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
                        <h2 className="text-2xl font-bold text-slate-800">Nueva Actividad</h2>
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
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Título de la Actividad</label>
                        <input
                            type="text"
                            placeholder="Ej: Visita Comercial TechSolutions"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            className="w-full text-lg font-bold p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand-red/50 focus:bg-white focus:outline-none transition-all placeholder:font-normal"
                            autoFocus
                        />
                    </div>

                    {/* 2. Type Selection - SECOND */}
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

                    {/* 3. Priority Selection - THIRD */}
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

                    {/* 4. Client/Company - FOURTH */}
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

                    {/* Asignar a: Multi-user selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Asignar a:</label>

                        {/* Selected users chips */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            {newEvent.assignedTo.map(userId => {
                                const user = teamMembers.find(u => u.id === userId);
                                if (!user) return null;
                                return (
                                    <div
                                        key={userId}
                                        className="flex items-center gap-2 bg-brand-red/10 border border-brand-red/20 rounded-full px-3 py-1.5"
                                    >
                                        <div className="w-5 h-5 rounded-full bg-brand-red text-white flex items-center justify-center text-[10px] font-bold">
                                            {user.name.charAt(0)}
                                        </div>
                                        <span className="text-xs font-medium text-slate-700">
                                            {user.name}{user.isCurrentUser ? ' (Tú)' : ''}
                                        </span>
                                        <button
                                            onClick={() => {
                                                // Don't allow removing all users
                                                if (newEvent.assignedTo.length > 1) {
                                                    setNewEvent({
                                                        ...newEvent,
                                                        assignedTo: newEvent.assignedTo.filter(id => id !== userId)
                                                    });
                                                }
                                            }}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Dropdown selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserSelector(!showUserSelector)}
                                className="w-full flex items-center justify-between gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:border-brand-red/50 transition-colors"
                            >
                                <div className="flex items-center gap-2 text-slate-600">
                                    <UserPlus size={16} />
                                    <span className="text-sm font-medium">Agregar persona</span>
                                </div>
                                <ChevronDown size={16} className={`text-slate-400 transition-transform ${showUserSelector ? 'rotate-180' : ''}`} />
                            </button>

                            {/* User list dropdown */}
                            {showUserSelector && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                                    {teamMembers.map(user => {
                                        const isSelected = newEvent.assignedTo.includes(user.id);
                                        return (
                                            <button
                                                key={user.id}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        // Remove user (but keep at least one)
                                                        if (newEvent.assignedTo.length > 1) {
                                                            setNewEvent({
                                                                ...newEvent,
                                                                assignedTo: newEvent.assignedTo.filter(id => id !== user.id)
                                                            });
                                                        }
                                                    } else {
                                                        // Add user
                                                        setNewEvent({
                                                            ...newEvent,
                                                            assignedTo: [...newEvent.assignedTo, user.id]
                                                        });
                                                    }
                                                }}
                                                className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${isSelected ? 'bg-brand-red/5' : ''
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-brand-red border-brand-red' : 'border-slate-300'
                                                    }`}>
                                                    {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-red to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="text-sm font-medium text-slate-700">
                                                        {user.name}{user.isCurrentUser ? ' (Tú)' : ''}
                                                    </div>
                                                    <div className="text-xs text-slate-400">{user.email}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="text-xs text-slate-400">
                            {newEvent.assignedTo.length} {newEvent.assignedTo.length === 1 ? 'persona asignada' : 'personas asignadas'}
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
                                Crear Actividad
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
