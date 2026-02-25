import React, { useState, useEffect } from 'react';
import { X, Save, Sprout, Calendar, Trash2 } from 'lucide-react';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useSystemToast } from '../../hooks/useSystemToast';

const CROP_TYPES = [
    { value: 'soy', label: 'Soja', icon: '🌱', color: '#22c55e' },
    { value: 'corn', label: 'Maíz', icon: '🌽', color: '#eab308' },
    { value: 'wheat', label: 'Trigo', icon: '🌾', color: '#f97316' },
    { value: 'sunflower', label: 'Girasol', icon: '🌻', color: '#fbbf24' },
    { value: 'other', label: 'Otro', icon: '📦', color: '#6b7280' }
];

const LotForm = ({
    lot,
    establishments = [],
    defaultEstablishmentId = null, // ID del establecimiento recién creado (para pre-selección)
    geometry,
    hectares,
    onSave,
    onDelete,
    onCancel,
    isOpen
}) => {
    const { confirm } = useConfirm();
    const toast = useSystemToast();

    const [formData, setFormData] = useState({
        name: '',
        establishment_id: '',
        crop_type: 'soy',
        campaign: '',
        sowing_date: '',
        color: '#22c55e',
        hectares: ''
    });

    useEffect(() => {
        if (lot) {
            setFormData({
                name: lot.name || '',
                establishment_id: lot.establishment_id || '',
                crop_type: lot.crop_type || 'soy',
                campaign: lot.campaign || '',
                sowing_date: lot.sowing_date || '',
                color: lot.color || '#22c55e',
                hectares: lot.hectares || ''
            });
        } else {
            // Reset for new lot. Prioridad: último creado > primero de la lista.
            setFormData({
                name: '',
                establishment_id: defaultEstablishmentId || establishments[0]?.id || '',
                crop_type: 'soy',
                campaign: '',
                sowing_date: '',
                color: '#22c55e',
                hectares: hectares?.toFixed(2) || ''
            });
        }
    }, [lot, establishments, hectares, defaultEstablishmentId]);

    const handleSubmit = (e) => {
        e?.preventDefault();

        // Validación manual — el botón Guardar está fuera del <form>,
        // por lo que el atributo HTML `required` no se dispara automáticamente.
        if (!formData.name?.trim()) {
            toast.showError('El nombre del lote es obligatorio.');
            return;
        }
        if (!formData.campaign?.trim()) {
            toast.showError('La campaña es obligatoria.');
            return;
        }

        const lotData = {
            name: formData.name,
            establishment_id: formData.establishment_id || null,
            crop_type: formData.crop_type,
            campaign: formData.campaign,
            sowing_date: formData.sowing_date || null,
            color: formData.color,
            geometry,
            hectares: formData.hectares ? parseFloat(formData.hectares) : hectares
        };

        console.log('🟢 LotForm submitting data:', lotData);
        console.log('🟢 Geometry:', geometry);
        console.log('🟢 Hectares (manual):', formData.hectares);
        console.log('🟢 Hectares (calculated):', hectares);
        onSave(lotData);
    };

    const handleCropTypeChange = (cropType) => {
        const crop = CROP_TYPES.find(c => c.value === cropType);
        setFormData({
            ...formData,
            crop_type: cropType,
            color: crop?.color || formData.color
        });
    };

    if (!isOpen) return null;

    return (
        <div
            className="absolute right-4 top-4 bottom-4 w-96 z-[1000]"
            onWheel={(e) => e.stopPropagation()}
        >
            <div className="h-full backdrop-blur-md bg-white/90 rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-200/50 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Sprout className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {lot ? 'Editar Lote' : 'Nuevo Lote'}
                                </h2>
                                {hectares && (
                                    <p className="text-sm text-gray-600">
                                        {hectares.toFixed(2)} hectáreas
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Form — scrollable, takes all available space between header and footer */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Lote *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Ej: Lote Norte"
                            required
                        />
                    </div>

                    {/* Establishment */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Establecimiento *
                        </label>
                        <select
                            value={formData.establishment_id}
                            onChange={(e) => setFormData({ ...formData, establishment_id: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                        >
                            <option value="">Seleccionar...</option>
                            {establishments.map((est) => (
                                <option key={est.id} value={est.id}>
                                    {est.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Crop Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Tipo de Cultivo
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {CROP_TYPES.map((crop) => (
                                <button
                                    key={crop.value}
                                    type="button"
                                    onClick={() => handleCropTypeChange(crop.value)}
                                    className={`p-3 rounded-lg border-2 transition-all ${formData.crop_type === crop.value
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{crop.icon}</span>
                                        <span className="text-sm font-medium">{crop.label}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                                placeholder="#22c55e"
                            />
                        </div>
                    </div>

                    {/* Campaign */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Campaña *
                        </label>
                        <input
                            type="text"
                            value={formData.campaign}
                            onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Ej: 2024/2025"
                            required
                        />
                    </div>

                    {/* Sowing Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha de Siembra
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="date"
                                value={formData.sowing_date}
                                onChange={(e) => setFormData({ ...formData, sowing_date: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Hectares - Editable */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hectáreas *
                            {hectares && !lot && (
                                <span className="ml-2 text-xs text-gray-500">
                                    (Calculado: {hectares.toFixed(2)} ha)
                                </span>
                            )}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.hectares}
                            onChange={(e) => setFormData({ ...formData, hectares: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Ej: 25.50"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Puedes editar el valor calculado automáticamente
                        </p>
                    </div>
                </form>

                {/* Footer — always visible, never scrolls */}
                <div className="px-4 py-3 border-t border-gray-200/50 space-y-2 flex-shrink-0">
                    {/* Delete button (only for existing lots) */}
                    {lot && onDelete && (
                        <button
                            type="button"
                            onClick={async () => {
                                const confirmed = await confirm({
                                    title: 'Eliminar Lote',
                                    message: `¿Estás seguro de que deseas eliminar el lote "${lot.name}"?\n\nEsta acción no se puede deshacer.`,
                                    confirmText: 'Eliminar',
                                    cancelText: 'Cancelar',
                                    variant: 'danger',
                                });
                                if (confirmed) onDelete(lot.id);
                            }}
                            className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Eliminar Lote
                        </button>
                    )}

                    {/* Save/Cancel buttons */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Guardar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LotForm;
