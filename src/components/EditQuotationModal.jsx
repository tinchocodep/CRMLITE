import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { products } from '../data/products';

const EditQuotationModal = ({ isOpen, onClose, quotation, onSave }) => {
    const [formData, setFormData] = useState({
        clientName: '',
        saleType: 'own',
        paymentCondition: '30d',
        deliveryDate: '',
        originAddress: '',
        destinationAddress: '',
        lines: []
    });

    useEffect(() => {
        if (quotation) {
            setFormData({
                clientName: quotation.clientName || '',
                saleType: quotation.saleType || 'own',
                paymentCondition: quotation.paymentCondition || '30d',
                deliveryDate: quotation.deliveryDate || '',
                originAddress: quotation.originAddress || '',
                destinationAddress: quotation.destinationAddress || '',
                lines: quotation.lines || []
            });
        }
    }, [quotation]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Calcular totales
        const subtotal = formData.lines.reduce((sum, line) => sum + line.subtotal, 0);
        const tax = formData.lines.reduce((sum, line) => sum + (line.subtotal * line.taxRate / 100), 0);
        const total = subtotal + tax;

        onSave({
            ...formData,
            subtotal,
            tax,
            total,
            updatedAt: new Date().toISOString()
        });
        onClose();
    };

    const addLine = () => {
        const newLine = {
            id: `line-${Date.now()}`,
            productSapCode: products[0].sapCode,
            productName: products[0].hybridNameAtSkuLevel,
            quantity: 1,
            volume: 0.02,
            unitPrice: products[0].precio,
            subtotal: products[0].precio,
            taxRate: 21,
            total: products[0].precio * 1.21
        };
        setFormData({ ...formData, lines: [...formData.lines, newLine] });
    };

    const removeLine = (index) => {
        const newLines = formData.lines.filter((_, i) => i !== index);
        setFormData({ ...formData, lines: newLines });
    };

    const updateLine = (index, field, value) => {
        const newLines = [...formData.lines];
        newLines[index][field] = value;

        // Recalcular si cambia cantidad o precio
        if (field === 'quantity' || field === 'unitPrice') {
            newLines[index].subtotal = newLines[index].quantity * newLines[index].unitPrice;
            newLines[index].total = newLines[index].subtotal * (1 + newLines[index].taxRate / 100);
        }

        // Si cambia el producto
        if (field === 'productSapCode') {
            const product = products.find(p => p.sapCode === parseInt(value));
            if (product) {
                newLines[index].productName = product.hybridNameAtSkuLevel;
                newLines[index].unitPrice = product.precio;
                newLines[index].subtotal = newLines[index].quantity * product.precio;
                newLines[index].total = newLines[index].subtotal * (1 + newLines[index].taxRate / 100);
            }
        }

        setFormData({ ...formData, lines: newLines });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (!isOpen || !quotation) return null;

    const subtotal = formData.lines.reduce((sum, line) => sum + line.subtotal, 0);
    const tax = formData.lines.reduce((sum, line) => sum + (line.subtotal * line.taxRate / 100), 0);
    const total = subtotal + tax;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl my-8"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Editar Cotización</h2>
                                <p className="text-sm opacity-90">{quotation.number}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Cliente
                                </label>
                                <input
                                    type="text"
                                    value={formData.clientName}
                                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    required
                                    disabled
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Fecha de Entrega
                                </label>
                                <input
                                    type="date"
                                    value={formData.deliveryDate}
                                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Tipo de Venta
                                </label>
                                <select
                                    value={formData.saleType}
                                    onChange={(e) => setFormData({ ...formData, saleType: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    <option value="own">Venta Propia</option>
                                    <option value="partner">Venta Socio</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Condición de Pago
                                </label>
                                <select
                                    value={formData.paymentCondition}
                                    onChange={(e) => setFormData({ ...formData, paymentCondition: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    <option value="cash">Contado</option>
                                    <option value="30d">30 días</option>
                                    <option value="60d">60 días</option>
                                    <option value="90d">90 días</option>
                                </select>
                            </div>
                        </div>

                        {/* Addresses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Dirección de Origen
                                </label>
                                <input
                                    type="text"
                                    value={formData.originAddress}
                                    onChange={(e) => setFormData({ ...formData, originAddress: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Dirección de Destino
                                </label>
                                <input
                                    type="text"
                                    value={formData.destinationAddress}
                                    onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    required
                                />
                            </div>
                        </div>

                        {/* Products */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Package className="w-5 h-5 text-blue-600" />
                                    Productos
                                </h3>
                                <button
                                    type="button"
                                    onClick={addLine}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Agregar Producto
                                </button>
                            </div>

                            <div className="space-y-3">
                                {formData.lines.map((line, index) => (
                                    <div key={line.id} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                                    Producto
                                                </label>
                                                <select
                                                    value={line.productSapCode}
                                                    onChange={(e) => updateLine(index, 'productSapCode', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                                >
                                                    {products.map(product => (
                                                        <option key={product.sapCode} value={product.sapCode}>
                                                            {product.hybridNameAtSkuLevel}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                                    Cantidad
                                                </label>
                                                <input
                                                    type="number"
                                                    value={line.quantity}
                                                    onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                    min="1"
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                                    Precio Unit.
                                                </label>
                                                <input
                                                    type="number"
                                                    value={line.unitPrice}
                                                    onChange={(e) => updateLine(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                    min="0"
                                                    step="0.01"
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                                />
                                            </div>

                                            <div className="flex items-end gap-2">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                                        Subtotal
                                                    </label>
                                                    <div className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold">
                                                        {formatCurrency(line.subtotal)}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeLine(index)}
                                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm opacity-90">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm opacity-90">
                                    <span>IVA (21%)</span>
                                    <span>{formatCurrency(tax)}</span>
                                </div>
                                <div className="flex items-center justify-between text-2xl font-bold pt-2 border-t border-white/20">
                                    <span>TOTAL</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold hover:shadow-lg transition-all"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default EditQuotationModal;
