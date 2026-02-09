import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Search, Filter, TrendingUp, TrendingDown, DollarSign, Calendar, Building2, FileText, AlertCircle, X, Eye, Download, ExternalLink, Bell, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllClientBalances, getClientMovements } from '../services/cuentaCorrienteService';
import PDFPreviewModal from '../components/PDFPreviewModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAuth } from '../contexts/AuthContext';



const CuentaCorriente = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, positive, negative, zero
    const [accounts, setAccounts] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [clientMovements, setClientMovements] = useState([]);
    const [pdfPreview, setPdfPreview] = useState({ isOpen: false, comprobante: null });
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Load real client balances from comprobantes
    useEffect(() => {
        const loadBalances = () => {
            const balances = getAllClientBalances();
            setAccounts(balances);
        };

        loadBalances();
        // Reload every 5 seconds to catch new comprobantes
        const interval = setInterval(loadBalances, 5000);
        return () => clearInterval(interval);
    }, []);

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

    const handleOpenDetail = (account) => {
        setSelectedClient(account);
        const movements = getClientMovements(account.company);
        setClientMovements(movements);
        setShowDetailModal(true);
    };

    const handleOpenPDF = (movement, event) => {
        // Prevent row click event
        if (event) {
            event.stopPropagation();
        }

        console.log('Opening PDF for movement:', movement);

        // Find the full comprobante data
        const comprobantes = JSON.parse(localStorage.getItem('comprobantes') || '[]');
        console.log('Available comprobantes:', comprobantes.length);

        const comprobante = comprobantes.find(c => c.id === movement.id);
        console.log('Found comprobante:', comprobante);

        if (comprobante) {
            setPdfPreview({ isOpen: true, comprobante });
        } else {
            console.error('Comprobante not found for movement:', movement);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-24 xl:pb-8 xl:pt-14 relative">

            {/* Floating Action Buttons - Top Right */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2 md:right-8 xl:top-20">
                <button
                    onClick={() => navigate('/agenda')}
                    className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-md border border-slate-200 dark:border-slate-600 hover:scale-105"
                    title="Ir a Agenda"
                >
                    <Calendar className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                </button>
                <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-md border border-slate-200 dark:border-slate-600 hover:scale-105"
                    title="Notificaciones"
                >
                    <Bell className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                </button>
                <button
                    onClick={() => setLogoutModalOpen(true)}
                    className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center hover:bg-red-500 dark:hover:bg-red-600 hover:text-white transition-all shadow-md border border-slate-200 dark:border-slate-600 hover:scale-105 group"
                    title="Cerrar Sesión"
                >
                    <LogOut className="w-5 h-5 text-slate-700 dark:text-slate-200 group-hover:text-white" />
                </button>
            </div>

            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
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
                                            <button
                                                onClick={() => handleOpenDetail(account)}
                                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-advanta-green to-green-600 text-white text-sm font-semibold hover:shadow-lg transition-all"
                                            >
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

            {/* Detail Modal */}
            <AnimatePresence>
                {showDetailModal && selectedClient && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowDetailModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                            {selectedClient.company}
                                        </h2>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-600 dark:text-slate-400">Saldo:</span>
                                                <span className={`text-lg font-bold ${getBalanceColor(selectedClient.balance)}`}>
                                                    ${Math.abs(selectedClient.balance).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-600 dark:text-slate-400">Facturas Pendientes:</span>
                                                <span className="text-lg font-bold text-slate-900 dark:text-white">
                                                    {selectedClient.pendingInvoices}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowDetailModal(false)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Movements Table */}
                            <div className="flex-1 overflow-auto p-6">
                                {clientMovements.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                        <p className="text-slate-600 dark:text-slate-400">No hay movimientos registrados</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Fecha</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Tipo</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Número</th>
                                                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Monto</th>
                                                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Estado</th>
                                                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Saldo</th>
                                                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">PDF</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {clientMovements.map((movement) => {
                                                    const isOverdue = movement.status !== 'paid' &&
                                                        ((Date.now() - new Date(movement.date).getTime()) / (1000 * 60 * 60 * 24)) > 30;

                                                    return (
                                                        <tr
                                                            key={movement.id}
                                                            className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                                        >
                                                            <td className="py-3 px-4 text-sm text-slate-900 dark:text-white">
                                                                {new Date(movement.date).toLocaleDateString('es-AR')}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${movement.type === 'FACTURA'
                                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                                    }`}>
                                                                    {movement.type}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 text-sm font-mono text-slate-900 dark:text-white">
                                                                {movement.number}
                                                            </td>
                                                            <td className="py-3 px-4 text-sm font-semibold text-right text-slate-900 dark:text-white">
                                                                ${movement.amount.toLocaleString()}
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${movement.status === 'paid'
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                    : isOverdue
                                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                                                    }`}>
                                                                    {movement.status === 'paid' ? 'Pagado' : isOverdue ? 'Vencido' : 'Pendiente'}
                                                                </span>
                                                            </td>
                                                            <td className={`py-3 px-4 text-sm font-bold text-right ${getBalanceColor(movement.balance)}`}>
                                                                ${Math.abs(movement.balance).toLocaleString()}
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                {movement.pdf_url && (
                                                                    <button
                                                                        onClick={(e) => handleOpenPDF(movement, e)}
                                                                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors inline-flex items-center justify-center"
                                                                        title="Ver PDF"
                                                                    >
                                                                        <Eye className="w-4 h-4 text-advanta-green" />
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PDF Preview Modal */}
            <PDFPreviewModal
                isOpen={pdfPreview.isOpen}
                comprobante={pdfPreview.comprobante}
                onClose={() => setPdfPreview({ isOpen: false, comprobante: null })}
            />

            {/* Notifications Dropdown */}
            <AnimatePresence>
                {notificationsOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="fixed top-32 right-4 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[100]"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-100">Notificaciones</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Mantente al día con tu CRM</p>
                            </div>
                            <button
                                onClick={() => setNotificationsOpen(false)}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                        <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Cuenta Corriente actualizada</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Los saldos se actualizaron correctamente</p>
                                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 inline-block">Hace 2 min</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                                No hay más notificaciones
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Logout Confirmation Modal */}
            <ConfirmModal
                isOpen={logoutModalOpen}
                onClose={() => setLogoutModalOpen(false)}
                onConfirm={handleLogout}
                title="Cerrar Sesión"
                message="¿Estás seguro que deseas cerrar sesión? Tendrás que volver a iniciar sesión para acceder."
                confirmText="Cerrar Sesión"
                cancelText="Cancelar"
                type="danger"
            />
        </div>
    );
};

export default CuentaCorriente;
