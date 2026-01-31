import React from 'react';
import { Building2, Mail, Phone, Briefcase, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';

const ContactCard = ({ contact, onEdit, onDelete, isExpanded, onToggleExpand }) => {
    // Get active companies count
    const activeCompanies = contact.companies.filter(c => c.isCompanyActive);
    const hasInactiveCompanies = contact.companies.some(c => !c.isCompanyActive);

    return (
        <div className="mb-5">
            <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">

                {/* Header Section */}
                <div className="p-4 space-y-3">
                    {/* Name Row */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-slate-800 leading-tight">
                                {contact.firstName} {contact.lastName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                <Building2 size={12} className="shrink-0" />
                                <span className="truncate">
                                    {activeCompanies.length} {activeCompanies.length === 1 ? 'empresa' : 'empresas'}
                                    {hasInactiveCompanies && ' (+ inactivas)'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    {(contact.email || contact.phone) && (
                        <div className="space-y-1.5">
                            {contact.email && (
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <Mail size={12} className="text-slate-400 shrink-0" />
                                    <span className="truncate">{contact.email}</span>
                                </div>
                            )}
                            {contact.phone && (
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <Phone size={12} className="text-slate-400 shrink-0" />
                                    <span>{contact.phone}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Companies Badges (collapsed view) */}
                    {!isExpanded && (
                        <div className="flex flex-wrap gap-2">
                            {contact.companies.slice(0, 2).map((company, idx) => (
                                <div
                                    key={idx}
                                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${!company.isCompanyActive
                                            ? 'bg-slate-100 border-slate-300 text-slate-400'
                                            : company.companyType === 'client'
                                                ? 'bg-green-50 border-green-200 text-green-700'
                                                : 'bg-blue-50 border-blue-200 text-blue-700'
                                        }`}
                                >
                                    <Briefcase size={11} strokeWidth={2.5} />
                                    <span className="truncate max-w-[120px]">{company.companyName}</span>
                                    {company.isPrimary && <span className="text-[10px]">★</span>}
                                </div>
                            ))}
                            {contact.companies.length > 2 && (
                                <div className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                                    +{contact.companies.length - 2} más
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(contact); }}
                            className="flex-1 px-3 py-2 bg-slate-100 hover:bg-brand-red hover:text-white text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                            <Pencil size={14} />
                            Editar
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(contact.id); }}
                            className="flex-1 px-3 py-2 bg-slate-100 hover:bg-red-600 hover:text-white text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                            <Trash2 size={14} />
                            Eliminar
                        </button>
                    </div>
                </div>

                {/* Expandable Details - Companies List */}
                <div className={`bg-slate-50/50 border-t-2 border-slate-200 transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} overflow-y-auto`}>
                    <div className="p-4 space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Building2 size={13} /> Empresas Vinculadas ({contact.companies.length})
                        </h4>

                        <div className="space-y-2">
                            {contact.companies.map((company, idx) => (
                                <div
                                    key={idx}
                                    className={`bg-white rounded-xl p-3 border shadow-sm ${!company.isCompanyActive
                                            ? 'border-slate-300 opacity-60'
                                            : 'border-slate-200'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-sm text-slate-700">
                                                    {company.companyName}
                                                </span>
                                                {company.isPrimary && (
                                                    <span className="px-1.5 py-0.5 bg-yellow-100 border border-yellow-300 text-yellow-700 text-[10px] font-bold rounded">
                                                        PRINCIPAL
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500 font-semibold">
                                                {company.role}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${company.companyType === 'client'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {company.companyType === 'client' ? 'CLIENTE' : 'PROSPECTO'}
                                            </span>
                                            {!company.isCompanyActive && (
                                                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md text-[10px] font-bold">
                                                    DESACTIVADA
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                        Vinculado desde: {new Date(company.addedDate).toLocaleDateString('es-AR')}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Notes */}
                        {contact.notes && (
                            <div className="pt-2 border-t border-slate-200">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Notas</p>
                                <p className="text-xs text-slate-600 italic">"{contact.notes}"</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Toggle */}
                <button
                    onClick={onToggleExpand}
                    className="w-full py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-red hover:bg-slate-50 transition-colors border-t-2 border-slate-200"
                >
                    {isExpanded ? 'Ver Menos' : 'Ver Detalles'}
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>
        </div>
    );
};

export default ContactCard;
