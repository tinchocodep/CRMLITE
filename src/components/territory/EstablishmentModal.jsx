import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin } from 'lucide-react';
import { useCompanies } from '../../hooks/useCompanies';
import { useSystemToast } from '../../hooks/useSystemToast';

/**
 * EstablishmentModal
 * - Sin `establishment` prop → modo creación
 * - Con `establishment` prop → modo edición (pre-carga datos)
 * - `onSave(data, establishment)` → función externa que hace create o update
 */
const EstablishmentModal = ({ isOpen, onClose, establishment = null, onSave }) => {
    const isEditMode = Boolean(establishment);

    const { companies } = useCompanies('client');
    const { showSuccess, showError } = useSystemToast();

    const [formData, setFormData] = useState({
        name: '',
        company_id: '',
        location: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pre-carga los datos cuando se abre en modo edición
    useEffect(() => {
        if (isOpen && isEditMode) {
            setFormData({
                name: establishment.name || '',
                company_id: establishment.company_id || '',
                location: establishment.location || ''
            });
        } else if (!isOpen) {
            // Limpia el formulario al cerrar
            setFormData({ name: '', company_id: '', location: '' });
        }
    }, [isOpen, establishment, isEditMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showError('El nombre del establecimiento es requerido');
            return;
        }

        if (!formData.company_id) {
            showError('Debe seleccionar una empresa');
            return;
        }

        setIsSubmitting(true);

        try {
            // Delegate to the centralized handler from TerritoryPage
            const result = await onSave(formData, establishment);

            if (result && result.success === false) {
                throw new Error(result.error || 'Error desconocido');
            }

            showSuccess(isEditMode ? 'Establecimiento actualizado correctamente' : 'Establecimiento creado correctamente');
            onClose();
        } catch (error) {
            showError(isEditMode ? 'Error al actualizar el establecimiento' : 'Error al crear el establecimiento');
            console.error('Error saving establishment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4">
                <div className="backdrop-blur-md bg-white/95 rounded-2xl shadow-2xl border border-white/20 overflow-hidden">

                    {/* Header */}
                    <div className="p-6 border-b border-gray-200/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Building2 className="w-5 h-5 text-green-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {isEditMode ? 'Editar Establecimiento' : 'Nuevo Establecimiento'}
                                </h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre del Establecimiento *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ej: Campo La Esperanza"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        {/* Company */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Empresa *
                            </label>
                            <select
                                name="company_id"
                                value={formData.company_id}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                required
                            >
                                <option value="">Seleccionar empresa...</option>
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                        {company.legal_name || company.trade_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Ubicación (opcional)
                                </div>
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="Ej: Ruta 9 km 234, Pergamino"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? (isEditMode ? 'Guardando...' : 'Creando...')
                                    : (isEditMode ? 'Guardar Cambios' : 'Crear Establecimiento')}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default EstablishmentModal;
