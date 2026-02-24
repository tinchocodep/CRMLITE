import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, Clock, User, MapPin, Building2,
    CheckCircle2, Circle, AlertCircle, Layers
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Priority config ────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
    high: { label: 'Alta', className: 'bg-red-100 text-red-700 border-red-200' },
    medium: { label: 'Media', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    low: { label: 'Baja', className: 'bg-blue-100 text-blue-700 border-blue-200' },
};

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    pending: {
        label: 'Pendiente',
        icon: Circle,
        borderClass: 'border-l-brand-red',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    completed: {
        label: 'Completada',
        icon: CheckCircle2,
        borderClass: 'border-l-green-500',
        badgeClass: 'bg-green-50 text-green-700 border-green-200',
    },
    cancelled: {
        label: 'Cancelada',
        icon: AlertCircle,
        borderClass: 'border-l-slate-300',
        badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
    },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatVisitDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        return format(parseISO(dateStr), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
        return dateStr;
    }
};

const formatDuration = (minutes) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

// ─── Component ────────────────────────────────────────────────────────────────
/**
 * VisitCard — Single visit card for the Visitas grid.
 * Handles all edge states: pending, completed, cancelled.
 * Optionally shows territory badge if an establishment is linked to the company.
 * Exposes onComplete and onDelete action callbacks (handled by parent page).
 */
const VisitCard = ({ visit, establishment, lots = [], onComplete, onDelete }) => {
    const navigate = useNavigate();

    const status = STATUS_CONFIG[visit.status] ?? STATUS_CONFIG.pending;
    const priority = PRIORITY_CONFIG[visit.priority] ?? PRIORITY_CONFIG.medium;
    const StatusIcon = status.icon;

    const isCompleted = visit.status === 'completed';

    return (
        <article
            className={`
                relative bg-white rounded-2xl border border-slate-100 shadow-sm
                border-l-4 ${status.borderClass}
                transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
                ${isCompleted ? 'opacity-75' : ''}
            `}
        >
            <div className="p-5 space-y-4">

                {/* ── Header: Title + Status + Priority ── */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                        <StatusIcon
                            size={18}
                            className={`flex-shrink-0 mt-0.5 ${isCompleted ? 'text-green-500' : 'text-brand-red'}`}
                        />
                        <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">
                            {visit.title || 'Sin título'}
                        </h3>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.badgeClass}`}>
                            {status.label}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priority.className}`}>
                            {priority.label}
                        </span>
                    </div>
                </div>

                {/* ── Client ── */}
                <div className="flex items-center gap-2 text-slate-600">
                    <User size={14} className="flex-shrink-0 text-slate-400" />
                    <span className="text-sm font-medium truncate">{visit.clientName}</span>
                </div>

                {/* ── Date + Time + Duration ── */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar size={13} className="flex-shrink-0" />
                        <span className="text-xs">{formatVisitDate(visit.scheduled_date)}</span>
                    </div>
                    {visit.scheduled_time && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                            <Clock size={13} className="flex-shrink-0" />
                            <span className="text-xs">{visit.scheduled_time.slice(0, 5)}</span>
                        </div>
                    )}
                    {visit.duration_minutes && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <span className="text-xs">· {formatDuration(visit.duration_minutes)}</span>
                        </div>
                    )}
                </div>

                {/* ── Comercial ── */}
                <div className="flex items-center gap-2 text-slate-500">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-red to-orange-400 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                        {(visit.comercialName || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-slate-500">{visit.comercialName}</span>
                </div>

                {/* ── Description (optional) ── */}
                {visit.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 italic border-t border-slate-50 pt-2">
                        {visit.description}
                    </p>
                )}

                {/* ── Territory Badge (optional) ── */}
                {establishment && (
                    <div
                        className="flex items-center gap-2 pt-2 border-t border-slate-100 cursor-pointer group"
                        onClick={() => navigate('/campos')}
                        title="Ver en Campos"
                    >
                        <Building2 size={13} className="text-green-600 flex-shrink-0" />
                        <div className="min-w-0">
                            <span className="text-xs font-semibold text-green-700 group-hover:underline truncate block">
                                {establishment.name}
                            </span>
                            {lots.length > 0 && (
                                <div className="flex items-center gap-1 mt-0.5">
                                    <Layers size={10} className="text-green-500" />
                                    <span className="text-[10px] text-green-600">
                                        {lots.length} {lots.length === 1 ? 'lote' : 'lotes'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <MapPin size={11} className="ml-auto text-green-400 group-hover:text-green-600 transition-colors" />
                    </div>
                )}

                {/* ── Actions ── */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    {/* Complete / Reopen */}
                    <button
                        onClick={() => onComplete(visit)}
                        className={`
                            flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold
                            transition-all duration-150
                            ${isCompleted
                                ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                            }
                        `}
                        title={isCompleted ? 'Marcar como pendiente' : 'Marcar como hecha'}
                    >
                        <CheckCircle2 size={13} />
                        {isCompleted ? 'Reabrir' : 'Hecha'}
                    </button>

                    {/* Delete */}
                    <button
                        onClick={() => onDelete(visit)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all duration-150"
                        title="Eliminar visita"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </article>
    );
};

export default VisitCard;
