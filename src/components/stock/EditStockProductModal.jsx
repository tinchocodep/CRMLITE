import React, { useState, useEffect } from 'react';
import { X, Save, Package, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateStockProduct, getCategories, getWarehouses } from '../../services/stockService';

const STOCK_TYPES = [
    { value: 'own', label: '🏢 Propio', color: 'text-green-600 focus:ring-green-500' },
    { value: 'consigned', label: '📦 Consignado', color: 'text-purple-600 focus:ring-purple-500' },
    { value: 'third_party', label: '🤝 Tercero', color: 'text-orange-600 focus:ring-orange-500' },
];

export default function EditStockProductModal({ isOpen, onClose, product, onSuccess }) {
    const [formData, setFormData] = useState({
        productName: '',
        cropDescription: '',
        stockType: 'own',
        warehouse: '',
        unitPrice: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Populate form when product changes
    useEffect(() => {
        if (product) {
            setFormData({
                productName: product.productName || '',
                cropDescription: product.cropDescription || '',
                stockType: product.stockType || 'own',
                warehouse: product.warehouse || '',
                unitPrice: product.unitPrice != null ? String(product.unitPrice) : '',
            });
            setError(null);
        }
    }, [product]);

    if (!isOpen || !product) return null;

    const categories = getCategories();
    const warehouses = getWarehouses();

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving) return;

        // Validate
        if (!formData.productName.trim()) {
            setError('El nombre del producto es obligatorio');
            return;
        }

        const parsedPrice = formData.unitPrice !== '' ? parseFloat(formData.unitPrice) : null;
        if (formData.unitPrice !== '' && (isNaN(parsedPrice) || parsedPrice < 0)) {
            setError('El precio unitario debe ser un número válido mayor o igual a 0');
            return;
        }

        setSaving(true);
        try {
            const updates = {
                productName: formData.productName.trim(),
                cropDescription: formData.cropDescription.trim(),
                stockType: formData.stockType,
                warehouse: formData.warehouse.trim(),
                unitPrice: parsedPrice,
            };

            updateStockProduct(product.productSapCode, updates);

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || 'Error al guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    const FIELD_CLASS = "w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all";

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <Package className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Editar Producto</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">SAP: {product.productSapCode}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        {/* Error */}
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
                                {error}
                            </div>
                        )}

                        {/* Product Name */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Nombre del Producto
                            </label>
                            <input
                                type="text"
                                value={formData.productName}
                                onChange={(e) => handleChange('productName', e.target.value)}
                                className={FIELD_CLASS}
                                placeholder="Ej: Roundup Full II"
                            />
                        </div>

                        {/* Unit Price — main highlight */}
                        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                            <label className="flex items-center gap-2 text-sm font-bold text-green-700 dark:text-green-400 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Precio Unitario (ARS)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.unitPrice}
                                onChange={(e) => handleChange('unitPrice', e.target.value)}
                                className={`${FIELD_CLASS} text-lg font-bold`}
                                placeholder="0.00"
                            />
                            {formData.unitPrice && !isNaN(parseFloat(formData.unitPrice)) && product.balance > 0 && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                                    Valor total estimado: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(parseFloat(formData.unitPrice) * product.balance)}
                                    {' '}({product.balance} unid.)
                                </p>
                            )}
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Categoría / Cultivo
                            </label>
                            <input
                                type="text"
                                list="categories-list"
                                value={formData.cropDescription}
                                onChange={(e) => handleChange('cropDescription', e.target.value)}
                                className={FIELD_CLASS}
                                placeholder="Ej: Herbicida"
                            />
                            <datalist id="categories-list">
                                {categories.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>

                        {/* Warehouse */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Depósito
                            </label>
                            <input
                                type="text"
                                list="warehouses-list"
                                value={formData.warehouse}
                                onChange={(e) => handleChange('warehouse', e.target.value)}
                                className={FIELD_CLASS}
                                placeholder="Ej: Depósito Central"
                            />
                            <datalist id="warehouses-list">
                                {warehouses.map(w => <option key={w} value={w} />)}
                            </datalist>
                        </div>

                        {/* Stock Type */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Tipo de Stock
                            </label>
                            <div className="flex gap-4 flex-wrap">
                                {STOCK_TYPES.map(st => (
                                    <label key={st.value} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="stockType"
                                            value={st.value}
                                            checked={formData.stockType === st.value}
                                            onChange={(e) => handleChange('stockType', e.target.value)}
                                            className={`w-4 h-4 ${st.color}`}
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{st.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                            >
                                {saving ? (
                                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
