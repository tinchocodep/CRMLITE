import React, { useState, useMemo } from 'react';
import { Edit2, ArrowUpDown, ArrowUp, ArrowDown, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ClientsTable = ({ clients, onEdit, allContacts }) => {
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

    // Sorting logic
    const sortedClients = useMemo(() => {
        if (!sortConfig.key) return clients;

        return [...clients].sort((a, b) => {
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
    }, [clients, sortConfig]);

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
            <table className="w-full table-fixed">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                    <tr>
                        <th
                            onClick={() => handleSort('trade_name')}
                            className="w-[10%] px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="flex items-center gap-1.5">
                                Comercial
                                <SortIcon columnKey="trade_name" />
                            </div>
                        </th>
                        <th
                            onClick={() => handleSort('legal_name')}
                            className="w-[12%] px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="flex items-center gap-1.5">
                                Razón Social
                                <SortIcon columnKey="legal_name" />
                            </div>
                        </th>
                        <th
                            onClick={() => handleSort('cuit')}
                            className="w-[8%] px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="flex items-center gap-1.5">
                                CUIT
                                <SortIcon columnKey="cuit" />
                            </div>
                        </th>
                        <th className="w-[12%] px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                            Dirección
                        </th>
                        <th
                            onClick={() => handleSort('city')}
                            className="w-[7%] px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="flex items-center gap-1.5">
                                Ciudad
                                <SortIcon columnKey="city" />
                            </div>
                        </th>
                        <th
                            onClick={() => handleSort('province')}
                            className="w-[7%] px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="flex items-center gap-1.5">
                                Provincia
                                <SortIcon columnKey="province" />
                            </div>
                        </th>
                        <th className="w-[10%] px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                            Email
                        </th>
                        <th className="w-[7%] px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                            Teléfono
                        </th>
                        <th
                            onClick={() => handleSort('comercial_name')}
                            className="w-[7%] px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="flex items-center gap-1.5">
                                Vendedor
                                <SortIcon columnKey="comercial_name" />
                            </div>
                        </th>
                        <th
                            onClick={() => handleSort('payment_terms')}
                            className="w-[6%] px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="flex items-center gap-1.5">
                                Pago
                                <SortIcon columnKey="payment_terms" />
                            </div>
                        </th>
                        <th
                            onClick={() => handleSort('credit_limit')}
                            className="w-[6%] px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="flex items-center gap-1.5">
                                Crédito
                                <SortIcon columnKey="credit_limit" />
                            </div>
                        </th>
                        <th
                            onClick={() => handleSort('client_since')}
                            className="w-[6%] px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="flex items-center gap-1.5">
                                Desde
                                <SortIcon columnKey="client_since" />
                            </div>
                        </th>
                        <th className="w-[2%] px-3 py-2.5 text-center text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight">

                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {sortedClients.map((client) => {
                        return (
                            <tr
                                key={client.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <td className="px-3 py-2.5 text-[13px] font-medium text-slate-900 dark:text-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Building2 size={15} className="text-brand-red flex-shrink-0" />
                                        <span className="truncate" title={client.trade_name}>
                                            {client.trade_name || '-'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-3 py-2.5 text-[13px] text-slate-600 dark:text-slate-400">
                                    <span className="truncate block" title={client.legal_name}>
                                        {client.legal_name || '-'}
                                    </span>
                                </td>
                                <td className="px-3 py-2.5 text-[12px] text-slate-600 dark:text-slate-400 font-mono">
                                    <span className="truncate block">
                                        {client.cuit || '-'}
                                    </span>
                                </td>
                                <td className="px-3 py-2.5 text-[13px] text-slate-600 dark:text-slate-400">
                                    <span className="truncate block" title={client.address}>
                                        {client.address || '-'}
                                    </span>
                                </td>
                                <td className="px-2 py-2 text-xs text-slate-600 dark:text-slate-400">
                                    <span className="truncate block">
                                        {client.city || '-'}
                                    </span>
                                </td>
                                <td className="px-2 py-2 text-xs text-slate-600 dark:text-slate-400">
                                    <span className="truncate block">
                                        {client.province || '-'}
                                    </span>
                                </td>
                                <td className="px-2 py-2 text-xs text-slate-600 dark:text-slate-400">
                                    <span className="truncate block" title={client.email}>
                                        {client.email || '-'}
                                    </span>
                                </td>
                                <td className="px-2 py-2 text-xs text-slate-600 dark:text-slate-400">
                                    <span className="truncate block">
                                        {client.phone || '-'}
                                    </span>
                                </td>
                                <td className="px-2 py-2 text-xs text-slate-600 dark:text-slate-400">
                                    <span className="truncate block">
                                        {client.comercial_name || '-'}
                                    </span>
                                </td>
                                <td className="px-2 py-2 text-xs text-slate-600 dark:text-slate-400">
                                    <span className="truncate block">
                                        {client.payment_terms || '-'}
                                    </span>
                                </td>
                                <td className="px-2 py-2 text-xs text-slate-600 dark:text-slate-400">
                                    <span className="truncate block">
                                        {client.credit_limit ? `$${(client.credit_limit / 1000).toFixed(0)}k` : '-'}
                                    </span>
                                </td>
                                <td className="px-2 py-2 text-xs text-slate-600 dark:text-slate-400">
                                    <span className="truncate block">
                                        {client.client_since ? new Date(client.client_since).toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }) : '-'}
                                    </span>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                    <button
                                        onClick={() => onEdit(client)}
                                        className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-brand-red dark:hover:text-brand-red hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                                        title="Editar"
                                    >
                                        <Edit2 size={15} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Empty State */}
            {sortedClients.length === 0 && (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                    No se encontraron clientes
                </div>
            )}
        </div>
    );
};

export default ClientsTable;
