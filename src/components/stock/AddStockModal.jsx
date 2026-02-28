import React, { useState, useEffect } from 'react';
import { X, Package, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { addStockProduct, getCategories, getWarehouses } from '../../services/stockService';

const AddStockModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        productSapCode: '',
        productName: '',
        cropDescription: '',
        stockType: 'own',
        warehouse: '',
        initialQuantity: '',
        unitPrice: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isNewWarehouse, setIsNewWarehouse] = useState(false);
    const [newWarehouseName, setNewWarehouseName] = useState('');

    // Load categories and warehouses
    useEffect(() => {
        if (isOpen) {
            setCategories(getCategories());
            setWarehouses(getWarehouses());
        }
    }, [isOpen]);

    const validateForm = () => {
        const newErrors = {};

        // SAP Code validation
        if (!formData.productSapCode) {
            newErrors.productSapCode = 'El código SAP es requerido';
        } else if (isNaN(formData.productSapCode)) {
            newErrors.productSapCode = 'El código SAP debe ser numérico';
        }

        // Product Name validation
        if (!formData.productName) {
            newErrors.productName = 'El nombre del producto es requerido';
        } else if (formData.productName.length < 3) {
            newErrors.productName = 'El nombre debe tener al menos 3 caracteres';
        }

        // Crop Description validation
        if (!formData.cropDescription) {
            newErrors.cropDescription = 'La categoría es requerida';
        }

        // Warehouse validation
        if (!formData.warehouse) {
            newErrors.warehouse = 'El depósito es requerido';
        }

        // Initial Quantity validation
        if (!formData.initialQuantity) {
            newErrors.initialQuantity = 'La cantidad inicial es requerida';
        } else if (isNaN(formData.initialQuantity) || Number(formData.initialQuantity) <= 0) {
            newErrors.initialQuantity = 'La cantidad debe ser mayor a 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const parsedPrice = formData.unitPrice !== '' ? parseFloat(formData.unitPrice) : null;
            const product = {
                productSapCode: Number(formData.productSapCode),
                productName: formData.productName,
                cropDescription: formData.cropDescription,
                stockType: formData.stockType,
                warehouse: formData.warehouse,
                initialQuantity: Number(formData.initialQuantity),
                unitPrice: parsedPrice
            };

            await addStockProduct(product);

            // Reset form
            setFormData({
                productSapCode: '',
                productName: '',
                cropDescription: '',
                stockType: 'own',
                warehouse: '',
                initialQuantity: '',
                unitPrice: ''
            });
            setIsNewCategory(false);
            setNewCategoryName('');
            setIsNewWarehouse(false);
            setNewWarehouseName('');
            setErrors({});

            // Notify parent and close
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            setErrors({ submit: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        Agregar Stock
                                    </h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Registrar nuevo producto en inventario
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
                        <div className="space-y-4">
                            {/* SAP Code */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Código SAP *
                                </label>
                                <input
                                    type="number"
                                    value={formData.productSapCode}
                                    onChange={(e) => handleChange('productSapCode', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-lg border ${errors.productSapCode
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-slate-200 dark:border-slate-700 focus:ring-green-500'
                                        } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent`}
                                    placeholder="Ej: 198000053"
                                />
                                {errors.productSapCode && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.productSapCode}
                                    </p>
                                )}
                            </div>

                            {/* Product Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Nombre del Producto *
                                </label>
                                <input
                                    type="text"
                                    value={formData.productName}
                                    onChange={(e) => handleChange('productName', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-lg border ${errors.productName
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-slate-200 dark:border-slate-700 focus:ring-green-500'
                                        } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent`}
                                    placeholder="Ej: MAIZ HIBRIDO 80-63TRE"
                                />
                                {errors.productName && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.productName}
                                    </p>
                                )}
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Categoría / Cultivo *
                                </label>
                                {!isNewCategory ? (
                                    <select
                                        value={formData.cropDescription}
                                        onChange={(e) => {
                                            if (e.target.value === '__new__') {
                                                setIsNewCategory(true);
                                                setNewCategoryName('');
                                                handleChange('cropDescription', '');
                                            } else {
                                                handleChange('cropDescription', e.target.value);
                                            }
                                        }}
                                        className={`w-full px-4 py-2.5 rounded-lg border ${errors.cropDescription
                                            ? 'border-red-300 focus:ring-red-500'
                                            : 'border-slate-200 dark:border-slate-700 focus:ring-green-500'
                                            } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent`}
                                    >
                                        <option value="">Seleccionar categoría...</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                        <option value="__new__">➕ Agregar nueva categoría...</option>
                                    </select>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newCategoryName}
                                            onChange={(e) => {
                                                setNewCategoryName(e.target.value);
                                                handleChange('cropDescription', e.target.value);
                                            }}
                                            placeholder="Nombre de la nueva categoría"
                                            autoFocus
                                            className={`flex-1 px-4 py-2.5 rounded-lg border ${errors.cropDescription
                                                ? 'border-red-300 focus:ring-red-500'
                                                : 'border-green-300 dark:border-green-700 focus:ring-green-500'
                                                } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsNewCategory(false);
                                                setNewCategoryName('');
                                                handleChange('cropDescription', '');
                                            }}
                                            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Volver a seleccionar categoría existente"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                                {errors.cropDescription && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.cropDescription}
                                    </p>
                                )}
                            </div>

                            {/* Stock Type */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Tipo de Stock *
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="stockType"
                                            value="own"
                                            checked={formData.stockType === 'own'}
                                            onChange={(e) => handleChange('stockType', e.target.value)}
                                            className="w-4 h-4 text-green-600 focus:ring-green-500"
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">🏢 Propio</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="stockType"
                                            value="consigned"
                                            checked={formData.stockType === 'consigned'}
                                            onChange={(e) => handleChange('stockType', e.target.value)}
                                            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">📦 Consignado</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="stockType"
                                            value="third_party"
                                            checked={formData.stockType === 'third_party'}
                                            onChange={(e) => handleChange('stockType', e.target.value)}
                                            className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">🤝 Tercero</span>
                                    </label>
                                </div>
                            </div>

                            {/* Warehouse */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Depósito *
                                </label>
                                {!isNewWarehouse ? (
                                    <select
                                        value={formData.warehouse}
                                        onChange={(e) => {
                                            if (e.target.value === '__new__') {
                                                setIsNewWarehouse(true);
                                                setNewWarehouseName('');
                                                handleChange('warehouse', '');
                                            } else {
                                                handleChange('warehouse', e.target.value);
                                            }
                                        }}
                                        className={`w-full px-4 py-2.5 rounded-lg border ${errors.warehouse
                                            ? 'border-red-300 focus:ring-red-500'
                                            : 'border-slate-200 dark:border-slate-700 focus:ring-green-500'
                                            } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent`}
                                    >
                                        <option value="">Seleccionar depósito...</option>
                                        {warehouses.map(wh => (
                                            <option key={wh} value={wh}>{wh}</option>
                                        ))}
                                        <option value="__new__">➕ Agregar nuevo depósito...</option>
                                    </select>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newWarehouseName}
                                            onChange={(e) => {
                                                setNewWarehouseName(e.target.value);
                                                handleChange('warehouse', e.target.value);
                                            }}
                                            placeholder="Nombre del nuevo depósito"
                                            autoFocus
                                            className={`flex-1 px-4 py-2.5 rounded-lg border ${errors.warehouse
                                                ? 'border-red-300 focus:ring-red-500'
                                                : 'border-green-300 dark:border-green-700 focus:ring-green-500'
                                                } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsNewWarehouse(false);
                                                setNewWarehouseName('');
                                                handleChange('warehouse', '');
                                            }}
                                            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Volver a seleccionar depósito existente"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                                {errors.warehouse && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.warehouse}
                                    </p>
                                )}
                            </div>

                            {/* Initial Quantity */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Cantidad Inicial *
                                </label>
                                <input
                                    type="number"
                                    value={formData.initialQuantity}
                                    onChange={(e) => handleChange('initialQuantity', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-lg border ${errors.initialQuantity
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-slate-200 dark:border-slate-700 focus:ring-green-500'
                                        } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent`}
                                    placeholder="Ej: 500"
                                    min="1"
                                />
                                {errors.initialQuantity && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.initialQuantity}
                                    </p>
                                )}
                            </div>

                            {/* Unit Price */}
                            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                                <label className="block text-sm font-bold text-green-700 dark:text-green-400 mb-2">
                                    💲 Precio Unitario (ARS)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.unitPrice}
                                    onChange={(e) => handleChange('unitPrice', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-green-300 dark:border-green-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-bold"
                                    placeholder="0.00"
                                />
                                {formData.unitPrice && !isNaN(parseFloat(formData.unitPrice)) && formData.initialQuantity && !isNaN(Number(formData.initialQuantity)) && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                                        Valor total estimado: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(parseFloat(formData.unitPrice) * Number(formData.initialQuantity))}
                                    </p>
                                )}
                            </div>

                            {/* Submit Error */}
                            {errors.submit && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.submit}
                                    </p>
                                </div>
                            )}
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AddStockModal;
