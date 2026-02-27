import React, { useState, useMemo } from 'react';
import {
    Plus, Search, Loader2, AlertCircle, RefreshCw,
    ClipboardList, CheckCircle2, Clock, RotateCcw,
    Trash2, Pencil, Phone, Users, Mail, MapPin, Briefcase,
    Building2, Calendar
} from 'lucide-react';
import { useAllActivities } from '../hooks/useAllActivities';
import { useRoleBasedFilter } from '../hooks/useRoleBasedFilter';
import { ComercialFilter } from '../components/shared/ComercialFilter';
import VisitFormModal from '../components/visits/VisitFormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Activity Type Config ──────────────────────────────────────────────────────
const ACTIVITY_TYPE_CONFIG = {
    visit: { label: 'Visita', icon: MapPin, color: 'bg-green-100 text-green-700', border: 'border-green-200' },
    call: { label: 'Llamada', icon: Phone, color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
    meeting: { label: 'Reunión', icon: Users, color: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
    email: { label: 'Email', icon: Mail, color: 'bg-sky-100 text-sky-700', border: 'border-sky-200' },
    task: { label: 'Tarea', icon: Briefcase, color: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
    other: { label: 'Otro', icon: ClipboardList, color: 'bg-slate-100 text-slate-600', border: 'border-slate-200' },
};

const PRIORITY_CONFIG = {
    high: { label: 'Alta', color: 'text-red-600 bg-red-50 border-red-200' },
    medium: { label: 'Media', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    low: { label: 'Baja', color: 'text-blue-600 bg-blue-50 border-blue-200' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCardDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        const d = parseISO(dateStr);
        if (isToday(d)) return 'Hoy';
        return format(d, "d 'de' MMMM, yyyy", { locale: es });
    } catch { return dateStr; }
};

const getDateColor = (dateStr, status) => {
    if (status === 'completed') return 'text-slate-400';
    if (!dateStr) return 'text-slate-500';
    try {
        const d = parseISO(dateStr);
        if (isPast(d) && !isToday(d)) return 'text-red-600';
        if (isToday(d)) return 'text-green-600';
    } catch { }
    return 'text-slate-600';
};

// ─── Activity Card ────────────────────────────────────────────────────────────
const ActivityCard = ({ activity, onComplete, onEdit, onDelete }) => {
    const typeConfig = ACTIVITY_TYPE_CONFIG[activity.activity_type] || ACTIVITY_TYPE_CONFIG.other;
    const priorityConfig = PRIORITY_CONFIG[activity.priority] || PRIORITY_CONFIG.medium;
    const isCompleted = activity.status === 'completed';
    const isPending = activity.status === 'pending';

    // Status indicator color — red ring for pending, green for completed
    const statusRingColor = isCompleted ? 'border-green-500 bg-green-500' : 'border-red-400 bg-white';

    return (
        <div className={`
            bg-white rounded-2xl border border-slate-200 shadow-sm 
            hover:shadow-md hover:border-slate-300 transition-all duration-200
            flex flex-col overflow-hidden
            ${isCompleted ? 'opacity-70' : ''}
        `}>
            {/* ── Card Header ── */}
            <div className="px-4 pt-4 pb-3 flex items-start gap-3">
                {/* Status dot */}
                <div className={`mt-1 w-3 h-3 rounded-full border-2 flex-shrink-0 ${statusRingColor}`} />

                {/* Title + Type badge */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-sm font-bold leading-snug ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {activity.title || 'Sin título'}
                        </h3>
                        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md ${typeConfig.color}`}>
                            {typeConfig.label}
                        </span>
                    </div>
                    {/* Status badge */}
                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${isPending ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                        {isPending ? 'Pendiente' : 'Cumplida'}
                    </span>
                </div>
            </div>

            {/* ── Card Body ── */}
            <div className="px-4 pb-3 flex-1 space-y-2">
                {/* Client / Company */}
                {activity.clientName && activity.clientName !== 'Sin asignar' && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Building2 size={12} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate font-medium">{activity.clientName}</span>
                    </div>
                )}

                {/* Date + Time + Duration */}
                <div className={`flex items-center gap-1.5 text-xs ${getDateColor(activity.scheduled_date, activity.status)}`}>
                    <Calendar size={12} className="flex-shrink-0" />
                    <span className="font-medium">{formatCardDate(activity.scheduled_date)}</span>
                    {activity.scheduled_time && (
                        <>
                            <span className="text-slate-300">⏐</span>
                            <Clock size={11} className="flex-shrink-0" />
                            <span>{activity.scheduled_time.slice(0, 5)}</span>
                        </>
                    )}
                    {activity.duration && (
                        <span className="text-slate-400">· {activity.duration}h</span>
                    )}
                </div>

                {/* Comercial */}
                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--color-brand-primary)] to-orange-400 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                        {(activity.comercialName || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-slate-500 truncate">{activity.comercialName}</span>
                </div>

                {/* Description / notes */}
                {activity.description && (
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 italic">
                        {activity.description}
                    </p>
                )}

                {/* Priority */}
                <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${priorityConfig.color}`}>
                    Prioridad: {priorityConfig.label}
                </div>

                {/* Opportunity info (if linked) */}
                {activity.opportunityName && (
                    <div className="flex items-start gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <MapPin size={12} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                            <span className="text-[11px] font-semibold text-slate-600 block truncate">
                                {activity.opportunityName}
                            </span>
                            {activity.opportunityAmount && (
                                <span className="text-[10px] text-slate-400">
                                    Monto: ${Number(activity.opportunityAmount).toLocaleString('es-AR')}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Card Footer — Actions ── */}
            <div className="px-3 py-2.5 border-t border-slate-100 flex items-center gap-2">
                {/* Cumplida / Reabrir */}
                <button
                    onClick={() => onComplete(activity)}
                    className={`
                        flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all
                        ${isCompleted
                            ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                        }
                    `}
                >
                    <CheckCircle2 size={13} />
                    {isCompleted ? 'Reabrir' : 'Cumplida'}
                </button>

                {/* Editar */}
                <button
                    onClick={() => onEdit(activity)}
                    className="p-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 transition-all"
                    title="Editar"
                >
                    <Pencil size={13} />
                </button>

                {/* Eliminar */}
                <button
                    onClick={() => onDelete(activity)}
                    className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 transition-all"
                    title="Eliminar"
                >
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ hasFilters, onNew }) => (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <ClipboardList size={24} className="text-slate-400" />
        </div>
        <h3 className="text-sm font-bold text-slate-700 mb-1">
            {hasFilters ? 'Sin resultados' : 'No hay actividades registradas'}
        </h3>
        <p className="text-xs text-slate-400 mb-4 max-w-xs">
            {hasFilters
                ? 'Probá con otros filtros o borrá la búsqueda.'
                : 'Creá tu primera actividad.'}
        </p>
        {!hasFilters && (
            <button
                onClick={onNew}
                className="flex items-center gap-2 px-4 py-2 btn-brand rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
                <Plus size={13} />
                Nueva actividad
            </button>
        )}
    </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
const Actividades = () => {
    const {
        activities,
        loading,
        error,
        refetch,
        completeActivity,
        deleteActivity,
    } = useAllActivities();

    // Role-based commercial filter
    const {
        comerciales,
        selectedComercialId,
        setSelectedComercialId,
        canFilter,
        showAllOption,
        filterDataByRole,
        loading: filterLoading
    } = useRoleBasedFilter();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    // ── Filtered activities ─────────────────────────────────────────────────
    const filteredActivities = useMemo(() => {
        // First apply role-based filter (by comercial)
        let result = filterDataByRole(activities);

        if (statusFilter !== 'all') {
            result = result.filter(a => a.status === statusFilter);
        }

        if (typeFilter !== 'all') {
            if (typeFilter === 'opportunity') {
                // Filtro especial: actividades vinculadas a oportunidades
                result = result.filter(a => a.opportunity_id != null);
            } else {
                result = result.filter(a => a.activity_type === typeFilter);
            }
        }

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter(a =>
                (a.title || '').toLowerCase().includes(q) ||
                (a.clientName || '').toLowerCase().includes(q) ||
                (a.comercialName || '').toLowerCase().includes(q)
            );
        }

        // Sort by date — closest first
        result.sort((a, b) => {
            const dateA = a.activity_date ? new Date(a.activity_date) : new Date('9999-12-31');
            const dateB = b.activity_date ? new Date(b.activity_date) : new Date('9999-12-31');
            return dateA - dateB;
        });

        return result;
    }, [activities, statusFilter, typeFilter, search, selectedComercialId, filterDataByRole]);

    const hasFilters = search.trim() !== '' || statusFilter !== 'all' || typeFilter !== 'all';

    // ── Handlers ───────────────────────────────────────────────────────────
    const handleOpenNew = () => {
        setEditingActivity(null);
        setModalOpen(true);
    };

    const handleEdit = (activity) => {
        setEditingActivity(activity);
        setModalOpen(true);
    };

    const handleComplete = async (activity) => {
        await completeActivity(activity.id, activity.status);
    };

    const handleDeleteRequest = (activity) => setConfirmDelete(activity);

    const handleDeleteConfirm = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        await deleteActivity(confirmDelete.id);
        setDeleting(false);
        setConfirmDelete(null);
    };

    const totalCount = filteredActivities.length;

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full min-h-0">

            {/* ── Header ── */}
            <div className="flex-shrink-0 px-4 md:px-6 pt-5 pb-4 bg-white border-b border-slate-100">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-primary)] to-orange-400 flex items-center justify-center shadow-sm">
                            <ClipboardList size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Actividades</h1>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {loading ? 'Cargando...' : `${totalCount} actividad${totalCount !== 1 ? 'es' : ''}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={refetch}
                        className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                        title="Actualizar"
                    >
                        <RefreshCw size={13} />
                        Actualizar
                    </button>
                </div>

                {/* ── Filter bar ── */}
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[180px] max-w-md">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por título, cliente o comercial..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red focus:bg-white transition-all placeholder:text-slate-400"
                        />
                    </div>

                    {/* Type filter */}
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-red/30 cursor-pointer"
                    >
                        <option value="all">Todos los tipos</option>
                        {Object.entries(ACTIVITY_TYPE_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                        ))}
                        <option value="opportunity">Oportunidades</option>
                    </select>

                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-red/30 cursor-pointer"
                    >
                        <option value="all">Todas</option>
                        <option value="pending">Pendientes</option>
                        <option value="completed">Cumplidas</option>
                    </select>

                    {/* Comercial filter (Admin & Supervisor only) */}
                    {canFilter && (
                        <ComercialFilter
                            comerciales={comerciales}
                            selectedComercialId={selectedComercialId}
                            onComercialChange={setSelectedComercialId}
                            showAllOption={showAllOption}
                            loading={filterLoading}
                        />
                    )}

                    {/* Clear filters */}
                    {hasFilters && (
                        <button
                            onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-200 transition-colors"
                        >
                            <RotateCcw size={12} />
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {/* Error state */}
                {error && (
                    <div className="mb-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
                        <AlertCircle size={15} className="flex-shrink-0" />
                        <span>{error}</span>
                        <button onClick={refetch} className="ml-auto text-xs underline hover:no-underline">Reintentar</button>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={24} className="animate-spin text-slate-400" />
                    </div>
                )}

                {/* Card Grid */}
                {!loading && (
                    filteredActivities.length === 0 ? (
                        <EmptyState hasFilters={hasFilters} onNew={handleOpenNew} />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredActivities.map(activity => (
                                <ActivityCard
                                    key={activity.id}
                                    activity={activity}
                                    onComplete={handleComplete}
                                    onEdit={handleEdit}
                                    onDelete={handleDeleteRequest}
                                />
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* ── Modals ── */}
            <VisitFormModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditingActivity(null); }}
                onSuccess={refetch}
                initialData={editingActivity}
            />

            <ConfirmModal
                isOpen={Boolean(confirmDelete)}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Eliminar actividad"
                message={`¿Estás seguro de eliminar "${confirmDelete?.title || 'esta actividad'}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                type="danger"
            />
        </div>
    );
};

export default Actividades;
