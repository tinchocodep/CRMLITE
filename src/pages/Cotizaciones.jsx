import React, { useState } from 'react';
import { FileText, Search, Edit2, CheckCircle, DollarSign, Calendar, Building2, ShoppingCart, XCircle, ChevronRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { orders as mockOrders } from '../data/orders';
import { useToast } from '../contexts/ToastContext';
import QuotationDetailsModal from '../components/QuotationDetailsModal';
import EditQuotationModal from '../components/EditQuotationModal';
import { useQuotations } from '../hooks/useQuotations';
import { useOrders } from '../hooks/useOrders';

const Cotizaciones = () => {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [quotationToEdit, setQuotationToEdit] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [quotationToDelete, setQuotationToDelete] = useState(null);
    // Modal de selección de IVA previo a confirmar la cotización
    const [ivaModalOpen, setIvaModalOpen] = useState(false);
    const [quotationToConfirm, setQuotationToConfirm] = useState(null);
    const [selectedIvaRate, setSelectedIvaRate] = useState('21');
    const [isConfirming, setIsConfirming] = useState(false);

    // Usar hook de Supabase para cotizaciones
    const {
        quotations,
        loading,
        error,
        updateQuotation,
        deleteQuotation
    } = useQuotations();

    // Usar hook de Supabase para pedidos
    const { createOrder } = useOrders();

    const [localOrders, setLocalOrders] = useState(mockOrders);

    // Función para actualizar el estado de una cotización
    const handleUpdateStatus = async (quotation, newStatus) => {
        const result = await updateQuotation(quotation.id, { status: newStatus });

        if (!result.success) {
            showToast({
                id: `error-${quotation.id}-${Date.now()}`,
                title: '❌ Error',
                description: result.error || 'No se pudo actualizar el estado',
                priority: 'high',
                icon: XCircle,
                timeAgo: 'Ahora'
            });
            return;
        }

        const statusLabels = {
            draft: 'Borrador',
            sent: 'Enviada',
            approved: 'Aprobada',
            rejected: 'Rechazada'
        };

        const statusIcons = {
            draft: Edit2,
            sent: FileText,
            approved: CheckCircle,
            rejected: XCircle
        };

        showToast({
            id: `status-${quotation.id}-${Date.now()}`,
            title: `✅ Estado Actualizado`,
            description: `Cotización ${quotation.quotation_number || quotation.number} marcada como ${statusLabels[newStatus]}`,
            priority: 'high',
            icon: statusIcons[newStatus],
            timeAgo: 'Ahora'
        });

        // Debug: Log newStatus to see what value we're getting
        console.log('🔍 [handleUpdateStatus] newStatus:', newStatus, 'quotation:', quotation);

        // Si se aprueba la cotización, crear pedido automáticamente
        if (newStatus === 'approved') {
            console.log('🛒 Creating order from approved quotation:', quotation);

            const orderData = {
                quotation_id: quotation.id,
                company_id: quotation.company_id,
                client_name: quotation.company?.trade_name || quotation.company?.legal_name || quotation.client_name || 'Cliente Desconocido',
                delivery_date: quotation.delivery_date,
                status: 'pending',
                sale_type: quotation.sale_type,
                payment_condition: quotation.payment_condition,
                origin_address: quotation.origin_address || '',
                destination_address: quotation.destination_address || '',
                subtotal: quotation.subtotal,
                tax: quotation.tax,
                total: quotation.total,
                lines: quotation.lines.map(line => ({
                    product_sap_code: line.product_sap_code,
                    product_name: line.product_name,
                    quantity: line.quantity,
                    unit_price: line.unit_price,
                    subtotal: line.subtotal
                }))
            };


            const orderResult = await createOrder(orderData);

            if (orderResult.success) {
                showToast({
                    id: `order-created-${quotation.id}-${Date.now()}`,
                    title: '🛒 Pedido Creado',
                    description: `Se creó el pedido ${orderResult.data.order_number} automáticamente desde la cotización ${quotation.quotation_number || quotation.number}`,
                    priority: 'high',
                    icon: ShoppingCart,
                    timeAgo: 'Ahora'
                });
            } else {
                showToast({
                    id: `order-error-${quotation.id}-${Date.now()}`,
                    title: '⚠️ Advertencia',
                    description: `La cotización se aprobó pero hubo un error al crear el pedido: ${orderResult.error}`,
                    priority: 'high',
                    icon: XCircle,
                    timeAgo: 'Ahora'
                });
            }
        }
    };

    // Función para editar cotización
    const handleEditQuotation = (quotation) => {
        setQuotationToEdit(quotation);
        setEditModalOpen(true);
    };

    // Guardar cambios de cotización
    const handleSaveQuotation = async (updatedData) => {
        const result = await updateQuotation(quotationToEdit.id, updatedData);

        if (!result.success) {
            showToast({
                id: `error-${quotationToEdit.id}-${Date.now()}`,
                title: '❌ Error',
                description: result.error || 'No se pudo actualizar la cotización',
                priority: 'high',
                icon: XCircle,
                timeAgo: 'Ahora'
            });
            return;
        }

        showToast({
            id: `edit-${quotationToEdit.id}-${Date.now()}`,
            title: '✅ Cotización Actualizada',
            description: `Los cambios en ${quotationToEdit.quotation_number || quotationToEdit.number} se guardaron correctamente`,
            priority: 'high',
            icon: CheckCircle,
            timeAgo: 'Ahora'
        });
    };

    // Función para eliminar cotización
    const handleDeleteQuotation = async () => {
        if (!quotationToDelete) return;

        const result = await deleteQuotation(quotationToDelete.id);

        if (!result.success) {
            showToast({
                id: `error-delete-${quotationToDelete.id}-${Date.now()}`,
                title: '❌ Error',
                description: result.error || 'No se pudo eliminar la cotización',
                priority: 'high',
                icon: XCircle,
                timeAgo: 'Ahora'
            });
            setDeleteConfirmOpen(false);
            setQuotationToDelete(null);
            return;
        }

        showToast({
            id: `delete-${quotationToDelete.id}-${Date.now()}`,
            title: '✅ Cotización Eliminada',
            description: `La cotización ${quotationToDelete.quotation_number || quotationToDelete.number} fue eliminada correctamente`,
            priority: 'high',
            icon: CheckCircle,
            timeAgo: 'Ahora'
        });

        setDeleteConfirmOpen(false);
        setQuotationToDelete(null);
    };


    // Apply filters
    const filteredQuotations = quotations.filter(quot => {
        const matchesSearch = quot.quotation_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quot.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quot.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quot.clientName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || quot.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const stats = [
        {
            label: 'Total',
            value: quotations.length,
            icon: FileText,
            color: 'from-blue-500 to-blue-600',
            textColor: 'text-blue-600'
        },
        {
            label: 'Borradores',
            value: quotations.filter(q => q.status === 'draft').length,
            icon: Edit2,
            color: 'from-amber-500 to-amber-600',
            textColor: 'text-amber-600'
        },
        {
            label: 'Enviadas',
            value: quotations.filter(q => q.status === 'sent').length,
            icon: FileText,
            color: 'from-purple-500 to-purple-600',
            textColor: 'text-purple-600'
        },
        {
            label: 'Aprobadas',
            value: quotations.filter(q => q.status === 'approved').length,
            icon: CheckCircle,
            color: 'from-green-500 to-green-600',
            textColor: 'text-green-600'
        }
    ];

    const statusConfig = {
        draft: { label: 'Borrador', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '📝' },
        sent: { label: 'Enviada', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '📤' },
        approved: { label: 'Aprobada', color: 'bg-green-100 text-green-700 border-green-200', icon: '✅' },
        rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-700 border-red-200', icon: '❌' },
        revision: { label: 'En Revisión', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '🔍' }
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

    // Abre el modal de selección de IVA antes de confirmar
    const handleConfirmQuotation = (quotation) => {
        setQuotationToConfirm(quotation);
        setSelectedIvaRate('21');
        setIvaModalOpen(true);
    };

    // Confirma la cotización con el IVA seleccionado, recalcula importes y crea el pedido
    const handleConfirmWithIva = async () => {
        if (!quotationToConfirm || isConfirming) return;
        setIsConfirming(true);

        try {
            const baseSubtotal = parseFloat(quotationToConfirm.subtotal) || 0;
            const ivaMultiplier = selectedIvaRate === '21' ? 0.21
                : selectedIvaRate === '10.5' ? 0.105
                    : 0;

            const newTax = parseFloat((baseSubtotal * ivaMultiplier).toFixed(2));
            const newTotal = parseFloat((baseSubtotal + newTax).toFixed(2));

            // Actualizar la cotización con los nuevos valores de IVA antes de aprobarla
            await updateQuotation(quotationToConfirm.id, {
                tax_rate: selectedIvaRate === 'none' ? 0 : parseFloat(selectedIvaRate),
                tax: newTax,
                total: newTotal,
            });

            // Aprobar y crear pedido con los valores actualizados
            const updatedQuotation = {
                ...quotationToConfirm,
                tax: newTax,
                total: newTotal,
                subtotal: baseSubtotal,
            };

            setIvaModalOpen(false);
            setQuotationToConfirm(null);
            await handleUpdateStatus(updatedQuotation, 'approved');
        } finally {
            setIsConfirming(false);
        }
    };

    const getStatusBadge = (status) => {
        const config = statusConfig[status] || statusConfig.draft;
        return (
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${config.color} flex items-center gap-1 w-fit`}>
                <span>{config.icon}</span>
                <span className="hidden sm:inline">{config.label}</span>
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-24 xl:pb-8 xl:pt-14">
            {/* Header - Mobile Optimized */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 xl:static">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
                    {/* Title */}
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">Cotizaciones</h1>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 hidden sm:block">Gestión de cotizaciones y confirmación de pedidos</p>
                        </div>
                    </div>

                    {/* Stats Cards - Mobile Optimized */}
                    <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-6">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-lg sm:rounded-xl p-2 sm:p-4 border border-slate-200 dark:border-slate-700 shadow-sm"
                            >
                                <div className="flex flex-col items-center gap-1 sm:gap-2">
                                    <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.textColor}`} />
                                    <span className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
                                    <p className="text-[9px] sm:text-xs text-slate-600 dark:text-slate-400 font-medium text-center leading-tight">{stat.label}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Search and Filters - Mobile Optimized */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-advanta-green focus:border-transparent"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-advanta-green focus:border-transparent"
                        >
                            <option value="all">Todos</option>
                            <option value="draft">Borradores</option>
                            <option value="sent">Enviadas</option>
                            <option value="approved">Aprobadas</option>
                            <option value="rejected">Rechazadas</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Quotations List - Mobile Optimized Cards */}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-advanta-green"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            Error al cargar cotizaciones
                        </h3>
                        <p className="text-sm text-red-600 dark:text-red-400 px-4">
                            {error}
                        </p>
                    </div>
                ) : filteredQuotations.length === 0 ? (
                    <div className="text-center py-12 sm:py-16">
                        <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 dark:text-slate-700 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            No hay cotizaciones
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 px-4">
                            Las cotizaciones se crean automáticamente cuando marcas una oportunidad como ganada.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:gap-4">
                        {filteredQuotations.map((quotation, index) => {
                            // Permitir confirmar desde draft o sent (sin necesidad de pasar por sent)
                            const canConfirm = quotation.status === 'draft' || quotation.status === 'sent';
                            const isApproved = quotation.status === 'approved';

                            return (
                                <motion.div
                                    key={quotation.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => {
                                        setSelectedQuotation(quotation);
                                        setDetailsModalOpen(true);
                                    }}
                                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer active:scale-[0.98]"
                                >
                                    <div className="p-3 sm:p-6">
                                        {/* Header Row - Mobile Optimized */}
                                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                                                    <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                                                        {quotation.quotation_number || quotation.number}
                                                    </h3>
                                                    {getStatusBadge(quotation.status)}
                                                </div>
                                                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                                    <Building2 size={14} className="flex-shrink-0" />
                                                    <span className="font-medium truncate">{quotation.client_name || quotation.clientName}</span>
                                                </div>
                                            </div>
                                            <div className="text-right ml-2 flex-shrink-0">
                                                <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                                                    {formatCurrency(parseFloat(quotation.total))}
                                                </div>
                                                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                                                    + IVA {formatCurrency(parseFloat(quotation.tax))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details Grid - Mobile Optimized */}
                                        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-700">
                                            <div>
                                                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Tipo</div>
                                                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                                                    {(quotation.sale_type || quotation.saleType) === 'own' ? '🏢 Propia' : '🤝 Partner'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Pago</div>
                                                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                    {(quotation.payment_condition || quotation.paymentCondition) === 'cash' ? '💵 Contado' :
                                                        (quotation.payment_condition || quotation.paymentCondition) === '30d' ? '📅 30d' :
                                                            (quotation.payment_condition || quotation.paymentCondition) === '60d' ? '📅 60d' : '📅 90d'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Entrega</div>
                                                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                                                    {formatDate(quotation.delivery_date || quotation.deliveryDate)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Productos</div>
                                                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                                                    {quotation.lines?.length || 0} ítem(s)
                                                </div>
                                            </div>
                                        </div>

                                        {/* Products List - Mobile Optimized */}
                                        <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                                            {quotation.lines?.slice(0, 2).map((line, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                                                    <div className="flex-1 min-w-0 mr-2">
                                                        <span className="text-slate-700 dark:text-slate-300 truncate block">{line.product_name || line.productName}</span>
                                                        <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs">× {line.quantity}</span>
                                                    </div>
                                                    <div className="font-semibold text-slate-900 dark:text-white flex-shrink-0">
                                                        {formatCurrency(parseFloat(line.total))}
                                                    </div>
                                                </div>
                                            ))}
                                            {quotation.lines && quotation.lines.length > 2 && (
                                                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 italic">
                                                    + {quotation.lines.length - 2} producto(s) más
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions - Mobile Optimized */}
                                        <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                                                {formatDate(quotation.created_at || quotation.createdAt)}
                                            </div>
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                {canConfirm && !isApproved && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleConfirmQuotation(quotation);
                                                        }}
                                                        className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg text-[10px] sm:text-sm font-bold transition-all flex items-center gap-1 sm:gap-2 shadow-sm"
                                                    >
                                                        <ShoppingCart size={14} className="sm:w-4 sm:h-4" />
                                                        <span className="hidden sm:inline">CONFIRMAR</span>
                                                        <span className="sm:hidden">✓</span>
                                                    </button>
                                                )}
                                                {isApproved && (
                                                    <span className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] sm:text-sm font-bold flex items-center gap-1 sm:gap-2">
                                                        <CheckCircle size={14} className="sm:w-4 sm:h-4" />
                                                        <span className="hidden sm:inline">CONFIRMADA</span>
                                                        <span className="sm:hidden">✓</span>
                                                    </span>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditQuotation(quotation);
                                                    }}
                                                    className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} className="sm:w-[18px] sm:h-[18px] text-blue-600 dark:text-blue-400" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setQuotationToDelete(quotation);
                                                        setDeleteConfirmOpen(true);
                                                    }}
                                                    className="p-1.5 sm:p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} className="sm:w-[18px] sm:h-[18px] text-red-600 dark:text-red-400" />
                                                </button>
                                                <ChevronRight size={16} className="text-slate-400" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quotation Details Modal */}
            <QuotationDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => {
                    setDetailsModalOpen(false);
                    setSelectedQuotation(null);
                }}
                quotation={selectedQuotation}
                onUpdateStatus={handleUpdateStatus}
            />

            {/* Edit Quotation Modal */}
            <EditQuotationModal
                isOpen={editModalOpen}
                onClose={() => {
                    setEditModalOpen(false);
                    setQuotationToEdit(null);
                }}
                quotation={quotationToEdit}
                onSave={handleSaveQuotation}
            />

            {/* ─── Modal de Selección de IVA ─────────────────────────────── */}
            <AnimatePresence>
                {ivaModalOpen && quotationToConfirm && (() => {
                    const base = parseFloat(quotationToConfirm.subtotal) || 0;
                    const ivaRate = selectedIvaRate === '21' ? 0.21
                        : selectedIvaRate === '10.5' ? 0.105
                            : 0;
                    const previewTax = base * ivaRate;
                    const previewTotal = base + previewTax;

                    return (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => !isConfirming && setIvaModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6"
                            >
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                                        <ShoppingCart className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirmar Cotización</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{quotationToConfirm.quotation_number || quotationToConfirm.number}</p>
                                    </div>
                                </div>

                                {/* IVA Options */}
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Seleccionar condición fiscal:</p>
                                <div className="space-y-2 mb-5">
                                    {[
                                        { value: '21', label: 'IVA 21%', desc: 'Alícuota general' },
                                        { value: '10.5', label: 'IVA 10.5%', desc: 'Alícuota reducida' },
                                        { value: 'none', label: 'Sin IVA', desc: 'Exento / No gravado' },
                                    ].map(opt => (
                                        <label
                                            key={opt.value}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedIvaRate === opt.value
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="iva-rate"
                                                value={opt.value}
                                                checked={selectedIvaRate === opt.value}
                                                onChange={() => setSelectedIvaRate(opt.value)}
                                                className="accent-green-500"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{opt.label}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                {/* Price Preview */}
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-5 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Subtotal neto</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(base)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">
                                            {selectedIvaRate === 'none' ? 'IVA' : `IVA (${selectedIvaRate}%)`}
                                        </span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(previewTax)}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200 dark:border-slate-600">
                                        <span className="text-slate-900 dark:text-white">Total</span>
                                        <span className="text-green-600 dark:text-green-400">{formatCurrency(previewTotal)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => !isConfirming && setIvaModalOpen(false)}
                                        disabled={isConfirming}
                                        className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirmWithIva}
                                        disabled={isConfirming}
                                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                                    >
                                        {isConfirming ? (
                                            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <ShoppingCart size={16} />
                                        )}
                                        {isConfirming ? 'Confirmando...' : 'Confirmar Pedido'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => {
                            setDeleteConfirmOpen(false);
                            setQuotationToDelete(null);
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Eliminar Cotización</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Esta acción no se puede deshacer</p>
                                </div>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 mb-6">
                                ¿Estás seguro de que deseas eliminar la cotización <span className="font-bold">{quotationToDelete?.quotation_number || quotationToDelete?.number}</span>?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setDeleteConfirmOpen(false);
                                        setQuotationToDelete(null);
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-semibold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteQuotation}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={18} />
                                    Eliminar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

    );
};

export default Cotizaciones;
