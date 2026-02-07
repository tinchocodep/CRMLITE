import React, { useState, useMemo } from 'react';
import { User, Mail, Phone, Building2, Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ContactsTable = ({ contacts, onEdit, onDelete }) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Sorting logic
    const sortedContacts = useMemo(() => {
        if (!sortConfig.key) return contacts;

        return [...contacts].sort((a, b) => {
            let aValue, bValue;

            switch (sortConfig.key) {
                case 'fullName':
                    aValue = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
                    bValue = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
                    break;
                case 'email':
                    aValue = (a.email || '').toLowerCase();
                    bValue = (b.email || '').toLowerCase();
                    break;
                case 'phone':
                    aValue = a.phone || '';
                    bValue = b.phone || '';
                    break;
                case 'primaryCompany':
                    const aPrimary = a.companies.find(c => c.isPrimary);
                    const bPrimary = b.companies.find(c => c.isPrimary);
                    aValue = (aPrimary?.companyName || '').toLowerCase();
                    bValue = (bPrimary?.companyName || '').toLowerCase();
                    break;
                case 'role':
                    const aRole = a.companies.find(c => c.isPrimary);
                    const bRole = b.companies.find(c => c.isPrimary);
                    aValue = (aRole?.role || '').toLowerCase();
                    bValue = (bRole?.role || '').toLowerCase();
                    break;
                case 'createdAt':
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [contacts, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return null;
        return sortConfig.direction === 'asc' ?
            <ChevronUp size={14} className="text-advanta-green" /> :
            <ChevronDown size={14} className="text-advanta-green" />;
    };

    const getPrimaryCompany = (contact) => {
        const primary = contact.companies.find(c => c.isPrimary);
        return primary || contact.companies[0] || null;
    };

    const getCompanyTypeColor = (type) => {
        switch (type) {
            case 'client': return 'text-green-600 dark:text-green-400';
            case 'prospect': return 'text-blue-600 dark:text-blue-400';
            case 'supplier': return 'text-purple-600 dark:text-purple-400';
            default: return 'text-slate-600 dark:text-slate-400';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px]">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                        <tr>
                            <th
                                onClick={() => handleSort('fullName')}
                                className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                                <div className="flex items-center gap-1.5">
                                    Nombre Completo
                                    <SortIcon columnKey="fullName" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('email')}
                                className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                                <div className="flex items-center gap-1.5">
                                    Email
                                    <SortIcon columnKey="email" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('phone')}
                                className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                                <div className="flex items-center gap-1.5">
                                    Teléfono
                                    <SortIcon columnKey="phone" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('primaryCompany')}
                                className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                                <div className="flex items-center gap-1.5">
                                    Empresa Principal
                                    <SortIcon columnKey="primaryCompany" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('role')}
                                className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                                <div className="flex items-center gap-1.5">
                                    Cargo
                                    <SortIcon columnKey="role" />
                                </div>
                            </th>
                            <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight whitespace-nowrap">
                                Empresas
                            </th>
                            <th
                                onClick={() => handleSort('createdAt')}
                                className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                                <div className="flex items-center gap-1.5">
                                    Creado
                                    <SortIcon columnKey="createdAt" />
                                </div>
                            </th>
                            <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-tight whitespace-nowrap">

                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {sortedContacts.map((contact) => {
                            const primaryCompany = getPrimaryCompany(contact);
                            const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();

                            return (
                                <tr
                                    key={contact.id}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <td className="px-3 py-2.5 text-[13px] font-medium text-slate-900 dark:text-slate-100">
                                        <div className="flex items-center gap-2">
                                            <User size={15} className="text-advanta-green flex-shrink-0" />
                                            <span className="truncate" title={fullName}>
                                                {fullName || '-'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-[13px] text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center gap-2">
                                            {contact.email ? (
                                                <>
                                                    <Mail size={15} className="text-slate-400 flex-shrink-0" />
                                                    <span className="truncate" title={contact.email}>
                                                        {contact.email}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-[13px] text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center gap-2">
                                            {contact.phone ? (
                                                <>
                                                    <Phone size={15} className="text-slate-400 flex-shrink-0" />
                                                    <span>{contact.phone}</span>
                                                </>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-[13px] text-slate-700 dark:text-slate-300">
                                        {primaryCompany ? (
                                            <div className="flex items-center gap-2">
                                                <Building2 size={15} className={`flex-shrink-0 ${getCompanyTypeColor(primaryCompany.companyType)}`} />
                                                <span className="truncate" title={primaryCompany.companyName}>
                                                    {primaryCompany.companyName}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5 text-[13px] text-slate-700 dark:text-slate-300">
                                        <span className="truncate" title={primaryCompany?.role}>
                                            {primaryCompany?.role || '-'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-[13px] text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold text-advanta-green">
                                                {contact.companies.length}
                                            </span>
                                            {contact.companies.length > 1 && (
                                                <span className="text-[11px] text-slate-500">
                                                    (+{contact.companies.length - 1})
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-[13px] text-slate-700 dark:text-slate-300">
                                        {contact.createdAt ? (
                                            <span title={format(new Date(contact.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}>
                                                {format(new Date(contact.createdAt), 'MMM yy', { locale: es })}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                        <button
                                            onClick={() => onEdit(contact)}
                                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-advanta-green dark:hover:text-advanta-green hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                                            title="Editar"
                                        >
                                            <Edit2 size={15} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(contact.id)}
                                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all ml-1"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Empty State */}
                {sortedContacts.length === 0 && (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                        No se encontraron contactos
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactsTable;
