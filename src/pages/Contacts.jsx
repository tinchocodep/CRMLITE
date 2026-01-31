import React, { useState } from 'react';
import { Search, Plus, UserPlus } from 'lucide-react';
import ContactCard from '../components/contacts/ContactCard';
import ContactModal from '../components/contacts/ContactModal';
import { mockContacts } from '../data/mockContacts';

const Contacts = () => {
    const [contacts, setContacts] = useState(mockContacts);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedContactId, setExpandedContactId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState(null);

    // Filter contacts based on search
    const filteredContacts = contacts.filter(contact => {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
        const email = contact.email?.toLowerCase() || '';
        const phone = contact.phone?.toLowerCase() || '';
        const companies = contact.companies.map(c => c.companyName.toLowerCase()).join(' ');

        return fullName.includes(searchLower) ||
            email.includes(searchLower) ||
            phone.includes(searchLower) ||
            companies.includes(searchLower);
    });

    const handleToggleExpand = (contactId) => {
        setExpandedContactId(expandedContactId === contactId ? null : contactId);
    };

    const handleEditContact = (contact) => {
        setEditingContact(contact);
        setIsModalOpen(true);
    };

    const handleDeleteContact = (contactId) => {
        const contact = contacts.find(c => c.id === contactId);
        const activeCompanies = contact.companies.filter(c => c.isCompanyActive);

        if (activeCompanies.length > 0) {
            const confirmMsg = `Este contacto está vinculado a ${activeCompanies.length} empresa(s) activa(s). ¿Estás seguro de eliminarlo?`;
            if (!window.confirm(confirmMsg)) {
                return;
            }
        }

        setContacts(contacts.filter(c => c.id !== contactId));
    };

    const handleCreateContact = () => {
        setEditingContact(null);
        setIsModalOpen(true);
    };

    const handleSaveContact = (contactData) => {
        if (editingContact) {
            // Update existing contact
            setContacts(contacts.map(c => c.id === contactData.id ? contactData : c));
        } else {
            // Add new contact
            setContacts([...contacts, contactData]);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingContact(null);
    };

    return (
        <div className="h-full flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Agenda de Contactos</h1>
                    <p className="text-slate-500 mt-1">Gestión de personas vinculadas a empresas</p>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-sm">
                    <div className="text-2xl font-bold text-slate-800">{contacts.length}</div>
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Total Contactos</div>
                </div>
                <div className="bg-white rounded-2xl p-4 border-2 border-blue-200 shadow-sm">
                    <div className="text-2xl font-bold text-blue-700">
                        {contacts.filter(c => c.companies.some(comp => comp.companyType === 'prospect')).length}
                    </div>
                    <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide">En Prospectos</div>
                </div>
                <div className="bg-white rounded-2xl p-4 border-2 border-green-200 shadow-sm">
                    <div className="text-2xl font-bold text-green-700">
                        {contacts.filter(c => c.companies.some(comp => comp.companyType === 'client')).length}
                    </div>
                    <div className="text-xs text-green-600 font-semibold uppercase tracking-wide">En Clientes</div>
                </div>
                <div className="bg-white rounded-2xl p-4 border-2 border-yellow-200 shadow-sm">
                    <div className="text-2xl font-bold text-yellow-700">
                        {contacts.filter(c => c.companies.length > 1).length}
                    </div>
                    <div className="text-xs text-yellow-600 font-semibold uppercase tracking-wide">Multi-empresa</div>
                </div>
            </div>

            {/* Contacts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pr-2 pb-20 custom-scrollbar items-start">
                {filteredContacts.map(contact => (
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
