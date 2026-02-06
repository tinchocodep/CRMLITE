import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// Porcentajes de referencia por status (sugerencias, no obligatorios)
const statusProbabilityReference = {
    iniciado: 10,
    presupuestado: 30,
    negociado: 60,
    ganado: 100,
    perdido: 0
};

export const SimpleOpportunityModal = ({ isOpen, onClose, onSave, opportunity = null }) => {
    const [formData, setFormData] = useState({
        opportunity_name: opportunity?.opportunity_name || '',
        business_unit: opportunity?.business_unit || '',
        product: opportunity?.product || '',
        amount: opportunity?.amount || '',
        probability: opportunity?.probability || 50,
        close_date: opportunity?.close_date || '',
        status: opportunity?.status || 'iniciado'
    });

    // Actualizar formData cuando cambia opportunity (para edit)
    useEffect(() => {
        if (opportunity) {
            setFormData({
                opportunity_name: opportunity.opportunity_name || '',
                business_unit: opportunity.business_unit || '',
                product: opportunity.product || '',
                amount: opportunity.amount || '',
                probability: opportunity.probability || 50,
                close_date: opportunity.close_date || '',
                status: opportunity.status || 'iniciado'
            });
        }
    }, [opportunity]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
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
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {opportunity ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <X size={24} className="text-slate-600 dark:text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Unidad de Negocio
                            </label>
                            <input
                                type="text"
                                name="business_unit"
                                value={formData.business_unit}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Producto
                            </label>
                            <input
                                type="text"
                                name="product"
                                value={formData.product}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Monto
                        </label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

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
                            <option value="iniciado">🚀 Iniciado (ref: 10%)</option>
                            <option value="presupuestado">📋 Presupuestado (ref: 30%)</option>
                            <option value="negociado">🤝 Negociado (ref: 60%)</option>
                            <option value="ganado">✅ Ganado (ref: 100%)</option>
                            <option value="perdido">❌ Perdido (ref: 0%)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Probabilidad: {formData.probability}%
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

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Fecha de Cierre
                        </label>
                        <input
                            type="date"
                            name="close_date"
                            value={formData.close_date}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#E76E53] to-red-600 hover:from-[#D55E43] hover:to-red-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
                        >
                            {opportunity ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
