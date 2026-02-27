import React, { useState, useEffect, useCallback } from 'react';
import { X, MapPin, Calendar, Clock, User, AlignLeft, Flag, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrentTenant } from '../../hooks/useCurrentTenant';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanies } from '../../hooks/useCompanies';
import BusinessUnitPicker from '../shared/BusinessUnitPicker';

// ─── Constants ───────────────────────────────────────────────────────────────
const PRIORITY_OPTIONS = [
    { value: 'high', label: 'Alta' },
    { value: 'medium', label: 'Media' },
    { value: 'low', label: 'Baja' },
];

const INITIAL_FORM = {
    title: '',
    company_id: '',
    comercial_id: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: '',
    priority: 'medium',
    description: '',
    establishment_id: '',
};

// ─── FieldWrapper ─────────────────────────────────────────────────────────────
const FieldWrapper = ({ label, icon: Icon, required, children }) => (
    <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            {Icon && <Icon size={12} className="text-slate-400" />}
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

const inputCls = `
    w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800
    focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red
    transition-all placeholder:text-slate-400
`;

// ─── Component ────────────────────────────────────────────────────────────────
/**
 * VisitFormModal — Create / Edit visit modal.
 * On submit, inserts/updates an activity record with activity_type = 'visit'.
 * Receives optional `initialData` for edit mode.
 */
const VisitFormModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
    const { tenantId } = useCurrentTenant();
    const { comercialId, isAdmin, isSupervisor } = useAuth();

    const [form, setForm] = useState(INITIAL_FORM);
    const { companies: allCompanies } = useCompanies();
    const clients = allCompanies.filter(c => c.company_type === 'client');
    const prospects = allCompanies.filter(c => c.company_type === 'prospect');
    const [comerciales, setComerciales] = useState([]);
    const [establishments, setEstablishments] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // ── Populate from initialData (edit mode) ──────────────────────────────
    useEffect(() => {
        if (initialData) {
            setForm({
                title: initialData.title || '',
                company_id: initialData.company_id || '',
                comercial_id: initialData.comercial_id || '',
                scheduled_date: initialData.scheduled_date || '',
                scheduled_time: initialData.scheduled_time?.slice(0, 5) || '',
                duration_minutes: initialData.duration_minutes || '',
                priority: initialData.priority || 'medium',
                description: initialData.description || '',
                establishment_id: initialData.establishment_id || '',
            });
        } else {
            setForm({ ...INITIAL_FORM, comercial_id: comercialId || '' });
        }
        setErrors({});
    }, [initialData, isOpen, comercialId]);

    // ── Load dropdowns ─────────────────────────────────────────────────────
    const loadDropdowns = useCallback(async () => {
        if (!tenantId) return;
        const [{ data: com }, { data: est }] = await Promise.all([
            supabase.from('comerciales').select('id, name').eq('tenant_id', tenantId).eq('is_active', true).order('name'),
            supabase.from('establishments').select('id, name, company_id').eq('tenant_id', tenantId).order('name'),
        ]);
        setComerciales(com || []);
        setEstablishments(est || []);
    }, [tenantId]);

    useEffect(() => {
        if (isOpen) loadDropdowns();
    }, [isOpen, loadDropdowns]);

    // ── Auto-link establishment when company changes ───────────────────────
    useEffect(() => {
        if (!form.company_id) {
            setForm(f => ({ ...f, establishment_id: '' }));
            return;
        }
        const linked = establishments.find(e => e.company_id === form.company_id);
        if (linked) {
            setForm(f => ({ ...f, establishment_id: linked.id }));
        }
    }, [form.company_id, establishments]);

    const handleChange = (field, value) => {
        setForm(f => ({ ...f, [field]: value }));
        if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
    };

    // ── Validation ─────────────────────────────────────────────────────────
    const validate = () => {
        const newErrors = {};
        if (!form.title.trim()) newErrors.title = 'El título es requerido';
        if (!form.company_id) newErrors.company_id = 'El cliente es requerido';
        if (!form.scheduled_date) newErrors.scheduled_date = 'La fecha es requerida';
        if (!form.comercial_id) newErrors.comercial_id = 'El comercial es requerido';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ── Submit ─────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            const payload = {
                title: form.title.trim(),
                company_id: form.company_id || null,
                comercial_id: form.comercial_id || null,
                scheduled_date: form.scheduled_date || null,
                scheduled_time: form.scheduled_time || null,
                duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
                priority: form.priority,
                description: form.description.trim() || null,
                establishment_id: form.establishment_id || null,
                activity_type: 'visit',
                status: initialData?.status || 'pending',
                tenant_id: tenantId,
            };

            let queryError;
            if (initialData?.id) {
                const { error } = await supabase
                    .from('activities')
                    .update(payload)
                    .eq('id', initialData.id)
                    .eq('tenant_id', tenantId);
                queryError = error;
            } else {
                const { error } = await supabase
                    .from('activities')
                    .insert(payload);
                queryError = error;
            }

            if (queryError) throw queryError;
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error('Error saving visit:', err);
            setErrors({ _global: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const isEditMode = Boolean(initialData?.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">
                            {isEditMode ? 'Editar visita' : 'Nueva visita'}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isEditMode ? 'Modificá los datos de la visita' : 'Planificá una visita a un cliente'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">

                    {/* Global error */}
                    {errors._global && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                            {errors._global}
                        </div>
                    )}

                    {/* Title */}
                    <FieldWrapper label="Título" icon={AlignLeft} required>
                        <input
                            type="text"
                            placeholder="Ej: Visita de seguimiento post-cosecha"
                            value={form.title}
                            onChange={e => handleChange('title', e.target.value)}
                            className={`${inputCls} ${errors.title ? 'border-red-400 bg-red-50' : ''}`}
                        />
                        {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                    </FieldWrapper>

                    {/* Client / Prospect — BusinessUnitPicker */}
                    <div className="flex flex-col gap-1.5">
                        <BusinessUnitPicker
                            value={form.company_id}
                            entityType={allCompanies.find(c => c.id === form.company_id)?.company_type || ''}
                            onChange={(entityId) => {
                                handleChange('company_id', entityId);
                            }}
                            clients={clients}
                            prospects={prospects}
                            required={true}
                            label="Cliente / Prospecto"
                        />
                        {errors.company_id && <p className="text-xs text-red-500">{errors.company_id}</p>}
                    </div>

                    {/* Date + Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <FieldWrapper label="Fecha" icon={Calendar} required>
                            <input
                                type="date"
                                value={form.scheduled_date}
                                onChange={e => handleChange('scheduled_date', e.target.value)}
                                className={`${inputCls} ${errors.scheduled_date ? 'border-red-400 bg-red-50' : ''}`}
                            />
                            {errors.scheduled_date && <p className="text-xs text-red-500">{errors.scheduled_date}</p>}
                        </FieldWrapper>
                        <FieldWrapper label="Hora" icon={Clock}>
                            <input
                                type="time"
                                value={form.scheduled_time}
                                onChange={e => handleChange('scheduled_time', e.target.value)}
                                className={inputCls}
                            />
                        </FieldWrapper>
                    </div>

                    {/* Duration + Priority */}
                    <div className="grid grid-cols-2 gap-3">
                        <FieldWrapper label="Duración (min)" icon={Clock}>
                            <input
                                type="number"
                                placeholder="Ej: 60"
                                min="5"
                                max="480"
                                value={form.duration_minutes}
                                onChange={e => handleChange('duration_minutes', e.target.value)}
                                className={inputCls}
                            />
                        </FieldWrapper>
                        <FieldWrapper label="Prioridad" icon={Flag}>
                            <select
                                value={form.priority}
                                onChange={e => handleChange('priority', e.target.value)}
                                className={inputCls}
                            >
                                {PRIORITY_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </FieldWrapper>
                    </div>

                    {/* Comercial — only admins/supervisors can change */}
                    {(isAdmin || isSupervisor) && (
                        <FieldWrapper label="Comercial" icon={User} required>
                            <select
                                value={form.comercial_id}
                                onChange={e => handleChange('comercial_id', e.target.value)}
                                className={`${inputCls} ${errors.comercial_id ? 'border-red-400 bg-red-50' : ''}`}
                            >
                                <option value="">Seleccionar comercial...</option>
                                {comerciales.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {errors.comercial_id && <p className="text-xs text-red-500">{errors.comercial_id}</p>}
                        </FieldWrapper>
                    )}

                    {/* Establishment (auto-linked, but overridable) */}
                    {establishments.length > 0 && (
                        <FieldWrapper label="Campo (opcional)" icon={MapPin}>
                            <select
                                value={form.establishment_id}
                                onChange={e => handleChange('establishment_id', e.target.value)}
                                className={inputCls}
                            >
                                <option value="">Sin campo vinculado</option>
                                {establishments.map(est => (
                                    <option key={est.id} value={est.id}>{est.name}</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-slate-400">
                                Se vincula automáticamente al seleccionar un cliente con campo.
                            </p>
                        </FieldWrapper>
                    )}

                    {/* Description */}
                    <FieldWrapper label="Notas / Observaciones" icon={AlignLeft}>
                        <textarea
                            rows={3}
                            placeholder="Objetivos, referencias, recordatorios..."
                            value={form.description}
                            onChange={e => handleChange('description', e.target.value)}
                            className={`${inputCls} resize-none`}
                        />
                    </FieldWrapper>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-red text-white text-sm font-bold hover:bg-brand-red/90 disabled:opacity-60 transition-all shadow-sm"
                    >
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        {isEditMode ? 'Guardar cambios' : 'Crear visita'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VisitFormModal;
