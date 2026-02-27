import React, { useState, useMemo } from 'react';
import {
    Plus, Search, Loader2, AlertCircle,
    ClipboardList, CheckCircle2, Clock, RotateCcw,
    Trash2, Pencil, Phone, Users, Mail, MapPin, Briefcase, MoreVertical, X
} from 'lucide-react';
import { useAllActivities } from '../hooks/useAllActivities';
import VisitFormModal from '../components/visits/VisitFormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Activity Type Config ──────────────────────────────────────────────────────
const ACTIVITY_TYPE_CONFIG = {
    visit: { label: 'Visita', icon: MapPin, color: 'bg-green-100 text-green-700' },
    call: { label: 'Llamada', icon: Phone, color: 'bg-blue-100 text-blue-700' },
    meeting: { label: 'Reunión', icon: Users, color: 'bg-purple-100 text-purple-700' },
    email: { label: 'Email', icon: Mail, color: 'bg-sky-100 text-sky-700' },
    task: { label: 'Tarea', icon: Briefcase, color: 'bg-amber-100 text-amber-700' },
    other: { label: 'Otro', icon: ClipboardList, color: 'bg-slate-100 text-slate-600' },
};

const PRIORITY_CONFIG = {
    high: { label: 'Alta', dot: 'bg-red-500' },
    medium: { label: 'Media', dot: 'bg-amber-400' },
    low: { label: 'Baja', dot: 'bg-blue-400' },
};

// ─── Filter tabs config ───────────────────────────────────────────────────────
const STATUS_TABS = [
    { key: 'all', label: 'Todas', icon: ClipboardList },
    { key: 'pending', label: 'Pendientes', icon: Clock },
    { key: 'completed', label: 'Cumplidas', icon: CheckCircle2 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        const d = parseISO(dateStr);
        if (isToday(d)) return 'Hoy';
        return format(d, "d MMM yyyy", { locale: es });
    } catch { return dateStr; }
};

const getDateStyle = (dateStr, status) => {
    if (status === 'completed') return 'text-slate-400';
    if (!dateStr) return 'text-slate-500';
    try {
        const d = parseISO(dateStr);
        if (isPast(d) && !isToday(d)) return 'text-red-600 font-bold';
        if (isToday(d)) return 'text-green-600 font-bold';
    } catch { }
    return 'text-slate-600';
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ hasFilters, onNew }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
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

