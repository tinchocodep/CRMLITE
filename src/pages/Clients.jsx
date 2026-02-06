import React, { useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import ClientCard from '../components/clients/ClientCard';
import ClientsTable from '../components/clients/ClientsTable';
import ConvertToClientModal from '../components/clients/ConvertToClientModal';
import { ComercialFilter } from '../components/shared/ComercialFilter';
import { useCompanies } from '../hooks/useCompanies';
import { useContacts } from '../hooks/useContacts';
import { useRoleBasedFilter } from '../hooks/useRoleBasedFilter';
import { useSystemToast } from '../hooks/useSystemToast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useDebounce } from '../hooks/useDebounce';


const Clients = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300); // Debounce search
    const { companies: clients, loading, createCompany, updateCompany, deleteCompany } = useCompanies('client');
    const { contacts: allContacts, linkToCompany, unlinkFromCompany } = useContacts();
    const { showSuccess, showError, showWarning } = useSystemToast();

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

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [expandedClientId, setExpandedClientId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, clientId: null });

    // Apply role-based filter first
    const roleFilteredClients = useMemo(() => {
        return filterDataByRole(clients);
    }, [clients, selectedComercialId, filterDataByRole]);

    // Then apply search filter with debounced value
    const filteredClients = roleFilteredClients.filter(c =>
        (c.trade_name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (c.legal_name || '').toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    const handleToggleExpand = (id) => {
        setExpandedClientId(prevId => prevId === id ? null : id);
    };

    const handleSaveClient = async (clientData) => {
        try {
            // Extract contactIds before preparing data
            const { contactIds, ...restClientData } = clientData;

            // Prepare the data with correct field names and company_type
            const dataToSave = {
                ...restClientData,
                company_type: 'client'
            };

            let result;
            let savedClientId;

            // Check if this is a new client (no id) or updating existing
            if (clientData.id) {
                // Update existing client
                // Before updating, check if CUIT already exists (excluding current client)
                if (clientData.cuit && clients && clients.length > 0) {
                    const existingCompany = clients.find(c =>
                        c.cuit === clientData.cuit && c.id !== clientData.id
                    );
                    if (existingCompany) {
                        showWarning(`Ya existe una empresa con el CUIT ${clientData.cuit}: ${existingCompany.trade_name || existingCompany.legal_name}. Por favor, edite la empresa existente o use un CUIT diferente.`);
                        return;
                    }
                }
                result = await updateCompany(clientData.id, dataToSave);
                savedClientId = clientData.id;
            } else {
                // Before creating, check if CUIT already exists
                if (clientData.cuit && clients && clients.length > 0) {
                    const existingCompany = clients.find(c => c.cuit === clientData.cuit);
                    if (existingCompany) {
                        showWarning(`Ya existe una empresa con el CUIT ${clientData.cuit}: ${existingCompany.trade_name || existingCompany.legal_name}. Por favor, edite la empresa existente o use un CUIT diferente.`);
                        return;
                    }
                }
                // Create new client
                result = await createCompany(dataToSave);
                savedClientId = result.data?.id;
            }

            if (result.success && savedClientId) {
                // Handle contact-company relationships
                if (contactIds && contactIds.length >= 0) {
                    console.log('💾 Saving contact-company relationships:', {
                        clientId: savedClientId,
                        selectedContactIds: contactIds,
                        allContacts: allContacts.length
                    });

                    // Get current contacts for this client
                    const currentContacts = allContacts.filter(contact =>
                        contact.companies?.some(company => company.companyId === savedClientId)
                    );
                    const currentContactIds = currentContacts.map(c => c.id);

                    console.log('📊 Current vs New contacts:', {
                        currentContactIds,
                        newContactIds: contactIds,
                        currentContacts: currentContacts.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))
                    });

                    // Find contacts to add (in contactIds but not in currentContactIds)
                    const contactsToAdd = contactIds.filter(id => !currentContactIds.includes(id));

                    // Find contacts to remove (in currentContactIds but not in contactIds)
                    const contactsToRemove = currentContactIds.filter(id => !contactIds.includes(id));

                    console.log('🔄 Contacts to add/remove:', {
                        toAdd: contactsToAdd,
                        toRemove: contactsToRemove
                    });

                    // Add new contacts
                    for (const contactId of contactsToAdd) {
                        try {
                            console.log('➕ Linking contact to company:', { contactId, companyId: savedClientId });
                            await linkToCompany(contactId, savedClientId, 'client', false);
                            console.log('✅ Successfully linked contact:', contactId);
                        } catch (err) {
                            console.error('❌ Error linking contact:', contactId, err);
                        }
                    }

                    // Remove unselected contacts
                    for (const contactId of contactsToRemove) {
                        try {
                            console.log('➖ Unlinking contact from company:', { contactId, companyId: savedClientId });
                            await unlinkFromCompany(contactId, savedClientId);
                            console.log('✅ Successfully unlinked contact:', contactId);
                        } catch (err) {
                            console.error('❌ Error unlinking contact:', contactId, err);
                        }
                    }

                    console.log('✅ Finished processing contact relationships');
                }

                showSuccess(clientData.id ? 'Cliente actualizado exitosamente!' : 'Cliente creado exitosamente!');
            } else {
                showError('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Error saving client:', error);
            showError('Error al guardar cliente');
        }
        setIsCreateModalOpen(false);
        setEditingClient(null);
    };

    const handleDeleteClient = (id) => {
        setConfirmDelete({ isOpen: true, clientId: id });
    };

    const confirmDeleteClient = async () => {
        const result = await deleteCompany(confirmDelete.clientId);
        if (!result.success) {
            showError('Error al eliminar cliente: ' + result.error);
        }
    };

    const handleEditClient = (client) => {
        setEditingClient(client);
        setIsCreateModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingClient(null);
        setIsCreateModalOpen(true);
    };

    return (
        <div className="h-full flex flex-col gap-6 p-4 md:p-6 xl:px-6 xl:pt-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Clientes</h1>
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
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex-1 md:w-80 border border-slate-100 dark:border-slate-600 focus-within:ring-2 ring-brand-red/10 dark:ring-red-500/20 transition-all">
                            <Search size={20} className="text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2 bg-gradient-to-r from-[#E76E53] to-red-600 hover:from-[#D55E43] hover:to-red-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95"
                        >
                            <Plus size={18} />
                            <span className="hidden md:inline">Nuevo</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile: Card Grid (< xl) */}
            <div className="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2 pb-20 custom-scrollbar items-start">
                {loading ? (
                    <div className="col-span-full flex items-center justify-center py-20">
                        <div className="text-slate-400 dark:text-slate-500">Cargando clientes...</div>
                    </div>
                ) : filteredClients.map(client => (
                    <ClientCard
                        key={client.id}
                        client={client}
                        onEdit={handleEditClient}
                        onDelete={handleDeleteClient}
                        isExpanded={expandedClientId === client.id}
                        onToggleExpand={() => handleToggleExpand(client.id)}
                        allContacts={allContacts}
                    />
                ))}
            </div>

            {/* Desktop: Table View (>= xl) */}
            <div className="hidden xl:block overflow-y-auto pb-20 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-slate-400 dark:text-slate-500">Cargando clientes...</div>
                    </div>
                ) : (
                    <ClientsTable
                        clients={filteredClients}
                        onEdit={handleEditClient}
                        allContacts={allContacts}
                    />
                )}
            </div>

            <ConvertToClientModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onConvert={handleSaveClient}
                prospect={editingClient} // Reusing prospect prop for editing existing client
                title={editingClient ? 'Editar Cliente' : 'Alta de Cliente'}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, clientId: null })}
                onConfirm={confirmDeleteClient}
                title="Eliminar cliente"
                message="¿Está seguro de eliminar este cliente? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
};

export default Clients;
