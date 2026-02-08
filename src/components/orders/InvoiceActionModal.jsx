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
        letra: 'A',
        punto_venta: 5,
        numero_cbte: '',
        // Fiscal data (only for invoices)
        cae: '',
        vto_cae: '',
        qr_url: ''
    });

    if (!isOpen || !order) return null;

    const handleProcess = async () => {
        setError(null);
        setLoading(true);

        try {
            // Validate required fields
            if (!config.numero_cbte) {
                throw new Error('Debe ingresar el número de comprobante');
            }

            let result;

            switch (selectedAction) {
                case 'FACTURA':
                    // Validate fiscal data for invoices
                    if (!config.cae || !config.vto_cae) {
                        throw new Error('Debe ingresar CAE y Vencimiento CAE para facturas');
                    }

                    result = await processInvoice(order, {
                        tipo_cbte: 'FACTURA',
                        letra: config.letra,
                        punto_venta: parseInt(config.punto_venta),
                        numero_cbte: parseInt(config.numero_cbte),
                        fiscal: {
                            cae: config.cae,
                            vto_cae: config.vto_cae,
                            qr_url: config.qr_url || ''
                        }
                    });
                    break;

                case 'REMITO':
                    result = await processRemito(order, {
                        letra: config.letra,
                        punto_venta: parseInt(config.punto_venta),
                        numero_cbte: parseInt(config.numero_cbte)
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

                            {/* Basic Config */}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                        Letra
                                    </label>
                                    <select
                                        value={config.letra}
                                        onChange={(e) => setConfig({ ...config, letra: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-advanta-green dark:focus:ring-red-500 outline-none"
                                    >
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                        Punto de Venta
                                    </label>
                                    <input
                                        type="number"
                                        value={config.punto_venta}
                                        onChange={(e) => setConfig({ ...config, punto_venta: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-advanta-green dark:focus:ring-red-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                        Número *
                                    </label>
                                    <input
                                        type="number"
                                        value={config.numero_cbte}
                                        onChange={(e) => setConfig({ ...config, numero_cbte: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-advanta-green dark:focus:ring-red-500 outline-none"
                                        placeholder="1234"
                                    />
                                </div>
                            </div>

                            {/* Fiscal Data (only for FACTURA) */}
                            {selectedAction === 'FACTURA' && (
                                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        Datos Fiscales (AFIP)
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                                CAE *
                                            </label>
                                            <input
                                                type="text"
                                                value={config.cae}
                                                onChange={(e) => setConfig({ ...config, cae: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-advanta-green dark:focus:ring-red-500 outline-none"
                                                placeholder="74050000000000"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                                Vto. CAE *
                                            </label>
                                            <input
                                                type="text"
                                                value={config.vto_cae}
                                                onChange={(e) => setConfig({ ...config, vto_cae: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-advanta-green dark:focus:ring-red-500 outline-none"
                                                placeholder="20/02/2026"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                            URL QR (opcional)
                                        </label>
                                        <input
                                            type="text"
                                            value={config.qr_url}
                                            onChange={(e) => setConfig({ ...config, qr_url: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-advanta-green dark:focus:ring-red-500 outline-none"
                                            placeholder="https://www.afip.gob.ar/..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Order Summary */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3">
                            Resumen del Pedido
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Cliente:</span>
                                <span className="font-medium text-slate-800 dark:text-slate-100">{order.clientName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">CUIT:</span>
                                <span className="font-medium text-slate-800 dark:text-slate-100">{order.clientCuit || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Productos:</span>
                                <span className="font-medium text-slate-800 dark:text-slate-100">{(order.lines || order.products || []).length} items</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Total:</span>
                                <span className="font-bold text-lg text-advanta-green dark:text-red-400">
                                    ${(order.total || order.totalAmount || 0).toLocaleString('es-AR')}
                                </span>
                            </div>
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
