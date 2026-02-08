import React, { useState } from 'react';
import { X, DollarSign, CreditCard, Banknote, Building2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PaymentModal = ({ isOpen, onClose, order, onConfirm }) => {
    const [paymentData, setPaymentData] = useState({
        amount: order?.total || 0,
        method: 'cash', // cash, transfer, check, card
        paymentDate: new Date().toISOString().split('T')[0],
        reference: '',
        notes: ''
    });

    const paymentMethods = [
        { value: 'cash', label: 'Efectivo', icon: Banknote, color: 'green' },
        { value: 'transfer', label: 'Transferencia', icon: Building2, color: 'blue' },
        { value: 'check', label: 'Cheque', icon: Calendar, color: 'purple' },
        { value: 'card', label: 'Tarjeta', icon: CreditCard, color: 'indigo' }
    ];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(paymentData);
        onClose();
    };

    const remainingAmount = order?.total - (order?.paidAmount || 0);
    const isPartialPayment = paymentData.amount < remainingAmount;

    if (!isOpen || !order) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Registrar Pago</h2>
                                    <p className="text-sm opacity-90">Pedido: {order.orderNumber}</p>
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

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Order Summary */}
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Total del Pedido:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(order.total)}</span>
                            </div>
                            {order.paidAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Ya Pagado:</span>
                                    <span className="font-semibold text-green-600">{formatCurrency(order.paidAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg pt-2 border-t border-slate-200 dark:border-slate-700">
                                <span className="font-bold text-slate-900 dark:text-white">Saldo Pendiente:</span>
                                <span className="font-bold text-red-600">{formatCurrency(remainingAmount)}</span>
                            </div>
                        </div>

                        {/* Payment Amount */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Monto a Cobrar
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="number"
                                    value={paymentData.amount}
                                    onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                                    max={remainingAmount}
                                    min={0}
                                    step="0.01"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-bold"
                                />
                            </div>
                            {isPartialPayment && (
                                <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Pago parcial - Quedará pendiente: {formatCurrency(remainingAmount - paymentData.amount)}
                                </p>
                            )}
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                Forma de Pago
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {paymentMethods.map((method) => {
                                    const Icon = method.icon;
                                    const isSelected = paymentData.method === method.value;
                                    return (
                                        <button
                                            key={method.value}
                                            type="button"
                                            onClick={() => setPaymentData({ ...paymentData, method: method.value })}
                                            className={`p-4 rounded-xl border-2 transition-all ${isSelected
                                                    ? `border-${method.color}-500 bg-${method.color}-50 dark:bg-${method.color}-900/20`
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? `text-${method.color}-600` : 'text-slate-400'
                                                }`} />
                                            <p className={`text-sm font-semibold ${isSelected ? `text-${method.color}-700 dark:text-${method.color}-400` : 'text-slate-600 dark:text-slate-400'
                                                }`}>
                                                {method.label}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Payment Date */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Fecha de Pago
                            </label>
                            <input
                                type="date"
                                value={paymentData.paymentDate}
                                onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {/* Reference */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Referencia / Nº de Comprobante (Opcional)
                            </label>
                            <input
                                type="text"
                                value={paymentData.reference}
                                onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                                placeholder="Ej: Transferencia #12345, Cheque #67890"
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Notas (Opcional)
                            </label>
                            <textarea
                                value={paymentData.notes}
                                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                                rows={3}
                                placeholder="Observaciones adicionales..."
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            />
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
                                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:shadow-lg transition-all"
                            >
                                Confirmar Pago
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PaymentModal;
