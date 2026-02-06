import React, { useMemo } from 'react';
import { Users, X, UserPlus } from 'lucide-react';
import { useContacts } from '../../hooks/useContacts';

/**
 * ContactSelector Component
 * 
 * Allows selecting contacts filtered by comercial_id
 * Used in client modals to assign contacts to companies
 * 
 * @param {string} comercialId - ID of the comercial to filter contacts
 * @param {Array} selectedContactIds - Array of currently selected contact IDs
 * @param {Function} onChange - Callback when selection changes
 * @param {string} label - Label for the selector
 */
const ContactSelector = ({ comercialId, selectedContactIds = [], onChange, label = "Contactos Asignados" }) => {
    const { contacts, loading } = useContacts();

    // Filter contacts by comercial_id
    const availableContacts = useMemo(() => {
        if (!comercialId) return [];

        return contacts.filter(contact => {
            // Get the comercial_id from the original contact data
            const contactComercialId = contact._original?.comercial_id;
            return contactComercialId === comercialId;
        });
    }, [contacts, comercialId]);

    // Get selected contact objects
    const selectedContacts = useMemo(() => {
        return availableContacts.filter(contact => selectedContactIds.includes(contact.id));
    }, [availableContacts, selectedContactIds]);

    // Get unselected contacts for the dropdown
    const unselectedContacts = useMemo(() => {
        return availableContacts.filter(contact => !selectedContactIds.includes(contact.id));
    }, [availableContacts, selectedContactIds]);

    const handleAddContact = (contactId) => {
        onChange([...selectedContactIds, contactId]);
    };

    const handleRemoveContact = (contactId) => {
        onChange(selectedContactIds.filter(id => id !== contactId));
    };

    if (loading) {
        return (
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 ml-1">{label}</label>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-sm text-slate-400">
                    Cargando contactos...
                </div>
            </div>
        );
    }

    if (!comercialId) {
        return (
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 ml-1">{label}</label>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center text-sm text-amber-700">
                    <Users size={20} className="inline-block mr-2" />
                    Primero selecciona un comercial para ver sus contactos disponibles
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 ml-1">{label}</label>

            {/* Selected Contacts */}
            {selectedContacts.length > 0 && (
                <div className="space-y-2">
                    {selectedContacts.map(contact => (
                        <div
                            key={contact.id}
                            className="flex items-center justify-between p-3 bg-brand-red/5 border border-brand-red/20 rounded-xl group hover:bg-brand-red/10 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-brand-red/20 text-brand-red flex items-center justify-center font-bold text-sm">
                                    {contact.firstName?.[0]}{contact.lastName?.[0]}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-700">
                                        {contact.firstName} {contact.lastName}
                                    </div>
                                    {contact.email && (
                                        <div className="text-xs text-slate-500">{contact.email}</div>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveContact(contact.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-100 md:opacity-0 group-hover:opacity-100"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Contact Dropdown */}
            {unselectedContacts.length > 0 ? (
                <select
                    onChange={(e) => {
                        if (e.target.value) {
                            handleAddContact(e.target.value);
                            e.target.value = ''; // Reset select
                        }
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-red focus:bg-white focus:ring-4 ring-brand-red/5 transition-all outline-none"
                >
                    <option value="">+ Agregar contacto...</option>
                    {unselectedContacts.map(contact => (
                        <option key={contact.id} value={contact.id}>
                            {contact.firstName} {contact.lastName}
                            {contact.email ? ` (${contact.email})` : ''}
                        </option>
                    ))}
                </select>
            ) : selectedContacts.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-sm text-slate-500">
                    <UserPlus size={20} className="inline-block mr-2 text-slate-400" />
                    No hay contactos disponibles para este comercial
                </div>
            ) : null}

            {/* Info message */}
            {availableContacts.length > 0 && (
                <p className="text-xs text-slate-400 ml-1">
                    {availableContacts.length} contacto{availableContacts.length !== 1 ? 's' : ''} disponible{availableContacts.length !== 1 ? 's' : ''} de este comercial
                </p>
            )}
        </div>
    );
};

export default ContactSelector;
