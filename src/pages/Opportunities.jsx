import React, { useState, useMemo } from 'react';
import { Search, Plus, TrendingUp, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { useOpportunities } from '../hooks/useOpportunities';

const Opportunities = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { opportunities, loading } = useOpportunities();

    // Filter opportunities
    const filteredOpportunities = useMemo(() => {
        return opportunities.filter(opp =>
            (opp.opportunity_name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [opportunities, searchTerm]);

    // Calculate stats
    const stats = useMemo(() => ({
        total: opportunities.length,
        totalAmount: opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0),
        won: opportunities.filter(opp => opp.status === 'ganado').length,
        inProgress: opportunities.filter(opp => ['iniciado', 'presupuestado', 'negociado'].includes(opp.status)).length,
    }), [opportunities]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="h-full flex flex-col gap-6 p-4 md:p-6 xl:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4">
                <div className="text-center w-full md:w-auto md:text-left">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Oportunidades</h1>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm w-full md:w-auto">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex-1 md:w-80 border border-slate-100 dark:border-slate-600 focus-within:ring-2 ring-brand-red/10 dark:ring-red-500/20 transition-all">
                        <Search size={20} className="text-slate-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar oportunidades..."
                            className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        className="px-4 py-2.5 bg-gradient-to-r from-[#E76E53] to-red-600 hover:from-[#D55E43] hover:to-red-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95"
                    >
                        <Plus size={18} />
                        <span className="hidden md:inline">Nuevo</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards - Compact */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <TrendingUp size={14} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Total</span>
                    </div>
                    <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatCurrency(stats.totalAmount)}</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Ganadas</span>
                    </div>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.won}</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Clock size={14} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">En Proceso</span>
                    </div>
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{stats.inProgress}</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <DollarSign size={14} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Promedio</span>
                    </div>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {stats.total > 0 ? formatCurrency(stats.totalAmount / stats.total) : '$0'}
                    </p>
                </div>
            </div>

            {/* Opportunities List */}
            <div className="flex-1 overflow-y-auto pb-20">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-slate-400 dark:text-slate-500">Cargando oportunidades...</div>
                    </div>
                ) : filteredOpportunities.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp size={32} className="text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No se encontraron oportunidades</p>
                        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Crea tu primera oportunidad</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOpportunities.map(opportunity => (
                            <div
                                key={opportunity.id}
                                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100">
                                        {opportunity.opportunity_name || 'Sin nombre'}
                                    </h3>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${opportunity.status === 'ganado' ? 'bg-green-100 text-green-700' :
                                            opportunity.status === 'perdido' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                                        }`}>
                                        {opportunity.status || 'iniciado'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    Monto: {formatCurrency(opportunity.amount || 0)}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-500">
                                    Probabilidad: {opportunity.probability || 0}%
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Opportunities;
