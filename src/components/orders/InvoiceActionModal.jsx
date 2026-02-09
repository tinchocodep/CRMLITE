import React, { useState, useEffect } from 'react';
import { X, FileText, Truck, DollarSign, AlertCircle } from 'lucide-react';
import { processInvoice, processRemito } from '../../services/invoiceService';
import { saveComprobante, getComprobantesByOrder, getShippedQuantities } from '../../services/comprobantesService';

/**
 * Invoice/Remito Action Modal
 * Allows user to choose between Invoice, Remito, or Payment for an order
 * Intelligently shows only available actions based on existing comprobantes
 */
export default function InvoiceActionModal({ isOpen, order, onClose, onSuccess }) {
    const [selectedAction, setSelectedAction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [existingComprobantes, setExistingComprobantes] = useState([]);

    // Invoice/Remito configuration
    const [config, setConfig] = useState({
        letra: 'A',  // Only letra is needed, rest is returned by n8n/AFIP
        fecha_pago: order?.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });

    // Payment configuration
    const [paymentConfig, setPaymentConfig] = useState({
        amount: order?.total || order?.totalAmount || 0,
        paymentMethod: 'efectivo',
        otherPaymentMethod: '',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: ''
    });

    // Remito quantities configuration (for partial remitos)
    const [remitoQuantities, setRemitoQuantities] = useState({});

    // Load existing comprobantes when modal opens
    useEffect(() => {
        if (isOpen && order) {
            const comprobantes = getComprobantesByOrder(order.id);
            setExistingComprobantes(comprobantes);

            // Calculate remaining balance for payment suggestion
            const totalCobrado = comprobantes
                .filter(c => c.tipo === 'COBRO')
                .reduce((sum, c) => sum + (c.total || 0), 0);
            const orderTotal = order?.total || order?.totalAmount || 0;
            const saldoPendiente = orderTotal - totalCobrado;

            // Reset payment config with remaining balance
            setPaymentConfig({
                amount: saldoPendiente > 0 ? saldoPendiente : 0,
                paymentMethod: 'efectivo',
                otherPaymentMethod: '',
                paymentDate: new Date().toISOString().split('T')[0],
                notes: ''
            });

            // Auto-select the next action if only one is available
            const available = getAvailableActions(comprobantes);
            if (available.filter(a => !a.disabled).length === 1) {
                setSelectedAction(available.find(a => !a.disabled).id);
            } else {
                setSelectedAction(null);
            }
        }
    }, [isOpen, order]);

    // Initialize remito quantities when REMITO is selected
    useEffect(() => {
        if (selectedAction === 'REMITO' && order?.lines) {
            const shippedQuantities = getShippedQuantities(order.id);
            const initialQuantities = {};

            order.lines.forEach(line => {
                const alreadyShipped = shippedQuantities[line.id] || 0;
                const pending = line.quantity - alreadyShipped;
                // Initialize with pending quantity (user can modify)
                initialQuantities[line.id] = pending > 0 ? pending : 0;
            });

            setRemitoQuantities(initialQuantities);
        }
    }, [selectedAction, order]);

    if (!isOpen || !order) return null;


    // Determine which actions are already completed
    const hasFactura = existingComprobantes.some(c => c.tipo === 'FACTURA');
    const hasRemito = existingComprobantes.some(c => c.tipo === 'REMITO');

    // Get available actions based on what's already done
    const getAvailableActions = (comprobantes = existingComprobantes) => {
        const hasF = comprobantes.some(c => c.tipo === 'FACTURA');
        const hasR = comprobantes.some(c => c.tipo === 'REMITO');

        // Calculate total paid from all COBRO comprobantes
        const totalCobrado = comprobantes
            .filter(c => c.tipo === 'COBRO')
            .reduce((sum, c) => sum + (c.total || 0), 0);

        const orderTotal = order?.total || order?.totalAmount || 0;
        const saldoPendiente = orderTotal - totalCobrado;
        const isFullyPaid = saldoPendiente <= 0.01; // Small threshold for floating point

        // Check if all products are fully shipped
        const shippedQuantities = getShippedQuantities(order.id);
        const allProductsShipped = order?.lines?.every(line => {
            const shipped = shippedQuantities[line.id] || 0;
            return shipped >= line.quantity;
        }) ?? false;

        // Calculate total pending quantity
        const totalPendingQty = order?.lines?.reduce((sum, line) => {
            const shipped = shippedQuantities[line.id] || 0;
            const pending = line.quantity - shipped;
            return sum + (pending > 0 ? pending : 0);
        }, 0) || 0;

        const allActions = [
            {
                id: 'FACTURA',
                label: 'Facturar',
                icon: FileText,
                color: 'bg-blue-500 hover:bg-blue-600',
                description: 'Generar factura y enviar a AFIP',
                disabled: hasF,
                completedText: '✓ Ya facturado'
            },
            {
                id: 'REMITO',
                label: 'Remitir',
                icon: Truck,
                color: 'bg-green-500 hover:bg-green-600',
                description: allProductsShipped ? 'Todos los productos ya fueron remitidos' : (hasR ? `Remitir productos pendientes (${totalPendingQty} unid.)` : 'Generar remito y descontar stock'),
                disabled: allProductsShipped,
                completedText: allProductsShipped ? '✓ Totalmente remitido' : `Remitido parcialmente`
            },
            {
                id: 'COBRAR',
                label: 'Cobrar',
                icon: DollarSign,
                color: 'bg-purple-500 hover:bg-purple-600',
                description: isFullyPaid ? 'Pedido totalmente cobrado' : `Registrar cobro (Pendiente: $${saldoPendiente.toFixed(2)})`,
                disabled: isFullyPaid,
                completedText: isFullyPaid ? '✓ Totalmente cobrado' : `Cobrado: $${totalCobrado.toFixed(2)}`
            }
        ];

        return allActions;
    };

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
                        letra: config.letra,
                        fecha_pago: config.fecha_pago
                    });

                    // Save comprobante with whatever data comes from webhook
                    if (result.success) {
                        // Get data from webhook response (may contain template variables)
                        const webhookData = result.data || result.webhookResponse?.data || {};
                        console.log('📄 Datos recibidos del webhook:', webhookData);

                        // Parse punto_venta (handle "punto de venta" with space and string format)
                        const puntoVenta = parseInt(
                            webhookData.punto_venta ||
                            webhookData.punto_de_venta ||
                            webhookData['punto de venta'] ||
                            '0'
                        ) || 0;

                        // Parse numero_cbte (handle string format with leading zeros)
                        const numeroCbte = parseInt(webhookData.numero_cbte || '0') || 0;

                        const comprobante = saveComprobante({
                            tipo: 'FACTURA',
                            orderId: order.id,
                            orderNumber: order.orderNumber,
                            punto_venta: puntoVenta,
                            numero_cbte: numeroCbte,
                            letra: config.letra,
                            cae: webhookData.cae || 'Pendiente',
                            vto_cae: webhookData.vto_cae || '',
                            qr_url: webhookData.qr_url || '',
                            pdf_url: webhookData.pdf_url || '',
                            total: order.total || order.totalAmount || 0,
                            clientName: order.clientName,
                            fecha_emision: new Date().toISOString().split('T')[0]
                        });

                        console.log('✅ Comprobante guardado:', comprobante);
                        result.comprobante = comprobante;

                        // Update existingComprobantes to refresh available actions
                        setExistingComprobantes(prev => [...prev, comprobante]);
                    }
                    break;

                case 'REMITO':
                    // Validate that at least one product has quantity > 0
                    const hasQuantities = Object.values(remitoQuantities).some(qty => qty > 0);
                    if (!hasQuantities) {
                        throw new Error('Debe seleccionar al menos una cantidad para remitir');
                    }

                    // Pass selected quantities to processRemito
                    result = await processRemito(order, {
                        letra: config.letra,
                        fecha_pago: config.fecha_pago
                    }, remitoQuantities);

                    // Save comprobante with whatever data comes from webhook
                    if (result.success) {
                        // Get data from webhook response (may contain template variables)
                        const webhookData = result.data || result.webhookResponse?.data || {};
                        console.log('📄 Datos recibidos del webhook:', webhookData);

                        // Parse punto_venta (handle "punto de venta" with space and string format)
                        const puntoVenta = parseInt(
                            webhookData.punto_venta ||
                            webhookData.punto_de_venta ||
                            webhookData['punto de venta'] ||
                            '0'
                        ) || 0;

                        // Parse numero_cbte (handle string format with leading zeros)
                        const numeroCbte = parseInt(webhookData.numero_cbte || '0') || 0;

                        // Build products array with quantities
                        const shippedQuantities = getShippedQuantities(order.id);
                        const products = order.lines
                            .filter(line => (remitoQuantities[line.id] || 0) > 0)
                            .map(line => {
                                const quantityShipped = remitoQuantities[line.id] || 0;
                                const alreadyShipped = shippedQuantities[line.id] || 0;
                                const pending = line.quantity - alreadyShipped - quantityShipped;

                                return {
                                    productId: line.id,
                                    productSapCode: line.productSapCode,
                                    productName: line.productName,
                                    quantityOrdered: line.quantity,
                                    quantityShipped: quantityShipped,
                                    quantityPending: pending,
                                    unitPrice: line.unitPrice,
                                    subtotal: quantityShipped * line.unitPrice,
                                    taxRate: line.taxRate,
                                    total: quantityShipped * line.unitPrice * (1 + line.taxRate / 100)
                                };
                            });

                        // Calculate if it's a partial remito
                        const allProductsFullyShipped = order.lines.every(line => {
                            const totalShipped = (shippedQuantities[line.id] || 0) + (remitoQuantities[line.id] || 0);
                            return totalShipped >= line.quantity;
                        });
                        const isPartialRemito = !allProductsFullyShipped;

                        // Calculate totals for this remito
                        const remitoSubtotal = products.reduce((sum, p) => sum + p.subtotal, 0);
                        const remitoTax = products.reduce((sum, p) => sum + (p.total - p.subtotal), 0);
                        const remitoTotal = products.reduce((sum, p) => sum + p.total, 0);

                        const comprobante = saveComprobante({
                            tipo: 'REMITO',
                            orderId: order.id,
                            orderNumber: order.orderNumber,
                            punto_venta: puntoVenta,
                            numero_cbte: numeroCbte,
                            letra: config.letra,
                            cae: webhookData.cae || 'Pendiente',
                            vto_cae: webhookData.vto_cae || '',
                            qr_url: webhookData.qr_url || '',
                            pdf_url: webhookData.pdf_url || '',
                            subtotal: remitoSubtotal,
                            tax: remitoTax,
                            total: remitoTotal,
                            clientName: order.clientName,
                            fecha_emision: new Date().toISOString().split('T')[0],
                            // Product quantities
                            products: products,
                            isPartialRemito: isPartialRemito
                        });

                        console.log('✅ Comprobante guardado:', comprobante);
                        result.comprobante = comprobante;
                        result.message = isPartialRemito
                            ? `Remito parcial creado. ${products.length} producto(s) remitido(s).`
                            : 'Remito completo creado.';

                        // Update existingComprobantes to refresh available actions
                        setExistingComprobantes(prev => [...prev, comprobante]);
                    }
                    break;


                case 'COBRAR':
                    // Calculate total already paid
                    const totalCobrado = existingComprobantes
                        .filter(c => c.tipo === 'COBRO')
                        .reduce((sum, c) => sum + (c.total || 0), 0);

                    const orderTotal = order?.total || order?.totalAmount || 0;
                    const saldoPendienteActual = orderTotal - totalCobrado;

                    // Validate payment amount
                    if (!paymentConfig.amount || paymentConfig.amount <= 0) {
                        throw new Error('El monto a cobrar debe ser mayor a 0');
                    }
                    if (paymentConfig.amount > saldoPendienteActual) {
                        throw new Error(`El monto a cobrar no puede ser mayor al saldo pendiente ($${saldoPendienteActual.toFixed(2)})`);
                    }

                    // Validate other payment method if selected
                    if (paymentConfig.paymentMethod === 'otro' && !paymentConfig.otherPaymentMethod.trim()) {
                        throw new Error('Debe especificar el método de pago');
                    }

                    // Calculate remaining balance after this payment
                    const amountPaid = parseFloat(paymentConfig.amount);
                    const remainingBalance = saldoPendienteActual - amountPaid;
                    const isPartialPayment = remainingBalance > 0.01;

                    // Determine final payment method (use custom if 'otro')
                    const finalPaymentMethod = paymentConfig.paymentMethod === 'otro'
                        ? paymentConfig.otherPaymentMethod
                        : paymentConfig.paymentMethod;

                    // Save payment comprobante
                    const paymentComprobante = saveComprobante({
                        tipo: 'COBRO',
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        punto_venta: 0,
                        numero_cbte: 0,
                        letra: '',
                        cae: 'N/A',
                        vto_cae: '',
                        qr_url: '',
                        pdf_url: '',
                        total: amountPaid,
                        clientName: order.clientName,
                        fecha_emision: paymentConfig.paymentDate,
                        // Payment-specific fields
                        paymentMethod: finalPaymentMethod,
                        isPartialPayment: isPartialPayment,
                        remainingBalance: remainingBalance,
                        notes: paymentConfig.notes || ''
                    });

                    console.log('✅ Payment comprobante saved:', paymentComprobante);

                    result = {
                        success: true,
                        message: isPartialPayment
                            ? `Cobro parcial registrado. Adeuda: $${remainingBalance.toFixed(2)}`
                            : 'Cobro total registrado',
                        comprobante: paymentComprobante
                    };

                    // Update existingComprobantes to refresh available actions
                    setExistingComprobantes(prev => [...prev, paymentComprobante]);
                    break;

                default:
                    throw new Error('Debe seleccionar una acción');
            }

            if (result.success) {
                onSuccess(result);

                // Small delay to ensure comprobante is saved and parent can reload
                setTimeout(() => {
                    onClose();
                }, 100);
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

    const actions = getAvailableActions();

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
                                const isDisabled = action.disabled;

                                return (
                                    <button
                                        key={action.id}
                                        onClick={() => !isDisabled && setSelectedAction(action.id)}
                                        disabled={isDisabled}
                                        className={`
                                            p-4 rounded-xl border-2 transition-all relative
                                            ${isDisabled
                                                ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 opacity-60 cursor-not-allowed'
                                                : isSelected
                                                    ? 'border-advanta-green dark:border-red-500 bg-green-50 dark:bg-red-900/20'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                            }
                                        `}
                                    >
                                        {isDisabled && (
                                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                ✓
                                            </div>
                                        )}
                                        <Icon
                                            className={`mx-auto mb-2 ${isDisabled ? 'text-slate-400' : isSelected ? 'text-advanta-green dark:text-red-500' : 'text-slate-600 dark:text-slate-400'}`}
                                            size={24}
                                        />
                                        <p className={`text-sm font-bold ${isDisabled ? 'text-slate-500' : isSelected ? 'text-advanta-green dark:text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {action.label}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {isDisabled ? action.completedText : action.description}
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


                            {/* Letra Selection - ONLY FOR FACTURA */}
                            {selectedAction === 'FACTURA' && (
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
                            )}

                            {/* Product Quantity Selection - ONLY FOR REMITO */}
                            {selectedAction === 'REMITO' && order?.lines && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">
                                        Seleccionar Cantidades a Remitir *
                                    </label>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {order.lines.map((line) => {
                                            const shippedQuantities = getShippedQuantities(order.id);
                                            const alreadyShipped = shippedQuantities[line.id] || 0;
                                            const pending = line.quantity - alreadyShipped;
                                            const selectedQty = remitoQuantities[line.id] || 0;

                                            return (
                                                <div key={line.id} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-slate-800 dark:text-slate-100 text-sm truncate">
                                                                {line.productName}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                <span>Total: <strong>{line.quantity}</strong></span>
                                                                {alreadyShipped > 0 && (
                                                                    <span className="text-green-600 dark:text-green-400">
                                                                        Remitido: <strong>{alreadyShipped}</strong>
                                                                    </span>
                                                                )}
                                                                <span className="text-amber-600 dark:text-amber-400">
                                                                    Pendiente: <strong>{pending}</strong>
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex-shrink-0 w-24">
                                                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 text-center">
                                                                A Remitir
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={pending}
                                                                value={selectedQty}
                                                                onChange={(e) => {
                                                                    const value = parseInt(e.target.value) || 0;
                                                                    const clamped = Math.min(Math.max(0, value), pending);
                                                                    setRemitoQuantities(prev => ({
                                                                        ...prev,
                                                                        [line.id]: clamped
                                                                    }));
                                                                }}
                                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-advanta-green dark:focus:ring-red-500 outline-none font-medium text-center"
                                                                disabled={pending <= 0}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Calculations Section */}
                                                    {selectedQty > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                                <div>
                                                                    <p className="text-slate-500 dark:text-slate-400">Precio Unit.</p>
                                                                    <p className="font-bold text-slate-700 dark:text-slate-300">
                                                                        ${line.unitPrice?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-slate-500 dark:text-slate-400">Subtotal</p>
                                                                    <p className="font-bold text-slate-700 dark:text-slate-300">
                                                                        ${(selectedQty * line.unitPrice)?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-slate-500 dark:text-slate-400">Quedarán</p>
                                                                    <p className="font-bold text-amber-600 dark:text-amber-400">
                                                                        {pending - selectedQty} unid.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Totals Summary */}
                                    {Object.values(remitoQuantities).some(qty => qty > 0) && (
                                        <div className="mt-4 p-3 bg-advanta-green/10 dark:bg-green-900/20 rounded-lg border border-advanta-green/30 dark:border-green-700">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                    Total de este Remito:
                                                </span>
                                                <span className="text-lg font-bold text-advanta-green dark:text-green-400">
                                                    ${order.lines
                                                        .reduce((sum, line) => {
                                                            const qty = remitoQuantities[line.id] || 0;
                                                            return sum + (qty * line.unitPrice);
                                                        }, 0)
                                                        .toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                                        Podés hacer remitos parciales. Solo se remitirán las cantidades que especifiques.
                                    </p>
                                </div>
                            )}

                            {/* Payment Date */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                    Fecha de Pago *
                                </label>
                                <input
                                    type="date"
                                    value={config.fecha_pago}
                                    onChange={(e) => setConfig({ ...config, fecha_pago: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-advanta-green dark:focus:ring-red-500 outline-none font-medium"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    Fecha estimada de pago del cliente (por defecto: fecha de entrega)
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Payment Configuration Form (only for COBRAR) */}
                    {selectedAction === 'COBRAR' && (
                        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">
                                Configuración del Cobro
                            </h3>

                            {/* Payment Amount */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                    Monto a Cobrar *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={order?.total || order?.totalAmount || 0}
                                    value={paymentConfig.amount || ''}
                                    onChange={(e) => setPaymentConfig({ ...paymentConfig, amount: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-advanta-green dark:focus:ring-red-500 outline-none font-medium"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    {(() => {
                                        const orderTotal = order?.total || order?.totalAmount || 0;
                                        const totalCobrado = existingComprobantes
                                            .filter(c => c.tipo === 'COBRO')
                                            .reduce((sum, c) => sum + (c.total || 0), 0);
                                        const saldoPendiente = orderTotal - totalCobrado;
                                        const nuevoSaldo = saldoPendiente - (paymentConfig.amount || 0);

                                        return (
                                            <>
                                                Total del pedido: ${orderTotal.toFixed(2)}
                                                {totalCobrado > 0 && (
                                                    <span className="text-green-600 dark:text-green-400 font-bold ml-2">
                                                        • Ya cobrado: ${totalCobrado.toFixed(2)}
                                                    </span>
                                                )}
                                                {saldoPendiente > 0 && (
                                                    <span className="text-amber-600 dark:text-amber-400 font-bold ml-2">
                                                        • Saldo pendiente: ${saldoPendiente.toFixed(2)}
                                                    </span>
                                                )}
                                                {paymentConfig.amount && nuevoSaldo > 0.01 && (
                                                    <span className="text-red-600 dark:text-red-400 font-bold ml-2">
                                                        → Quedará: ${nuevoSaldo.toFixed(2)}
                                                    </span>
                                                )}
                                            </>
                                        );
                                    })()}
                                </p>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                    Método de Pago *
                                </label>
                                <select
                                    value={paymentConfig.paymentMethod}
                                    onChange={(e) => setPaymentConfig({ ...paymentConfig, paymentMethod: e.target.value, otherPaymentMethod: '' })}
                                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-advanta-green dark:focus:ring-red-500 outline-none font-medium"
                                >
                                    <option value="efectivo">💵 Efectivo</option>
                                    <option value="transferencia">🏦 Transferencia Bancaria</option>
                                    <option value="cheque">📝 Cheque</option>
                                    <option value="tarjeta_debito">💳 Tarjeta de Débito</option>
                                    <option value="tarjeta_credito">💳 Tarjeta de Crédito</option>
                                    <option value="mercadopago">🔵 MercadoPago</option>
                                    <option value="otro">📋 Otro</option>
                                </select>
                            </div>

                            {/* Other Payment Method (conditional) */}
                            {paymentConfig.paymentMethod === 'otro' && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                        Especificar Método de Pago *
                                    </label>
                                    <input
                                        type="text"
                                        value={paymentConfig.otherPaymentMethod}
                                        onChange={(e) => setPaymentConfig({ ...paymentConfig, otherPaymentMethod: e.target.value })}
                                        placeholder="Ej: Criptomonedas, Permuta, etc."
                                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-advanta-green dark:focus:ring-red-500 outline-none font-medium"
                                    />
                                </div>
                            )}

                            {/* Payment Date */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                    Fecha de Cobro *
                                </label>
                                <input
                                    type="date"
                                    value={paymentConfig.paymentDate}
                                    onChange={(e) => setPaymentConfig({ ...paymentConfig, paymentDate: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-advanta-green dark:focus:ring-red-500 outline-none font-medium"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                    Notas (opcional)
                                </label>
                                <textarea
                                    value={paymentConfig.notes}
                                    onChange={(e) => setPaymentConfig({ ...paymentConfig, notes: e.target.value })}
                                    placeholder="Ej: Cheque #12345, Transferencia CBU..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-advanta-green dark:focus:ring-red-500 outline-none font-medium resize-none"
                                />
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
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-emerald-600 dark:to-green-600 dark:hover:from-emerald-700 dark:hover:to-green-700 text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {loading ? 'Procesando...' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
