import React, { useState } from 'react';
import { Building2, MapPin, Briefcase, FileText, ChevronDown, ChevronUp, Tractor, Leaf, Map, User, Pencil, Trash2 } from 'lucide-react';
import CompanyContactsSection from '../shared/CompanyContactsSection';

const importanceConfig = {
    low: { label: 'Estándar', logo: '/logo_frio.png', color: 'bg-blue-50 border-blue-100 text-blue-700' },
    medium: { label: 'Importante', logo: '/logo_tibio.png', color: 'bg-orange-50 border-orange-100 text-orange-700' },
    high: { label: 'Clave', logo: '/logo_urgente.png', color: 'bg-red-50 border-red-100 text-red-700' }
};

const ClientCard = ({ client, onEdit, onDelete, isExpanded, onToggleExpand, allContacts = [] }) => {
    const importance = importanceConfig[client.importance] || importanceConfig.low;

    return (
        <div className="mb-5">
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">

                {/* Header Section - Linear Layout for Mobile */}
                <div className="p-4 space-y-3">
                    {/* Top Row: Title + Importance Logo */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">
                                {client.tradeName}
                            </h3>
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mt-1">
                                <Building2 size={12} className="text-slate-400 dark:text-slate-500 shrink-0" />
                                <span className="truncate">{client.legalName}</span>
                            </div>
                        </div>
                        <img
                            src={importance.logo}
                            alt={importance.label}
                            className="w-10 h-10 object-contain shrink-0"
                        />
                    </div>

                    {/* Info Badges Row */}
                    <div className="flex flex-wrap gap-2">
                        <div className="px-2.5 py-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <MapPin size={11} strokeWidth={2.5} />
                            <span>{client.city}, {client.province}</span>
                        </div>
                        <div className="px-2.5 py-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <FileText size={11} strokeWidth={2.5} />
                            <span>LEG: {client.fileNumber}</span>
                        </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center gap-2 pt-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(client); }}
                            className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-brand-red dark:hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                            <Pencil size={14} />
                            Editar
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(client.id); }}
                            className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                            <Trash2 size={14} />
                            Eliminar
                        </button>
                    </div>
                </div>

                {/* Expandable Details */}
                <div className={`bg-slate-50/50 dark:bg-slate-900/50 border-t-2 border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} overflow-y-auto`}>
                    <div className="p-4 space-y-4">

                        {/* Units / Segments */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Map size={13} /> Unidades Productivas ({client.segments.length})
                            </h4>
                            <div className="space-y-2">
                                {client.segments.map(segment => (
                                    <div key={segment.id} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-xs text-slate-700 dark:text-slate-200 uppercase">{segment.name}</span>
                                            <span className="text-xs font-bold text-brand-red dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-md">{segment.hectares} Has</span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                                            <span className="flex items-center gap-1"><Leaf size={10} /> {segment.crops || 'N/A'}</span>
                                            <span className="flex items-center gap-1"><Tractor size={10} /> {segment.machinery || 'N/A'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Extra Info */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Unidad de Negocio</p>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">{client.businessUnit}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Comercial</p>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                                    <User size={12} /> {client.commercialRep}
                                </p>
                            </div>
                        </div>

                        {client.detail && (
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400 italic">"{client.detail}"</p>
                            </div>
                        )}

                        {/* Contacts Section */}
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                            <CompanyContactsSection
                                contacts={allContacts}
                                companyId={client.id}
                                companyName={client.tradeName}
                                companyType="client"
                                isCompact={false}
                            />
                        </div>

                    </div>
                </div>

                {/* Footer Toggle */}
                <button
                    onClick={onToggleExpand}
                    className="w-full py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-brand-red dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-t-2 border-slate-200 dark:border-slate-700"
                >
                    {isExpanded ? 'Ver Menos' : 'Ver Detalles'}
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>
        </div>
    );
};

export default ClientCard;
