import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, TrendingUp, DollarSign, CheckCircle, Clock, Edit2, ChevronDown, X } from 'lucide-react';
import { useOpportunities } from '../hooks/useOpportunities';
import { SimpleOpportunityModal } from '../components/opportunities/SimpleOpportunityModal';

const statusConfig = {
    iniciado: { label: 'Iniciado', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '🚀' },
    presupuestado: { label: 'Presupuestado', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '📋' },
    negociado: { label: 'Negociado', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '🤝' },
    ganado: { label: 'Ganado', color: 'bg-green-100 text-green-700 border-green-200', icon: '✅' },
    perdido: { label: 'Perdido', color: 'bg-red-100 text-red-700 border-red-200', icon: '❌' }
};

const Opportunities = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { opportunities, loading, createOpportunity, updateOpportunity } = useOpportunities();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [opportunityToEdit, setOpportunityToEdit] = useState(null);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);

    useEffect(() => {
        console.log('🟢 Opportunities component MOUNTED');
        return () => console.log('🔴 Opportunities component UNMOUNTED');
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statusDropdownOpen && !event.target.closest('.status-dropdown-container')) {
                setStatusDropdownOpen(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [statusDropdownOpen]);

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

    const handleEdit = (opportunity) => {
        setOpportunityToEdit(opportunity);
        setIsEditModalOpen(true);
    };

    const handleSaveOpportunity = async (opportunityData) => {
        if (opportunityToEdit) {
            await updateOpportunity(opportunityToEdit.id, opportunityData);
        } else {
            await createOpportunity(opportunityData);
        }
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setOpportunityToEdit(null);
    };

    const handleStatusChange = async (opportunityId, newStatus) => {
        await updateOpportunity(opportunityId, { status: newStatus });
        setStatusDropdownOpen(null);
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


            {/* Mobile: Cards (< xl) */}
            <div className="xl:hidden flex-1 overflow-y-auto pb-20 space-y-4">
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
                    filteredOpportunities.map(opportunity => {
                        const status = statusConfig[opportunity.status] || statusConfig.iniciado;
                        return (
                            <div
                                key={opportunity.id}
                                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 flex-1">
                                        {opportunity.opportunity_name || 'Sin nombre'}
                                    </h3>
                                    <div className="relative status-dropdown-container ml-2">
                                        <button
                                            onClick={() => setStatusDropdownOpen(statusDropdownOpen === opportunity.id ? null : opportunity.id)}
                                            className={`px-2 py-1 rounded-lg text-xs font-semibold border ${status.color} flex items-center gap-1 hover:opacity-80 transition-opacity`}
                                        >
                                            <span>{status.icon}</span>
                                            <span>{status.label}</span>
                                            <ChevronDown size={12} />
                                        </button>
                                        {statusDropdownOpen === opportunity.id && (
                                            <div className="absolute top-full right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[140px]">
                                                {Object.entries(statusConfig).map(([key, config]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => handleStatusChange(opportunity.id, key)}
                                                        className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${opportunity.status === key ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
                                                    >
                                                        <span>{config.icon}</span>
                                                        <span className={config.color.split(' ')[1]}>{config.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 mb-3">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        <span className="font-medium">Unidad de Negocio:</span> {opportunity.business_unit || 'N/A'}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        <span className="font-medium">Producto:</span> {opportunity.product || 'N/A'}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        <span className="font-medium">Monto:</span> <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(opportunity.amount || 0)}</span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all"
                                            style={{ width: `${opportunity.probability || 0}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 min-w-[35px]">
                                        {opportunity.probability || 0}%
                                    </span>
                                </div>

                                <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <button
                                        onClick={() => handleEdit(opportunity)}
                                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                                    >
                                        <Edit2 size={14} />
                                        <span>Editar</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Desktop: Table (>= xl) */}
            <div className="hidden xl:block flex-1 overflow-y-auto pb-20">
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
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Estado</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Oportunidad</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Unidad de Negocio</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Producto</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Monto</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Probabilidad</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Cierre</th>
                                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOpportunities.map((opp, index) => {
                                    const status = statusConfig[opp.status] || statusConfig.iniciado;
                                    const closeDate = opp.close_date ? new Date(opp.close_date) : null;

                                    return (
                                        <tr
                                            key={opp.id}
                                            className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'
                                                }`}
                                        >
                                            <td className="py-3 px-4">
                                                <div className="relative status-dropdown-container">
                                                    <button
                                                        onClick={() => setStatusDropdownOpen(statusDropdownOpen === opp.id ? null : opp.id)}
                                                        className={`px-2 py-1 rounded-lg text-xs font-semibold border ${status.color} flex items-center gap-1 w-fit hover:opacity-80 transition-opacity`}
                                                    >
                                                        <span>{status.icon}</span>
                                                        <span>{status.label}</span>
                                                        <ChevronDown size={12} />
                                                    </button>
                                                    {statusDropdownOpen === opp.id && (
                                                        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[140px]">
                                                            {Object.entries(statusConfig).map(([key, config]) => (
                                                                <button
                                                                    key={key}
                                                                    onClick={() => handleStatusChange(opp.id, key)}
                                                                    className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${opp.status === key ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
                                                                >
                                                                    <span>{config.icon}</span>
                                                                    <span className={config.color.split(' ')[1]}>{config.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                                                    {opp.opportunity_name || 'Sin nombre'}
                                                </p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                                    {opp.company?.trade_name || opp.company?.legal_name || 'N/A'}
                                                </p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    {opp.product_type || 'N/A'}
                                                </p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="font-semibold text-sm text-green-600 dark:text-green-400">
                                                    {formatCurrency(opp.amount || 0)}
                                                </p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden max-w-[80px]">
                                                        <div
                                                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all"
                                                            style={{ width: `${opp.probability || 0}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 min-w-[35px]">
                                                        {opp.probability || 0}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    {closeDate ? closeDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                </p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center">
                                                    <button
                                                        onClick={() => handleEdit(opp)}
                                                        className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={16} className="text-blue-600 dark:text-blue-400" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            <SimpleOpportunityModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleSaveOpportunity}
            />

            <SimpleOpportunityModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setOpportunityToEdit(null);
                }}
                onSave={handleSaveOpportunity}
                opportunity={opportunityToEdit}
            />
        </div>
    );
};

export default Opportunities;
// Force deployment Fri Feb  6 04:37:04 -03 2026
