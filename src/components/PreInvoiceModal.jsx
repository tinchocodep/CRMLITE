import React, { useState } from 'react';
import { X, FileText, Building2, Hash, Calendar, DollarSign, Package, AlertCircle, CheckCircle, Edit2 } from 'lucide-react';

const PreInvoiceModal = ({ isOpen, onClose, order, onConfirm, onEdit }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedOrder, setEditedOrder] = useState(order);

    if (!isOpen || !order) return null;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const handleConfirm = () => {
        onConfirm(isEditing ? editedOrder : order);
        setIsEditing(false);
        onClose();
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedOrder(order);
        onClose();
    };

    const handleEdit = () => {
        if (onEdit) {
            onEdit(order);
            onClose();
        } else {
            setIsEditing(true);
        }
    };

    const handleLineChange = (index, field, value) => {
        const newLines = [...editedOrder.lines];
        newLines[index] = {
            ...newLines[index],
            [field]: field === 'quantity' || field === 'unitPrice' ? parseFloat(value) || 0 : value
        };

        // Recalcular totales
        const subtotal = newLines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
        const tax = subtotal * 0.21; // IVA 21%
        const total = subtotal + tax;

        setEditedOrder({
            ...editedOrder,
            lines: newLines,
            subtotal,
            tax,
            total
        });
    };

    const currentOrder = isEditing ? editedOrder : order;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <FileText size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Pre-Factura</h2>
                                <p className="text-purple-100 text-sm">Revise los datos antes de facturar</p>
                            </div>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Datos del Cliente */}
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <Building2 size={20} className="text-purple-600" />
                            Datos del Cliente
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Razón Social</p>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{currentOrder.clientName}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">CUIT</p>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{currentOrder.clientCuit || 'No disponible'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Pedido N°</p>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{currentOrder.orderNumber}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Fecha</p>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatDate(currentOrder.createdAt)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Productos/Servicios */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <Package size={20} className="text-purple-600" />
                            Productos / Servicios
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-slate-200 dark:border-slate-600">
                                        <th className="text-left py-3 px-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Código</th>
                                        <th className="text-left py-3 px-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Producto</th>
                                        <th className="text-center py-3 px-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Cantidad</th>
                                        <th className="text-right py-3 px-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Precio Unit.</th>
                                        <th className="text-right py-3 px-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentOrder.lines.map((line, index) => (
                                        <tr key={index} className="border-b border-slate-100 dark:border-slate-700">
                                            <td className="py-3 px-2">
                                                <p className="text-sm font-mono text-slate-600 dark:text-slate-400">{line.productSapCode}</p>
                                            </td>
                                            <td className="py-3 px-2">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={line.productName}
                                                        onChange={(e) => handleLineChange(index, 'productName', e.target.value)}
                                                        className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{line.productName}</p>
                                                )}
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        value={line.quantity}
                                                        onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                                                        className="w-20 px-2 py-1 text-sm text-center border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{line.quantity}</p>
                                                )}
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        value={line.unitPrice}
                                                        onChange={(e) => handleLineChange(index, 'unitPrice', e.target.value)}
                                                        className="w-28 px-2 py-1 text-sm text-right border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(line.unitPrice)}</p>
                                                )}
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatCurrency(line.quantity * line.unitPrice)}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totales */}
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Subtotal</span>
                                <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{formatCurrency(currentOrder.subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">IVA (21%)</span>
                                <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{formatCurrency(currentOrder.tax)}</span>
                            </div>
                            <div className="border-t-2 border-purple-200 dark:border-slate-500 pt-3 flex justify-between items-center">
                                <span className="text-xl font-bold text-purple-700 dark:text-purple-300">TOTAL</span>
                                <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(currentOrder.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Advertencia */}
                    <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Importante</p>
                                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                                    Al confirmar, se generará la factura en AFIP y se enviará al cliente. Esta acción no se puede deshacer.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer con acciones */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                        <button
                            onClick={handleCancel}
                            className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <X size={18} />
                            Cancelar
                        </button>

                        {!isEditing && (
                            <button
                                onClick={handleEdit}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <Edit2 size={18} />
                                Editar
                            </button>
                        )}

                        <button
                            onClick={handleConfirm}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            <CheckCircle size={18} />
                            {isEditing ? 'Guardar y Facturar' : 'Confirmar Facturación'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreInvoiceModal;