// ─── Stats bar ────────────────────────────────────────────────────────────────
const StatsBar = ({ activities }) => {
    const pending = activities.filter(a => a.status === 'pending').length;
    const completed = activities.filter(a => a.status === 'completed').length;
    const overdue = activities.filter(a => {
        if (a.status === 'completed' || !a.scheduled_date) return false;
        try { return isPast(parseISO(a.scheduled_date)) && !isToday(parseISO(a.scheduled_date)); }
        catch { return false; }
    }).length;

    return (
        <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {pending} pendiente{pending !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {completed} cumplida{completed !== 1 ? 's' : ''}
            </span>
            {overdue > 0 && (
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    {overdue} vencida{overdue !== 1 ? 's' : ''}
                </span>
            )}
        </div>
    );
};

// ─── Activity Row ─────────────────────────────────────────────────────────────
const ActivityRow = ({ activity, onComplete, onEdit, onDelete }) => {
    const [actionsOpen, setActionsOpen] = useState(false);

    const typeConfig = ACTIVITY_TYPE_CONFIG[activity.activity_type] || ACTIVITY_TYPE_CONFIG.other;
    const priorityConfig = PRIORITY_CONFIG[activity.priority] || PRIORITY_CONFIG.medium;
    const TypeIcon = typeConfig.icon;
    const isCompleted = activity.status === 'completed';

    return (
        <div className={`
            group flex items-center gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50/80 transition-colors
            ${isCompleted ? 'opacity-60' : ''}
        `}>
            {/* Tipo de actividad */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${typeConfig.color}`}>
                <TypeIcon size={14} />
            </div>

            {/* Info principal */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-semibold truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {activity.title || 'Sin título'}
                    </h3>
                    <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${priorityConfig.dot}`}
                        title={`Prioridad: ${priorityConfig.label}`}
                    />
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                    {activity.clientName && activity.clientName !== 'Sin asignar' && (
                        <span className="text-xs text-slate-500 truncate max-w-[160px]">{activity.clientName}</span>
                    )}
                    <span className={`text-[11px] px-1.5 py-0.5 rounded ${typeConfig.color}`}>
                        {typeConfig.label}
                    </span>
                </div>
            </div>

            {/* Fecha */}
            <div className={`flex-shrink-0 text-xs text-right ${getDateStyle(activity.scheduled_date, activity.status)}`}>
                <div>{formatDate(activity.scheduled_date)}</div>
                {activity.scheduled_time && (
                    <div className="text-slate-400">{activity.scheduled_time.slice(0, 5)}</div>
                )}
            </div>

            {/* Comercial */}
            <div className="hidden md:flex items-center gap-1.5 flex-shrink-0 w-28 min-w-0">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--color-brand-primary)] to-orange-400 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                    {(activity.comercialName || '?').charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-slate-500 truncate">{activity.comercialName}</span>
            </div>

            {/* ─── Acciones rápidas (desktop) ── */}
            <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                {/* Cumplida */}
                <button
                    onClick={() => onComplete(activity)}
                    className={`
                        flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all
                        ${isCompleted
                            ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                        }
                    `}
                    title={isCompleted ? 'Reabrir' : 'Marcar cumplida'}
                >
                    <CheckCircle2 size={13} />
                    {isCompleted ? 'Reabrir' : 'Cumplida'}
                </button>

                {/* Editar */}
                <button
                    onClick={() => onEdit(activity)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all"
                    title="Editar"
                >
                    <Pencil size={12} />
                    Editar
                </button>

                {/* Eliminar */}
                <button
                    onClick={() => onDelete(activity)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all"
                    title="Eliminar"
                >
                    <Trash2 size={12} />
                </button>
            </div>

            {/* ─── Acciones (mobile) ── */}
            <div className="sm:hidden flex-shrink-0 relative">
                <button
                    onClick={() => setActionsOpen(prev => !prev)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                >
                    <MoreVertical size={16} className="text-slate-400" />
                </button>
                {actionsOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setActionsOpen(false)} />
                        <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-40">
                            <button
                                onClick={() => { onComplete(activity); setActionsOpen(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                <CheckCircle2 size={13} />
                                {isCompleted ? 'Reabrir' : 'Cumplida'}
                            </button>
                            <button
                                onClick={() => { onEdit(activity); setActionsOpen(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                <Pencil size={12} />
                                Editar
                            </button>
                            <button
                                onClick={() => { onDelete(activity); setActionsOpen(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                                <Trash2 size={12} />
                                Eliminar
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
/**
 * Actividades — Full page for managing all activities.
 * Layout: header (title + new button) → filter bar → table-like list with quick actions.
 */
const Actividades = () => {
    const {
        activities,
        loading,
        error,
        refetch,
        completeActivity,
        deleteActivity,
    } = useAllActivities();

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
        let result = activities;

        if (statusFilter !== 'all') {
            result = result.filter(a => a.status === statusFilter);
        }

        if (typeFilter !== 'all') {
            result = result.filter(a => a.activity_type === typeFilter);
        }

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter(a =>
                (a.title || '').toLowerCase().includes(q) ||
                (a.clientName || '').toLowerCase().includes(q) ||
                (a.comercialName || '').toLowerCase().includes(q)
            );
        }

        return result;
    }, [activities, statusFilter, typeFilter, search]);

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

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full min-h-0 bg-slate-50">

            {/* ── Header ── */}
            <div className="flex-shrink-0 px-6 pt-6 pb-4 bg-white border-b border-slate-100">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Actividades</h1>
                        <div className="mt-1">
                            {loading ? (
                                <span className="text-xs text-slate-400">Cargando...</span>
                            ) : (
                                <StatsBar activities={activities} />
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleOpenNew}
                        className="flex items-center gap-2 px-4 py-2.5 btn-brand text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-sm flex-shrink-0"
                    >
                        <Plus size={15} />
                        Nueva actividad
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

                    {/* Type filter */}
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="px-3 py-2 text-xs font-semibold bg-slate-100 rounded-xl border-none focus:ring-2 focus:ring-brand-red/30 cursor-pointer"
                    >
                        <option value="all">Todos los tipos</option>
                        {Object.entries(ACTIVITY_TYPE_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                        ))}
                    </select>

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
            <div className="flex-1 overflow-y-auto">
                {/* Error state */}
                {error && (
                    <div className="mx-6 mt-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
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

                {/* Table-like list */}
                {!loading && (
                    filteredActivities.length === 0 ? (
                        <EmptyState hasFilters={hasFilters} onNew={handleOpenNew} />
                    ) : (
                        <div className="bg-white mx-4 my-4 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            {/* Table header */}
                            <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                                <div className="w-8" />
                                <div className="flex-1">Actividad</div>
                                <div className="w-20 text-right">Fecha</div>
                                <div className="hidden md:block w-28">Comercial</div>
                                <div className="w-52 text-center">Acciones</div>
                            </div>
                            {/* Rows */}
                            {filteredActivities.map(activity => (
                                <ActivityRow
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
