import React, { useState } from 'react';
import { Search, Filter, Plus, UserPlus, CheckCircle2, X } from 'lucide-react';
import ProspectCard from '../components/prospects/ProspectCard';
import EditProspectModal from '../components/prospects/EditProspectModal';
import ConvertToClientModal from '../components/clients/ConvertToClientModal';
import { useCompanies } from '../hooks/useCompanies';
import { useContacts } from '../hooks/useContacts';

const Prospects = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { companies: prospects, loading, createCompany, updateCompany, convertToClient } = useCompanies('prospect');
    const { contacts: allContacts } = useContacts();
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [selectedProspect, setSelectedProspect] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);


    // Filter Logic
    const filteredProspects = prospects.filter(p =>
        (p.trade_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.legal_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.cuit?.includes(searchTerm))
    );


    const handlePromoteClick = (prospect) => {
        setSelectedProspect(prospect);
        setIsConvertModalOpen(true);
    };

    const handleEditClick = (prospect) => {
        setSelectedProspect(prospect);
        setIsEditModalOpen(true);
    };

    const handleCreateClick = () => {
        setSelectedProspect({
            id: Date.now(), // Temporary ID
            created_at: new Date().toISOString(),
            status: 'contacted',
            trade_name: '',
            legal_name: '',
            cuit: '',
            contact: '',
            city: '',
            province: '',
            notes: ''
        });
        setIsEditModalOpen(true);
    };

    const handleSaveProspect = async (updatedProspect) => {
        try {
            if (updatedProspect.id && typeof updatedProspect.id === 'number' && updatedProspect.id > 1000000) {
                // New prospect (temporary ID)
                const result = await createCompany({
                    company_type: 'prospect',
                    trade_name: updatedProspect.tradeName || updatedProspect.trade_name,
                    legal_name: updatedProspect.companyName || updatedProspect.legal_name,
                    cuit: updatedProspect.cuit,
                    email: updatedProspect.email,
                    phone: updatedProspect.phone,
                    city: updatedProspect.city,
                    province: updatedProspect.province,
                    notes: updatedProspect.notes,
                    prospect_source: updatedProspect.source,
                    qualification_score: updatedProspect.qualification_score || 0
                });

                if (result.success) {
                    alert('Nuevo Prospecto creado exitosamente!');
                } else {
                    alert('Error al crear prospecto: ' + result.error);
                }
            } else {
                // Update existing prospect
                const result = await updateCompany(updatedProspect.id, {
                    trade_name: updatedProspect.tradeName || updatedProspect.trade_name,
                    legal_name: updatedProspect.companyName || updatedProspect.legal_name,
                    cuit: updatedProspect.cuit,
                    email: updatedProspect.email,
                    phone: updatedProspect.phone,
                    city: updatedProspect.city,
                    province: updatedProspect.province,
                    notes: updatedProspect.notes
                });

                if (result.success) {
                    alert('Prospecto actualizado exitosamente!');
                } else {
                    alert('Error al actualizar prospecto: ' + result.error);
                }
            }
            setIsEditModalOpen(false);
        } catch (error) {
            console.error('Error saving prospect:', error);
            alert('Error al guardar prospecto');
        }
    };


    const handleConfirmConversion = async (clientData) => {
        try {
            const result = await convertToClient(selectedProspect.id, {
                client_since: clientData.clientSince || new Date().toISOString().split('T')[0],
                payment_terms: clientData.paymentTerms,
                credit_limit: clientData.creditLimit
            });

            if (result.success) {
                alert(`¡Felicitaciones! ${selectedProspect.trade_name} ha sido convertido a Cliente.`);
                setIsConvertModalOpen(false);
            } else {
                alert('Error al convertir a cliente: ' + result.error);
            }
        } catch (error) {
            console.error('Error converting to client:', error);
            alert('Error al convertir a cliente');
        }
    };


    return (
        <div className="h-full flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Prospectos</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gestiona y califica tus potenciales clientes</p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm w-full md:w-auto">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex-1 md:w-80 border border-slate-100 dark:border-slate-600 focus-within:ring-2 ring-brand-red/10 dark:ring-red-500/20 transition-all">
                        <Search size={20} className="text-slate-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, empresa o CUIT..."
                            className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pr-2 pb-20 custom-scrollbar">
                {loading ? (
                    <div className="col-span-full flex items-center justify-center py-20">
                        <div className="text-slate-400 dark:text-slate-500">Cargando prospectos...</div>
                    </div>
                ) : filteredProspects.length === 0 ? (
                    <div className="col-span-full flex items-center justify-center py-20">
                        <div className="text-slate-400 dark:text-slate-500">No se encontraron prospectos</div>
                    </div>
                ) : (
                    filteredProspects.map(prospect => (
                        <ProspectCard
                            key={prospect.id}
                            prospect={prospect}
                            onPromote={handlePromoteClick}
                            onEdit={handleEditClick}
                            allContacts={allContacts}
                        />
                    ))
                )}


                {/* Add New Placeholder */}
                <button
                    onClick={handleCreateClick}
                    className="group border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:border-brand-red/50 dark:hover:border-red-500/50 hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-all min-h-[300px]"
                >
                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 border-2 border-slate-100 dark:border-slate-700 group-hover:border-brand-red/20 dark:group-hover:border-red-500/30 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-brand-red dark:group-hover:text-red-400 transition-all shadow-sm">
                        <Plus size={32} />
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 font-bold group-hover:text-brand-red dark:group-hover:text-red-400 transition-colors">Nuevo Prospecto</span>
                </button>
            </div>

            {/* Conversion Modal */}
            <ConvertToClientModal
                isOpen={isConvertModalOpen}
                onClose={() => setIsConvertModalOpen(false)}
                prospect={selectedProspect}
                onConvert={handleConfirmConversion}
            />

            {/* Edit Modal */}
            <EditProspectModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                prospect={selectedProspect}
                onSave={handleSaveProspect}
            />
        </div>
    );
};

export default Prospects;
