import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Package,
    FileText,
    DollarSign,
    ArrowUpRight,
    TrendingDown,
    TrendingUp,
    AlertCircle,
    Warehouse,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { stockBalances } from '../data/stock';
import { invoices, accountMovements } from '../data/invoices';

const ComercialIndex = () => {
    const navigate = useNavigate();

    // ── Stock metrics ──────────────────────────────────────────────────────────
    const stockMetrics = useMemo(() => {
        const totalUnits = stockBalances.reduce((s, i) => s + i.balance, 0);
        const productsInStock = stockBalances.filter(i => i.balance > 0).length;
        const totalValue = totalUnits * 1400; // precio promedio estimado
        return { totalUnits, productsInStock, totalValue };
    }, []);

    // ── Cuentas por cobrar ─────────────────────────────────────────────────────
    const accountsReceivable = useMemo(() => {
        const unpaid = invoices.filter(inv => inv.status === 'issued' || inv.status === 'partial');
        const today = new Date();
        const overdue = unpaid.filter(inv => new Date(inv.dueDate) < today);
        const upcoming = unpaid.filter(inv => new Date(inv.dueDate) >= today);
        return {
            totalReceivable: [...overdue, ...upcoming].reduce((s, i) => s + i.total, 0),
            totalOverdue: overdue.reduce((s, i) => s + i.total, 0),
            overdueCount: overdue.length,
            upcomingCount: upcoming.length,
        };
    }, []);

    const formatCurrency = (n) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

    // ── KPIs header ───────────────────────────────────────────────────────────
    const kpis = [
        {
            label: 'Productos en Stock',
            value: stockMetrics.productsInStock,
            sub: `${stockMetrics.totalUnits.toLocaleString()} unidades`,
            icon: Warehouse,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        },
        {
            label: 'Valor Stock Estimado',
            value: formatCurrency(stockMetrics.totalValue),
            sub: 'Precio promedio $1.400/u',
            icon: TrendingUp,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
        },
        {
            label: 'Facturas Pendientes',
            value: accountsReceivable.overdueCount + accountsReceivable.upcomingCount,
            sub: formatCurrency(accountsReceivable.totalReceivable),
            icon: FileText,
            color: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
        },
        {
            label: 'Deuda Vencida',
            value: accountsReceivable.overdueCount,
            sub: formatCurrency(accountsReceivable.totalOverdue),
            icon: AlertCircle,
            color: 'text-red-600',
            bg: 'bg-red-50 dark:bg-red-900/20',
        },
    ];

    // ── Módulos ────────────────────────────────────────────────────────────────
    const modules = [
        {
            title: 'Stock',
            description: 'Balances, ingresos y egresos de inventario',
            path: '/stock',
            icon: Package,
            color: 'from-green-500 to-emerald-600',
            stats: `${stockMetrics.productsInStock} productos`,
            badge: null,
        },
        {
            title: 'Comprobantes',
            description: 'Facturas, recibos y notas de crédito/débito',
            path: '/comprobantes',
            icon: FileText,
            color: 'from-amber-500 to-orange-500',
            stats: `${invoices.length} comprobantes`,
            badge: accountsReceivable.overdueCount > 0 ? accountsReceivable.overdueCount : null,
        },
        {
            title: 'Cuenta Corriente',
            description: 'Estado de cuenta por cliente y saldos',
            path: '/cuenta-corriente',
            icon: DollarSign,
            color: 'from-emerald-500 to-teal-600',
            stats: `${accountsReceivable.upcomingCount + accountsReceivable.overdueCount} pendientes`,
            badge: accountsReceivable.overdueCount > 0 ? accountsReceivable.overdueCount : null,
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-24 xl:pb-8 xl:pt-14">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                            Comercial
                        </h1>
                        <p className="text-lg text-slate-500 dark:text-slate-400">
                            Inventario, facturación y estado de cuentas
                        </p>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {kpis.map((kpi, i) => (
                            <div key={i} className={`${kpi.bg} rounded-xl p-4 border border-slate-200 dark:border-slate-700`}>
                                <div className="flex items-center gap-3 mb-1">
                                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                                    <span className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{kpi.label}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{kpi.sub}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Módulos */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    Módulos Comerciales
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
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

export default ComercialIndex;
