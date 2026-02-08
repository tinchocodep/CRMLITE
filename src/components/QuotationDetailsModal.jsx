import React from 'react';
import { X, FileText, Building2, Calendar, DollarSign, Package, Send, CheckCircle, XCircle, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QuotationDetailsModal = ({ isOpen, onClose, quotation, onUpdateStatus }) => {
    if (!isOpen || !quotation) return null;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const statusConfig = {
        draft: { label: 'Borrador', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Edit2 },
        sent: { label: 'Enviada', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Send },
        approved: { label: 'Aprobada', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
        rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle }
    };

    const currentStatus = statusConfig[quotation.status];
    const StatusIcon = currentStatus.icon;

    // Acciones disponibles según el estado actual
    const availableActions = {
        draft: [
            { action: 'sent', label: 'Enviar Cotización', icon: Send, color: 'purple' }
        ],
        sent: [
            { action: 'approved', label: 'Marcar como Aprobada', icon: CheckCircle, color: 'green' },
            { action: 'rejected', label: 'Marcar como Rechazada', icon: XCircle, color: 'red' }
        ],
        approved: [],
        rejected: [
            { action: 'sent', label: 'Reenviar Cotización', icon: Send, color: 'purple' }
        ]
    };

    const actions = availableActions[quotation.status] || [];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Cotización {quotation.number}</h2>
                                    <p className="text-sm opacity-90">{quotation.clientName}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Status Badge */}
                        <div className="flex items-center justify-between">
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${currentStatus.color} flex items-center gap-2`}>
                                <StatusIcon className="w-4 h-4" />
                                {currentStatus.label}
                            </span>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                Creada: {formatDate(quotation.createdAt)}
                            </div>
                        </div>

                        {/* Client & Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    <h3 className="font-bold text-slate-900 dark:text-white">Cliente</h3>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300">{quotation.clientName}</p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Calendar className="w-5 h-5 text-purple-600" />
                                    <h3 className="font-bold text-slate-900 dark:text-white">Fecha de Entrega</h3>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300">{formatDate(quotation.deliveryDate)}</p>
                            </div>
                        </div>

                        {/* Products */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Package className="w-5 h-5 text-green-600" />
                                <h3 className="font-bold text-slate-900 dark:text-white">Productos</h3>
                            </div>
                            <div className="space-y-3">
                                {quotation.lines.map((line, index) => (
                                    <div key={index} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-slate-900 dark:text-white">{line.productName}</h4>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">SAP: {line.productSapCode}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-slate-600 dark:text-slate-400">Cantidad</p>
                                                <p className="font-bold text-slate-900 dark:text-white">{line.quantity} unidades</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">Precio Unitario</span>
                                            <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(line.unitPrice)}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">Subtotal</span>
                                            <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(line.subtotal)}</span>
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
                                    <span>{formatCurrency(quotation.subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm opacity-90">
                                    <span>IVA (21%)</span>
                                    <span>{formatCurrency(quotation.tax)}</span>
                                </div>
                                <div className="flex items-center justify-between text-2xl font-bold pt-2 border-t border-white/20">
                                    <span>TOTAL</span>
                                    <span>{formatCurrency(quotation.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Tipo de Venta</h4>
                                <p className="text-slate-700 dark:text-slate-300">
                                    {quotation.saleType === 'own' ? '🏢 Venta Propia' : '🤝 Venta Socio'}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Condición de Pago</h4>
                                <p className="text-slate-700 dark:text-slate-300">{quotation.paymentCondition}</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {actions.length > 0 && (
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Acciones Disponibles</h4>
                                <div className="flex flex-wrap gap-3">
                                    {actions.map((action) => {
                                        const ActionIcon = action.icon;
                                        const colorClasses = {
                                            purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
                                            green: 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
                                            red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                                        };

                                        return (
                                            <button
                                                key={action.action}
                                                onClick={() => {
                                                    onUpdateStatus(quotation, action.action);
                                                    onClose();
                                                }}
                                                className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${colorClasses[action.color]} text-white rounded-lg font-bold hover:shadow-lg transition-all`}
                                            >
                                                <ActionIcon className="w-5 h-5" />
                                                {action.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Close Button */}
                        <div className="flex justify-end pt-4">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default QuotationDetailsModal;
