import React, { useState } from 'react';
import { Building2, MapPin, Briefcase, FileText, ChevronDown, ChevronUp, Tractor, Leaf, Map, User, Pencil, Trash2, Mail, Phone, FileDigit, FileCheck, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CompanyContactsSection from '../shared/CompanyContactsSection';
import { useLegajoDocuments } from '../../hooks/useLegajoDocuments';

const importanceConfig = {
    low: { label: 'Baja', color: 'bg-blue-50 border-blue-100 text-blue-700' },
    medium: { label: 'Media', color: 'bg-orange-50 border-orange-100 text-orange-700' },
    high: { label: 'Alta', color: 'bg-red-50 border-red-100 text-red-700' }
};

const ClientCard = ({ client, onEdit, onDelete, isExpanded, onToggleExpand, allContacts = [] }) => {
    const navigate = useNavigate();
    const importance = importanceConfig[client.importance] || importanceConfig.low;

    // Get real legajo progress
    const { getCompletionStats } = useLegajoDocuments(client.id);
    const stats = getCompletionStats();

    const totalDocs = stats.total;
    const uploadedDocs = stats.uploaded;
    const legajoStatus = stats.uploaded === stats.total ? 'complete' : stats.uploaded > 0 ? 'incomplete' : 'empty';
    const progressPercentage = stats.total > 0 ? (stats.uploaded / stats.total) * 100 : 0;

    const handleLegajoClick = (e) => {
        e.stopPropagation();
        navigate('/legajo');
    };

    return (
        <div className="mb-5">
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">

                {/* Header Section - Compact Layout */}
                <div className="p-3 space-y-2">
                    {/* Top Row: Edit Button, Title + Importance Badge */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(client); }}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-brand-red dark:hover:bg-red-600 hover:text-white text-slate-400 dark:text-slate-500 transition-all shadow-sm"
                                title="Editar Cliente"
                            >
                                <Pencil size={14} strokeWidth={2.5} />
                            </button>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">
                                        {client.trade_name || client.legal_name || 'Sin nombre'}
                                    </h3>
                                    {/* Importance Badge */}
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${importance.color} whitespace-nowrap`}>
                                        {importance.label}
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <Building2 size={12} />
                                    <span className="truncate">{client.legal_name || client.trade_name || '---'}</span>
                                </p>

                                {/* Inline Info: CUIT, Email, Phone */}
                                <div className="mt-2 space-y-1">
                                    {/* CUIT */}
                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                        <FileDigit size={12} className="text-slate-400 dark:text-slate-500" />
                                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mr-1">CUIT:</span>
                                        {client.cuit}
                                    </p>

                                    {/* Email */}
                                    {client.email && (
                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                            <Mail size={12} className="text-slate-400 dark:text-slate-500" />
                                            <a
                                                href={`mailto:${client.email}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="hover:text-brand-red dark:hover:text-red-400 transition-colors truncate"
                                                title={client.email}
                                            >
                                                {client.email}
                                            </a>
                                        </p>
                                    )}

                                    {/* Phone */}
                                    {client.phone && (
                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                            <Phone size={12} className="text-slate-400 dark:text-slate-500" />
                                            <a
                                                href={`tel:${client.phone}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="hover:text-brand-red dark:hover:text-red-400 transition-colors"
                                            >
                                                {client.phone}
                                            </a>
                                        </p>
                                    )}
                                </div>

                                {/* Location */}
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-2">
                                    <MapPin size={10} />
                                    {client.city}, {client.province}
                                </p>
                            </div>
                        </div>


                    </div>

                    {/* Legajo Progress - Clickable */}
                    <button
                        onClick={handleLegajoClick}
                        className="w-full p-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-xl transition-all active:scale-95"
                        title="Ver Legajo Completo"
                    >
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${legajoStatus === 'complete' ? 'bg-emerald-50 text-emerald-600' :
                                legajoStatus === 'incomplete' ? 'bg-orange-50 text-orange-600' :
                                    'bg-slate-100 text-slate-400'
                                }`}>
                                {legajoStatus === 'complete' ? <FileCheck size={16} /> : <FolderOpen size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">
                                    <span>Legajo: {client.file_number || '---'}</span>
                                    <span>{uploadedDocs}/{totalDocs} Docs</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${legajoStatus === 'complete' ? 'bg-emerald-500' :
                                            legajoStatus === 'incomplete' ? 'bg-orange-500' :
                                                'bg-slate-400'
                                            }`}
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Action Buttons Row */}
                    <div className="flex items-center gap-2">
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
                <div className={`bg-white dark:bg-slate-900/50 border-t-2 border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} overflow-y-auto`}>
                    <div className="p-4 space-y-4">

                        {/* Units / Segments */}
                        {client.segments && client.segments.length > 0 && (
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
                        )}

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
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                            <CompanyContactsSection
                                contacts={allContacts}
                                companyId={client.id}
                                companyName={client.trade_name || client.legal_name}
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
