import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, TrendingUp, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import OpportunityCard from '../components/opportunities/OpportunityCard';
import CreateOpportunityModal from '../components/opportunities/CreateOpportunityModal';
import { useOpportunities } from '../hooks/useOpportunities';

export default function Opportunities() {
    const { opportunities, loading, createOpportunity, updateOpportunity } = useOpportunities();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOpportunity, setSelectedOpportunity] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);


    // Listen for custom event from Quick Actions
    useEffect(() => {
        const handleOpenModal = () => {
            setIsCreateModalOpen(true);
        };

        window.addEventListener('openOpportunityModal', handleOpenModal);

        return () => {
            window.removeEventListener('openOpportunityModal', handleOpenModal);
        };
    }, []);


    // Filter opportunities
    const filteredOpportunities = opportunities.filter(opp => {
        const matchesSearch = (opp.opportunity_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (opp.company_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (opp.product_type?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || opp.status === statusFilter;
        return matchesSearch && matchesStatus;
    });


    // Calculate stats
    const stats = {
        total: opportunities.length,
        totalAmount: opportunities.reduce((sum, opp) => sum + opp.amount, 0),
        won: opportunities.filter(opp => opp.status === 'ganado').length,
        wonAmount: opportunities.filter(opp => opp.status === 'ganado').reduce((sum, opp) => sum + opp.amount, 0),
        lost: opportunities.filter(opp => opp.status === 'perdido').length,
        inProgress: opportunities.filter(opp => ['iniciado', 'presupuestado', 'negociado'].includes(opp.status)).length,
        avgProbability: Math.round(opportunities.reduce((sum, opp) => sum + opp.probability, 0) / opportunities.length)
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-red to-red-600 text-white p-6 pb-8">
                <h1 className="text-2xl font-bold mb-2">Oportunidades</h1>
                <p className="text-red-100 text-sm">Gestiona tu pipeline de ventas</p>
            </div>

            {/* Stats Cards */}
            <div className="px-4 -mt-4 mb-6">
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Total Opportunities */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <TrendingUp size={16} className="text-blue-600" />
                            </div>
                            <span className="text-xs text-slate-600 font-medium">Total</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                        <p className="text-xs text-slate-500 mt-1">{formatCurrency(stats.totalAmount)}</p>
                    </div>

                    {/* Won */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                <CheckCircle size={16} className="text-green-600" />
                            </div>
                            <span className="text-xs text-slate-600 font-medium">Ganadas</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{stats.won}</p>
                        <p className="text-xs text-slate-500 mt-1">{formatCurrency(stats.wonAmount)}</p>
                    </div>

                    {/* In Progress */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                <Clock size={16} className="text-orange-600" />
                            </div>
                            <span className="text-xs text-slate-600 font-medium">En Proceso</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
                        <p className="text-xs text-slate-500 mt-1">{stats.avgProbability}% prob. promedio</p>
                    </div>

                    {/* Lost */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                <XCircle size={16} className="text-red-600" />
                            </div>
                            <span className="text-xs text-slate-600 font-medium">Perdidas</span>
                        </div>
                        <p className="text-2xl font-bold text-red-600">{stats.lost}</p>
                        <p className="text-xs text-slate-500 mt-1">Seguimiento activo</p>
                    </div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="px-4 mb-6">
                {/* Search Bar */}
                <div className="relative mb-3">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar oportunidades..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 focus:border-brand-red focus:ring-2 focus:ring-red-100 outline-none transition-all bg-white"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${statusFilter === 'all'
                            ? 'bg-brand-red text-white shadow-md'
                            : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                    >
                        Todas ({opportunities.length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('iniciado')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${statusFilter === 'iniciado'
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                    >
                        🚀 Iniciado
                    </button>
                    <button
                        onClick={() => setStatusFilter('presupuestado')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${statusFilter === 'presupuestado'
                            ? 'bg-yellow-500 text-white shadow-md'
                            : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                    >
                        📋 Presupuestado
                    </button>
                    <button
                        onClick={() => setStatusFilter('negociado')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${statusFilter === 'negociado'
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                    >
                        🤝 Negociado
                    </button>
                    <button
                        onClick={() => setStatusFilter('ganado')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${statusFilter === 'ganado'
                            ? 'bg-green-500 text-white shadow-md'
                            : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                    >
                        ✅ Ganado
                    </button>
                    <button
                        onClick={() => setStatusFilter('perdido')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${statusFilter === 'perdido'
                            ? 'bg-red-500 text-white shadow-md'
                            : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                    >
                        ❌ Perdido
                    </button>
                </div>
            </div>

            {/* Opportunities List */}
            <div className="px-4">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-slate-400">Cargando oportunidades...</div>
                    </div>
                ) : filteredOpportunities.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp size={32} className="text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">No se encontraron oportunidades</p>
                        <p className="text-slate-400 text-sm mt-1">Intenta con otros filtros</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOpportunities.map(opportunity => (
                            <OpportunityCard
                                key={opportunity.id}
                                opportunity={opportunity}
                                onClick={() => setSelectedOpportunity(opportunity)}
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
        </div>
    );
}
