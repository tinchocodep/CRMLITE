import React, { useState, useEffect } from 'react';
import { Search, FolderOpen, FileCheck, FileWarning, Filter, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCompanies } from '../hooks/useCompanies';
import { supabase } from '../lib/supabase';
import LegajoModal from '../components/legajo/LegajoModal';

const Legajos = () => {
    const navigate = useNavigate();
    const { companies: rawCompanies, loading } = useCompanies();
    const [companies, setCompanies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Calculate progress for each company
    useEffect(() => {
        const calculateProgress = async () => {
            console.log('📊 [Progress] Starting calculation');
            console.log('📊 [Progress] Raw companies:', rawCompanies);

            if (!rawCompanies || rawCompanies.length === 0) {
                console.log('📊 [Progress] No companies, setting empty array');
                setCompanies([]);
                return;
            }

            // Get all file attachments
            const { data: attachments, error } = await supabase
                .from('file_attachments')
                .select('entity_id, document_type, status')
                .eq('entity_type', 'company')
                .eq('status', 'active');

            console.log('📊 [Progress] Attachments:', attachments);
            console.log('📊 [Progress] Error:', error);

            const companiesWithProgress = rawCompanies.map(company => {
                const companyDocs = attachments?.filter(att => att.entity_id === company.id) || [];
                console.log(`📊 [Progress] Company ${company.trade_name}: ${companyDocs.length} docs`);

                const progress = {
                    current: companyDocs.length,
                    total: 6
                };
                const legajoStatus = progress.current === progress.total ? 'complete' : 'incomplete';

                return {
                    ...company,
                    progress,
                    legajoStatus
                };
            });

            console.log('📊 [Progress] Final companies with progress:', companiesWithProgress);
            setCompanies(companiesWithProgress);
        };

        calculateProgress();
    }, [rawCompanies]);

    console.log('🔍 [Legajos] Component rendering');
    console.log('🔍 [Legajos] Companies:', companies);
    console.log('🔍 [Legajos] Loading:', loading);

    // Filter only clients (not prospects)
    const clients = companies.filter(c => c.company_type === 'client');
    console.log('🔍 [Legajos] Filtered clients:', clients);

    // Filter by search term
    const filteredClients = clients.filter(c =>
        ((c.trade_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || false) ||
        ((c.legal_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || false) ||
        (c.file_number && c.file_number.includes(searchTerm))
    );

    const handleOpenLegajo = (client) => {
        setSelectedClient(client);
        setIsModalOpen(true);
    };

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4">
                <div className="flex items-center gap-3 text-center md:text-left">
                    <button
                        onClick={() => navigate('/clientes')}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-brand-red"
                        title="Volver a Clientes"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Legajos Digitales</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl flex-1 md:w-80 border border-slate-100 focus-within:ring-2 ring-brand-red/10 transition-all">
                        <Search size={20} className="text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente o legajo..."
                            className="bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2 pb-20 custom-scrollbar">
                {filteredClients.map(client => (
                    <div
                        key={client.id}
                        onClick={() => handleOpenLegajo(client)}
                        className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-brand-red/30 hover:shadow-lg transition-all cursor-pointer group flex flex-col md:flex-row items-center gap-4 md:gap-6"
                    >
                        {/* Icon Status */}
                        <div className={`
                            w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors
                            ${client.legajoStatus === 'complete' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 group-hover:text-brand-red group-hover:bg-red-50'}
                        `}>
                            {client.legajoStatus === 'complete' ? <FileCheck size={24} /> : <FolderOpen size={24} />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 text-center md:text-left">
                            <h3 className="text-lg font-bold text-slate-800 group-hover:text-brand-red transition-colors">{client.trade_name}</h3>
                            <p className="text-sm text-slate-500">{client.legal_name}</p>
                        </div>

                        {/* File Number Badge */}
                        <div className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs font-mono font-bold text-slate-500">
                            LEG: {client.file_number || '---'}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full md:w-48">
                            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-1">
                                <span>Progreso</span>
                                <span>{client.progress.current}/{client.progress.total} Docs</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${client.legajoStatus === 'complete' ? 'bg-emerald-500' : 'bg-brand-red'}`}
                                    style={{ width: `${(client.progress.current / client.progress.total) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Warning if incomplete */}
                        {client.legajoStatus !== 'complete' && (
                            <div className="hidden md:block text-amber-500" title="Documentación incompleta">
                                <FileWarning size={20} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <LegajoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                client={selectedClient}
                legajo={selectedClient?.legajo}
            />
        </div>
    );
};

export default Legajos;
