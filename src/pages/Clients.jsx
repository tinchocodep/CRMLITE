import React, { useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import ClientCard from '../components/clients/ClientCard';
import ConvertToClientModal from '../components/clients/ConvertToClientModal';
import { ComercialFilter } from '../components/shared/ComercialFilter';
import { useCompanies } from '../hooks/useCompanies';
import { useContacts } from '../hooks/useContacts';
import { useRoleBasedFilter } from '../hooks/useRoleBasedFilter';

const Clients = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { companies: clients, loading, createCompany, updateCompany, deleteCompany } = useCompanies('client');
    const { contacts: allContacts } = useContacts();

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

    // Apply role-based filter first
    const roleFilteredClients = useMemo(() => {
        return filterDataByRole(clients);
    }, [clients, selectedComercialId, filterDataByRole]);

    // Then apply search filter
    const filteredClients = roleFilteredClients.filter(c =>
        (c.trade_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.legal_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleExpand = (id) => {
        setExpandedClientId(prevId => prevId === id ? null : id);
    };

    const handleSaveClient = async (clientData) => {
        try {
            // Prepare the data with correct field names and company_type
            const dataToSave = {
                ...clientData,
                company_type: 'client'
            };

            let result;

            // Check if this is a new client (no id) or updating existing
            if (clientData.id) {
                // Update existing client
                // Before updating, check if CUIT already exists (excluding current client)
                if (clientData.cuit && clients && clients.length > 0) {
                    const existingCompany = clients.find(c =>
                        c.cuit === clientData.cuit && c.id !== clientData.id
                    );
                    if (existingCompany) {
                        alert(`Ya existe una empresa con el CUIT ${clientData.cuit}: ${existingCompany.trade_name || existingCompany.legal_name}. Por favor, edite la empresa existente o use un CUIT diferente.`);
                        return;
                    }
                }
                result = await updateCompany(clientData.id, dataToSave);
            } else {
                // Before creating, check if CUIT already exists
                if (clientData.cuit && clients && clients.length > 0) {
                    const existingCompany = clients.find(c => c.cuit === clientData.cuit);
                    if (existingCompany) {
                        alert(`Ya existe una empresa con el CUIT ${clientData.cuit}: ${existingCompany.trade_name || existingCompany.legal_name}. Por favor, edite la empresa existente o use un CUIT diferente.`);
                        return;
                    }
                }
                // Create new client
                result = await createCompany(dataToSave);
            }

            if (result.success) {
                alert(clientData.id ? 'Cliente actualizado exitosamente!' : 'Cliente creado exitosamente!');
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Error saving client:', error);
            alert('Error al guardar cliente');
        }
        setIsCreateModalOpen(false);
        setEditingClient(null);
    };

    const handleDeleteClient = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este cliente?')) {
            const result = await deleteCompany(id);
            if (!result.success) {
                alert('Error al eliminar cliente: ' + result.error);
            }
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
        <div className="h-full flex flex-col gap-6 p-4 md:p-6">
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
                            className="px-4 py-2 bg-brand-red hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95"
                        >
                            <Plus size={18} />
                            <span className="hidden md:inline">Nuevo</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pr-2 pb-20 custom-scrollbar items-start">
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

            <ConvertToClientModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onConvert={handleSaveClient}
                prospect={editingClient} // Reusing prospect prop for editing existing client
            />
        </div>
    );
};

export default Clients;
