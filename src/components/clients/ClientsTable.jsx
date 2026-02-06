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
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                        <tr>
                            <th
                                onClick={() => handleSort('trade_name')}
                                className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                                <div className="flex items-center gap-2">
                                    Nombre Comercial
                                    <SortIcon columnKey="trade_name" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('legal_name')}
                                className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                                <div className="flex items-center gap-2">
                                    Razón Social
                                    <SortIcon columnKey="legal_name" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('cuit')}
                                className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                                <div className="flex items-center gap-2">
                                    CUIT
                                    <SortIcon columnKey="cuit" />
                                </div>
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                Dirección
                            </th>
                            <th
                                onClick={() => handleSort('city')}
                                className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                                <div className="flex items-center gap-2">
                                    Ciudad
                                    <SortIcon columnKey="city" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('province')}
                                className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                                <div className="flex items-center gap-2">
                                    Provincia
                                    <SortIcon columnKey="province" />
                                </div>
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                Email
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                Teléfono
                            </th>
                            <th
                                onClick={() => handleSort('comercial_name')}
                                className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                                <div className="flex items-center gap-2">
                                    Comercial
                                    <SortIcon columnKey="comercial_name" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('payment_terms')}
                                className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                                <div className="flex items-center gap-2">
                                    Condición Pago
                                    <SortIcon columnKey="payment_terms" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('credit_limit')}
                                className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                                <div className="flex items-center gap-2">
                                    Límite Crédito
                                    <SortIcon columnKey="credit_limit" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('client_since')}
                                className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                                <div className="flex items-center gap-2">
                                    Cliente Desde
                                    <SortIcon columnKey="client_since" />
                                </div>
                            </th>
                            <th className="px-3 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {sortedClients.map((client) => {
                            const fullAddress = [client.address, client.city, client.province]
                                .filter(Boolean)
                                .join(', ');

                            return (
                                <tr
                                    key={client.id}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <td className="px-3 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={16} className="text-brand-red flex-shrink-0" />
                                            <span className="truncate max-w-[150px]" title={client.trade_name}>
                                                {client.trade_name || '-'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-400 max-w-[180px]">
                                        <span className="truncate block" title={client.legal_name}>
                                            {client.legal_name || '-'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                                        {client.cuit || '-'}
                                    </td>
                                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-400 max-w-[200px]">
                                        <span className="truncate block" title={client.address}>
                                            {client.address || '-'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                        {client.city || '-'}
                                    </td>
                                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                        {client.province || '-'}
                                    </td>
                                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-400 max-w-[180px]">
                                        <span className="truncate block" title={client.email}>
                                            {client.email || '-'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                        {client.phone || '-'}
                                    </td>
                                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                        {client.comercial_name || '-'}
                                    </td>
                                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                        {client.payment_terms || '-'}
                                    </td>
                                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                        {client.credit_limit ? `$${client.credit_limit.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                        {formatDate(client.client_since)}
                                    </td>
                                    <td className="px-3 py-3 text-right whitespace-nowrap">
                                        <button
                                            onClick={() => onEdit(client)}
                                            className="p-2 text-slate-600 dark:text-slate-400 hover:text-brand-red dark:hover:text-brand-red hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

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
