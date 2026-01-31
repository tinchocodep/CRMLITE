import React, { useState } from 'react';
import { X, Search, ArrowRight } from 'lucide-react';

const ProspectPickerModal = ({ isOpen, onClose, prospects, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProspects = prospects.filter(p =>
        p.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">

                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Seleccionar Prospecto</h3>
                        <p className="text-xs text-slate-500">Busca el prospecto para convertir a cliente</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>

                <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-3 text-slate-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Buscar por nombre o empresa..."
                            className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-brand-red outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filteredProspects.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">No se encontraron prospectos</div>
                    ) : (
                        filteredProspects.map(prospect => (
                            <button
                                key={prospect.id}
                                onClick={() => onSelect(prospect)}
                                className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl group transition-colors border border-transparent hover:border-slate-100 text-left"
                            >
                                <div>
                                    <div className="font-bold text-slate-700 text-sm group-hover:text-brand-red transition-colors">{prospect.tradeName}</div>
                                    <div className="text-xs text-slate-500">{prospect.companyName}</div>
                                </div>
                                <div className="text-slate-300 group-hover:text-brand-red transition-colors">
                                    <ArrowRight size={16} />
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProspectPickerModal;
