import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, TrendingUp, DollarSign, CheckCircle, Clock, Edit2, Trash2, ChevronDown, X, Trophy, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOpportunities } from '../hooks/useOpportunities';
import { SimpleOpportunityModal } from '../components/opportunities/SimpleOpportunityModal';
import EditOpportunityModal from '../components/opportunities/EditOpportunityModal';
import { useToast } from '../contexts/ToastContext';

const stageConfig = {
    prospecting: { label: 'Prospección', probability: 10, dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700' },
    qualification: { label: 'Calificación', probability: 25, dot: 'bg-cyan-500', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700' },
    proposal: { label: 'Propuesta', probability: 50, dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700' },
    negotiation: { label: 'Negociación', probability: 75, dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700' },
    won: { label: 'Ganado', probability: 100, dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700' },
    lost: { label: 'Perdido', probability: 0, dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700' },
};

const Opportunities = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { opportunities, loading, createOpportunity, updateOpportunity, deleteOpportunity } = useOpportunities();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [opportunityToEdit, setOpportunityToEdit] = useState(null);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [opportunityToDelete, setOpportunityToDelete] = useState(null);

    const { showToast } = useToast();

    useEffect(() => {
        console.log('🟢 Opportunities component MOUNTED');
        return () => console.log('🔴 Opportunities component UNMOUNTED');
    }, []);

    // Listen for global opportunity creation event from Quick Actions
    useEffect(() => {
        const handleOpenModal = () => {
            console.log('📢 Received openOpportunityModal event');
            setIsCreateModalOpen(true);
        };

        window.addEventListener('openOpportunityModal', handleOpenModal);
        return () => window.removeEventListener('openOpportunityModal', handleOpenModal);
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

    const openDropdown = useCallback((e, oppId) => {
        e.stopPropagation();
        if (statusDropdownOpen === oppId) {
            setStatusDropdownOpen(null);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        setDropdownPosition({
            top: rect.bottom + 6,
            left: rect.left,
        });
        setStatusDropdownOpen(oppId);
    }, [statusDropdownOpen]);

    // Handle status change from dropdown
    const handleStatusChange = async (opportunityId, newStatus) => {
        try {
            console.log('🔄 Changing status:', { opportunityId, newStatus });

            const statusToProbability = {
                'prospecting': 10,
                'qualification': 25,
                'proposal': 50,
                'negotiation': 75,
                'won': 100,
                'lost': 0,
            };

            const probability = statusToProbability[newStatus] ?? 0;

            const result = await updateOpportunity(opportunityId, {
                status: newStatus,
                probability,
            });

            if (result.success) {
                setStatusDropdownOpen(null);
                console.log('✅ Status updated successfully');
            } else {
                throw new Error(result.error || 'Error al actualizar el estado');
            }
        } catch (err) {
            console.error('❌ Error changing status:', err);
        }
    };

    // Función para marcar como ganado
    const handleMarkAsWon = async (opportunity) => {
        try {
            const result = await updateOpportunity(opportunity.id, { status: 'won' });

            if (result.success) {
                if (result.data?.autoCreatedQuotation) {
                    showToast({
                        id: `won-${opportunity.id}-${Date.now()}`,
                        title: '✅ Oportunidad marcada como GANADA!',
                        description: `Se creó la cotización: ${result.data.autoCreatedQuotation.quotationNumber}\n💰 Total: $${result.data.autoCreatedQuotation.total.toLocaleString('es-AR')}\n\nPuedes verla en el módulo "Cotizaciones"`,
                        priority: 'high',
                        timeAgo: 'Ahora',
                    });
                } else if (result.data?.existingQuotation) {
                    showToast({
                        id: `won-existing-${opportunity.id}-${Date.now()}`,
                        title: '✅ Oportunidad marcada como GANADA!',
                        description: `Ya existe una cotización para esta oportunidad: ${result.data.existingQuotation.quotation_number}`,
                        priority: 'medium',
                        timeAgo: 'Ahora',
                    });
                } else {
                    showToast({
                        id: `won-${opportunity.id}-${Date.now()}`,
                        title: '✅ Oportunidad marcada como GANADA!',
                        description: 'La oportunidad se actualizó correctamente.',
                        priority: 'medium',
                        timeAgo: 'Ahora',
                    });
                }
            } else {
                throw new Error(result.error || 'Error al actualizar la oportunidad');
            }
        } catch (error) {
            console.error('Error marking opportunity as won:', error);
            showToast({
                id: `error-${opportunity.id}-${Date.now()}`,
                title: '❌ Error',
                description: `No se pudo marcar la oportunidad como ganada: ${error.message}`,
                priority: 'high',
                timeAgo: 'Ahora',
            });
        }
    };

    // Función para eliminar oportunidad con confirmación
    const handleDeleteOpportunity = async () => {
        if (!opportunityToDelete) return;

        const result = await deleteOpportunity(opportunityToDelete.id);

        if (!result.success) {
            showToast({
                id: `error-delete-${opportunityToDelete.id}-${Date.now()}`,
                title: '❌ Error',
                description: result.error || 'No se pudo eliminar la oportunidad',
                priority: 'high',
                icon: XCircle,
                timeAgo: 'Ahora',
            });
            setDeleteConfirmOpen(false);
            setOpportunityToDelete(null);
            return;
        }

        showToast({
            id: `delete-${opportunityToDelete.id}-${Date.now()}`,
            title: '✅ Oportunidad Eliminada',
            description: `La oportunidad "${opportunityToDelete.opportunity_name || opportunityToDelete.title}" fue eliminada correctamente`,
            priority: 'high',
            icon: CheckCircle,
            timeAgo: 'Ahora',
        });

        setDeleteConfirmOpen(false);
        setOpportunityToDelete(null);
    };

    // Filter opportunities
    const filteredOpportunities = useMemo(() => {
        return opportunities.filter(opp =>
            (opp.title || opp.opportunity_name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [opportunities, searchTerm]);

    // Calculate stats
    const stats = useMemo(() => ({
        total: opportunities.length,
        totalAmount: opportunities.reduce((sum, opp) => sum + (opp.estimatedValue || opp.amount || 0), 0),
        won: opportunities.filter(opp => opp.status === 'won' || opp.status === 'ganado').length,
        inProgress: opportunities.filter(opp => ['prospecting', 'qualification', 'proposal', 'negotiation', 'iniciado', 'presupuestado', 'negociado'].includes(opp.status)).length,
    }), [opportunities]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleEdit = (opportunity) => {
        console.log('🔍 Opportunities - Editing opportunity:', opportunity);
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

    return (
        <div className="h-full flex flex-col gap-6 p-4 md:p-6 xl:px-6 xl:pt-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4">
                <div className="text-center w-full md:w-auto md:text-left">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Oportunidades</h1>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm w-full md:w-auto">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex-1 md:w-80 border border-slate-100 dark:border-slate-600 focus-within:ring-2 ring-advanta-green/10 dark:ring-red-500/20 transition-all">
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
                        className="px-4 py-2.5 bg-gradient-to-r from-[#44C12B] to-[#4BA323] hover:from-[#3a9120] hover:to-[#3d8a1f] text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95"
                    >
                        <Plus size={18} />
                        <span className="hidden md:inline">Nuevo</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
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
                        const status = stageConfig[opportunity.status] || stageConfig.prospecting;
                        const isWon = opportunity.status === 'won' || opportunity.status === 'ganado';
                        const isLost = opportunity.status === 'lost' || opportunity.status === 'perdido';
                        const canMarkAsWon = !isWon && !isLost && (opportunity.probability || 0) > 60;
                        return (
                            <div
                                key={opportunity.id}
                                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 flex-1">
                                        {opportunity.opportunity_name || opportunity.title || 'Sin nombre'}
                                    </h3>
                                    <div className="relative status-dropdown-container ml-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setStatusDropdownOpen(statusDropdownOpen === opportunity.id ? null : opportunity.id);
                                            }}
                                            className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 hover:opacity-80 transition-opacity ${status.badge}`}
                                        >
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status.dot}`} />
                                            <span>{status.label}</span>
                                            <span className="opacity-60">· {status.probability}%</span>
                                            <ChevronDown size={11} className="opacity-60" />
                                        </button>
                                        {statusDropdownOpen === opportunity.id && (
                                            <div className="absolute top-full right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[100] min-w-[180px] overflow-hidden">
                                                {Object.entries(stageConfig).map(([key, config]) => (
                                                    <button
                                                        key={key}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatusChange(opportunity.id, key);
                                                        }}
                                                        className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${opportunity.status === key ? 'bg-slate-100 dark:bg-slate-700' : ''
                                                            }`}
                                                    >
                                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
                                                        <span className="flex-1 text-slate-700 dark:text-slate-300">{config.label}</span>
                                                        <span className="text-slate-400 dark:text-slate-500 font-normal">{config.probability}%</span>
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

                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                    {canMarkAsWon && (
                                        <button
                                            onClick={() => handleMarkAsWon(opportunity)}
                                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-1 shadow-sm"
                                            title="Marcar como Ganado"
                                        >
                                            <Trophy size={14} />
                                            <span>Ganado</span>
                                        </button>
                                    )}
                                    {isWon && (
                                        <span className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-bold flex items-center gap-1">
                                            <Trophy size={14} />
                                            <span>GANADA</span>
                                        </span>
                                    )}
                                    {!isWon && (
                                        <>
                                            <button
                                                onClick={() => handleEdit(opportunity)}
                                                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                                            >
                                                <Edit2 size={14} />
                                                <span>Editar</span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpportunityToDelete(opportunity);
                                                    setDeleteConfirmOpen(true);
                                                }}
                                                className="px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
                                            >
                                                <Trash2 size={14} />
                                                <span>Eliminar</span>
                                            </button>
                                        </>
                                    )}
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
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-visible">
                        <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
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
                            <tbody className="overflow-visible">
                                {filteredOpportunities.map((opp, index) => {
                                    const status = stageConfig[opp.status] || stageConfig.prospecting;
                                    const closeDate = opp.expectedCloseDate || opp.close_date;
                                    const parsedDate = closeDate ? new Date(closeDate) : null;
                                    const isWon = opp.status === 'won' || opp.status === 'ganado';
                                    const isLost = opp.status === 'lost' || opp.status === 'perdido';
                                    const canMarkAsWon = !isWon && !isLost && (opp.probability || 0) > 60;

                                    return (
                                        <tr
                                            key={opp.id}
                                            className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'}`}
                                        >
                                            <td className="py-3 px-4" style={{ position: 'relative', overflow: 'visible' }}>
                                                <div className="status-dropdown-container">
                                                    <button
                                                        onClick={(e) => openDropdown(e, opp.id)}
                                                        className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 hover:opacity-80 transition-all w-fit ${status.badge}`}
                                                    >
                                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status.dot}`} />
                                                        <span>{status.label}</span>
                                                        <span className="opacity-60">· {status.probability}%</span>
                                                        <ChevronDown size={11} className="opacity-60" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                                                    {opp.title || opp.opportunity_name || 'Sin nombre'}
                                                </p>
                                                {opp.description && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                                        {opp.description}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                                    {opp.clientName || opp.company?.trade_name || opp.company?.legal_name || 'N/A'}
                                                </p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    {opp.products ? `${opp.products.length} producto(s)` : (opp.product_type || 'N/A')}
                                                </p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="font-semibold text-sm text-green-600 dark:text-green-400">
                                                    {formatCurrency(opp.estimatedValue || opp.amount || 0)}
                                                </p>
                                            </td>
                                            <td className="py-3 px-4">
                                                {/* Barra de progreso visual (read-only) - refleja el status actual */}
                                                {(() => {
                                                    const prob = opp.probability || 0;
                                                    const barColor = prob >= 80 ? 'from-emerald-400 to-emerald-600'
                                                        : prob >= 60 ? 'from-blue-400 to-blue-600'
                                                            : prob >= 40 ? 'from-amber-400 to-amber-500'
                                                                : prob >= 20 ? 'from-orange-400 to-orange-500'
                                                                    : 'from-slate-300 to-slate-400';
                                                    return (
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 min-w-[80px] overflow-hidden">
                                                                <div
                                                                    className={`bg-gradient-to-r ${barColor} h-full rounded-full transition-all duration-500`}
                                                                    style={{ width: `${prob}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[35px] text-right">
                                                                {prob}%
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    {parsedDate ? parsedDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                </p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    {canMarkAsWon && (
                                                        <button
                                                            onClick={() => handleMarkAsWon(opp)}
                                                            className="px-2 py-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm hover:shadow-md"
                                                            title="Marcar como Ganado"
                                                        >
                                                            <Trophy size={14} />
                                                            <span>GANADO</span>
                                                        </button>
                                                    )}
                                                    {isWon && (
                                                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1">
                                                            <Trophy size={14} />
                                                            <span>GANADA</span>
                                                        </span>
                                                    )}
                                                    {!isWon && (
                                                        <button
                                                            onClick={() => handleEdit(opp)}
                                                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={16} className="text-blue-600 dark:text-blue-400" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpportunityToDelete(opp);
                                                            setDeleteConfirmOpen(true);
                                                        }}
                                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} className="text-red-600 dark:text-red-400" />
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

            <EditOpportunityModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setOpportunityToEdit(null);
                }}
                onSave={handleSaveOpportunity}
                opportunity={opportunityToEdit}
            />

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => {
                            setDeleteConfirmOpen(false);
                            setOpportunityToDelete(null);
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                                        Eliminar Oportunidad
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        ¿Estás seguro de eliminar la oportunidad <span className="font-semibold">"{opportunityToDelete?.opportunity_name || opportunityToDelete?.title}"</span>? Esta acción no se puede deshacer.
                                    </p>
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => {
                                                setDeleteConfirmOpen(false);
                                                setOpportunityToDelete(null);
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleDeleteOpportunity}
                                            className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <Trash2 size={16} />
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fixed dropdown portal - immune to parent overflow:hidden/auto */}
            {statusDropdownOpen && (() => {
                const oppId = statusDropdownOpen;
                const opp = filteredOpportunities.find(o => o.id === oppId);
                if (!opp) return null;
                return (
                    <div
                        className="status-dropdown-container"
                        style={{
                            position: 'fixed',
                            top: dropdownPosition.top,
                            left: dropdownPosition.left,
                            zIndex: 99999,
                        }}
                    >
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl min-w-[190px] overflow-hidden">
                            {Object.entries(stageConfig).map(([key, config]) => (
                                <button
                                    key={key}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(opp.id, key);
                                    }}
                                    className={`w-full px-3 py-2.5 text-left text-xs font-semibold flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${opp.status === key ? 'bg-slate-100 dark:bg-slate-700' : ''
                                        }`}
                                >
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
                                    <span className="flex-1 text-slate-700 dark:text-slate-300">{config.label}</span>
                                    <span className="text-slate-400 dark:text-slate-500 font-normal">{config.probability}%</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            })()}

        </div>
    );
};

export default Opportunities;
