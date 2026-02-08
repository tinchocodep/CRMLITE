import React, { useState } from 'react';
import { CreditCard, Search, Filter, TrendingUp, TrendingDown, DollarSign, Calendar, Building2, FileText, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const CuentaCorriente = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, positive, negative, zero

    // Mock data - esto se conectará con Supabase
    const [accounts, setAccounts] = useState([
        {
            id: 1,
            company: 'Agro San Juan S.A.',
            balance: 45000,
            lastMovement: '2026-02-10',
            pendingInvoices: 2,
            overdueInvoices: 0,
            creditLimit: 200000
        },
        {
            id: 2,
            company: 'Estancia La Pampa',
            balance: -15000,
            lastMovement: '2026-02-08',
            pendingInvoices: 1,
            overdueInvoices: 1,
            creditLimit: 150000
        },
        {
            id: 3,
            company: 'Campo Verde S.R.L.',
            balance: 0,
            lastMovement: '2026-02-05',
            pendingInvoices: 0,
            overdueInvoices: 0,
            creditLimit: 100000
        }
    ]);

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const positiveAccounts = accounts.filter(acc => acc.balance > 0);
    const negativeAccounts = accounts.filter(acc => acc.balance < 0);
    const totalOverdue = accounts.reduce((sum, acc) => sum + acc.overdueInvoices, 0);

    const stats = [
        {
            label: 'Saldo Total',
            value: `$${totalBalance.toLocaleString()}`,
            icon: DollarSign,
            color: totalBalance >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600',
            textColor: totalBalance >= 0 ? 'text-green-600' : 'text-red-600'
        },
        {
            label: 'Cuentas a Favor',
            value: positiveAccounts.length,
            icon: TrendingUp,
            color: 'from-green-500 to-green-600',
            textColor: 'text-green-600'
        },
        {
            label: 'Cuentas en Deuda',
            value: negativeAccounts.length,
            icon: TrendingDown,
            color: 'from-red-500 to-red-600',
            textColor: 'text-red-600'
        },
        {
            label: 'Facturas Vencidas',
            value: totalOverdue,
            icon: AlertCircle,
            color: 'from-amber-500 to-amber-600',
            textColor: 'text-amber-600'
        }
    ];

    const getBalanceColor = (balance) => {
        if (balance > 0) return 'text-green-600 dark:text-green-400';
        if (balance < 0) return 'text-red-600 dark:text-red-400';
        return 'text-slate-600 dark:text-slate-400';
    };

    const getBalanceIcon = (balance) => {
        if (balance > 0) return <TrendingUp className="w-4 h-4" />;
        if (balance < 0) return <TrendingDown className="w-4 h-4" />;
        return null;
    };

    const filteredAccounts = accounts.filter(account => {
        const matchesSearch = account.company?.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesStatus = true;
        if (statusFilter === 'positive') matchesStatus = account.balance > 0;
        if (statusFilter === 'negative') matchesStatus = account.balance < 0;
        if (statusFilter === 'zero') matchesStatus = account.balance === 0;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-24 xl:pb-8">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 xl:top-14 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                                <CreditCard className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cuenta Corriente</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Estado de cuenta de clientes</p>
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
                                    <span className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</span>
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
                                placeholder="Buscar cliente..."
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
                            <option value="positive">Saldo a Favor</option>
                            <option value="negative">En Deuda</option>
                            <option value="zero">Saldo Cero</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Accounts List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {filteredAccounts.length === 0 ? (
                    <div className="text-center py-16">
                        <CreditCard className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            No hay cuentas
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            {searchTerm || statusFilter !== 'all'
                                ? 'No se encontraron cuentas con los filtros aplicados'
                                : 'Las cuentas corrientes de clientes aparecerán aquí'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredAccounts.map((account, index) => (
                            <motion.div
                                key={account.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Building2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                    {account.company}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-600 dark:text-slate-400">Saldo:</span>
                                                <div className={`flex items-center gap-1 text-lg font-bold ${getBalanceColor(account.balance)}`}>
                                                    {getBalanceIcon(account.balance)}
                                                    <span>${Math.abs(account.balance).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Límite de Crédito</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                ${account.creditLimit.toLocaleString()}
                                            </p>
                                            <div className="mt-2">
                                                <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${Math.abs(account.balance) / account.creditLimit > 0.8
                                                            ? 'bg-red-500'
                                                            : Math.abs(account.balance) / account.creditLimit > 0.5
                                                                ? 'bg-amber-500'
                                                                : 'bg-green-500'
                                                            }`}
                                                        style={{ width: `${Math.min((Math.abs(account.balance) / account.creditLimit) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-blue-600" />
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Último Movimiento</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {new Date(account.lastMovement).toLocaleDateString('es-AR')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-purple-600" />
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Facturas Pendientes</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {account.pendingInvoices}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className={`w-4 h-4 ${account.overdueInvoices > 0 ? 'text-red-600' : 'text-slate-400'}`} />
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Facturas Vencidas</p>
                                                <p className={`text-sm font-semibold ${account.overdueInvoices > 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                                                    {account.overdueInvoices}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end">
                                            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-advanta-green to-green-600 text-white text-sm font-semibold hover:shadow-lg transition-all">
                                                Ver Detalle
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

export default CuentaCorriente;
