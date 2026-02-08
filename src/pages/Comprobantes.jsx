import React, { useState } from 'react';
import { Receipt, Search, Filter, Plus, Eye, Download, DollarSign, Calendar, Building2, FileText, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Comprobantes = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // all, invoice, credit_note, debit_note
    const [statusFilter, setStatusFilter] = useState('all'); // all, paid, pending, cancelled

    // Mock data - esto se conectará con Supabase
    const [vouchers, setVouchers] = useState([
        {
            id: 1,
            voucherNumber: 'FC-A-0001-00000123',
            type: 'invoice',
            company: 'Agro San Juan S.A.',
            status: 'paid',
            amount: 125000,
            issueDate: '2026-02-01',
            dueDate: '2026-02-15',
            paymentDate: '2026-02-10',
            orderNumber: 'PED-001'
        },
        {
            id: 2,
            voucherNumber: 'FC-A-0001-00000124',
            type: 'invoice',
            company: 'Estancia La Pampa',
            status: 'pending',
            amount: 89500,
            issueDate: '2026-02-05',
            dueDate: '2026-02-20',
            paymentDate: null,
            orderNumber: 'PED-002'
        },
        {
            id: 3,
            voucherNumber: 'NC-A-0001-00000001',
            type: 'credit_note',
            company: 'Campo Verde S.R.L.',
            status: 'paid',
            amount: -15000,
            issueDate: '2026-02-03',
            dueDate: null,
            paymentDate: '2026-02-03',
            orderNumber: null
        },
        {
            id: 4,
            voucherNumber: 'FC-A-0001-00000125',
            type: 'invoice',
            company: 'Agroindustrias del Sur',
            status: 'pending',
            amount: 67800,
            issueDate: '2026-02-07',
            dueDate: '2026-02-22',
            paymentDate: null,
            orderNumber: 'PED-004'
        },
        {
            id: 5,
            voucherNumber: 'FC-A-0001-00000126',
            type: 'invoice',
            company: 'Semillas del Norte',
            status: 'paid',
            amount: 178500,
            issueDate: '2026-02-04',
            dueDate: '2026-02-19',
            paymentDate: '2026-02-12',
            orderNumber: 'PED-005'
        },
        {
            id: 6,
            voucherNumber: 'ND-A-0001-00000001',
            type: 'debit_note',
            company: 'Agro San Juan S.A.',
            status: 'pending',
            amount: 5000,
            issueDate: '2026-02-06',
            dueDate: '2026-02-21',
            paymentDate: null,
            orderNumber: null
        }
    ]);

    const stats = [
        {
            label: 'Total Comprobantes',
            value: vouchers.length,
            icon: Receipt,
            color: 'from-purple-500 to-purple-600',
            textColor: 'text-purple-600'
        },
        {
            label: 'Facturas',
            value: vouchers.filter(v => v.type === 'invoice').length,
            icon: FileText,
            color: 'from-blue-500 to-blue-600',
            textColor: 'text-blue-600'
        },
        {
            label: 'Pagados',
            value: vouchers.filter(v => v.status === 'paid').length,
            icon: CheckCircle,
            color: 'from-green-500 to-green-600',
            textColor: 'text-green-600'
        },
        {
            label: 'Pendientes',
            value: vouchers.filter(v => v.status === 'pending').length,
            icon: XCircle,
            color: 'from-amber-500 to-amber-600',
            textColor: 'text-amber-600'
        }
    ];

    const getTypeBadge = (type) => {
        const typeConfig = {
            invoice: { label: 'Factura', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            credit_note: { label: 'Nota Crédito', color: 'bg-green-100 text-green-700 border-green-200' },
            debit_note: { label: 'Nota Débito', color: 'bg-red-100 text-red-700 border-red-200' }
        };

        const config = typeConfig[type] || typeConfig.invoice;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            paid: { label: 'Pagado', color: 'bg-green-100 text-green-700 border-green-200' },
            pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
            cancelled: { label: 'Anulado', color: 'bg-red-100 text-red-700 border-red-200' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const filteredVouchers = vouchers.filter(voucher => {
        const matchesSearch = voucher.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            voucher.voucherNumber?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = typeFilter === 'all' || voucher.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || voucher.status === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-24 xl:pb-8">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 xl:top-14 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <Receipt className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Comprobantes</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Facturas, notas de crédito y débito</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-advanta-green to-green-600 text-white rounded-lg hover:shadow-lg transition-all">
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Nuevo Comprobante</span>
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
                                placeholder="Buscar comprobante..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-advanta-green focus:border-transparent"
                            />
                        </div>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-advanta-green focus:border-transparent"
                        >
                            <option value="all">Todos los tipos</option>
                            <option value="invoice">Facturas</option>
                            <option value="credit_note">Notas de Crédito</option>
                            <option value="debit_note">Notas de Débito</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-advanta-green focus:border-transparent"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="paid">Pagados</option>
                            <option value="pending">Pendientes</option>
                            <option value="cancelled">Anulados</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Vouchers List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {filteredVouchers.length === 0 ? (
                    <div className="text-center py-16">
                        <Receipt className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            No hay comprobantes
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                                ? 'No se encontraron comprobantes con los filtros aplicados'
                                : 'Los comprobantes emitidos aparecerán aquí'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredVouchers.map((voucher, index) => (
                            <motion.div
                                key={voucher.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                                                    {voucher.voucherNumber}
                                                </h3>
                                                {getTypeBadge(voucher.type)}
                                                {getStatusBadge(voucher.status)}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Building2 className="w-4 h-4" />
                                                <span>{voucher.company}</span>
                                            </div>
                                            {voucher.orderNumber && (
                                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500 mt-1">
                                                    <FileText className="w-3 h-3" />
                                                    <span>Pedido: {voucher.orderNumber}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors">
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors">
                                                <Download className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className={`w-4 h-4 ${voucher.amount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Monto</p>
                                                <p className={`text-sm font-semibold ${voucher.amount >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-600'}`}>
                                                    ${Math.abs(voucher.amount).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-blue-600" />
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Emisión</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {new Date(voucher.issueDate).toLocaleDateString('es-AR')}
                                                </p>
                                            </div>
                                        </div>
                                        {voucher.dueDate && (
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-amber-600" />
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Vencimiento</p>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        {new Date(voucher.dueDate).toLocaleDateString('es-AR')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {voucher.paymentDate && (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Pago</p>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        {new Date(voucher.paymentDate).toLocaleDateString('es-AR')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
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

export default Comprobantes;
