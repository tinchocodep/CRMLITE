import React, { useState } from 'react';
import { X, FileText, Building2, AlertTriangle, DollarSign, Package, MinusCircle } from 'lucide-react';

const CreditNoteModal = ({ isOpen, onClose, invoice, onConfirm }) => {
    const [creditNoteData, setCreditNoteData] = useState({
        reason: '',
        type: 'total', // 'total' o 'partial'
        selectedLines: [],
        customAmount: 0
    });

    if (!isOpen || !invoice) return null;

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

    const handleLineToggle = (lineIndex) => {
        setCreditNoteData(prev => {
            const newSelected = prev.selectedLines.includes(lineIndex)
                ? prev.selectedLines.filter(i => i !== lineIndex)
                : [...prev.selectedLines, lineIndex];
            return { ...prev, selectedLines: newSelected };
        });
    };

    const calculateCreditAmount = () => {
        if (creditNoteData.type === 'total') {
            return invoice.total;
        } else if (creditNoteData.type === 'partial' && creditNoteData.selectedLines.length > 0) {
            return creditNoteData.selectedLines.reduce((sum, lineIndex) => {
                const line = invoice.lines[lineIndex];
                return sum + line.total;
            }, 0);
        } else if (creditNoteData.type === 'custom') {
            return creditNoteData.customAmount;
        }
        return 0;
    };

    const handleConfirm = () => {
        const creditAmount = calculateCreditAmount();

        const creditNote = {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            type: creditNoteData.type,
            reason: creditNoteData.reason,
            amount: creditAmount,
            lines: creditNoteData.type === 'partial'
                ? creditNoteData.selectedLines.map(i => invoice.lines[i])
                : invoice.lines,
            createdAt: new Date().toISOString()
        };

        onConfirm(creditNote);
        onClose();
    };

    const creditAmount = calculateCreditAmount();

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <MinusCircle size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Generar Nota de Crédito</h2>
                                <p className="text-red-100 text-sm">Devolución o corrección de factura</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
                    {/* Invoice Info */}
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                            <FileText size={20} className="text-red-600" />
                            Factura Original
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Número</p>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{invoice.invoiceNumber}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Cliente</p>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{invoice.clientName}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Fecha</p>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatDate(invoice.issueDate || invoice.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Total</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatCurrency(invoice.total)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Credit Note Type */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                            Tipo de Nota de Crédito *
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setCreditNoteData({ ...creditNoteData, type: 'total', selectedLines: [] })}
                                className={`p-4 rounded-xl border-2 transition-all ${creditNoteData.type === 'total'
                                        ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                                        : 'border-slate-200 dark:border-slate-600 hover:border-red-300'
                                    }`}
                            >
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Total</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Anular factura completa</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCreditNoteData({ ...creditNoteData, type: 'partial', selectedLines: [] })}
                                className={`p-4 rounded-xl border-2 transition-all ${creditNoteData.type === 'partial'
                                        ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                                        : 'border-slate-200 dark:border-slate-600 hover:border-red-300'
                                    }`}
                            >
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Parcial</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Seleccionar productos</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCreditNoteData({ ...creditNoteData, type: 'custom', selectedLines: [] })}
                                className={`p-4 rounded-xl border-2 transition-all ${creditNoteData.type === 'custom'
                                        ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                                        : 'border-slate-200 dark:border-slate-600 hover:border-red-300'
                                    }`}
                            >
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Monto Custom</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Especificar monto</p>
                            </button>
                        </div>
                    </div>

                    {/* Partial Selection */}
                    {creditNoteData.type === 'partial' && (
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                                <Package size={16} className="inline mr-2" />
                                Seleccionar Productos a Acreditar
                            </label>
                            <div className="space-y-2">
                                {invoice.lines.map((line, index) => (
                                    <label
                                        key={index}
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${creditNoteData.selectedLines.includes(index)
                                                ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                                                : 'border-slate-200 dark:border-slate-600 hover:border-red-300'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={creditNoteData.selectedLines.includes(index)}
                                            onChange={() => handleLineToggle(index)}
                                            className="w-5 h-5 text-red-600 rounded"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{line.productName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Cantidad: {line.quantity} × {formatCurrency(line.unitPrice)}
                                            </p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatCurrency(line.total)}</p>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Custom Amount */}
                    {creditNoteData.type === 'custom' && (
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                <DollarSign size={16} className="inline mr-2" />
                                Monto a Acreditar *
                            </label>
                            <input
                                type="number"
                                min="0"
                                max={invoice.total}
                                step="0.01"
                                value={creditNoteData.customAmount}
                                onChange={(e) => setCreditNoteData({ ...creditNoteData, customAmount: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-3 text-lg font-bold border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                                placeholder="0.00"
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Máximo: {formatCurrency(invoice.total)}
                            </p>
                        </div>
                    )}

                    {/* Reason */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Motivo de la Nota de Crédito *
                        </label>
                        <textarea
                            value={creditNoteData.reason}
                            onChange={(e) => setCreditNoteData({ ...creditNoteData, reason: e.target.value })}
                            placeholder="Describe el motivo de la devolución o corrección..."
                            rows="3"
                            className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-none resize-none bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                        />
                    </div>

                    {/* Credit Amount Summary */}
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-6">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-slate-700 dark:text-slate-300">Monto a Acreditar</span>
                            <span className="text-3xl font-bold text-red-700 dark:text-red-300">{formatCurrency(creditAmount)}</span>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg">
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Importante</p>
                                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                                    La nota de crédito se generará en AFIP y se aplicará automáticamente a la cuenta corriente del cliente. Esta acción no se puede deshacer.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <X size={18} />
                            Cancelar
                        </button>

                        <button
                            onClick={handleConfirm}
                            disabled={!creditNoteData.reason || creditAmount === 0}
                            className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <MinusCircle size={18} />
                            Generar Nota de Crédito
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreditNoteModal;
