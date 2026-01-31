import React from 'react';
import { UserCheck, Mail, Phone, Star, Plus } from 'lucide-react';

/**
 * Reusable component to display contacts linked to a company (prospect or client)
 * Shows contact list with primary indicator and basic info
 */
const CompanyContactsSection = ({
    contacts = [],
    onAddContact,
    onEditContact,
    companyId,
    companyName,
    companyType = 'prospect',
    isCompact = false
}) => {
    // Filter contacts for this specific company
    const companyContacts = contacts.filter(contact =>
        contact.companies?.some(c => c.companyId === companyId)
    );

    // Get primary contact
    const primaryContact = companyContacts.find(contact =>
        contact.companies?.find(c => c.companyId === companyId)?.isPrimary
    );

    if (isCompact && companyContacts.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UserCheck size={16} className="text-slate-500" />
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                        Contactos ({companyContacts.length})
                    </h4>
                </div>
                {onAddContact && (
                    <button
                        onClick={onAddContact}
                        className="flex items-center gap-1 px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-bold transition-colors"
                    >
                        <Plus size={12} />
                        Agregar
                    </button>
                )}
            </div>

            {/* Contacts List */}
            {companyContacts.length > 0 ? (
                <div className="space-y-2">
                    {companyContacts.map(contact => {
                        const companyLink = contact.companies?.find(c => c.companyId === companyId);
                        const isPrimary = companyLink?.isPrimary;

                        return (
                            <div
                                key={contact.id}
                                onClick={() => onEditContact?.(contact)}
                                className={`bg-slate-50 border rounded-xl p-3 transition-all ${onEditContact ? 'cursor-pointer hover:bg-slate-100 hover:border-slate-300' : ''
                                    } ${isPrimary ? 'border-yellow-300 bg-yellow-50/50' : 'border-slate-200'}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        {/* Name and Primary Badge */}
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-sm text-slate-800 truncate">
                                                {contact.firstName} {contact.lastName}
                                            </span>
                                            {isPrimary && (
                                                <span className="px-1.5 py-0.5 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded text-[9px] font-bold flex items-center gap-0.5 shrink-0">
                                                    <Star size={9} fill="currentColor" />
                                                    PRINCIPAL
                                                </span>
                                            )}
                                        </div>

                                        {/* Role */}
                                        {companyLink?.role && (
                                            <div className="text-xs text-slate-600 font-semibold mb-2">
                                                {companyLink.role}
                                            </div>
                                        )}

                                        {/* Contact Info */}
                                        {!isCompact && (
                                            <div className="space-y-1">
                                                {contact.email && (
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <Mail size={11} className="shrink-0" />
                                                        <span className="truncate">{contact.email}</span>
                                                    </div>
                                                )}
                                                {contact.phone && (
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <Phone size={11} className="shrink-0" />
                                                        <span>{contact.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <UserCheck size={24} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400 font-semibold">
                        No hay contactos vinculados
                    </p>
                    {onAddContact && (
                        <button
                            onClick={onAddContact}
                            className="mt-2 text-xs text-teal-600 hover:text-teal-700 font-bold"
                        >
                            + Agregar contacto
                        </button>
                    )}
                </div>
            )}

            {/* Primary Contact Summary (Compact Mode) */}
            {isCompact && primaryContact && (
                <div className="flex items-center gap-2 text-xs">
                    <Star size={12} className="text-yellow-600" fill="currentColor" />
                    <span className="font-semibold text-slate-700">
                        {primaryContact.firstName} {primaryContact.lastName}
                    </span>
                    {primaryContact.email && (
                        <span className="text-slate-500 truncate">• {primaryContact.email}</span>
                    )}
                </div>
            )}
        </div>
    );
};

export default CompanyContactsSection;
