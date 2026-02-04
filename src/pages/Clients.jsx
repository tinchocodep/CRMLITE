import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import ClientCard from '../components/clients/ClientCard';
import ConvertToClientModal from '../components/clients/ConvertToClientModal';
import { useCompanies } from '../hooks/useCompanies';
import { useContacts } from '../hooks/useContacts';

const Clients = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { companies: clients, loading, createCompany, updateCompany, deleteCompany } = useCompanies('client');
    const { contacts: allContacts } = useContacts();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [expandedClientId, setExpandedClientId] = useState(null);

    const filteredClients = clients.filter(c =>
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
        <div className="h-full flex flex-col gap-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Clientes</h1>
                </div>

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

                {/* Add New Placeholder */}
                <button
                    onClick={openCreateModal}
                    className="group border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:border-brand-red/50 dark:hover:border-red-500/50 hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-all min-h-[200px]"
                >
                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 border-2 border-slate-100 dark:border-slate-700 group-hover:border-brand-red/20 dark:group-hover:border-red-500/30 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-brand-red dark:group-hover:text-red-400 transition-all shadow-sm">
                        <Plus size={32} />
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 font-bold group-hover:text-brand-red dark:group-hover:text-red-400 transition-colors">Nuevo Cliente Directo</span>
                </button>
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
