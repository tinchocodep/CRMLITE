import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    Package,
    FileText,
    DollarSign,
    ShoppingCart,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Users,
    CheckCircle,
    Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { opportunities } from '../data/opportunities';
import { quotations } from '../data/quotations';
import { orders } from '../data/orders';
import { stockBalances } from '../data/stock';
import { invoices, accountMovements } from '../data/invoices';

const CotizadorIndex = () => {
    const navigate = useNavigate();

    // ==================== CÁLCULOS DE KPIs ====================

    // 1. Volumen Cotizado vs Cerrado (Tasa de conversión)
    const conversionMetrics = useMemo(() => {
        const totalOpportunities = opportunities.length;
        const wonOpportunities = opportunities.filter(o => o.status === 'won').length;
        const totalQuoted = opportunities.reduce((sum, o) => sum + o.estimatedValue, 0);
        const totalClosed = opportunities
            .filter(o => o.status === 'won')
            .reduce((sum, o) => sum + o.estimatedValue, 0);

        const conversionRate = totalOpportunities > 0
            ? ((wonOpportunities / totalOpportunities) * 100).toFixed(1)
            : 0;

        return {
            totalQuoted,
            totalClosed,
            conversionRate,
            totalOpportunities,
            wonOpportunities
        };
    }, []);

    // 2. Stock Valuado
    const stockMetrics = useMemo(() => {
        const totalValue = stockBalances.reduce((sum, item) => {
            // Estimamos precio promedio de $1,400 por unidad
            const estimatedPrice = 1400;
            return sum + (item.balance * estimatedPrice);
        }, 0);

        const totalUnits = stockBalances.reduce((sum, item) => sum + item.balance, 0);
        const productsInStock = stockBalances.filter(item => item.balance > 0).length;

        return {
            totalValue,
            totalUnits,
            productsInStock
        };
    }, []);

    // 3. Cuentas por Cobrar (Antigüedad de Deuda)
    const accountsReceivable = useMemo(() => {
        const unpaidInvoices = invoices.filter(inv => inv.status === 'issued' || inv.status === 'partial');

        const today = new Date();
        const overdue = unpaidInvoices.filter(inv => {
            const dueDate = new Date(inv.dueDate);
            return dueDate < today;
        });

        const upcoming = unpaidInvoices.filter(inv => {
            const dueDate = new Date(inv.dueDate);
            return dueDate >= today;
        });

        const totalOverdue = overdue.reduce((sum, inv) => sum + inv.total, 0);
        const totalUpcoming = upcoming.reduce((sum, inv) => sum + inv.total, 0);
        const totalReceivable = totalOverdue + totalUpcoming;

        return {
            totalReceivable,
            totalOverdue,
            totalUpcoming,
            overdueCount: overdue.length,
            upcomingCount: upcoming.length
        };
    }, []);

    // 4. Pedidos en Proceso
    const ordersMetrics = useMemo(() => {
        const pending = orders.filter(o => o.status === 'pending').length;
        const shipped = orders.filter(o => o.status === 'shipped').length;
        const invoiced = orders.filter(o => o.status === 'invoiced').length;
        const completed = orders.filter(o => o.status === 'completed' || o.status === 'paid').length;

        return { pending, shipped, invoiced, completed, total: orders.length };
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatPercentage = (value) => {
        return `${value}%`;
    };

    // Módulos disponibles
    const modules = [
        {
            title: 'Oportunidades',
            description: 'Gestión de oportunidades de venta',
            path: '/opportunities',
            icon: TrendingUp,
            color: 'from-blue-500 to-blue-600',
            stats: `${opportunities.length} activas`,
            badge: opportunities.filter(o => ['negotiation', 'proposal'].includes(o.status)).length
        },
        {
            title: 'Cotizaciones',
            description: 'Cotizaciones y confirmación',
            path: '/cotizaciones',
            icon: FileText,
            color: 'from-purple-500 to-purple-600',
            stats: `${quotations.length} cotizaciones`,
            badge: quotations.filter(q => q.status === 'sent').length
        },
        {
            title: 'Pedidos',
            description: 'Remitir, Facturar y Cobrar',
            path: '/pedidos',
            icon: ShoppingCart,
            color: 'from-indigo-500 to-indigo-600',
            stats: `${orders.length} pedidos`,
            badge: ordersMetrics.pending
        },
        {
            title: 'Stock',
            description: 'Movimientos y balances',
            path: '/stock',
            icon: Package,
            color: 'from-green-500 to-green-600',
            stats: `${stockMetrics.productsInStock} productos`,
            badge: null
        },
        {
            title: 'Comprobantes',
            description: 'Facturas y documentos',
            path: '/comprobantes',
            icon: FileText,
            color: 'from-amber-500 to-amber-600',
            stats: `${invoices.length} facturas`,
            badge: null
        },
        {
            title: 'Cuenta Corriente',
            description: 'Estado de cuentas por cliente',
            path: '/cuenta-corriente',
            icon: DollarSign,
            color: 'from-emerald-500 to-emerald-600',
            stats: `${accountsReceivable.overdueCount + accountsReceivable.upcomingCount} pendientes`,
            badge: accountsReceivable.overdueCount
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-24 xl:pb-8 xl:pt-14">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                            Dashboard Administración
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Visión estratégica del negocio
                        </p>
                    </div>



                    {/* Estado de Pedidos */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="w-5 h-5 text-amber-500" />
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {ordersMetrics.pending}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Pendientes</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-2">
                                <Package className="w-5 h-5 text-blue-500" />
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {ordersMetrics.shipped}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Remitidos</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-2">
                                <FileText className="w-5 h-5 text-purple-500" />
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {ordersMetrics.invoiced}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Facturados</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {ordersMetrics.completed}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Completados</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Módulos */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    Módulos de Administración
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
