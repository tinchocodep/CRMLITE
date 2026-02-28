import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, User, Check, ChevronDown, UserPlus, Save } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrentTenant } from '../../hooks/useCurrentTenant';
import BusinessUnitPicker from '../shared/BusinessUnitPicker';

// Shared config — mirrors CreateEventModal for visual consistency
const priorityConfig = {
    high: {
        id: 'high',
        label: 'Alta',
        color: 'bg-red-50 border-red-200',
        activeColor: 'bg-red-100 border-red-500 ring-2 ring-red-500/20'
    },
    medium: {
        id: 'medium',
        label: 'Media',
        color: 'bg-orange-50 border-orange-200',
        activeColor: 'bg-orange-100 border-orange-500 ring-2 ring-orange-500/20'
    },
    low: {
        id: 'low',
        label: 'Baja',
        color: 'bg-blue-50 border-blue-200',
        activeColor: 'bg-blue-100 border-blue-500 ring-2 ring-blue-500/20'
    },
};

const typeConfig = [
    { id: 'visit', label: 'Visita' },
    { id: 'call', label: 'Llamada' },
    { id: 'meeting', label: 'Reunión' },
    { id: 'email', label: 'Email' },
    { id: 'task', label: 'Tarea' },
    { id: 'other', label: 'Otro' },
];

const durationOptions = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hora' },
    { value: 90, label: '1.5 horas' },
    { value: 120, label: '2 horas' },
    { value: 180, label: '3 horas' },
];

/**
 * EditActivityModal — Opens when user clicks an activity card.
 * Receives the full activity object and allows inline editing of all fields.
 * 
 * Props:
 *  - activity: the activity object to edit
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - onSave: (id, updates) => Promise<{success, error?}>
 *  - companies: array of companies for BusinessUnitPicker
 *  - comerciales: array of comerciales for assignment selector
 */
