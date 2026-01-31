import React, { useState } from 'react';
import { Calendar, Building2, FileDigit, Phone, Mail, ArrowRight, Pencil, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CompanyContactsSection from '../shared/CompanyContactsSection';

const statusConfig = {
    contacted: {
        id: 'contacted',
        label: 'Contacto Inicial',
        logo: '/logo_frio.png',
        color: 'bg-blue-50 border-blue-100',
        textColor: 'text-blue-700'
    },
    quoted: {
        id: 'quoted',
        label: 'Cotizado',
        logo: '/logo_tibio.png',
        color: 'bg-orange-50 border-orange-100',
        textColor: 'text-orange-700'
    },
    near_closing: {
        id: 'near_closing',
        label: 'Cierre Cercano',
        logo: '/logo_urgente.png',
        color: 'bg-red-50 border-red-100',
        textColor: 'text-red-700'
    },
};

const ProspectCard = ({ prospect, onPromote, onEdit, allContacts = [] }) => {
    const [showContacts, setShowContacts] = useState(false);
    const status = statusConfig[prospect.status] || statusConfig.contacted;

    // Get contacts linked to this prospect
    const prospectContacts = allContacts.filter(contact =>
        contact.companies?.some(c => c.companyId === prospect.id && c.companyType === 'prospect')
    );

    return (
        <div
            className="group relative bg-white/60 dark:bg-slate-800/90 backdrop-blur-md border border-white/60 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >

            {/* Header: Date & Status */}
            <div className="flex justify-between items-start mb-3">
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
                        <span>{format(new Date(prospect.date), "dd MMM yyyy", { locale: es })}</span>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={`flex items-center gap-1.5 pr-2.5 pl-0.5 py-0.5 rounded-full border ${status.color}`}>
                    <img src={status.logo} alt={status.label} className="w-5 h-5 object-contain" />
                    <span className={`text-[9px] font-bold uppercase tracking-wide opacity-90 ${status.textColor}`}>
                        {status.label}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div
                onClick={() => onEdit(prospect)}
                className="space-y-2 mb-4 cursor-pointer"
            >
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-brand-red dark:group-hover:text-red-400 transition-colors">
                        {prospect.tradeName}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Building2 size={12} />
                        {prospect.companyName}
                    </p>
                    {(prospect.city || prospect.province) && (
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5 ml-0.5">
                            <MapPin size={10} />
                            {prospect.city}{prospect.city && prospect.province ? ', ' : ''}{prospect.province}
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 group-hover:border-slate-200 dark:group-hover:border-slate-500 transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-500">
                            <FileDigit size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500">CUIT</p>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{prospect.cuit}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 group-hover:border-slate-200 dark:group-hover:border-slate-500 transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-500">
                            {prospect.contact.includes('@') ? <Mail size={14} /> : <Phone size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500">Contacto</p>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate" title={prospect.contact}>{prospect.contact}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contacts Section */}
            {prospectContacts.length > 0 && (
                <div className="mb-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowContacts(!showContacts);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors text-teal-700 font-bold text-xs"
                    >
                        <span>Contactos ({prospectContacts.length})</span>
                        {showContacts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {showContacts && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                            <CompanyContactsSection
                                contacts={allContacts}
                                companyId={prospect.id}
                                companyName={prospect.tradeName}
                                companyType="prospect"
                                isCompact={false}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Footer / Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100/50 dark:border-slate-700">
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
