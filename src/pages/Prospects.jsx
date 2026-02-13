import React, { useState, useMemo, useCallback } from 'react';
import { Search, Filter, Plus, UserPlus, CheckCircle2, X } from 'lucide-react';
import ProspectCard from '../components/prospects/ProspectCard';
import ProspectsTable from '../components/prospects/ProspectsTable';
import EditProspectModal from '../components/prospects/EditProspectModal';
import ConvertToClientModal from '../components/clients/ConvertToClientModal';
import { ComercialFilter } from '../components/shared/ComercialFilter';
import { useCompanies } from '../hooks/useCompanies';
import { useContacts } from '../hooks/useContacts';
import { useRoleBasedFilter } from '../hooks/useRoleBasedFilter';
import { useSystemToast } from '../hooks/useSystemToast';
import { useAuth } from '../contexts/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { supabase } from '../lib/supabase';

const Prospects = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { companies: prospects, loading, createCompany, updateCompany, deleteCompany, convertToClient } = useCompanies('prospect');
    const { contacts: allContacts } = useContacts();
    const { showSuccess, showError, showWarning } = useSystemToast();
    const { comercialId } = useAuth();

    // Role-based filtering
    const {
        comerciales,
        selectedComercialId,
        setSelectedComercialId,
        canFilter,
        showAllOption,
        filterDataByRole,
        loading: filterLoading
    } = useRoleBasedFilter();

    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [selectedProspect, setSelectedProspect] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);


    // Debounce search term to avoid excessive filtering while typing
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Apply role-based filter first
    const roleFilteredProspects = useMemo(() => {
        return filterDataByRole(prospects);
    }, [prospects, selectedComercialId, filterDataByRole]);

    // Then apply search filter (memoized with debounced search)
    const filteredProspects = useMemo(() => {
        if (!debouncedSearchTerm) return roleFilteredProspects;

        const searchLower = debouncedSearchTerm.toLowerCase();
        return roleFilteredProspects.filter(p =>
            (p.trade_name || '').toLowerCase().includes(searchLower) ||
            (p.legal_name || '').toLowerCase().includes(searchLower) ||
            (p.cuit?.includes(debouncedSearchTerm))
        );
    }, [roleFilteredProspects, debouncedSearchTerm]);


    const handlePromoteClick = useCallback((prospect) => {
        setSelectedProspect(prospect);
        setIsConvertModalOpen(true);
    }, []);

    const handleEditClick = useCallback((prospect) => {
        setSelectedProspect(prospect);
        setIsEditModalOpen(true);
    }, []);

    const handleCreateClick = useCallback(() => {
        console.log('🆕 [Prospects] Creating new prospect with comercialId:', comercialId);
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
            notes: '',
            comercial_id: comercialId // Initialize with current user's comercial_id
        });
        setIsEditModalOpen(true);
    }, [comercialId]);

    const handleSaveProspect = async (updatedProspect) => {
        try {
            if (updatedProspect.id && typeof updatedProspect.id === 'number' && updatedProspect.id > 1000000) {
                // New prospect (temporary ID)
                // Before creating, check if CUIT already exists
                if (updatedProspect.cuit && prospects && prospects.length > 0) {
                    const existingCompany = prospects.find(c => c.cuit === updatedProspect.cuit);
                    if (existingCompany) {
                        showWarning(`Ya existe una empresa con el CUIT ${updatedProspect.cuit}: ${existingCompany.trade_name || existingCompany.legal_name}. Por favor, edite la empresa existente o use un CUIT diferente.`);
                        return;
                    }
                }

                console.log('📝 [Prospects] Creating prospect with data:', {
                    company_type: 'prospect',
                    comercial_id: updatedProspect.comercial_id,
                    trade_name: updatedProspect.tradeName || updatedProspect.trade_name,
                    legal_name: updatedProspect.companyName || updatedProspect.legal_name
                });

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
                    status: updatedProspect.status || 'contacted',
                    prospect_source: updatedProspect.source,
                    qualification_score: updatedProspect.qualification_score || 0,
                    comercial_id: updatedProspect.comercial_id
                });

                if (result.success) {
                    showSuccess('Nuevo Prospecto creado exitosamente!');
                } else {
                    showError('Error al crear prospecto: ' + result.error);
                }
            } else {
                // Update existing prospect
                // Before updating, check if CUIT already exists (excluding current prospect)
                if (updatedProspect.cuit && prospects && prospects.length > 0) {
                    const existingCompany = prospects.find(c =>
                        c.cuit === updatedProspect.cuit && c.id !== updatedProspect.id
                    );
                    if (existingCompany) {
                        showWarning(`Ya existe una empresa con el CUIT ${updatedProspect.cuit}: ${existingCompany.trade_name || existingCompany.legal_name}. Por favor, edite la empresa existente o use un CUIT diferente.`);
                        return;
                    }
                }

                const result = await updateCompany(updatedProspect.id, {
                    trade_name: updatedProspect.tradeName || updatedProspect.trade_name,
                    legal_name: updatedProspect.companyName || updatedProspect.legal_name,
                    cuit: updatedProspect.cuit,
                    email: updatedProspect.email,
                    phone: updatedProspect.phone,
                    city: updatedProspect.city,
                    province: updatedProspect.province,
                    notes: updatedProspect.notes,
                    status: updatedProspect.status,
                    comercial_id: updatedProspect.comercial_id
                });

                if (result.success) {
                    showSuccess('Prospecto actualizado exitosamente!');
                } else {
                    showError('Error al actualizar prospecto: ' + result.error);
                }
            }
            setIsEditModalOpen(false);
        } catch (error) {
            console.error('Error saving prospect:', error);
            showError('Error al guardar prospecto');
        }
    };


    const handleConfirmConversion = async (clientData) => {
        try {
            console.log('🔍 [Prospects] Starting conversion for prospect:', selectedProspect);
            console.log('📦 [Prospects] Client data received from modal:', clientData);
            // Extract contactIds and file_number before preparing data
            // file_number should NOT be sent in the update - let the database trigger handle it
            // id should NOT be sent in the update - it's used as a query parameter
            const { contactIds, file_number, id, ...restClientData } = clientData;

            // Prepare the data for updating the prospect to client
            // NOTE: Do NOT include 'id' or 'file_number' in the update payload
            // - 'id' is used as a filter parameter
            // - 'file_number' is handled by the database trigger auto_assign_file_number()
            const dataToUpdate = {
                ...restClientData,
                company_type: 'client'
            };

            console.log('🔍 [Prospects] Updating prospect to client with data:', dataToUpdate);
            console.log('📋 [Prospects] Fields in dataToUpdate:', Object.keys(dataToUpdate));
            console.log('🚨 [Prospects] Has file_number?', 'file_number' in dataToUpdate, dataToUpdate.file_number);

            // Update the existing prospect record to become a client
            const result = await updateCompany(selectedProspect.id, dataToUpdate);

            if (result.success) {
                // Handle contact-company relationships if contactIds provided
                if (contactIds && contactIds.length > 0) {
                    console.log('💾 [Prospects] Creating contact-company relationships:', {
                        clientId: selectedProspect.id,
                        selectedContactIds: contactIds
                    });

                    // Add contacts to the newly converted client
                    for (const contactId of contactIds) {
                        try {
                            const { error: relationError } = await supabase
                                .from('contact_companies')
                                .insert([{
                                    contact_id: contactId,
                                    company_id: selectedProspect.id,
                                    is_primary: false,
                                    tenant_id: selectedProspect.tenant_id
                                }]);

                            if (relationError) {
                                console.error('Error adding contact relationship:', relationError);
                            }
                        } catch (err) {
                            console.error('Error in contact relationship loop:', err);
                        }
                    }
                }

                showSuccess(`¡Felicitaciones! ${clientData.trade_name || clientData.legal_name} ha sido convertido a Cliente.`);
                setIsConvertModalOpen(false);
            } else {
                showError('Error al convertir a cliente: ' + result.error);
            }
        } catch (error) {
            console.error('Error converting to client:', error);
            showError('Error al convertir a cliente');
        }
    };




    return (
        <div className="h-full flex flex-col gap-6 p-4 md:p-6 xl:px-6 xl:pt-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Prospectos</h1>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
                    {/* Comercial Filter (Admin & Supervisor only) */}
                    {canFilter && (
                        <ComercialFilter
                            comerciales={comerciales}
                            selectedComercialId={selectedComercialId}
                            onComercialChange={setSelectedComercialId}
                            showAllOption={showAllOption}
                            loading={filterLoading}
                        />
                    )}

                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm w-full md:w-auto">
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex-1 md:w-80 border border-slate-100 dark:border-slate-600 focus-within:ring-2 ring-advanta-green/10 dark:ring-red-500/20 transition-all">
                            <Search size={20} className="text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, empresa o CUIT..."
                                className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleCreateClick}
                            className="px-4 py-2 bg-gradient-to-r from-[#44C12B] to-[#4BA323] hover:from-[#3a9120] hover:to-[#3d8a1f] text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95"
                        >
                            <Plus size={18} />
                            <span className="hidden md:inline">Nuevo</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile: Card Grid (< xl) */}
            <div className="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2 pb-20 custom-scrollbar">
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
            </div>

            {/* Desktop: Table View (>= xl) */}
            <div className="hidden xl:block overflow-y-auto pr-2 pb-20 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-slate-400 dark:text-slate-500">Cargando prospectos...</div>
                    </div>
                ) : (
                    <ProspectsTable
                        prospects={filteredProspects}
                        onEdit={handleEditClick}
                        onPromote={handlePromoteClick}
                        onDelete={deleteCompany}
                        allContacts={allContacts}
                    />
                )}
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
