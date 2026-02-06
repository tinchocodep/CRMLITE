import React, { useState, useMemo } from 'react';
import { Search, Plus, TrendingUp, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import OpportunityCard from '../components/opportunities/OpportunityCard';
import CreateOpportunityModal from '../components/opportunities/CreateOpportunityModal';
import EditOpportunityModal from '../components/opportunities/EditOpportunityModal';
import { useOpportunities } from '../hooks/useOpportunities';

export default function Opportunities() {
    const { opportunities, loading, createOpportunity, updateOpportunity } = useOpportunities();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [opportunityToEdit, setOpportunityToEdit] = useState(null);

    // Filter opportunities
    const filteredOpportunities = useMemo(() => {
        return opportunities.filter(opp => {
            const matchesSearch = (opp.opportunity_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (opp.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (opp.product_type || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || opp.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [opportunities, searchTerm, statusFilter]);

    // Calculate stats
    const stats = useMemo(() => ({
        total: opportunities.length,
        totalAmount: opportunities.reduce((sum, opp) => sum + opp.amount, 0),
        won: opportunities.filter(opp => opp.status === 'ganado').length,
        wonAmount: opportunities.filter(opp => opp.status === 'ganado').reduce((sum, opp) => sum + opp.amount, 0),
        lost: opportunities.filter(opp => opp.status === 'perdido').length,
        inProgress: opportunities.filter(opp => ['iniciado', 'presupuestado', 'negociado'].includes(opp.status)).length,
        avgProbability: opportunities.length > 0 ? Math.round(opportunities.reduce((sum, opp) => sum + opp.probability, 0) / opportunities.length) : 0
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
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2.5 bg-gradient-to-r from-[#E76E53] to-red-600 hover:from-[#D55E43] hover:to-red-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95"
                    >
                        <Plus size={18} />
                        <span className="hidden md:inline">Nuevo</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards - More Compact */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Total Opportunities */}
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

                {/* Won */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Ganadas</span>
                    </div>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.won}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatCurrency(stats.wonAmount)}</p>
                </div>

                {/* In Progress */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Clock size={14} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">En Proceso</span>
                    </div>
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{stats.inProgress}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stats.avgProbability}% prob.</p>
                </div>

                {/* Lost */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <XCircle size={14} className="text-red-600 dark:text-red-400" />
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Perdidas</span>
                    </div>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.lost}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Seguimiento</p>
                </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${statusFilter === 'all'
                        ? 'bg-gradient-to-r from-[#E76E53] to-red-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                >
                    Todas ({opportunities.length})
                </button>
                <button
                    onClick={() => setStatusFilter('iniciado')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${statusFilter === 'iniciado'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                >
                    🚀 Iniciado
                </button>
                <button
                    onClick={() => setStatusFilter('presupuestado')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${statusFilter === 'presupuestado'
                        ? 'bg-yellow-500 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                >
                    📋 Presupuestado
                </button>
                <button
                    onClick={() => setStatusFilter('negociado')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${statusFilter === 'negociado'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                >
                    🤝 Negociado
                </button>
                <button
                    onClick={() => setStatusFilter('ganado')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${statusFilter === 'ganado'
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                >
                    ✅ Ganado
                </button>
                <button
                    onClick={() => setStatusFilter('perdido')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${statusFilter === 'perdido'
                        ? 'bg-red-500 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                >
                    ❌ Perdido
                </button>
            </div>

            {/* Opportunities List */}
            <div className="flex-1 overflow-y-auto">
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
                        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Intenta con otros filtros</p>
                    </div>
                ) : (
                    <div className="space-y-4 pb-20">
                        {filteredOpportunities.map(opportunity => (
                            <OpportunityCard
                                key={opportunity.id}
                                opportunity={opportunity}
                                onClick={() => {
                                    setOpportunityToEdit(opportunity);
                                    setIsEditModalOpen(true);
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create Opportunity Modal */}
            <CreateOpportunityModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={async (newOpportunity) => {
                    const result = await createOpportunity(newOpportunity);
                    if (result.success) {
                        setIsCreateModalOpen(false);
                    } else {
                        alert('Error al crear oportunidad: ' + result.error);
                    }
                }}
            />

            {/* Edit Opportunity Modal */}
            <EditOpportunityModal
                isOpen={isEditModalOpen}
                opportunity={opportunityToEdit}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setOpportunityToEdit(null);
                }}
                onSave={async (id, updates) => {
                    const result = await updateOpportunity(id, updates);
                    if (result.success) {
                        setIsEditModalOpen(false);
                        setOpportunityToEdit(null);
                    } else {
                        alert('Error al actualizar oportunidad: ' + result.error);
                    }
                }}
            />
        </div>
    );
}
