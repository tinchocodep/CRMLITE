import React, { useState, useMemo } from 'react';
import {
    Plus, Search, Filter, Loader2, AlertCircle,
    ClipboardList, CheckCircle2, Clock, RotateCcw
} from 'lucide-react';
import { useVisits } from '../hooks/useVisits';
import VisitFormModal from '../components/visits/VisitFormModal';
import VisitasGrid from '../components/visits/VisitasGrid';
import { ConfirmModal } from '../components/ConfirmModal';

// ─── Filter tabs config ───────────────────────────────────────────────────────
const STATUS_TABS = [
    { key: 'all', label: 'Todas', icon: ClipboardList },
    { key: 'pending', label: 'Pendientes', icon: Clock },
    { key: 'completed', label: 'Completadas', icon: CheckCircle2 },
];

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ hasFilters, onNew }) => (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <ClipboardList size={24} className="text-slate-400" />
        </div>
        <h3 className="text-sm font-bold text-slate-700 mb-1">
            {hasFilters ? 'Sin resultados' : 'No hay visitas registradas'}
        </h3>
        <p className="text-xs text-slate-400 mb-4 max-w-xs">
            {hasFilters
                ? 'Probá con otros filtros o borrá la búsqueda.'
                : 'Planificá tu primera visita a un cliente.'}
        </p>
        {!hasFilters && (
            <button
                onClick={onNew}
                className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-xl text-xs font-bold hover:bg-brand-red/90 transition-colors shadow-sm"
            >
                <Plus size={13} />
                Nueva visita
            </button>
        )}
    </div>
);

// ─── Stats bar ─────────────────────────────────────────────────────────────────
const StatsBar = ({ visits }) => {
    const pending = visits.filter(v => v.status === 'pending').length;
    const completed = visits.filter(v => v.status === 'completed').length;
    const total = visits.length;

    return (
        <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {pending} pendiente{pending !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {completed} completada{completed !== 1 ? 's' : ''}
            </span>
            <span className="text-slate-300">·</span>
            <span>{total} total</span>
        </div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
/**
 * Visitas — Full page for managing field visits.
 * Layout: header (title + new button) → filter bar → card grid.
 * Uses useVisits hook for all data + mutations.
 */
const Visitas = () => {
    const {
        visits,
        loading,
        error,
        refetch,
        completeVisit,
        deleteVisit,
        getEstablishmentForCompany,
        getLotsForEstablishment,
    } = useVisits();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingVisit, setEditingVisit] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null); // visit object | null
    const [deleting, setDeleting] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // ── Filtered visits ─────────────────────────────────────────────────────
    const filteredVisits = useMemo(() => {
        let result = visits;

        if (statusFilter !== 'all') {
            result = result.filter(v => v.status === statusFilter);
        }

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter(v =>
                (v.title || '').toLowerCase().includes(q) ||
                (v.clientName || '').toLowerCase().includes(q) ||
                (v.comercialName || '').toLowerCase().includes(q)
            );
        }

        return result;
    }, [visits, statusFilter, search]);

    const hasFilters = search.trim() !== '' || statusFilter !== 'all';

    // ── Handlers ───────────────────────────────────────────────────────────
    const handleOpenNew = () => {
        setEditingVisit(null);
        setModalOpen(true);
    };

    const handleEdit = (visit) => {
        setEditingVisit(visit);
        setModalOpen(true);
    };

    const handleComplete = async (visit) => {
        const newStatus = visit.status === 'completed' ? 'pending' : 'completed';
        await completeVisit(visit.id, newStatus);
    };

    const handleDeleteRequest = (visit) => setConfirmDelete(visit);

    const handleDeleteConfirm = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        await deleteVisit(confirmDelete.id);
        setDeleting(false);
        setConfirmDelete(null);
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full min-h-0 bg-slate-50">

            {/* ── Header ── */}
            <div className="flex-shrink-0 px-6 pt-6 pb-4 bg-white border-b border-slate-100">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Visitas</h1>
                        <div className="mt-1">
                            {loading ? (
                                <span className="text-xs text-slate-400">Cargando...</span>
                            ) : (
                                <StatsBar visits={visits} />
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleOpenNew}
                        className="flex items-center gap-2 px-4 py-2.5 bg-brand-red text-white rounded-xl text-sm font-bold hover:bg-brand-red/90 transition-all shadow-sm flex-shrink-0"
                    >
                        <Plus size={15} />
                        Nueva visita
                    </button>
                </div>

                {/* ── Filter bar ── */}
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[180px] max-w-xs">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por título, cliente..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm bg-slate-100 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red focus:bg-white transition-all placeholder:text-slate-400"
                        />
                    </div>

                    {/* Status tabs */}
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
                        {STATUS_TABS.map(tab => {
                            const Icon = tab.icon;
                            const active = statusFilter === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setStatusFilter(tab.key)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active
                                        ? 'bg-white text-slate-800 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <Icon size={12} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Clear filters */}
                    {hasFilters && (
                        <button
                            onClick={() => { setSearch(''); setStatusFilter('all'); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-200 transition-colors"
                        >
                            <RotateCcw size={12} />
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* Error state */}
                {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 mb-5">
                        <AlertCircle size={15} className="flex-shrink-0" />
                        <span>{error}</span>
                        <button
                            onClick={refetch}
                            className="ml-auto text-xs underline hover:no-underline"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm h-56 animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Cards grid */}
                {!loading && (
                    filteredVisits.length === 0 ? (
                        <EmptyState hasFilters={hasFilters} onNew={handleOpenNew} />
                    ) : (
                        <VisitasGrid
                            visits={filteredVisits}
                            getEstablishmentForCompany={getEstablishmentForCompany}
                            getLotsForEstablishment={getLotsForEstablishment}
                            onComplete={handleComplete}
                            onDelete={handleDeleteRequest}
                        />
                    )
                )}
            </div>

            {/* ── Modals ── */}
            <VisitFormModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditingVisit(null); }}
                onSuccess={refetch}
                initialData={editingVisit}
            />

            <ConfirmModal
                isOpen={Boolean(confirmDelete)}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Eliminar visita"
                message={`¿Estás seguro de eliminar "${confirmDelete?.title || 'esta visita'}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                type="danger"
            />
        </div>
    );
};

export default Visitas;
