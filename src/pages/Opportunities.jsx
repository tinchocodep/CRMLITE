import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, TrendingUp, DollarSign, CheckCircle, Clock, Edit2, Trash2, ChevronDown, X, Trophy } from 'lucide-react';
import { useOpportunities } from '../hooks/useOpportunities';
import { SimpleOpportunityModal } from '../components/opportunities/SimpleOpportunityModal';
import EditOpportunityModal from '../components/opportunities/EditOpportunityModal';
import { opportunities as mockOpportunities } from '../data/opportunities';
import { useToast } from '../contexts/ToastContext';
import { useNotifications } from '../hooks/useNotifications';

const stageConfig = {
    // Estados del Cotizador
    prospecting: { label: 'Prospección', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: '🔍' },
    qualification: { label: 'Calificación', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: '📊' },
    proposal: { label: 'Propuesta', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '📝' },
    negotiation: { label: 'Negociación', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '💼' },
    won: { label: 'Ganado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '🏆' },
    lost: { label: 'Perdido', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: '❌' }
};

const Opportunities = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { opportunities, loading, createOpportunity, updateOpportunity, deleteOpportunity } = useOpportunities();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [opportunityToEdit, setOpportunityToEdit] = useState(null);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);
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

    // Función para marcar como ganado y crear cotización
    const handleMarkAsWon = async (opportunity) => {
        try {
            // Update opportunity status to 'won' - this will trigger auto-quotation creation in useOpportunities
            const result = await updateOpportunity(opportunity.id, { status: 'won' });

            if (result.success) {
                // Show success notification
                if (result.data.autoCreatedQuotation) {
                    addNotification({
                        id: `won - ${opportunity.id} -${Date.now()} `,
                        title: '✅ Oportunidad marcada como GANADA!',
                        description: `Se creó la cotización: ${result.data.autoCreatedQuotation.quotationNumber} \n💰 Total: $${result.data.autoCreatedQuotation.total.toLocaleString('es-AR')} \n\nPuedes verla en el módulo "Cotizaciones"`,
                        priority: 'high',
                        timeAgo: 'Ahora'
                    });
                } else if (result.data.existingQuotation) {
                    addNotification({
                        id: `won - existing - ${opportunity.id} -${Date.now()} `,
                        title: '✅ Oportunidad marcada como GANADA!',
                        description: `Ya existe una cotización para esta oportunidad: ${result.data.existingQuotation.quotation_number} `,
                        priority: 'medium',
                        timeAgo: 'Ahora'
                    });
                } else {
                    addNotification({
                        id: `won - ${opportunity.id} -${Date.now()} `,
                        title: '✅ Oportunidad marcada como GANADA!',
                        description: 'La oportunidad se actualizó correctamente.',
                        priority: 'medium',
                        timeAgo: 'Ahora'
                    });
                }
            } else {
                throw new Error(result.error || 'Error al actualizar la oportunidad');
            }
        } catch (error) {
            console.error('Error marking opportunity as won:', error);
            addNotification({
                id: `error - ${opportunity.id} -${Date.now()} `,
                title: '❌ Error',
                description: `No se pudo marcar la oportunidad como ganada: ${error.message} `,
                priority: 'high',
                timeAgo: 'Ahora'
            });
        }
    };

    // Función para eliminar oportunidad
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
                timeAgo: 'Ahora'
            });
            setDeleteConfirmOpen(false);
            setOpportunityToDelete(null);
            return;
        }

        showToast({
            id: `delete-${opportunityToDelete.id}-${Date.now()}`,
            title: '✅ Oportunidad Eliminada',
            description: `La oportunidad ${opportunityToDelete.opportunity_name || opportunityToDelete.title} fue eliminada correctamente`,
            priority: 'high',
            icon: CheckCircle,
            timeAgo: 'Ahora'
        });

        setDeleteConfirmOpen(false);
        setOpportunityToDelete(null);
    };

    // Handle status change from dropdown
    const handleStatusChange = async (opportunityId, newStatus) => {
        try {
            console.log('🔄 Changing status:', { opportunityId, newStatus });

            // Calculate probability based on status
            const statusToProbability = {
                'prospecting': 10,
                'qualification': 30,
                'proposal': 50,
                'negotiation': 70,
                'won': 100,
                'lost': 0
            };

            const probability = statusToProbability[newStatus] || 0;

            const result = await updateOpportunity(opportunityId, {
                status: newStatus,
                probability: probability
            });

            if (result.success) {
                setStatusDropdownOpen(null); // Close dropdown
                console.log('✅ Status updated successfully');
            } else {
                throw new Error(result.error || 'Error al actualizar el estado');
            }
        } catch (err) {
            console.error('❌ Error changing status:', err);
        }
    };

    // Use database opportunities only
    const displayOpportunities = opportunities;

    // Filter opportunities
    const filteredOpportunities = useMemo(() => {
        return displayOpportunities.filter(opp =>
            (opp.title || opp.opportunity_name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [displayOpportunities, searchTerm]);

    // Calculate stats
    const stats = useMemo(() => ({
        total: displayOpportunities.length,
        totalAmount: displayOpportunities.reduce((sum, opp) => sum + (opp.estimatedValue || opp.amount || 0), 0),
        won: displayOpportunities.filter(opp => opp.status === 'won' || opp.status === 'ganado').length,
        inProgress: displayOpportunities.filter(opp => ['prospecting', 'qualification', 'proposal', 'negotiation', 'iniciado', 'presupuestado', 'negociado'].includes(opp.status)).length,
    }), [displayOpportunities]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleEdit = (opportunity) => {
        console.log('🔍 Opportunities - Original opportunity:', opportunity);

        // Transform opportunity data to match modal format
        const transformedOpportunity = {
            id: opportunity.id,
            opportunityName: opportunity.title,
            linkedEntity: {
                id: opportunity.clientId,
                type: 'client'
            },
            comercial: {
                id: 1 // Default comercial for mock
            },
            contact: null,
            productType: opportunity.products[0]?.productName || '',
            amount: opportunity.estimatedValue,
            closeDate: opportunity.expectedCloseDate,
            status: opportunity.status,
            probability: opportunity.probability,
            nextAction: '',
            nextActionDate: '',
            notes: opportunity.description,
            // NEW FIELDS for quotation
            products: opportunity.products.map(p => ({
                productSapCode: p.sapCode,
                productName: p.productName,
                quantity: p.quantity,
                unitPrice: p.estimatedPrice
            })),
            saleType: opportunity.saleType,
            paymentCondition: 'cash',
            deliveryDate: '',
            originAddress: '',
            destinationAddress: ''
        };

        console.log('✅ Opportunities - Transformed opportunity:', transformedOpportunity);

        setOpportunityToEdit(transformedOpportunity);
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
                        const status = stageConfig[opportunity.status] || stageConfig.iniciado;
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
                                        {opportunity.opportunity_name || 'Sin nombre'}
                                    </h3>
                                    <div className="relative status-dropdown-container ml-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log('Status button clicked, opportunity:', opportunity.id);
                                                setStatusDropdownOpen(statusDropdownOpen === opportunity.id ? null : opportunity.id);
                                            }}
                                            className={`px-2 py-1 rounded-lg text-xs font-semibold border ${status.color} flex items-center gap-1 hover:opacity-80 transition-opacity`}
                                        >
                                            <span>{status.icon}</span>
                                            <span>{status.label}</span>
                                            <ChevronDown size={12} />
                                        </button>
                                        {statusDropdownOpen === opportunity.id && (
                                            <div className="absolute top-full right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-[100] min-w-[140px]">
                                                {Object.entries(stageConfig).map(([key, config]) => (
                                                    <button
                                                        key={key}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            console.log('Status option clicked:', key);
                                                            handleStatusChange(opportunity.id, key);
                                                        }}
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
                                            style={{ width: `${opportunity.probability || 0}% ` }}
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
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    console.log('Delete button clicked, opportunity ID:', opportunity.id);
                                                    await deleteOpportunity(opportunity.id);
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
                                            <td className="py-3 px-4">
                                                <div className="status-dropdown-container" style={{ position: 'relative', zIndex: statusDropdownOpen === opp.id ? 9999 : 1 }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            console.log('Desktop status button clicked, opportunity:', opp.id);
                                                            setStatusDropdownOpen(statusDropdownOpen === opp.id ? null : opp.id);
                                                        }}
                                                        className={`px-2 py-1 rounded-lg text-xs font-semibold border ${status.color} flex items-center gap-1 w-fit hover:opacity-80 transition-opacity`}
                                                    >
                                                        <span>{status.icon}</span>
                                                        <span>{status.label}</span>
                                                        <ChevronDown size={12} />
                                                    </button>
                                                    {statusDropdownOpen === opp.id && (
                                                        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-[9999] min-w-[160px]">
                                                            {Object.entries(stageConfig).map(([key, config]) => (
                                                                <button
                                                                    key={key}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        console.log('Desktop status option clicked:', key);
                                                                        handleStatusChange(opp.id, key);
                                                                    }}
                                                                    className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${opp.status === key ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
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
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="60"
                                                        step="10"
                                                        value={Math.min(opp.probability || 0, 60)}
                                                        onChange={async (e) => {
                                                            const newProbability = parseInt(e.target.value);

                                                            // Auto-calculate status based on probability
                                                            let newStatus = opp.status;
                                                            if (newProbability >= 0 && newProbability <= 20) newStatus = 'prospecting';
                                                            else if (newProbability <= 40) newStatus = 'qualification';
                                                            else if (newProbability <= 60) newStatus = 'proposal';
                                                            else if (newProbability <= 80) newStatus = 'negotiation';
                                                            else if (newProbability > 80) newStatus = 'won';

                                                            console.log('📊 Probability changed:', { newProbability, newStatus });
                                                            await updateOpportunity(opp.id, {
                                                                probability: newProbability,
                                                                status: newStatus
                                                            });
                                                        }}
                                                        className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer max-w-[80px]
                                                            [&::-webkit-slider-thumb]:appearance-none
                                                            [&::-webkit-slider-thumb]:w-4
                                                            [&::-webkit-slider-thumb]:h-4
                                                            [&::-webkit-slider-thumb]:rounded-full
                                                            [&::-webkit-slider-thumb]:bg-blue-600
                                                            [&::-webkit-slider-thumb]:cursor-pointer
                                                            [&::-moz-range-thumb]:w-4
                                                            [&::-moz-range-thumb]:h-4
                                                            [&::-moz-range-thumb]:rounded-full
                                                            [&::-moz-range-thumb]:bg-blue-600
                                                            [&::-moz-range-thumb]:border-0
                                                            [&::-moz-range-thumb]:cursor-pointer"
                                                        style={{
                                                            background: `linear-gradient(to right, rgb(37 99 235) 0%, rgb(37 99 235) ${(Math.min(opp.probability || 0, 60) / 60) * 100}%, rgb(226 232 240) ${(Math.min(opp.probability || 0, 60) / 60) * 100}%, rgb(226 232 240) 100%)`
                                                        }}
                                                    />
                                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 min-w-[35px]">
                                                        {opp.probability || 0}%
                                                    </span>
                                                </div>
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
                                                        <>
                                                            <button
                                                                onClick={() => handleEdit(opp)}
                                                                className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                                title="Editar"
                                                            >
                                                                <Edit2 size={16} className="text-blue-600 dark:text-blue-400" />
                                                            </button>
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
                                                        </>
                                                    )}
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
                onSave={(opportunityId, updates) => {
                    // Update local mock data
                    setLocalOpportunities(prev =>
                        prev.map(opp =>
                            opp.id === opportunityId
                                ? { ...opp, ...updates }
                                : opp
                        )
                    );
                    setIsEditModalOpen(false);
                    setOpportunityToEdit(null);
                }}
                opportunity={opportunityToDelete}
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
                                        ¿Estás seguro de eliminar la oportunidad <span className="font-semibold">{opportunityToDelete?.opportunity_name || opportunityToDelete?.title}</span>? Esta acción no se puede deshacer.
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
        </div>
    );
};

export default Opportunities;
// Force deployment Fri Feb  6 04:37:04 -03 2026
