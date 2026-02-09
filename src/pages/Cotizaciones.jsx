import React, { useState } from 'react';
import { FileText, Search, Plus, Edit2, Eye, Send, CheckCircle, Clock, DollarSign, Calendar, Building2, ShoppingCart, XCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { quotations as mockQuotations } from '../data/quotations';
import { orders as mockOrders } from '../data/orders';
import { saveOrder } from '../services/ordersService';
import { getAllQuotations } from '../services/quotationsService';
import { useToast } from '../contexts/ToastContext';
import QuotationDetailsModal from '../components/QuotationDetailsModal';
import EditQuotationModal from '../components/EditQuotationModal';

const Cotizaciones = () => {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [quotationToEdit, setQuotationToEdit] = useState(null);

    // Estado para usar datos mock + datos del servicio
    const [localQuotations, setLocalQuotations] = useState(() => {
        // Merge mock quotations with quotations from service
        const serviceQuotations = getAllQuotations();
        const mockQuotationIds = new Set(mockQuotations.map(q => q.id));
        const uniqueServiceQuotations = serviceQuotations.filter(q => !mockQuotationIds.has(q.id));
        return [...mockQuotations, ...uniqueServiceQuotations];
    });
    const [localOrders, setLocalOrders] = useState(mockOrders);

    // Función para actualizar el estado de una cotización
    const handleUpdateStatus = (quotation, newStatus) => {
        setLocalQuotations(prev =>
            prev.map(q =>
                q.id === quotation.id
                    ? { ...q, status: newStatus, updatedAt: new Date().toISOString() }
                    : q
            )
        );

        const statusLabels = {
            draft: 'Borrador',
            sent: 'Enviada',
            approved: 'Aprobada',
            rejected: 'Rechazada'
        };

        const statusIcons = {
            draft: Edit2,
            sent: Send,
            approved: CheckCircle,
            rejected: XCircle
        };

        showToast({
            id: `status-${quotation.id}-${Date.now()}`,
            title: `✅ Estado Actualizado`,
            description: `Cotización ${quotation.number} marcada como ${statusLabels[newStatus]}`,
            priority: 'high',
            icon: statusIcons[newStatus],
            timeAgo: 'Ahora'
        });
    };

    // Función para editar cotización
    const handleEditQuotation = (quotation) => {
        setQuotationToEdit(quotation);
        setEditModalOpen(true);
    };

    // Guardar cambios de cotización
    const handleSaveQuotation = (updatedData) => {
        setLocalQuotations(prev =>
            prev.map(q =>
                q.id === quotationToEdit.id
                    ? { ...q, ...updatedData }
                    : q
            )
        );

        showToast({
            id: `edit-${quotationToEdit.id}-${Date.now()}`,
            title: '✅ Cotización Actualizada',
            description: `Los cambios en ${quotationToEdit.number} se guardaron correctamente`,
            priority: 'high',
            icon: CheckCircle,
            timeAgo: 'Ahora'
        });
    };


    // Apply filters
    const filteredQuotations = localQuotations.filter(quot => {
        const matchesSearch = quot.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quot.clientName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || quot.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const stats = [
        {
            label: 'Total',
            value: localQuotations.length,
            icon: FileText,
            color: 'from-blue-500 to-blue-600',
            textColor: 'text-blue-600'
        },
        {
            label: 'Borradores',
            value: localQuotations.filter(q => q.status === 'draft').length,
            icon: Edit2,
            color: 'from-amber-500 to-amber-600',
            textColor: 'text-amber-600'
        },
        {
            label: 'Enviadas',
            value: localQuotations.filter(q => q.status === 'sent').length,
            icon: Send,
            color: 'from-purple-500 to-purple-600',
            textColor: 'text-purple-600'
        },
        {
            label: 'Aprobadas',
            value: localQuotations.filter(q => q.status === 'approved').length,
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

    // Función para confirmar cotización y crear pedido
    const handleConfirmQuotation = (quotation) => {
        // Actualizar estado de cotización a "approved"
        setLocalQuotations(prev =>
            prev.map(q =>
                q.id === quotation.id
                    ? { ...q, status: 'approved' }
                    : q
            )
        );

        // Crear pedido usando el servicio (se guarda en localStorage)
        const newOrder = saveOrder({
            quotationId: quotation.id,
            clientId: quotation.clientId,
            clientName: quotation.clientName,
            saleType: quotation.saleType,
            paymentCondition: quotation.paymentCondition,
            deliveryDate: quotation.deliveryDate,
            originAddress: quotation.originAddress,
            destinationAddress: quotation.destinationAddress,
            status: 'pending',
            lines: quotation.lines,
            subtotal: quotation.subtotal,
            tax: quotation.tax,
            total: quotation.total
        });

        // Actualizar estado local también (para mantener sincronización)
        setLocalOrders(prev => [...prev, newOrder]);

        // Mostrar notificación
        showToast({
            id: `quotation-confirmed-${quotation.id}`,
            title: '✅ Cotización Confirmada',
            description: `Se creó el pedido ${newOrder.orderNumber} por ${formatCurrency(newOrder.total)}`,
            priority: 'high',
            icon: CheckCircle,
            timeAgo: 'Ahora'
        });
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
                {filteredQuotations.length === 0 ? (
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
                            const canConfirm = quotation.status === 'approved' || quotation.status === 'sent';
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
                                                        {quotation.number}
                                                    </h3>
                                                    {getStatusBadge(quotation.status)}
                                                </div>
                                                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                                    <Building2 size={14} className="flex-shrink-0" />
                                                    <span className="font-medium truncate">{quotation.clientName}</span>
                                                </div>
                                            </div>
                                            <div className="text-right ml-2 flex-shrink-0">
                                                <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                                                    {formatCurrency(quotation.total)}
                                                </div>
                                                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                                                    + IVA {formatCurrency(quotation.tax)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details Grid - Mobile Optimized */}
                                        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-700">
                                            <div>
                                                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Tipo</div>
                                                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                                                    {quotation.saleType === 'own' ? '🏢 Propia' : '🤝 Partner'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Pago</div>
                                                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                    {quotation.paymentCondition === 'cash' ? '💵 Contado' :
                                                        quotation.paymentCondition === '30d' ? '📅 30d' :
                                                            quotation.paymentCondition === '60d' ? '📅 60d' : '📅 90d'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Entrega</div>
                                                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                                                    {formatDate(quotation.deliveryDate)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Productos</div>
                                                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                                                    {quotation.lines.length} ítem(s)
                                                </div>
                                            </div>
                                        </div>

                                        {/* Products List - Mobile Optimized */}
                                        <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                                            {quotation.lines.slice(0, 2).map((line, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                                                    <div className="flex-1 min-w-0 mr-2">
                                                        <span className="text-slate-700 dark:text-slate-300 truncate block">{line.productName}</span>
                                                        <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs">× {line.quantity}</span>
                                                    </div>
                                                    <div className="font-semibold text-slate-900 dark:text-white flex-shrink-0">
                                                        {formatCurrency(line.total)}
                                                    </div>
                                                </div>
                                            ))}
                                            {quotation.lines.length > 2 && (
                                                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 italic">
                                                    + {quotation.lines.length - 2} producto(s) más
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions - Mobile Optimized */}
                                        <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                                                {formatDate(quotation.createdAt)}
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
        </div>

    );
};

export default Cotizaciones;
