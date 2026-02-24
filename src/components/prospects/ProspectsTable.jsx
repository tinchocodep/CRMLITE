import React, { useState, useMemo } from 'react';
import { Edit2, UserPlus, UserCheck, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Pagination } from '../shared/Pagination';

const ProspectsTable = ({ prospects, onEdit, onPromote, onDelete, onAddContact, allContacts, onStatusChange, page, totalCount, pageSize, onPageChange }) => {
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

    // Sorting logic
    const sortedProspects = useMemo(() => {
        if (!sortConfig.key) return prospects;

        return [...prospects].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            if (aValue == null) return 1;
            if (bValue == null) return -1;

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [prospects, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="opacity-40" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} className="text-advanta-green" />
            : <ArrowDown size={14} className="text-advanta-green" />;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
        } catch {
            return '-';
        }
    };

    // Inline style helper for the status select
    const STATUS_CONFIG = {
        contacted: { label: 'Contactado', dot: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
        quoted: { label: 'Cotizado', dot: '#eab308', bg: '#fefce8', text: '#854d0e', border: '#fde047' },
        near_closing: { label: 'Por Cerrar', dot: '#22c55e', bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
    };
    const getStatusCfg = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.contacted;

    const thClass = "px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors";

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="table-fixed w-full min-w-[1100px]">
                    {/* Fixed column widths prevent layout reflow when sidebar opens/closes */}
                    <colgroup>
                        <col style={{ width: '18%' }} />{/* Nombre Comercial */}
                        <col style={{ width: '16%' }} />{/* Razón Social */}
                        <col style={{ width: '11%' }} />{/* CUIT */}
                        <col style={{ width: '10%' }} />{/* Ciudad */}
                        <col style={{ width: '10%' }} />{/* Provincia */}
                        <col style={{ width: '12%' }} />{/* Comercial */}
                        <col style={{ width: '11%' }} />{/* Estado */}
                        <col style={{ width: '11%' }} />{/* Fecha Creación */}
                        <col style={{ width: '11%' }} />{/* Acciones */}
                    </colgroup>
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                        <tr>
                            <th onClick={() => handleSort('trade_name')} className={thClass}>
                                <div className="flex items-center gap-2">Nombre Comercial <SortIcon columnKey="trade_name" /></div>
                            </th>
                            <th onClick={() => handleSort('legal_name')} className={thClass}>
                                <div className="flex items-center gap-2">Razón Social <SortIcon columnKey="legal_name" /></div>
                            </th>
                            <th onClick={() => handleSort('cuit')} className={thClass}>
                                <div className="flex items-center gap-2">CUIT <SortIcon columnKey="cuit" /></div>
                            </th>
                            <th onClick={() => handleSort('city')} className={thClass}>
                                <div className="flex items-center gap-2">Ciudad <SortIcon columnKey="city" /></div>
                            </th>
                            <th onClick={() => handleSort('province')} className={thClass}>
                                <div className="flex items-center gap-2">Provincia <SortIcon columnKey="province" /></div>
                            </th>
                            <th onClick={() => handleSort('comercial_name')} className={thClass}>
                                <div className="flex items-center gap-2">Comercial <SortIcon columnKey="comercial_name" /></div>
                            </th>
                            <th onClick={() => handleSort('status')} className={thClass}>
                                <div className="flex items-center gap-2">Estado <SortIcon columnKey="status" /></div>
                            </th>
                            <th onClick={() => handleSort('created_at')} className={thClass}>
                                <div className="flex items-center gap-2">Fecha Creación <SortIcon columnKey="created_at" /></div>
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {sortedProspects.map((prospect) => (
                            <tr
                                key={prospect.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {prospect.trade_name || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                    {prospect.legal_name || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">
                                    {prospect.cuit || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                    {prospect.city || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                    {prospect.province || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                    {prospect.comercial_name || '-'}
                                </td>
                                <td className="px-4 py-3">
                                    {(() => {
                                        const cfg = getStatusCfg(prospect.status);
                                        return (
                                            <div className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
                                                {/* Visible pill */}
                                                <div
                                                    className="inline-flex items-center gap-1.5 pl-2.5 pr-7 py-1 rounded-full border text-xs font-semibold pointer-events-none select-none"
                                                    style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border }}
                                                >
                                                    <span
                                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: cfg.dot }}
                                                    />
                                                    {cfg.label}
                                                    <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-60" />
                                                </div>
                                                {/* Invisible native select on top */}
                                                <select
                                                    value={prospect.status || 'contacted'}
                                                    onChange={(e) => onStatusChange?.(prospect.id, e.target.value)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                >
                                                    <option value="contacted">Contactado</option>
                                                    <option value="quoted">Cotizado</option>
                                                    <option value="near_closing">Por Cerrar</option>
                                                </select>
                                            </div>
                                        );
                                    })()}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                    {formatDate(prospect.created_at)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(prospect)}
                                            className="p-2 text-slate-600 dark:text-slate-400 hover:text-advanta-green dark:hover:text-advanta-green hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        {onAddContact && (
                                            <button
                                                onClick={() => onAddContact(prospect)}
                                                className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                title="Agregar Contacto"
                                            >
                                                <UserPlus size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onPromote(prospect)}
                                            className="p-2 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                                            title="Convertir a Cliente"
                                        >
                                            <UserCheck size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(prospect.id)}
                                            className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Empty State */}
            {sortedProspects.length === 0 && (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                    No se encontraron prospectos
                </div>
            )}

            {/* Pagination */}
            {onPageChange && (
                <Pagination
                    page={page ?? 0}
                    totalCount={totalCount ?? 0}
                    pageSize={pageSize ?? 50}
                    onPageChange={onPageChange}
                />
            )}
        </div>
    );
};

export default ProspectsTable;
