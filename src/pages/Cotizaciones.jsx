import React, { useState } from 'react';
import { FileText, Search, Filter, Plus, Edit2, Eye, Send, CheckCircle, Clock, DollarSign, Calendar, Building2 } from 'lucide-react';
import { useOpportunities } from '../hooks/useOpportunities';
import { motion, AnimatePresence } from 'framer-motion';

const Cotizaciones = () => {
    const { opportunities, loading } = useOpportunities();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, draft, sent, approved

    // Filter only won opportunities
    const wonOpportunities = opportunities.filter(opp => opp.status === 'won');

    // Apply filters
    const filteredQuotations = wonOpportunities.filter(opp => {
        const matchesSearch = opp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            opp.company_name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || opp.quotation_status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const stats = [
        {
            label: 'Total Cotizaciones',
            value: wonOpportunities.length,
            icon: FileText,
            color: 'from-blue-500 to-blue-600',
            textColor: 'text-blue-600'
        },
        {
            label: 'Borradores',
            value: wonOpportunities.filter(o => !o.quotation_status || o.quotation_status === 'draft').length,
            icon: Edit2,
            color: 'from-amber-500 to-amber-600',
            textColor: 'text-amber-600'
        },
        {
            label: 'Enviadas',
            value: wonOpportunities.filter(o => o.quotation_status === 'sent').length,
            icon: Send,
            color: 'from-purple-500 to-purple-600',
            textColor: 'text-purple-600'
        },
        {
            label: 'Aprobadas',
            value: wonOpportunities.filter(o => o.quotation_status === 'approved').length,
            icon: CheckCircle,
            color: 'from-green-500 to-green-600',
            textColor: 'text-green-600'
        }
    ];

    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { label: 'Borrador', color: 'bg-amber-100 text-amber-700 border-amber-200' },
            sent: { label: 'Enviada', color: 'bg-purple-100 text-purple-700 border-purple-200' },
            approved: { label: 'Aprobada', color: 'bg-green-100 text-green-700 border-green-200' }
        };

        const config = statusConfig[status] || statusConfig.draft;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
                {config.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-advanta-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Cargando cotizaciones...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-24 xl:pb-8">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cotizaciones</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Oportunidades ganadas convertidas en cotizaciones</p>
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
                                placeholder="Buscar cotización..."
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
                            <option value="draft">Borradores</option>
                            <option value="sent">Enviadas</option>
                            <option value="approved">Aprobadas</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Quotations List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {filteredQuotations.length === 0 ? (
                    <div className="text-center py-16">
                        <FileText className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            No hay cotizaciones
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            {searchTerm || statusFilter !== 'all'
                                ? 'No se encontraron cotizaciones con los filtros aplicados'
                                : 'Las oportunidades ganadas aparecerán aquí como cotizaciones'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredQuotations.map((quotation, index) => (
                            <motion.div
                                key={quotation.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                    {quotation.title}
                                                </h3>
                                                {getStatusBadge(quotation.quotation_status || 'draft')}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Building2 className="w-4 h-4" />
                                                <span>{quotation.company_name || 'Sin empresa'}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors">
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors">
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-green-600" />
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Valor</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    ${quotation.value?.toLocaleString() || '0'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-blue-600" />
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Fecha Cierre</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {quotation.expected_close_date
                                                        ? new Date(quotation.expected_close_date).toLocaleDateString('es-AR')
                                                        : 'Sin fecha'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-amber-600" />
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Validez</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    30 días
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-purple-600" />
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Nº Cotización</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    COT-{quotation.id?.toString().slice(0, 6)}
                                                </p>
                                            </div>
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

export default Cotizaciones;
