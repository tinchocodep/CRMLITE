import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCompanies } from '../../hooks/useCompanies';
import { useAuth } from '../../contexts/AuthContext';
import { useSubmitGuard } from '../../hooks/useSubmitGuard';
import ComercialSelector from '../shared/ComercialSelector';
import BusinessUnitPicker from '../shared/BusinessUnitPicker';

// Porcentajes de referencia por status (sugerencias, no obligatorios)
const statusProbabilityReference = {
    iniciado: 10,
    presupuestado: 30,
    negociado: 60,
    ganado: 100,
    perdido: 0
};

export const SimpleOpportunityModal = ({ isOpen, onClose, onSave, opportunity = null }) => {
    const { companies } = useCompanies();
    const { isAdmin } = useAuth();
    const { isSubmitting, withGuard } = useSubmitGuard();

    // Filter companies by type
    const clients = companies.filter(c => c.company_type === 'client');
    const prospects = companies.filter(c => c.company_type === 'prospect');

    const INITIAL_FORM_STATE = {
        opportunity_name: '',
        linkedEntityId: '',
        linkedEntityType: '',
        product: '',
        amount: '',
        probability: 10,
        close_date: '',
        status: 'iniciado',
        notes: '',
        next_action: '',
        next_action_date: '',
        comercial_id: '',
        business_unit_id: null
    };

    const [formData, setFormData] = useState(() => {
        if (opportunity) {
            return {
                opportunity_name: opportunity.opportunity_name || '',
                linkedEntityId: opportunity.company_id?.toString() || '',
                linkedEntityType: opportunity.company?.company_type || '',
                product: opportunity.product_type || '',
                amount: opportunity.amount || '',
                probability: opportunity.probability ?? statusProbabilityReference[opportunity.status] ?? 10,
                close_date: opportunity.close_date || '',
                status: opportunity.status || 'iniciado',
                notes: opportunity.notes || '',
                next_action: opportunity.next_action || '',
                next_action_date: opportunity.next_action_date || '',
                comercial_id: opportunity.comercial_id || '',
                business_unit_id: opportunity.business_unit_id || null
            };
        }
        return INITIAL_FORM_STATE;
    });
    const [hasDraft, setHasDraft] = useState(false);

    // Actualizar formData cuando cambia opportunity (para edit) o resetear para crear
    useEffect(() => {
        if (opportunity) {
            setFormData({
                opportunity_name: opportunity.opportunity_name || '',
                linkedEntityId: opportunity.company_id?.toString() || '',
                linkedEntityType: opportunity.company?.company_type || '',
                product: opportunity.product_type || '',
                amount: opportunity.amount || '',
                probability: opportunity.probability ?? statusProbabilityReference[opportunity.status] ?? 10,
                close_date: opportunity.close_date || '',
                status: opportunity.status || 'iniciado',
                notes: opportunity.notes || '',
                next_action: opportunity.next_action || '',
                next_action_date: opportunity.next_action_date || '',
                comercial_id: opportunity.comercial_id || '',
                business_unit_id: opportunity.business_unit_id || null
            });
            setHasDraft(false);
        }
        // In create mode, only reset if there's no draft
        // (don't reset if user had unsaved data)
    }, [opportunity]);

    // Check if form has meaningful data (draft detection)
    const formHasData = !opportunity && (formData.opportunity_name || formData.linkedEntityId || formData.amount || formData.product);

    const handleClose = () => {
        if (formHasData) {
            setHasDraft(true);
        }
        onClose();
    };

    const handleDiscardDraft = () => {
        setFormData(INITIAL_FORM_STATE);
        setHasDraft(false);
    };

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        // Transform formData to match database schema
        const submitData = {
            opportunity_name: formData.opportunity_name,
            company_id: formData.linkedEntityId ? parseInt(formData.linkedEntityId) : null,
            product_type: formData.product,
            amount: formData.amount ? parseFloat(formData.amount) : null,
            probability: formData.probability,
            close_date: formData.close_date || null,
            status: formData.status,
            next_action: formData.next_action || null,
            next_action_date: formData.next_action_date || null,
            ...(formData.business_unit_id
                ? { comercial_id: null, business_unit_id: formData.business_unit_id }
                : (isAdmin && formData.comercial_id ? { comercial_id: formData.comercial_id, business_unit_id: null } : { business_unit_id: null })
            )
        };

        withGuard(async () => {
            await onSave(submitData);

            // Reset form after create (not edit)
            if (!opportunity) {
                setFormData(INITIAL_FORM_STATE);
                setHasDraft(false);
            }
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Reverse map: probability → status
    const probabilityToStatus = (prob) => {
        if (prob === 0) return 'perdido';
        if (prob <= 10) return 'iniciado';
        if (prob <= 30) return 'presupuestado';
        if (prob <= 60) return 'negociado';
        if (prob < 100) return 'negociado';
        return 'ganado';
    };

    const handleStatusChange = (e) => {
        const newStatus = e.target.value;
        const suggestedProbability = statusProbabilityReference[newStatus] || 10;
        setFormData(prev => ({
            ...prev,
            status: newStatus,
            probability: suggestedProbability
        }));
    };

    const handleProbabilityChange = (e) => {
        const value = parseInt(e.target.value);
        const derivedStatus = probabilityToStatus(value);
        setFormData(prev => ({ ...prev, probability: value, status: derivedStatus }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 rounded-t-2xl flex justify-between items-center z-10">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {opportunity ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
                    </h2>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500">
                        <X size={24} />
                    </button>
                </div>

                {/* Draft Banner */}
                {hasDraft && formHasData && (
                    <div className="mx-6 mt-3 flex items-center justify-between gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                        <div className="flex items-center gap-2">
                            <span className="text-amber-600 text-sm">⚠️</span>
                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Borrador pendiente de confirmar</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleDiscardDraft}
                            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 underline transition-colors"
                        >
                            Descartar
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Información Básica */}
                    <div className="space-y-4">

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Nombre de Oportunidad *
                            </label>
                            <input
                                type="text"
                                name="opportunity_name"
                                value={formData.opportunity_name}
                                onChange={handleChange}
                                required
                                placeholder="Ej: Venta de Fertilizantes Q1 2026"
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Comercial — ComercialSelector handles admin visibility */}
                        <ComercialSelector
                            value={formData.comercial_id}
                            businessUnitValue={formData.business_unit_id}
                            onChange={(cId, buId) => setFormData(prev => ({
                                ...prev,
                                comercial_id: cId,
                                business_unit_id: buId
                            }))}
                            label="Comercial Asignado"
                            required={false}
                        />

                        {/* Cliente / Prospecto — fila completa */}
                        <BusinessUnitPicker
                            value={formData.linkedEntityId}
                            entityType={formData.linkedEntityType}
                            onChange={(entityId, entityType, entity) => {
                                setFormData(prev => ({
                                    ...prev,
                                    linkedEntityId: entityId,
                                    linkedEntityType: entityType
                                }));
                            }}
                            clients={clients}
                            prospects={prospects}
                            required={true}
                            label="Cliente / Prospecto"
                        />

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Producto
                            </label>
                            <input
                                type="text"
                                name="product"
                                value={formData.product}
                                onChange={handleChange}
                                placeholder="Ej: Fertilizante NPK"
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Monto Estimado
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Fecha de Cierre Estimada
                                </label>
                                <input
                                    type="date"
                                    name="close_date"
                                    value={formData.close_date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Estado y Probabilidad */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">
                            📊 Estado y Probabilidad
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Estado
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleStatusChange}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="iniciado">🚀 Iniciado (1-10%)</option>
                                    <option value="presupuestado">📋 Presupuestado (11-30%)</option>
                                    <option value="negociado">🤝 Negociado (31-99%)</option>
                                    <option value="ganado">✅ Ganado (100%)</option>
                                    <option value="perdido">❌ Perdido (0%)</option>
                                </select>
                            </div>


                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Probabilidad de Cierre: {formData.probability}%
                            </label>
                            <div className="space-y-2">
                                <input
                                    type="range"
                                    name="probability"
                                    value={formData.probability}
                                    onChange={handleProbabilityChange}
                                    min="0"
                                    max="100"
                                    step="1"
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    style={{
                                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${formData.probability}%, #e2e8f0 ${formData.probability}%, #e2e8f0 100%)`
                                    }}
                                />
                                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                    <span>0%</span>
                                    <span>25%</span>
                                    <span>50%</span>
                                    <span>75%</span>
                                    <span>100%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Próximas Acciones */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">
                            🎯 Próximas Acciones
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Próxima Acción
                                </label>
                                <input
                                    type="text"
                                    name="next_action"
                                    value={formData.next_action}
                                    onChange={handleChange}
                                    placeholder="Ej: Llamar para seguimiento"
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Fecha de Próxima Acción
                                </label>
                                <input
                                    type="date"
                                    name="next_action_date"
                                    value={formData.next_action_date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>


                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all shadow-sm ${isSubmitting
                                ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                : 'btn-brand text-white hover:shadow-md'
                                }`}
                        >
                            {isSubmitting ? 'Guardando...' : (opportunity ? 'Actualizar' : 'Crear')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
