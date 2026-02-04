import React, { useState } from 'react';
import { Search, Plus, UserPlus } from 'lucide-react';
import ContactCard from '../components/contacts/ContactCard';
import ContactModal from '../components/contacts/ContactModal';
import { useContacts } from '../hooks/useContacts';

const Contacts = () => {
    const { contacts, loading, createContact, updateContact, deleteContact } = useContacts();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedContactId, setExpandedContactId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState(null);

    // Filter contacts based on search
    const filteredContacts = contacts.filter(contact => {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
        const email = (contact.email || '').toLowerCase();
        const phone = (contact.phone || '').toLowerCase();
        const companyName = (contact.company_name || '').toLowerCase();

        return fullName.includes(searchLower) ||
            email.includes(searchLower) ||
            phone.includes(searchLower) ||
            companyName.includes(searchLower);
    });

    const handleToggleExpand = (contactId) => {
        setExpandedContactId(expandedContactId === contactId ? null : contactId);
    };

    const handleEditContact = (contact) => {
        setEditingContact(contact);
        setIsModalOpen(true);
    };

    const handleDeleteContact = async (contactId) => {
        if (window.confirm('¿Estás seguro de eliminar este contacto?')) {
            const result = await deleteContact(contactId);
            if (!result.success) {
                alert('Error al eliminar contacto: ' + result.error);
            }
        }
    };

    const handleCreateContact = () => {
        setEditingContact(null);
        setIsModalOpen(true);
    };

    const handleSaveContact = async (contactData) => {
        try {
            let result;
            if (editingContact) {
                result = await updateContact(editingContact.id, contactData);
            } else {
                result = await createContact(contactData);
            }

            if (result.success) {
                handleCloseModal();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Error al guardar contacto');
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingContact(null);
    };

    return (
        <div className="h-full flex flex-col gap-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Contactos</h1>
                </div>

                <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl flex-1 md:w-80 border border-slate-100 focus-within:ring-2 ring-brand-red/10 transition-all">
                        <Search size={20} className="text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar contacto..."
                            className="bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-white rounded-xl p-2 border border-slate-200 shadow-sm">
                    <div className="text-xl font-bold text-slate-800">{contacts.length}</div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Total</div>
                </div>
                <div className="bg-white rounded-xl p-2 border border-blue-200 shadow-sm">
                    <div className="text-xl font-bold text-blue-700">
                        {contacts.filter(c => c.companies.some(comp => comp.companyType === 'prospect')).length}
                    </div>
                    <div className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide">Prospectos</div>
                </div>
                <div className="bg-white rounded-xl p-2 border border-green-200 shadow-sm">
                    <div className="text-xl font-bold text-green-700">
                        {contacts.filter(c => c.companies.some(comp => comp.companyType === 'client')).length}
                    </div>
                    <div className="text-[10px] text-green-600 font-semibold uppercase tracking-wide">Clientes</div>
                </div>
                <div className="bg-white rounded-xl p-2 border border-yellow-200 shadow-sm">
                    <div className="text-xl font-bold text-yellow-700">
                        {contacts.filter(c => c.companies.length > 1).length}
                    </div>
                    <div className="text-[10px] text-yellow-600 font-semibold uppercase tracking-wide">Multi-empresa</div>
                </div>
            </div>

            {/* Contacts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pr-2 pb-20 custom-scrollbar items-start">
                {loading ? (
                    <div className="col-span-full flex items-center justify-center py-20">
                        <div className="text-slate-400">Cargando contactos...</div>
                    </div>
                ) : filteredContacts.map(contact => (
                    <ContactCard
                        key={contact.id}
                        contact={contact}
                        onEdit={handleEditContact}
                        onDelete={handleDeleteContact}
                        isExpanded={expandedContactId === contact.id}
                        onToggleExpand={() => handleToggleExpand(contact.id)}
                    />
                ))}

                {/* Add New Contact Placeholder */}
                <button
                    onClick={handleCreateContact}
                    className="group border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:border-brand-red/50 hover:bg-red-50/30 transition-all min-h-[200px]"
                >
                    <div className="w-16 h-16 rounded-full bg-slate-50 group-hover:bg-white border-2 border-slate-100 group-hover:border-brand-red/20 flex items-center justify-center text-slate-400 group-hover:text-brand-red transition-all shadow-sm">
                        <UserPlus size={32} />
                    </div>
                    <span className="text-slate-500 font-bold group-hover:text-brand-red transition-colors">Nuevo Contacto</span>
                </button>
            </div>

            {/* No Results */}
            {filteredContacts.length === 0 && searchTerm && (
                <div className="text-center py-12">
                    <div className="text-slate-400 text-lg font-semibold">No se encontraron contactos</div>
                    <div className="text-slate-500 text-sm mt-2">Intenta con otros términos de búsqueda</div>
                </div>
            )}

            {/* Contact Modal */}
            <ContactModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveContact}
                contact={editingContact}
            />
        </div>
    );
};

export default Contacts;
