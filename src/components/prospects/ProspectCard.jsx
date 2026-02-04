import React, { useState } from 'react';
import { Calendar, Building2, FileDigit, Phone, Mail, ArrowRight, Pencil, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { safeFormat } from '../../utils/dateUtils';
import { es } from 'date-fns/locale';
import CompanyContactsSection from '../shared/CompanyContactsSection';

const statusConfig = {
    contacted: {
        id: 'contacted',
        label: 'Contacto Inicial',
        color: 'bg-blue-50 border-blue-100',
        textColor: 'text-blue-700'
    },
    quoted: {
        id: 'quoted',
        label: 'Cotizado',
        color: 'bg-orange-50 border-orange-100',
        textColor: 'text-orange-700'
    },
    near_closing: {
        id: 'near_closing',
        label: 'Cierre Cercano',
        color: 'bg-red-50 border-red-100',
        textColor: 'text-red-700'
    },
};

const ProspectCard = ({ prospect, onPromote, onEdit, allContacts = [] }) => {
    const [showContacts, setShowContacts] = useState(false);

    // Validación de datos
    if (!prospect) {
        console.error('🔍 [DEBUG] ProspectCard: prospect is null or undefined');
        return null;
    }

    const status = statusConfig[prospect.status] || statusConfig.contacted;

    // Get contacts linked to this prospect
    const prospectContacts = Array.isArray(allContacts) ? allContacts.filter(contact =>
        contact?.companies?.some(c => c.companyId === prospect.id && c.companyType === 'prospect')
    ) : [];

    return (
        <div
            className="group relative bg-white/60 dark:bg-slate-800/90 backdrop-blur-md border border-white/60 dark:border-slate-700 rounded-2xl p-3 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >

            {/* Header: Date & Status */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(prospect);
                        }}
                        className="p-1.5 mr-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-brand-red dark:hover:bg-red-600 hover:text-white text-slate-400 dark:text-slate-500 transition-all shadow-sm group-hover:shadow-md"
                        title="Editar Prospecto Completo"
                    >
                        <Pencil size={14} strokeWidth={2.5} />
                    </button>
                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-100/50 dark:bg-slate-700/50 px-2 py-0.5 rounded-lg">
                        <Calendar size={11} />
                        <span>{safeFormat(prospect.created_at, "dd MMM yyyy", { locale: es })}</span>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${status.color}`}>
                    <span className={`text-[9px] font-bold uppercase tracking-wide opacity-90 ${status.textColor}`}>
                        {status.label}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div
                onClick={() => onEdit(prospect)}
                className="space-y-2 mb-3 cursor-pointer"
            >
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-brand-red dark:group-hover:text-red-400 transition-colors">
                        {prospect.trade_name}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Building2 size={12} />
                        {prospect.legal_name}
                    </p>

                    {/* Inline Info: CUIT, Email, Phone */}
                    <div className="mt-2 space-y-1">
                        {/* CUIT */}
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <FileDigit size={12} className="text-slate-400 dark:text-slate-500" />
                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mr-1">CUIT:</span>
                            {prospect.cuit}
                        </p>

                        {/* Email */}
                        {prospect.contact && prospect.contact.includes('@') && (
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                <Mail size={12} className="text-slate-400 dark:text-slate-500" />
                                <a
                                    href={`mailto:${prospect.contact}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="hover:text-brand-red dark:hover:text-red-400 transition-colors truncate"
                                    title={prospect.contact}
                                >
                                    {prospect.contact}
                                </a>
                            </p>
                        )}

                        {/* Phone */}
                        {prospect.phone && (
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                <Phone size={12} className="text-slate-400 dark:text-slate-500" />
                                <a
                                    href={`tel:${prospect.phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="hover:text-brand-red dark:hover:text-red-400 transition-colors"
                                >
                                    {prospect.phone}
                                </a>
                            </p>
                        )}
                    </div>

                    {(prospect.city || prospect.province) && (
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-2 ml-0.5">
                            <MapPin size={10} />
                            {prospect.city}{prospect.city && prospect.province ? ', ' : ''}{prospect.province}
                        </p>
                    )}
                </div>
            </div>

            {prospectContacts.length > 0 && (
                <div className="mb-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowContacts(!showContacts);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 bg-brand-red/10 hover:bg-brand-red/20 rounded-xl transition-colors text-brand-red font-bold text-xs"
                    >
                        <span>Contactos ({prospectContacts.length})</span>
                        {showContacts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {showContacts && (
                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                            <CompanyContactsSection
                                contacts={allContacts}
                                companyId={prospect.id}
                                companyName={prospect.trade_name}
                                companyType="prospect"
                                isCompact={false}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Footer / Actions */}
            <div className="flex items-center justify-between pt-2">
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic line-clamp-1">
                    {prospect.notes}
                </div>

                {/* Promote Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onPromote(prospect);
                    }}
                    className="relative group/btn flex-shrink-0"
                    title="Convertir a Cliente"
                >
                    <div className="absolute inset-0 bg-brand-red/20 blur-xl rounded-full opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                    <img
                        src="/Diseno_sin_titulo.png"
                        alt="Promover a Cliente"
                        className="w-10 h-10 object-contain relative z-10 transition-transform duration-300 group-hover/btn:scale-110 drop-shadow-md hover:drop-shadow-xl"
                    />
                </button>
            </div>

        </div>
    );
};

export default ProspectCard;
