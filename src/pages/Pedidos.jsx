import React, { useState } from 'react';
import { Package, Search, Filter, Plus, Edit2, Eye, Truck, CheckCircle, Clock, DollarSign, Calendar, Building2, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const Pedidos = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, pending, in_progress, ready, delivered

    // Mock data - esto se conectará con Supabase
    const [orders, setOrders] = useState([
        {
            id: 1,
            orderNumber: 'PED-001',
            quotationNumber: 'COT-001',
            company: 'Agro San Juan S.A.',
            status: 'ready',
            totalAmount: 125000,
            createdDate: '2026-02-05',
            deliveryDate: '2026-02-15',
            items: 5,
            invoiced: false
        },
        {
            id: 2,
            orderNumber: 'PED-002',
            quotationNumber: 'COT-002',
            company: 'Estancia La Pampa',
            status: 'in_progress',
            totalAmount: 89500,
            createdDate: '2026-02-06',
            deliveryDate: '2026-02-20',
            items: 3,
            invoiced: false
        },
        {
            id: 3,
            orderNumber: 'PED-003',
            quotationNumber: 'COT-005',
            company: 'Campo Verde S.R.L.',
            status: 'delivered',
            totalAmount: 215000,
            createdDate: '2026-01-28',
            deliveryDate: '2026-02-08',
            items: 8,
            invoiced: true
        },
        {
            id: 4,
            orderNumber: 'PED-004',
            quotationNumber: 'COT-007',
            company: 'Agroindustrias del Sur',
            status: 'pending',
            totalAmount: 67800,
            createdDate: '2026-02-07',
            deliveryDate: '2026-02-18',
            items: 4,
            invoiced: false
        },
        {
            id: 5,
            orderNumber: 'PED-005',
            quotationNumber: 'COT-009',
            company: 'Semillas del Norte',
            status: 'ready',
            totalAmount: 178500,
            createdDate: '2026-02-04',
            deliveryDate: '2026-02-14',
            items: 6,
            invoiced: false
        }
    ]);

    const stats = [
        {
            label: 'Total Pedidos',
            value: orders.length,
            icon: Package,
            color: 'from-indigo-500 to-indigo-600',
            textColor: 'text-indigo-600'
        },
        {
            label: 'Pendientes',
            value: orders.filter(o => o.status === 'pending').length,
            icon: Clock,
            color: 'from-amber-500 to-amber-600',
            textColor: 'text-amber-600'
        },
        {
            label: 'Listos',
            value: orders.filter(o => o.status === 'ready').length,
            icon: CheckCircle,
            color: 'from-green-500 to-green-600',
            textColor: 'text-green-600'
        },
        {
            label: 'Entregados',
            value: orders.filter(o => o.status === 'delivered').length,
            icon: Truck,
            color: 'from-blue-500 to-blue-600',
            textColor: 'text-blue-600'
        }
    ];

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
            in_progress: { label: 'En Proceso', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            ready: { label: 'Listo', color: 'bg-green-100 text-green-700 border-green-200' },
            delivered: { label: 'Entregado', color: 'bg-slate-100 text-slate-700 border-slate-200' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-24 xl:pb-8">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <Package className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pedidos</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Cotizaciones cerradas listas para facturar y remitir</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-advanta-green to-green-600 text-white rounded-lg hover:shadow-lg transition-all">
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Nuevo Pedido</span>
                        </button>
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
                            <option value="in_progress">En Proceso</option>
                            <option value="ready">Listos</option>
                            <option value="delivered">Entregados</option>
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
                            {searchTerm || statusFilter !== 'all'
                                ? 'No se encontraron pedidos con los filtros aplicados'
                                : 'Crea tu primer pedido desde una cotización aprobada'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredOrders.map((order, index) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                    {order.orderNumber}
                                                </h3>
                                                {getStatusBadge(order.status)}
                                                {!order.invoiced && (
                                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                                                        Sin Facturar
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Building2 className="w-4 h-4" />
                                                <span>{order.company}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500 mt-1">
                                                <FileText className="w-3 h-3" />
                                                <span>Cotización: {order.quotationNumber}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors">
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors">
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            <button className="px-3 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold hover:shadow-lg transition-all">
                                                Facturar
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-green-600" />
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    ${order.totalAmount.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-indigo-600" />
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Items</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {order.items}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-blue-600" />
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Creado</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {new Date(order.createdDate).toLocaleDateString('es-AR')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Truck className="w-4 h-4 text-amber-600" />
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Entrega</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {new Date(order.deliveryDate).toLocaleDateString('es-AR')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                                                Remito
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Pedidos;
