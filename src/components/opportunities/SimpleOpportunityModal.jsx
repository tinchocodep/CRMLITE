import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCompanies } from '../../hooks/useCompanies';
import BusinessUnitPicker from '../shared/BusinessUnitPicker';

// Porcentajes de referencia por status (sugerencias, no obligatorios)
const statusProbabilityReference = {
    prospecting: 10,
    qualification: 25,
    proposal: 50,
    negotiation: 75,
    won: 100,
    lost: 0
};

export const SimpleOpportunityModal = ({ isOpen, onClose, onSave, opportunity = null }) => {
    const { companies } = useCompanies();

    // Filter companies by type
    const clients = companies.filter(c => c.company_type === 'client');
    const prospects = companies.filter(c => c.company_type === 'prospect');

    const [formData, setFormData] = useState({
        opportunity_name: opportunity?.opportunity_name || '',
        linkedEntityId: opportunity?.company_id?.toString() || '',
        linkedEntityType: opportunity?.company?.company_type || '',
        product: opportunity?.product_type || '',
        amount: opportunity?.amount || '',
        probability: opportunity?.probability || 50,
        close_date: opportunity?.close_date || '',
        status: opportunity?.status || 'prospecting',
        notes: opportunity?.notes || '',
        next_action: opportunity?.next_action || '',
        next_action_date: opportunity?.next_action_date || '',
        source: opportunity?.source || ''
    });

    // Actualizar formData cuando cambia opportunity (para edit)
    useEffect(() => {
        if (opportunity) {
            setFormData({
                opportunity_name: opportunity.opportunity_name || '',
                linkedEntityId: opportunity.company_id?.toString() || '',
                linkedEntityType: opportunity.company?.company_type || '',
                product: opportunity.product_type || '',
                amount: opportunity.amount || '',
                probability: opportunity.probability || 50,
                close_date: opportunity.close_date || '',
                status: opportunity.status || 'prospecting',
                notes: opportunity.notes || '',
                next_action: opportunity.next_action || '',
                next_action_date: opportunity.next_action_date || '',
                source: opportunity.source || ''
            });
        }
    }, [opportunity]);


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
            notes: formData.notes || null,
            next_action: formData.next_action || null,
            next_action_date: formData.next_action_date || null,
            source: formData.source || null
        };

        onSave(submitData);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = (e) => {
        const newStatus = e.target.value;
        // Sugerir probabilidad de referencia pero permitir que el usuario la cambie después
        const suggestedProbability = statusProbabilityReference[newStatus] || 50;
        setFormData(prev => ({
            ...prev,
            status: newStatus,
            probability: suggestedProbability
        }));
    };

    const handleProbabilityChange = (e) => {
        const value = parseInt(e.target.value);
        setFormData(prev => ({ ...prev, probability: value }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl flex justify-between items-center z-10">
                    <h2 className="text-2xl font-bold">
                        {opportunity ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Información Básica */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">
                            📋 Información Básica
                        </h3>

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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                label="Unidad de Negocio"
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
                                    Origen de la Oportunidad
                                </label>
                                <select
                                    name="source"
                                    value={formData.source}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="inbound">Inbound - Cliente nos contactó</option>
                                    <option value="outbound">Outbound - Prospección activa</option>
                                    <option value="referral">Referido</option>
                                    <option value="event">Evento/Feria</option>
                                    <option value="partner">Socio comercial</option>
                                    <option value="other">Otro</option>
                                </select>
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
                                    <option value="prospecting">🔍 Prospección (ref: 10%)</option>
                                    <option value="qualification">📊 Calificación (ref: 25%)</option>
                                    <option value="proposal">📝 Propuesta (ref: 50%)</option>
                                    <option value="negotiation">💼 Negociación (ref: 75%)</option>
                                    <option value="won">🏆 Ganado (ref: 100%)</option>
                                    <option value="lost">❌ Perdido (ref: 0%)</option>
                                </select>
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
                                    step="5"
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

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Notas
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Agrega notas, comentarios o detalles importantes sobre esta oportunidad..."
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
                        >
                            {opportunity ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
