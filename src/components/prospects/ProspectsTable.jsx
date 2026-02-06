import React, { useState, useMemo } from 'react';
import { Edit2, UserPlus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ProspectsTable = ({ prospects, onEdit, onPromote, allContacts }) => {
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

    // Status badge configuration
    const statusConfig = {
        contacted: { label: 'Contactado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        quoted: { label: 'Cotizado', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
        near_closing: { label: 'Por Cerrar', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
    };

    // Sorting logic
    const sortedProspects = useMemo(() => {
        if (!sortConfig.key) return prospects;

        return [...prospects].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle null/undefined values
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            // String comparison
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
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
        if (sortConfig.key !== columnKey) {
            return <ArrowUpDown size={14} className="opacity-40" />;
        }
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} className="text-brand-red" />
            : <ArrowDown size={14} className="text-brand-red" />;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
        } catch {
            return '-';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                        <tr>
                            <th
                                onClick={() => handleSort('trade_name')}
                                className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    Nombre Comercial
                                    <SortIcon columnKey="trade_name" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('legal_name')}
                                className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    Razón Social
                                    <SortIcon columnKey="legal_name" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('cuit')}
                                className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    CUIT
                                    <SortIcon columnKey="cuit" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('city')}
                                className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    Ciudad
                                    <SortIcon columnKey="city" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('province')}
                                className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    Provincia
                                    <SortIcon columnKey="province" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('comercial_name')}
                                className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    Comercial
                                    <SortIcon columnKey="comercial_name" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('status')}
                                className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    Estado
                                    <SortIcon columnKey="status" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('created_at')}
                                className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    Fecha Creación
                                    <SortIcon columnKey="created_at" />
                                </div>
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {sortedProspects.map((prospect) => {
                            const statusInfo = statusConfig[prospect.status] || statusConfig.contacted;

                            return (
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
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                            {statusInfo.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                        {formatDate(prospect.created_at)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onEdit(prospect)}
                                                className="p-2 text-slate-600 dark:text-slate-400 hover:text-brand-red dark:hover:text-brand-red hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => onPromote(prospect)}
                                                className="p-2 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                                                title="Convertir a Cliente"
                                            >
                                                <UserPlus size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Empty State */}
            {sortedProspects.length === 0 && (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                    No se encontraron prospectos
                </div>
            )}
        </div>
    );
};

export default ProspectsTable;
