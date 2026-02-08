import React, { useState } from 'react';
import { X, FileText, Truck, DollarSign, AlertCircle } from 'lucide-react';
import { processInvoice, processRemito } from '../../services/invoiceService';

/**
 * Invoice/Remito Action Modal
 * Allows user to choose between Invoice, Remito, or Payment for an order
 */
export default function InvoiceActionModal({ isOpen, order, onClose, onSuccess }) {
    const [selectedAction, setSelectedAction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Invoice/Remito configuration
    const [config, setConfig] = useState({
        letra: 'A'  // Only letra is needed, rest is returned by n8n/AFIP
    });

    if (!isOpen || !order) return null;

    const handleProcess = async () => {
        setError(null);
        setLoading(true);

        try {
            // Validate required fields
            if (!config.letra) {
                throw new Error('Debe seleccionar el tipo de letra (A, B, C)');
            }

            let result;

            switch (selectedAction) {
                case 'FACTURA':
                    result = await processInvoice(order, {
                        tipo_cbte: 'FACTURA',
                        letra: config.letra
                    });
                    break;

                case 'REMITO':
                    result = await processRemito(order, {
                        letra: config.letra
                    });
                    break;

                case 'COBRAR':
                    // TODO: Implement payment logic
                    console.log('💰 Processing payment for order:', order.id);
                    result = {
                        success: true,
                        message: 'Funcionalidad de cobro pendiente de implementación'
                    };
                    break;

                default:
                    throw new Error('Debe seleccionar una acción');
            }

            if (result.success) {
                onSuccess(result);
                onClose();
            } else {
                setError(result.error || 'Error al procesar la acción');
            }
        } catch (err) {
            console.error('Error processing action:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const actions = [
        {
            id: 'FACTURA',
            label: 'Facturar',
            icon: FileText,
            color: 'bg-blue-500 hover:bg-blue-600',
            description: 'Generar factura y enviar a AFIP'
        },
        {
            id: 'REMITO',
            label: 'Remitir',
            icon: Truck,
            color: 'bg-green-500 hover:bg-green-600',
            description: 'Generar remito y descontar stock'
        },
        {
            id: 'COBRAR',
            label: 'Cobrar',
            icon: DollarSign,
            color: 'bg-purple-500 hover:bg-purple-600',
            description: 'Registrar cobro del pedido'
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                            Procesar Pedido
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Pedido #{order.id} - {order.clientName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <X size={24} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
                                <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Action Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                            Seleccione la acción a realizar:
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {actions.map((action) => {
                                const Icon = action.icon;
                                const isSelected = selectedAction === action.id;

                                return (
                                    <button
                                        key={action.id}
                                        onClick={() => setSelectedAction(action.id)}
                                        className={`
                                            p-4 rounded-xl border-2 transition-all
                                            ${isSelected
                                                ? 'border-advanta-green dark:border-red-500 bg-green-50 dark:bg-red-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                            }
                                        `}
                                    >
                                        <Icon
                                            size={32}
                                            className={`mx-auto mb-2 ${isSelected ? 'text-advanta-green dark:text-red-400' : 'text-slate-400'}`}
                                        />
                                        <p className={`font-bold text-sm ${isSelected ? 'text-advanta-green dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {action.label}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {action.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Configuration Form (only for FACTURA and REMITO) */}
                    {(selectedAction === 'FACTURA' || selectedAction === 'REMITO') && (
                        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">
                                Configuración del Comprobante
                            </h3>

                            {/* Letra Selection */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                    Tipo de Comprobante *
                                </label>
                                <select
                                    value={config.letra}
                                    onChange={(e) => setConfig({ ...config, letra: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-advanta-green dark:focus:ring-red-500 outline-none font-medium"
                                >
                                    <option value="A">Letra A - Responsable Inscripto</option>
                                    <option value="B">Letra B - Consumidor Final</option>
                                    <option value="C">Letra C - Monotributista</option>
                                </select>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    El punto de venta, número de comprobante, CAE y QR serán generados automáticamente por AFIP
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Order Summary with Product Details */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3">
                            Detalle del Pedido
                        </h3>

                        {/* Client Info */}
                        <div className="space-y-2 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Cliente:</span>
                                <span className="font-medium text-slate-800 dark:text-slate-100">{order.clientName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">CUIT:</span>
                                <span className="font-medium text-slate-800 dark:text-slate-100">{order.clientCuit || 'N/A'}</span>
                            </div>
                        </div>

                        {/* Products Table */}
                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase">Productos</h4>
                            <div className="space-y-2">
                                {(order.lines || order.products || []).map((line, index) => {
                                    const quantity = line.quantity || 0;
                                    const unitPrice = line.unitPrice || line.estimatedPrice || 0;
                                    const lineTotal = quantity * unitPrice;

                                    return (
                                        <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                                        {line.productName || line.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        Código: {line.productSapCode || line.sapCode || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                <div>
                                                    <span className="text-slate-500 dark:text-slate-400">Cantidad:</span>
                                                    <p className="font-bold text-slate-800 dark:text-slate-100">{quantity}</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 dark:text-slate-400">Precio Unit.:</span>
                                                    <p className="font-bold text-slate-800 dark:text-slate-100">
                                                        ${unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-slate-500 dark:text-slate-400">Subtotal:</span>
                                                    <p className="font-bold text-advanta-green dark:text-red-400">
                                                        ${lineTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Totals Breakdown */}
                        <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                            {(() => {
                                // Calculate totals
                                const subtotal = order.subtotal || (order.lines || order.products || []).reduce((sum, line) => {
                                    return sum + ((line.quantity || 0) * (line.unitPrice || line.estimatedPrice || 0));
                                }, 0);

                                const iva = order.tax || (subtotal * 0.21);
                                const total = order.total || order.totalAmount || (subtotal + iva);

                                return (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
                                            <span className="font-medium text-slate-800 dark:text-slate-100">
                                                ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">IVA (21%):</span>
                                            <span className="font-medium text-slate-800 dark:text-slate-100">
                                                ${iva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-base pt-2 border-t border-slate-200 dark:border-slate-700">
                                            <span className="font-bold text-slate-700 dark:text-slate-300">TOTAL:</span>
                                            <span className="font-bold text-xl text-advanta-green dark:text-red-400">
                                                ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleProcess}
                        disabled={!selectedAction || loading}
                        className="flex-1 px-6 py-3 bg-advanta-green dark:bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 dark:hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Procesando...' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