const EditActivityModal = ({ activity, isOpen, onClose, onSave, companies = [], comerciales = [] }) => {
    const clients = useMemo(() => companies.filter(c => c.company_type === 'client'), [companies]);
    const prospects = useMemo(() => companies.filter(c => c.company_type === 'prospect'), [companies]);
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        title: '',
        activity_type: 'visit',
        priority: 'medium',
        scheduled_date: '',
        scheduled_time: '09:00',
        duration: 60,
        company_id: '',
        entity_type: '',
        comercial_id: '',
        description: '',
    });

    const [isSaving, setIsSaving] = useState(false);
    const [showComercialSelector, setShowComercialSelector] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);

    // Populate form when activity changes
    useEffect(() => {
        if (!activity || !isOpen) return;

        // Extract date and time from the activity
        // Activity may come from sidebar (scheduled_date/scheduled_time) or from agenda (start Date object)
        let dateStr = '';
        let timeStr = '09:00';

        if (activity.scheduled_date) {
            dateStr = activity.scheduled_date;
        } else if (activity.start instanceof Date) {
            dateStr = format(activity.start, 'yyyy-MM-dd');
        }

        if (activity.scheduled_time) {
            timeStr = activity.scheduled_time;
        } else if (activity.start instanceof Date) {
            timeStr = format(activity.start, 'HH:mm');
        }

        setFormData({
            title: activity.title || '',
            activity_type: activity.activity_type || activity.type || 'visit',
            priority: activity.priority || 'medium',
            scheduled_date: dateStr,
            scheduled_time: timeStr,
            duration: activity.duration || 60,
            company_id: activity.company_id || '',
            entity_type: activity.entity_type || '',
            comercial_id: activity.comercial_id || '',
            description: activity.description || '',
        });
    }, [activity, isOpen]);

    // Load comerciales for the selector
    useEffect(() => {
        const setupComerciales = async () => {
            if (!comerciales || comerciales.length === 0) {
                // Fallback: try to load from the activity's comercial_id
                setTeamMembers([]);
                return;
            }

            const { data: { user: authUser } } = await supabase.auth.getUser();
            const { data: userData } = await supabase
                .from('users')
                .select('comercial_id')
                .eq('id', authUser?.id)
                .single();

            const currentComercialId = userData?.comercial_id;

            const formattedComerciales = comerciales.map(c => ({
                id: c.id,
                name: c.name || c.email?.split('@')[0] || 'Sin nombre',
                email: c.email,
                isCurrentUser: c.id === currentComercialId,
            }));

            setTeamMembers(formattedComerciales);
        };

        if (isOpen) {
            setupComerciales();
        }
    }, [isOpen, comerciales]);

    // All hooks called before conditional returns
    if (!isOpen || !activity) return null;

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            const updates = {
                title: formData.title,
                activity_type: formData.activity_type,
                priority: formData.priority,
                scheduled_date: formData.scheduled_date,
                scheduled_time: formData.scheduled_time,
                duration: formData.duration,
                company_id: formData.company_id ? parseInt(formData.company_id) : null,
                comercial_id: formData.comercial_id || null,
                description: formData.description || null,
            };

            await onSave(activity.id, updates);
            onClose();
        } catch (error) {
            console.error('[EditActivityModal] Error saving:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const selectedComercial = teamMembers.find(m => m.id === formData.comercial_id);

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 dark:border-slate-700 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Editar Actividad</h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Modificá los campos que necesites</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">

                    {/* 1. Título */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Título de la Actividad</label>
                        <input
                            type="text"
                            placeholder="Ej: Visita Comercial TechSolutions"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full text-lg font-bold p-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-600 rounded-xl focus:border-advanta-green/50 focus:bg-white dark:focus:bg-slate-600 focus:outline-none transition-all placeholder:font-normal text-slate-800 dark:text-slate-100"
                            autoFocus
                        />
                    </div>

                    {/* 2. Tipo */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Tipo de Actividad</label>
                        <div className="flex flex-wrap gap-2">
                            {typeConfig.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setFormData({ ...formData, activity_type: t.id })}
                                    className={`
                                        px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all
                                        ${formData.activity_type === t.id
                                            ? 'bg-advanta-green/10 text-advanta-green border-advanta-green/30 ring-2 ring-offset-1 ring-advanta-green/20'
                                            : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-500'
                                        }
                                    `}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Fecha, Hora y Duración */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Fecha</label>
                            <input
                                type="date"
                                value={formData.scheduled_date}
                                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                                className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-200 focus:border-advanta-green outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Hora</label>
                            <input
                                type="time"
                                value={formData.scheduled_time}
                                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                                className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-200 focus:border-advanta-green outline-none"
                            />
                        </div>
                        {['visit', 'call', 'meeting'].includes(formData.activity_type) && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Duración</label>
                                <select
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                    className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-200 focus:border-advanta-green outline-none"
                                >
                                    {durationOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* 4. Prioridad */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Prioridad</label>
                        <div className="flex gap-3">
                            {Object.values(priorityConfig).map((p) => {
                                const isActive = formData.priority === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => setFormData({ ...formData, priority: p.id })}
                                        className={`
                                            flex-1 relative cursor-pointer rounded-xl p-3 border-2 transition-all duration-200 flex items-center gap-2 justify-center
                                            ${isActive ? p.activeColor : `${p.color} border-transparent hover:scale-[1.02]`}
                                        `}
                                    >
                                        <span className={`text-sm font-bold ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                                            {p.label}
                                        </span>
                                        {isActive && (
                                            <Check size={14} strokeWidth={3} className="text-advanta-green absolute top-2 right-2" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 5. Empresa */}
                    <BusinessUnitPicker
                        value={formData.company_id}
                        entityType={formData.entity_type}
                        onChange={(entityId, entityType) => {
                            setFormData(prev => ({ ...prev, company_id: entityId, entity_type: entityType }));
                        }}
                        clients={clients}
                        prospects={prospects}
                        required
                        label="Cliente / Prospecto"
                    />

                    {/* 6. Asignación de Comercial */}
                    {teamMembers.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Asignar a:</label>

                            {/* Current assignment chip */}
                            {selectedComercial && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <div className="flex items-center gap-2 bg-advanta-green/10 border border-advanta-green/20 rounded-full px-3 py-1.5">
                                        <div className="w-5 h-5 rounded-full bg-advanta-green text-white flex items-center justify-center text-[10px] font-bold">
                                            {selectedComercial.name.charAt(0)}
                                        </div>
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                            {selectedComercial.name}{selectedComercial.isCurrentUser ? ' (Tú)' : ''}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Selector dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowComercialSelector(!showComercialSelector)}
                                    className="w-full flex items-center justify-between gap-2 p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:border-advanta-green/50 transition-colors"
                                >
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <UserPlus size={16} />
                                        <span className="text-sm font-medium">Cambiar asignación ({teamMembers.length} disponibles)</span>
                                    </div>
                                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${showComercialSelector ? 'rotate-180' : ''}`} />
                                </button>

                                {showComercialSelector && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                                        {teamMembers.map(member => {
                                            const isSelected = formData.comercial_id === member.id;
                                            return (
                                                <button
                                                    key={member.id}
                                                    onClick={() => {
                                                        setFormData({ ...formData, comercial_id: member.id });
                                                        setShowComercialSelector(false);
                                                    }}
                                                    className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0 ${isSelected ? 'bg-advanta-green/5' : ''}`}
                                                >
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-advanta-green border-advanta-green' : 'border-slate-300 dark:border-slate-500'}`}>
                                                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-advanta-green to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                                                        {member.name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                            {member.name}{member.isCurrentUser ? ' (Tú)' : ''}
                                                        </div>
                                                        <div className="text-xs text-slate-400">{member.email}</div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 7. Descripción */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Observaciones</label>
                        <textarea
                            placeholder="Notas adicionales sobre la actividad..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:bg-white dark:focus:bg-slate-600 focus:border-advanta-green focus:ring-1 focus:ring-advanta-green/50 outline-none text-sm min-h-[100px] resize-none text-slate-700 dark:text-slate-200"
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`px-8 py-2.5 rounded-xl font-bold shadow-lg transition-all transform flex items-center gap-2 ${isSaving
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    : 'bg-brand text-white shadow-advanta-green/30 hover:shadow-advanta-green/50 hover:-translate-y-0.5 active:translate-y-0'
                                    }`}
                            >
                                <Save size={16} />
                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
};

export default EditActivityModal;
