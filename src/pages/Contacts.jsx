import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Search, Plus, UserPlus, Building2, X } from 'lucide-react';
import ContactCard from '../components/contacts/ContactCard';
import ContactsTable from '../components/contacts/ContactsTable';
import ContactModal from '../components/contacts/ContactModal';
import { useContacts } from '../hooks/useContacts';
import { useSystemToast } from '../hooks/useSystemToast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useDebounce } from '../hooks/useDebounce';
import { ComercialFilter } from '../components/shared/ComercialFilter';
import { useRoleBasedFilter } from '../hooks/useRoleBasedFilter';
import { supabase } from '../lib/supabase';
import { useCurrentTenant } from '../hooks/useCurrentTenant';

const Contacts = () => {
    const { contacts, loading, createContact, updateContact, deleteContact } = useContacts();
    const { tenantId } = useCurrentTenant();
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [expandedContactId, setExpandedContactId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, contactId: null });
    const [selectedSegment, setSelectedSegment] = useState('all');
    const { showSuccess, showError } = useSystemToast();

    // ── Company autocomplete state ──────────────────────────────────────────
    const [companySearch, setCompanySearch] = useState('');
    const [companyOptions, setCompanyOptions] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null); // { id, name, type }
    const companyInputRef = useRef(null);
    const dropdownRef = useRef(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
    const debouncedCompanySearch = useDebounce(companySearch, 250);

    // Fetch matching companies from Supabase
    // Si term está vacío, trae las primeras 6 como sugerencias de bienvenida
    const fetchCompanyOptions = useCallback(async (term) => {
        if (!tenantId) return;
        let query = supabase
            .from('companies')
            .select('id, trade_name, legal_name, company_type')
            .eq('tenant_id', tenantId)
            .eq('is_active', true)
            .order('trade_name')
            .limit(6);
        if (term && term.trim().length >= 1) {
            query = query.or(`trade_name.ilike.%${term.trim()}%,legal_name.ilike.%${term.trim()}%`);
        }
        const { data } = await query;
        setCompanyOptions(data || []);
    }, [tenantId]);

    useEffect(() => {
        if (!selectedCompany) fetchCompanyOptions(debouncedCompanySearch);
    }, [debouncedCompanySearch, fetchCompanyOptions, selectedCompany]);

    // Pre-cargar sugerencias al montar (para que aparezcan al primer foco)
    useEffect(() => {
        if (tenantId && !selectedCompany) fetchCompanyOptions('');
    }, [tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                companyInputRef.current && !companyInputRef.current.contains(e.target)
            ) setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const openDropdownWithPos = () => {
        if (companyInputRef.current) {
            const rect = companyInputRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        }
        setDropdownOpen(true);
    };

    const handleSelectCompany = (company) => {
        setSelectedCompany({ id: company.id, name: company.trade_name || company.legal_name, type: company.company_type });
        setCompanySearch('');
        setCompanyOptions([]);
        setDropdownOpen(false);
    };

    const handleClearCompany = () => {
        setSelectedCompany(null);
        setCompanySearch('');
        setSearchTerm('');
        setCompanyOptions([]);
        companyInputRef.current?.focus();
    };

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

    // Apply role-based filter to contacts
    const filteredByRole = filterDataByRole(contacts);

    // Filter contacts based on debounced search + segment + selected company
    const filteredContacts = useMemo(() => {
        return filteredByRole.filter(contact => {
            // Segment filter
            if (selectedSegment === 'prospect') {
                if (!contact.companies?.some(c => c.companyType === 'prospect')) return false;
            } else if (selectedSegment === 'client') {
                if (!contact.companies?.some(c => c.companyType === 'client')) return false;
            }

            // Company filter (selected from dropdown)
            if (selectedCompany) {
                return contact.companies?.some(c => c.companyId === selectedCompany.id);
            }

            // Text search filter (nombre, email, teléfono, cualquier empresa)
            if (!debouncedSearch) return true;
            const searchLower = debouncedSearch.toLowerCase();
            const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.toLowerCase();
            const email = (contact.email || '').toLowerCase();
            const phone = (contact.phone || '').toLowerCase();
            const matchesCompany = contact.companies?.some(c =>
                (c.companyName || '').toLowerCase().includes(searchLower)
            );

            return fullName.includes(searchLower) ||
                email.includes(searchLower) ||
                phone.includes(searchLower) ||
                matchesCompany;
        });
    }, [filteredByRole, debouncedSearch, selectedSegment, selectedCompany]);

    const handleToggleExpand = (contactId) => {
        setExpandedContactId(expandedContactId === contactId ? null : contactId);
    };

    const handleEditContact = (contact) => {
        setEditingContact(contact);
        setIsModalOpen(true);
    };

    const handleDeleteContact = (contactId) => {
        setConfirmDelete({ isOpen: true, contactId });
    };

    const confirmDeleteContact = async () => {
        const result = await deleteContact(confirmDelete.contactId);
        if (result.success) {
            showSuccess('Contacto eliminado exitosamente');
            setConfirmDelete({ isOpen: false, contactId: null });
        } else {
            showError('Error al eliminar contacto: ' + result.error);
        }
    };

    const handleCreateContact = () => {
        setEditingContact(null);
        setIsModalOpen(true);
    };

    const handleSaveContact = async (contactData) => {
        // ContactModal already handles createContact/updateContact internally.
        // This callback receives the result data after successful persistence.
        showSuccess(editingContact ? 'Contacto actualizado exitosamente!' : 'Contacto creado exitosamente!');
        handleCloseModal();
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingContact(null);
    };

    return (
        <div className="h-full flex flex-col gap-6 p-4 md:p-6 xl:px-6 xl:pt-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Contactos</h1>
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


                    {/* Segment Filter Pills */}
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm flex-shrink-0">
                        {[
                            { id: 'all', label: 'Todos' },
                            { id: 'prospect', label: 'Prospectos' },
                            { id: 'client', label: 'Clientes' },
                        ].map(seg => (
                            <button
                                key={seg.id}
                                onClick={() => setSelectedSegment(seg.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${selectedSegment === seg.id
                                    ? 'text-white'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                    }`}
                                style={selectedSegment === seg.id ? { backgroundColor: 'var(--color-brand-primary)' } : {}}
                            >
                                {seg.label}
                            </button>
                        ))}
                    </div>

                    {/* Search and Create Button */}
                    <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">

                        {/* Company autocomplete */}
                        <div className="relative flex-1 md:w-80" ref={dropdownRef}>
                            <div className={`flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border ${dropdownOpen ? 'border-slate-300 ring-2 ring-advanta-green/10' : 'border-slate-100'
                                } transition-all`}>
                                {selectedCompany ? (
                                    <Building2 size={16} className="text-slate-400 flex-shrink-0" />
                                ) : (
                                    <Search size={16} className="text-slate-400 flex-shrink-0" />
                                )}

                                {selectedCompany ? (
                                    // Chip de empresa seleccionada
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className="text-sm font-semibold text-slate-700 truncate">{selectedCompany.name}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${selectedCompany.type === 'client'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {selectedCompany.type === 'client' ? 'CLIENTE' : 'PROSPECTO'}
                                        </span>
                                        <button onClick={handleClearCompany} className="ml-auto text-slate-400 hover:text-slate-600 flex-shrink-0">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <input
                                        ref={companyInputRef}
                                        type="text"
                                        placeholder="Buscar contacto o empresa..."
                                        className="bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none w-full"
                                        value={companySearch}
                                        onChange={(e) => { setCompanySearch(e.target.value); setSearchTerm(e.target.value); openDropdownWithPos(); }}
                                        onFocus={() => openDropdownWithPos()}
                                    />
                                )}
                            </div>

                            {/* Dropdown — montado en body via portal para escapar overflow:hidden */}
                            {dropdownOpen && !selectedCompany && companyOptions.length > 0 && ReactDOM.createPortal(
                                <ul
                                    style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
                                    className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
                                >
                                    {/* Header contextual */}
                                    <li className="px-4 py-2 border-b border-slate-100 bg-slate-50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {companySearch ? 'Empresas encontradas' : 'Sugerencias'}
                                        </span>
                                    </li>
                                    {companyOptions.map(company => (
                                        <li
                                            key={company.id}
                                            onMouseDown={() => handleSelectCompany(company)}
                                            className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                                        >
                                            <span className="text-sm font-medium text-slate-700 truncate">
                                                {company.trade_name || company.legal_name}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ml-3 flex-shrink-0 ${company.company_type === 'client'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {company.company_type === 'client' ? 'CLIENTE' : 'PROSPECTO'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>,
                                document.body
                            )}
                        </div>

                        <button
                            onClick={handleCreateContact}
                            className="px-4 py-2 btn-brand text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95"
                        >
                            <Plus size={18} />
                            <span className="hidden md:inline">Nuevo</span>
                        </button>
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

            {/* Mobile: Card Grid (< xl) */}
            <div className="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2 pb-20 custom-scrollbar items-start">
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
                    className="group border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:border-advanta-green/50 hover:bg-red-50/30 transition-all min-h-[200px]"
                >
                    <div className="w-16 h-16 rounded-full bg-slate-50 group-hover:bg-white border-2 border-slate-100 group-hover:border-advanta-green/20 flex items-center justify-center text-slate-400 group-hover:text-advanta-green transition-all shadow-sm">
                        <UserPlus size={32} />
                    </div>
                    <span className="text-slate-500 font-bold group-hover:text-advanta-green transition-colors">Nuevo Contacto</span>
                </button>
            </div>

            {/* Desktop: Table View (>= xl) */}
            <div className="hidden xl:block overflow-y-auto pb-20 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-slate-400">Cargando contactos...</div>
                    </div>
                ) : (
                    <ContactsTable
                        contacts={filteredContacts}
                        onEdit={handleEditContact}
                        onDelete={handleDeleteContact}
                    />
                )}
            </div>

            {/* No Results */}
            {filteredContacts.length === 0 && !loading && (searchTerm || selectedCompany) && (
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

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, contactId: null })}
                onConfirm={confirmDeleteContact}
                title="Eliminar contacto"
                message="¿Estás seguro de eliminar este contacto? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
};

export default Contacts;
