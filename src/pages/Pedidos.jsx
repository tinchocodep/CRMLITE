import React, { useState, useEffect } from 'react';
import { Package, Search, Truck, CheckCircle, Clock, DollarSign, Calendar, Building2, FileText, Receipt, Banknote, PackageCheck, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { orders as mockOrders } from '../data/orders';
import { stockMovementsOut as mockStockMovements } from '../data/stock';
import { invoices as mockInvoices } from '../data/invoices';
import { useToast } from '../contexts/ToastContext';
import PaymentModal from '../components/PaymentModal';
import PreInvoiceModal from '../components/PreInvoiceModal';
import InvoiceActionModal from '../components/orders/InvoiceActionModal';
import ComprobantesList, { PDFPreviewModal } from '../components/orders/ComprobantesList';
import { getComprobantesByOrder } from '../services/comprobantesService';


const Pedidos = () => {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
    const [preInvoiceModalOpen, setPreInvoiceModalOpen] = useState(false);
    const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
    const [invoiceActionModalOpen, setInvoiceActionModalOpen] = useState(false);
    const [selectedOrderForAction, setSelectedOrderForAction] = useState(null);

    // Comprobantes state
    const [expandedOrders, setExpandedOrders] = useState(new Set());
    const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
    const [selectedComprobante, setSelectedComprobante] = useState(null);
    const [comprobantesMap, setComprobantesMap] = useState({});

    // Estado para usar datos mock
    const [localOrders, setLocalOrders] = useState(mockOrders);
    const [localStockMovements, setLocalStockMovements] = useState(mockStockMovements);
    const [localInvoices, setLocalInvoices] = useState(mockInvoices);

    // Load comprobantes for all orders
    useEffect(() => {
        const loadComprobantes = () => {
            console.log('🔄 Loading comprobantes for all orders...');
            const map = {};
            localOrders.forEach(order => {
                const orderComprobantes = getComprobantesByOrder(order.id);
                map[order.id] = orderComprobantes;
                if (orderComprobantes.length > 0) {
                    console.log(`📄 Order ${order.id} has ${orderComprobantes.length} comprobantes:`, orderComprobantes);
                }
            });
            setComprobantesMap(map);
            console.log('✅ Comprobantes map updated:', map);
        };

        loadComprobantes();

        // Reload when modal closes (in case new comprobante was added)
        if (!invoiceActionModalOpen) {
            console.log('🔄 Modal closed, reloading comprobantes...');
            loadComprobantes();
        }
    }, [localOrders, invoiceActionModalOpen]);

    // Toggle order expansion
    const toggleOrderExpansion = (orderId) => {
        const newExpanded = new Set(expandedOrders);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedOrders(newExpanded);
    };

    // Handle PDF preview
    const handlePreviewPDF = (comprobante) => {
        setSelectedComprobante(comprobante);
        setPdfPreviewOpen(true);
    };

    // URLs de webhooks N8N (se configurarán más adelante)
    const WEBHOOK_URLS = {
        remitir: '', // URL para generar remito
        facturar: '', // URL para generar factura AFIP
        cobrar: '' // URL para registrar pago
    };

    const statusConfig = {
        pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '⏳' },
        shipped: { label: 'Remitido', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '📦' },
        invoiced: { label: 'Facturado', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '📄' },
        paid: { label: 'Cobrado', color: 'bg-green-100 text-green-700 border-green-200', icon: '💰' },
        completed: { label: 'Completado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '✅' }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Función para REMITIR (crear egreso de stock)
    const handleRemitir = async (order) => {
        try {
            // Crear movimientos de stock (egresos)
            const newMovements = order.lines.map((line, index) => ({
                id: `mov-out-${Date.now()}-${index}`,
                type: 'out',
                productSapCode: line.productSapCode,
                productName: line.productName,
                quantity: line.quantity,
                orderId: order.id,
                orderNumber: order.orderNumber,
                date: new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            }));

            setLocalStockMovements(prev => [...prev, ...newMovements]);

            // Actualizar estado del pedido
            setLocalOrders(prev =>
                prev.map(o =>
                    o.id === order.id
                        ? { ...o, status: 'shipped', shippedAt: new Date().toISOString() }
                        : o
                )
            );

            // TODO: Cuando tengas el webhook, descomentar esto:
            // if (WEBHOOK_URLS.remitir) {
            //     await fetch(WEBHOOK_URLS.remitir, {
            //         method: 'POST',
            //         headers: { 'Content-Type': 'application/json' },
            //         body: JSON.stringify({ order, movements: newMovements })
            //     });
            // }

            showToast({
                id: `remitir-${order.id}`,
                title: '✅ Pedido Remitido',
                description: `Pedido ${order.orderNumber} - ${newMovements.length} producto(s) egresados del stock`,
                priority: 'high',
                icon: Truck,
                timeAgo: 'Ahora'
            });
        } catch (error) {
            console.error('Error al remitir:', error);
            showToast({
                id: `error-remitir-${order.id}`,
                title: '❌ Error al Remitir',
                description: 'No se pudo remitir el pedido. Intente nuevamente.',
                priority: 'critical',
                icon: AlertCircle,
                timeAgo: 'Ahora'
            });
        }
    };

    // Función para abrir el modal de pre-factura
    const handleFacturar = (order) => {
        setSelectedOrderForInvoice(order);
        setPreInvoiceModalOpen(true);
    };

    // Función para CONFIRMAR FACTURACIÓN (después de revisar en el modal)
    const confirmFacturar = async (order) => {
        try {
            // Crear factura
            const newInvoice = {
                id: `inv-${Date.now()}`,
                invoiceNumber: `FC-A-0001-${String(localInvoices.length + 1).padStart(8, '0')}`,
                type: 'AFIP',
                orderId: order.id,
                orderNumber: order.orderNumber,
                clientId: order.clientId,
                clientName: order.clientName,
                clientCuit: order.clientCuit,
                lines: order.lines,
                subtotal: order.subtotal,
                tax: order.tax,
                total: order.total,
                status: 'issued',
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                cae: `${Math.floor(Math.random() * 90000000000000) + 10000000000000}`, // Mock CAE
                caeExpiration: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            };

            setLocalInvoices(prev => [...prev, newInvoice]);

            // Actualizar estado del pedido
            setLocalOrders(prev =>
                prev.map(o =>
                    o.id === order.id
                        ? { ...o, status: 'invoiced', invoicedAt: new Date().toISOString(), invoiceId: newInvoice.id }
                        : o
                )
            );

            // TODO: Cuando tengas el webhook, descomentar esto:
            // if (WEBHOOK_URLS.facturar) {
            //     const response = await fetch(WEBHOOK_URLS.facturar, {
            //         method: 'POST',
            //         headers: { 'Content-Type': 'application/json' },
            //         body: JSON.stringify({ order, invoice: newInvoice })
            //     });
            //     const result = await response.json();
            //     // Actualizar con datos reales de AFIP
            // }

            showToast({
                id: `facturar-${order.id}`,
                title: '✅ Factura Generada',
                description: `Factura ${newInvoice.invoiceNumber} - CAE: ${newInvoice.cae}`,
                priority: 'high',
                icon: FileText,
                timeAgo: 'Ahora'
            });
        } catch (error) {
            console.error('Error al facturar:', error);
            showToast({
                id: `error-facturar-${order.id}`,
                title: '❌ Error al Facturar',
                description: 'No se pudo generar la factura. Intente nuevamente.',
                priority: 'critical',
                icon: AlertCircle,
                timeAgo: 'Ahora'
            });
        }
    };

    // Función para COBRAR (registrar pago)
    const handleCobrar = (order) => {
        // Buscar la factura asociada
        const invoice = localInvoices.find(inv => inv.orderId === order.id);

        if (!invoice) {
            showToast({
                id: `no-invoice-${order.id}`,
                title: '⚠️ Factura Requerida',
                description: 'Primero debes facturar el pedido antes de cobrar',
                priority: 'warning',
                icon: AlertCircle,
                timeAgo: 'Ahora'
            });
            return;
        }

        // Abrir modal de pago
        setSelectedOrderForPayment(order);
        setPaymentModalOpen(true);
    };

    // Confirmar pago desde el modal
    const handleConfirmPayment = async (paymentData) => {
        try {
            const order = selectedOrderForPayment;
            const invoice = localInvoices.find(inv => inv.orderId === order.id);

            // Crear pago
            const newPayment = {
                id: `pay-${Date.now()}`,
                paymentNumber: `PAG-2026-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
                invoiceId: invoice.id,
                clientId: order.clientId,
                clientName: order.clientName,
                amount: paymentData.amount,
                method: paymentData.method,
                status: 'completed',
                paymentDate: paymentData.paymentDate,
                reference: paymentData.reference,
                notes: paymentData.notes,
                createdAt: new Date().toISOString()
            };

            // Calcular monto total pagado
            const previousPaidAmount = order.paidAmount || 0;
            const totalPaid = previousPaidAmount + paymentData.amount;
            const isFullyPaid = totalPaid >= order.total;

            // Actualizar estado del pedido
            setLocalOrders(prev =>
                prev.map(o =>
                    o.id === order.id
                        ? {
                            ...o,
                            status: isFullyPaid ? 'paid' : 'invoiced',
                            paidAmount: totalPaid,
                            paidAt: isFullyPaid ? new Date().toISOString() : o.paidAt,
                            paymentId: newPayment.id,
                            payments: [...(o.payments || []), newPayment]
                        }
                        : o
                )
            );

            // TODO: Cuando tengas el webhook, descomentar esto:
            // if (WEBHOOK_URLS.cobrar) {
            //     await fetch(WEBHOOK_URLS.cobrar, {
            //         method: 'POST',
            //         headers: { 'Content-Type': 'application/json' },
            //         body: JSON.stringify({ order, invoice, payment: newPayment })
            //     });
            // }

            const methodLabels = {
                cash: 'Efectivo',
                transfer: 'Transferencia',
                check: 'Cheque',
                card: 'Tarjeta'
            };

            const remainingAmount = order.total - totalPaid;
            const isPartial = !isFullyPaid;

            showToast({
                id: `cobrar-${order.id}-${Date.now()}`,
                title: isFullyPaid ? '✅ Pedido Cobrado Totalmente' : '✅ Pago Parcial Registrado',
                description: `${formatCurrency(paymentData.amount)} - ${methodLabels[paymentData.method]}${isPartial ? ` | Pendiente: ${formatCurrency(remainingAmount)}` : ''}`,
                priority: 'high',
                icon: DollarSign,
                timeAgo: 'Ahora'
            });
        } catch (error) {
            console.error('Error al cobrar:', error);
            showToast({
                id: `error-cobrar-${selectedOrderForPayment.id}`,
                title: '❌ Error al Registrar Pago',
                description: 'No se pudo registrar el pago. Intente nuevamente.',
                priority: 'critical',
                icon: AlertCircle,
                timeAgo: 'Ahora'
            });
        }
    };


    // Apply filters
    const filteredOrders = localOrders.filter(order => {
        const matchesSearch = order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.clientName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const stats = [
        {
            label: 'Total Pedidos',
            value: localOrders.length,
            icon: Package,
            color: 'from-indigo-500 to-indigo-600',
            textColor: 'text-indigo-600'
        },
        {
            label: 'Pendientes',
            value: localOrders.filter(o => o.status === 'pending').length,
            icon: Clock,
            color: 'from-amber-500 to-amber-600',
            textColor: 'text-amber-600'
        },
        {
            label: 'Remitidos',
            value: localOrders.filter(o => o.status === 'shipped').length,
            icon: Truck,
            color: 'from-blue-500 to-blue-600',
            textColor: 'text-blue-600'
        },
        {
            label: 'Completados',
            value: localOrders.filter(o => o.status === 'completed' || o.status === 'paid').length,
            icon: CheckCircle,
            color: 'from-green-500 to-green-600',
            textColor: 'text-green-600'
        }
    ];

    const getStatusBadge = (status) => {
        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.color} flex items-center gap-1 w-fit`}>
                <span>{config.icon}</span>
                <span>{config.label}</span>
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-24 xl:pb-8 xl:pt-14">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <Package className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pedidos</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Gestión de pedidos: Remitir, Facturar y Cobrar</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar pedido..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-advanta-green focus:border-transparent"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-advanta-green focus:border-transparent"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="pending">Pendientes</option>
                            <option value="shipped">Remitidos</option>
                            <option value="invoiced">Facturados</option>
                            <option value="paid">Cobrados</option>
                            <option value="completed">Completados</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-16">
                        <Package className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            No hay pedidos
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            Los pedidos se crean automáticamente cuando confirmas una cotización.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredOrders.map((order, index) => {
                            const canRemitir = order.status === 'pending';
                            const canFacturar = order.status === 'shipped';
                            const canCobrar = order.status === 'invoiced';
                            const isCompleted = order.status === 'paid' || order.status === 'completed';

                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow"
                                >
                                    <div className="p-6">
                                        {/* Header Row */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                        {order.orderNumber}
                                                    </h3>
                                                    {getStatusBadge(order.status)}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                    <Building2 size={16} />
                                                    <span className="font-medium">{order.clientName}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                                    {formatCurrency(order.total)}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    + IVA {formatCurrency(order.tax)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                            <div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tipo de Venta</div>
                                                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {order.saleType === 'own' ? '🏢 Propia' : '🤝 Partner'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Pago</div>
                                                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {order.paymentCondition === 'cash' ? '💵 Contado' :
                                                        order.paymentCondition === '30d' ? '📅 30 días' :
                                                            order.paymentCondition === '60d' ? '📅 60 días' : '📅 90 días'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Entrega</div>
                                                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {formatDate(order.deliveryDate)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Productos</div>
                                                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {order.lines.length} ítem(s)
                                                </div>
                                            </div>
                                        </div>

                                        {/* Products List */}
                                        <div className="space-y-2 mb-4">
                                            {order.lines.slice(0, 2).map((line, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-sm">
                                                    <div className="flex-1">
                                                        <span className="text-slate-700 dark:text-slate-300">{line.productName}</span>
                                                        <span className="text-slate-500 dark:text-slate-400 ml-2">× {line.quantity}</span>
                                                    </div>
                                                    <div className="font-semibold text-slate-900 dark:text-white">
                                                        {formatCurrency(line.total)}
                                                    </div>
                                                </div>
                                            ))}
                                            {order.lines.length > 2 && (
                                                <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                                                    + {order.lines.length - 2} producto(s) más
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                Creado: {formatDate(order.createdAt)}
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                                {/* Check if order is fully completed */}
                                                {(() => {
                                                    const orderComprobantes = comprobantesMap[order.id] || [];
                                                    const hasFactura = orderComprobantes.some(c => c.tipo === 'FACTURA');
                                                    const hasRemito = orderComprobantes.some(c => c.tipo === 'REMITO');
                                                    const hasCobro = orderComprobantes.some(c => c.tipo === 'COBRO');
                                                    const isFullyCompleted = hasFactura && hasRemito && hasCobro;

                                                    if (isFullyCompleted) {
                                                        return (
                                                            <span className="px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-2">
                                                                <CheckCircle size={14} />
                                                                <span>COMPLETADO</span>
                                                            </span>
                                                        );
                                                    }

                                                    return (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedOrderForAction(order);
                                                                setInvoiceActionModalOpen(true);
                                                            }}
                                                            className="px-4 py-2 bg-gradient-to-r from-advanta-green to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                                                        >
                                                            <PackageCheck size={16} />
                                                            <span>PROCESAR</span>
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        {/* Comprobantes Section */}
                                        {comprobantesMap[order.id] && comprobantesMap[order.id].length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                <button
                                                    onClick={() => toggleOrderExpansion(order.id)}
                                                    className="w-full flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-advanta-green dark:hover:text-red-400 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4" />
                                                        <span>
                                                            Comprobantes ({comprobantesMap[order.id].length})
                                                        </span>
                                                    </div>
                                                    {expandedOrders.has(order.id) ? (
                                                        <ChevronUp className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4" />
                                                    )}
                                                </button>

                                                {/* Expanded Comprobantes List */}
                                                {expandedOrders.has(order.id) && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="mt-3"
                                                    >
                                                        <ComprobantesList
                                                            comprobantes={comprobantesMap[order.id]}
                                                            onPreview={handlePreviewPDF}
                                                        />
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={paymentModalOpen}
                onClose={() => {
                    setPaymentModalOpen(false);
                    setSelectedOrderForPayment(null);
                }}
                order={selectedOrderForPayment}
                onConfirm={handleConfirmPayment}
            />

            {/* Pre-Invoice Modal */}
            <PreInvoiceModal
                isOpen={preInvoiceModalOpen}
                onClose={() => {
                    setPreInvoiceModalOpen(false);
                    setSelectedOrderForInvoice(null);
                }}
                order={selectedOrderForInvoice}
                onConfirm={confirmFacturar}
            />

            {/* Invoice Action Modal (New Unified Modal) */}
            <InvoiceActionModal
                isOpen={invoiceActionModalOpen}
                order={selectedOrderForAction}
                onClose={() => {
                    setInvoiceActionModalOpen(false);
                    setSelectedOrderForAction(null);
                }}
                onSuccess={(result) => {
                    console.log('✅ Action completed:', result);

                    // Update order status based on comprobante type
                    if (result.comprobante) {
                        const actionType = result.comprobante.tipo; // 'FACTURA', 'REMITO', or 'COBRO'

                        // Determine new status
                        let newStatus = selectedOrderForAction.status;
                        if (actionType === 'FACTURA') {
                            newStatus = 'invoiced';
                        } else if (actionType === 'REMITO') {
                            newStatus = 'shipped';
                        } else if (actionType === 'COBRO') {
                            newStatus = 'paid';
                        }

                        // Update local orders
                        setLocalOrders(prev =>
                            prev.map(o =>
                                o.id === selectedOrderForAction.id
                                    ? { ...o, status: newStatus }
                                    : o
                            )
                        );

                        // Show success toast
                        const actionLabels = {
                            'FACTURA': 'Facturado',
                            'REMITO': 'Remitido',
                            'COBRO': 'Cobrado'
                        };

                        showToast({
                            id: `action-success-${selectedOrderForAction.id}`,
                            title: `✅ ${actionLabels[actionType]} Exitosamente`,
                            description: `Pedido ${selectedOrderForAction.orderNumber} procesado correctamente`,
                            priority: 'high',
                            icon: actionType === 'FACTURA' ? FileText : actionType === 'REMITO' ? Truck : DollarSign,
                            timeAgo: 'Ahora'
                        });
                    }
                }}
            />

            {/* PDF Preview Modal */}
            <PDFPreviewModal
                isOpen={pdfPreviewOpen}
                comprobante={selectedComprobante}
                onClose={() => {
                    setPdfPreviewOpen(false);
                    setSelectedComprobante(null);
                }}
            />
        </div>

    );
};

export default Pedidos;
