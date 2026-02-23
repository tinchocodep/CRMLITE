import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    ShoppingCart,
    ArrowUpRight,
    CheckCircle,
    Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuotations } from '../hooks/useQuotations';
import { useOrders } from '../hooks/useOrders';

const CotizadorIndex = () => {
    const navigate = useNavigate();
    const { quotations, loading: loadingQuotations } = useQuotations();
    const { orders, loading: loadingOrders } = useOrders();

    // KPIs de Pedidos
    const ordersMetrics = useMemo(() => {
        const pending = orders.filter(o => o.status === 'pending').length;
        const shipped = orders.filter(o => o.status === 'shipped').length;
        const invoiced = orders.filter(o => o.status === 'invoiced').length;
        const completed = orders.filter(o => o.status === 'completed' || o.status === 'paid').length;
        return { pending, shipped, invoiced, completed, total: orders.length };
    }, [orders]);

    // KPIs de Cotizaciones
    const quotationsMetrics = useMemo(() => {
        const draft = quotations.filter(q => q.status === 'draft').length;
        const sent = quotations.filter(q => q.status === 'sent').length;
        const confirmed = quotations.filter(q => q.status === 'confirmed' || q.status === 'won').length;
        return { draft, sent, confirmed, total: quotations.length };
    }, [quotations]);

    const isLoading = loadingQuotations || loadingOrders;

    // Módulos disponibles
    const modules = [
        {
            title: 'Cotizaciones',
            description: 'Cotizaciones y confirmación',
            path: '/cotizaciones',
            icon: FileText,
            color: 'from-purple-500 to-purple-600',
            stats: isLoading ? 'Cargando...' : `${quotationsMetrics.total} cotizaciones`,
            badge: quotationsMetrics.draft + quotationsMetrics.sent
        },
        {
            title: 'Pedidos',
            description: 'Remitir, Facturar y Cobrar',
            path: '/pedidos',
            icon: ShoppingCart,
            color: 'from-indigo-500 to-indigo-600',
            stats: isLoading ? 'Cargando...' : `${ordersMetrics.total} pedidos`,
            badge: ordersMetrics.pending + ordersMetrics.shipped + ordersMetrics.invoiced
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-24 xl:pb-8 xl:pt-14">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                            Administración
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Pipeline de ventas: cotizaciones y pedidos
                        </p>
                    </div>

                    {/* KPIs de Cotizaciones */}
                    <div className="mb-4">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                            Cotizaciones
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3 mb-2">
                                    <FileText className="w-5 h-5 text-slate-400" />
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {isLoading ? '—' : quotationsMetrics.draft}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Borradores</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3 mb-2">
                                    <FileText className="w-5 h-5 text-amber-500" />
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {isLoading ? '—' : quotationsMetrics.sent}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Enviadas</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3 mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {isLoading ? '—' : quotationsMetrics.confirmed}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Confirmadas</p>
                            </div>
                        </div>
                    </div>

                    {/* KPIs de Pedidos */}
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                            Pedidos
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3 mb-2">
                                    <Clock className="w-5 h-5 text-amber-500" />
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {isLoading ? '—' : ordersMetrics.pending}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Pendientes</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3 mb-2">
                                    <ShoppingCart className="w-5 h-5 text-blue-500" />
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {isLoading ? '—' : ordersMetrics.shipped}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Remitidos</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3 mb-2">
                                    <FileText className="w-5 h-5 text-purple-500" />
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {isLoading ? '—' : ordersMetrics.invoiced}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Facturados</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3 mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {isLoading ? '—' : ordersMetrics.completed}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Completados</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Módulos */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    Módulos de Administración
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {modules.map((module, index) => (
                        <motion.div
                            key={module.path}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                            onClick={() => navigate(module.path)}
                            className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:scale-105 transition-all cursor-pointer relative overflow-hidden"
                        >
                            {/* Badge */}
                            {module.badge !== null && module.badge > 0 && (
                                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                                    {module.badge}
                                </div>
                            )}

                            {/* Icon */}
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <module.icon className="w-7 h-7 text-white" />
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                {module.title}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                {module.description}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    {module.stats}
                                </span>
                                <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CotizadorIndex;
