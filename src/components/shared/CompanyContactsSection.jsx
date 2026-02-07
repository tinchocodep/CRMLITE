import React, { useState } from 'react';
import { UserCheck, Mail, Phone, Star, Plus, MessageSquare, UserPlus } from 'lucide-react';

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
    const [expandedContacts, setExpandedContacts] = useState({});

    // Filter contacts for this specific company
    const companyContacts = (contacts || []).filter(contact =>
        (contact.companies || []).some(c => c.companyId === companyId)
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
                        className="flex items-center gap-1 px-2 py-1 bg-advanta-green/10 hover:bg-advanta-green/20 text-advanta-green rounded-lg text-xs font-bold transition-colors"
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
                        const isExpanded = expandedContacts[contact.id] || false;

                        return (
                            <div
                                key={contact.id}
                                className={`bg-slate-50 border rounded-xl overflow-hidden transition-all ${isPrimary ? 'border-yellow-300 bg-yellow-50/50' : 'border-slate-200'
                                    }`}
                            >
                                {/* Main Contact Card - Clickable */}
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedContacts(prev => ({
                                            ...prev,
                                            [contact.id]: !prev[contact.id]
                                        }));
                                    }}
                                    className="p-3 cursor-pointer hover:bg-slate-100 transition-colors"
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

                                            {/* Quick Actions */}
                                            {!isCompact && (
                                                <div className="flex items-center gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                                                    {contact.phone && (
                                                        <>
                                                            <a
                                                                href={`tel:${contact.phone}`}
                                                                className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                                                                title="Llamar"
                                                            >
                                                                <Phone size={12} />
                                                            </a>
                                                            <a
                                                                href={`sms:${contact.phone}`}
                                                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                                                                title="Enviar mensaje"
                                                            >
                                                                <MessageSquare size={12} />
                                                            </a>
                                                        </>
                                                    )}
                                                    {contact.email && (
                                                        <a
                                                            href={`mailto:${contact.email}`}
                                                            className="p-1.5 bg-advanta-green/10 hover:bg-advanta-green/20 text-advanta-green rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                                                            title="Enviar email"
                                                        >
                                                            <Mail size={12} />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Generate vCard
                                                            const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.firstName} ${contact.lastName}
N:${contact.lastName};${contact.firstName};;;
${contact.email ? `EMAIL:${contact.email}` : ''}
${contact.phone ? `TEL:${contact.phone}` : ''}
ORG:${companyName}
TITLE:${companyLink?.role || ''}
END:VCARD`;
                                                            const blob = new Blob([vCard], { type: 'text/vcard' });
                                                            const url = window.URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = `${contact.firstName}_${contact.lastName}.vcf`;
                                                            a.click();
                                                            window.URL.revokeObjectURL(url);
                                                        }}
                                                        className="p-1.5 bg-advanta-green/10 hover:bg-advanta-green/20 text-advanta-green rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                                                        title="Agregar a contactos"
                                                    >
                                                        <UserPlus size={12} />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Contact Info (smaller, below actions) */}
                                            {!isCompact && (
                                                <div className="flex flex-col gap-0.5 text-[10px] text-slate-400 mt-2">
                                                    {contact.email && <span>{contact.email}</span>}
                                                    {contact.phone && <span>{contact.phone}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && !isCompact && (
                                    <div className="border-t border-slate-200 bg-white p-3 space-y-3">
                                        <h5 className="text-xs font-bold text-slate-500 uppercase">Empresas Vinculadas</h5>
                                        {contact.companies && contact.companies.map((company, idx) => (
                                            <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold text-xs text-slate-700">{company.companyName}</span>
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${company.companyType === 'client'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {company.companyType === 'client' ? 'CLIENTE' : 'PROSPECTO'}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-slate-500">{company.role}</div>
                                            </div>
                                        ))}
                                        {contact.notes && (
                                            <div className="pt-2 border-t border-slate-200">
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Notas</p>
                                                <p className="text-xs text-slate-600 italic">"{contact.notes}"</p>
                                            </div>
                                        )}
                                    </div>
                                )}
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
