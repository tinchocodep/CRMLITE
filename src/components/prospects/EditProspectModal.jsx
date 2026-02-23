import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Building2, User, Phone, Mail, FileDigit, Link, Save, Star, Trash2, UserPlus, Plus, MessageSquare } from 'lucide-react';
import { safeFormat } from '../../utils/dateUtils';
import { useContacts } from '../../hooks/useContacts';
import { useToast } from '../../contexts/ToastContext';
import { useNotifications } from '../../hooks/useNotifications';
import ContactModal from '../contacts/ContactModal';
import { ConfirmDialog } from '../ConfirmDialog';
import ComercialSelector from '../shared/ComercialSelector';

const statusOptions = [
    { id: 'contacted', label: 'Contacto Inicial', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'quoted', label: 'Cotizado', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { id: 'near_closing', label: 'Cierre Cercano', color: 'bg-red-50 text-red-700 border-red-200' },
];

const EditProspectModal = ({ isOpen, onClose, prospect, onSave, onContactsUpdate }) => {
    const { contacts, unlinkFromCompany, createContact, linkToCompany } = useContacts();
    const { addNotification } = useNotifications();
    const { showToast } = useToast();
    const [showContactModal, setShowContactModal] = useState(false);
    const [showLinkContactModal, setShowLinkContactModal] = useState(false);
    const [confirmUnlink, setConfirmUnlink] = useState({ isOpen: false, contactId: null, contactName: '' });
    const [formData, setFormData] = useState({
        name: '',
        status: 'contacted',
        notes: '',
        next_contact_date: '',
        last_contact_date: '',
        potential_value: '',
        comercial_id: null
    });

    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [preselectedCompany, setPreselectedCompany] = useState(null);
    const [expandedContacts, setExpandedContacts] = useState({});
    const [pendingContacts, setPendingContacts] = useState([]); // Contacts created before prospect is saved

    // Contact search and linking states
    const [contactSearchTerm, setContactSearchTerm] = useState('');
    const [selectedContactToLink, setSelectedContactToLink] = useState(null);
    const [linkRole, setLinkRole] = useState('');
    const [isLinking, setIsLinking] = useState(false);
    const [contactMode, setContactMode] = useState(null); // null | 'cartera' | 'nuevo'
    const [newContactForm, setNewContactForm] = useState({ first_name: '', last_name: '', email: '', phone: '', role: '' });

    useEffect(() => {
        setFormData({ ...prospect });
    }, [prospect]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        // Pass both formData and pendingContacts to parent
        onSave(formData, pendingContacts);
        onClose();
    };

    const handleUnlinkContact = (contactId, contactName) => {
        setConfirmUnlink({ isOpen: true, contactId, contactName });
    };

    const confirmUnlinkContact = async () => {
        try {
            await unlinkFromCompany(confirmUnlink.contactId, prospect.id);

            // Notify parent to refresh
            if (onContactsUpdate) {
                onContactsUpdate();
            }
            // Force re-render by updating formData
            setFormData({ ...formData });
        } catch (error) {
            console.error('Error unlinking contact:', error);
            showToast({
                id: `error-unlink-contact-${Date.now()}`,
                title: '❌ Error al desvincular',
                description: error.message || 'No se pudo desvincular el contacto',
                priority: 'high',
                timeAgo: 'Ahora'
            });
        } finally {
            setConfirmUnlink({ isOpen: false, contactId: null, contactName: '' });
        }
    };

    const handleCreateContact = () => {
        // Check if prospect has a REAL database ID (not temporary)
        // Temporary IDs are large numbers (> 1000000)
        const isRealId = prospect?.id && typeof prospect.id === 'number' && prospect.id < 1000000;

        setPreselectedCompany({
            companyId: isRealId ? prospect.id : null, // null if prospect not saved yet
            companyName: prospect?.trade_name || prospect?.legal_name || 'Nuevo Prospecto',
            companyType: 'prospect'
        });
        setIsContactModalOpen(true);
    };

    const handleContactSave = async (contactData) => {
        try {
            // If prospect doesn't have an ID yet, store contact as pending
            if (!prospect?.id || (typeof prospect.id === 'number' && prospect.id > 1000000)) {
                // Add to pending contacts list
                setPendingContacts(prev => [...prev, contactData]);

                showToast({
                    id: `pending-contact-${Date.now()}`,
                    title: '✅ Contacto agregado',
                    description: `${contactData.first_name} ${contactData.last_name} se vinculará al guardar el prospecto`,
                    priority: 'medium',
                    timeAgo: 'Ahora'
                });

                setIsContactModalOpen(false);
                setPreselectedCompany(null);
                return;
            }

            // If prospect has ID, create contact normally
            const result = await createContact(contactData);

            if (result.success) {
                // Show success notification
                showToast({
                    id: `contact-created-${Date.now()}`,
                    title: '✅ Contacto creado correctamente',
                    description: `${contactData.first_name} ${contactData.last_name} ha sido creado exitosamente`,
                    priority: 'medium',
                    timeAgo: 'Ahora'
                });

                // Notify parent to refresh
                if (onContactsUpdate) {
                    onContactsUpdate();
                }

                // Close the contact modal
                setIsContactModalOpen(false);

                // Reset preselected company
                setPreselectedCompany(null);

                // Force re-render
                setFormData({ ...formData });
            } else {
                showToast({
                    id: `error-save-contact-${Date.now()}`,
                    title: '❌ Error al guardar contacto',
                    description: result.error || 'No se pudo guardar el contacto',
                    priority: 'high',
                    timeAgo: 'Ahora'
                });
            }
        } catch (error) {
            console.error('Error saving contact:', error);
            showToast({
                id: `error-save-contact-unexpected-${Date.now()}`,
                title: '❌ Error inesperado',
                description: error.message || 'Ocurrió un error al guardar el contacto',
                priority: 'high',
                timeAgo: 'Ahora'
            });
        }
    };

    // Filter contacts that are NOT already linked to this prospect
    const availableContacts = contacts.filter(contact =>
        !contact.companies.some(c =>
            c.companyId === prospect?.id && c.companyType === 'prospect'
        )
    );

    // Search filter
    const filteredContacts = availableContacts.filter(contact => {
        if (!contactSearchTerm) return false;
        const searchLower = contactSearchTerm.toLowerCase();
        const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
        const cuit = contact._original?.cuit || '';
        return fullName.includes(searchLower) || cuit.includes(contactSearchTerm);
    });

    // Handle linking existing contact
    const handleLinkExistingContact = async () => {
        if (!selectedContactToLink || !linkRole.trim()) {
            showToast({
                id: `validation-link-contact-${Date.now()}`,
                title: 'ℹ️ Datos incompletos',
                description: 'Por favor selecciona un contacto y especifica el rol',
                priority: 'medium',
                timeAgo: 'Ahora'
            });
            return;
        }

        setIsLinking(true);
        try {
            await linkToCompany(
                selectedContactToLink.id,
                prospect.id,
                linkRole,
                false // isPrimary
            );

            // Reset states
            setContactSearchTerm('');
            setSelectedContactToLink(null);
            setLinkRole('');

            // Refresh
            if (onContactsUpdate) {
                onContactsUpdate();
            }
            setFormData({ ...formData });
        } catch (error) {
            console.error('Error linking contact:', error);
            showToast({
                id: `error-link-contact-${Date.now()}`,
                title: '❌ Error al vincular',
                description: error.message || 'No se pudo vincular el contacto',
                priority: 'high',
                timeAgo: 'Ahora'
            });
        } finally {
            setIsLinking(false);
        }
    };

    // CRITICAL: All hooks must be called BEFORE any conditional returns
    if (!isOpen || !prospect) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={(e) => {
                onClose();
            }}
        >
            <div
                className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]"
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {(!prospect.trade_name && !prospect.legal_name) ? 'Nuevo Prospecto' : 'Editar Prospecto'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>


                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">

                    <div className="space-y-6">
                        {/* Company Info - FIRST */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Nombre Comercial</label>
                                <input
                                    name="trade_name"
                                    value={formData.trade_name || ''}
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-advanta-green outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Razón Social</label>
                                <input
                                    name="legal_name"
                                    value={formData.legal_name || ''}
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-advanta-green outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">CUIT</label>
                                <input
                                    name="cuit"
                                    value={formData.cuit}
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-advanta-green outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Localidad</label>
                                <input
                                    name="city"
                                    value={formData.city || ''}
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-advanta-green outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Provincia</label>
                                <input
                                    name="province"
                                    value={formData.province || ''}
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-advanta-green outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1"><Phone size={11} /> Teléfono</label>
                                <input
                                    name="phone"
                                    value={formData.phone || ''}
                                    onChange={handleChange}
                                    placeholder="Ej: +54 9 11 1234-5678"
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-advanta-green outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1"><Mail size={11} /> Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={handleChange}
                                    placeholder="empresa@ejemplo.com"
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-advanta-green outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Fecha Creación</label>
                                <input
                                    type="date"
                                    disabled
                                    value={safeFormat(formData.created_at, 'yyyy-MM-dd', {}, '')}
                                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contactos Vinculados */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                <User size={14} />
                                Contactos Vinculados
                                {pendingContacts.length > 0 && (
                                    <span className="ml-auto px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-[10px] font-bold">
                                        {pendingContacts.length} PENDIENTE{pendingContacts.length > 1 ? 'S' : ''}
                                    </span>
                                )}
                            </h3>

                            {/* Pending Contacts (not yet saved) */}
                            {pendingContacts.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs text-orange-600 font-semibold">
                                        ⏳ Estos contactos se crearán al guardar el prospecto:
                                    </p>
                                    {pendingContacts.map((contact, idx) => (
                                        <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">
                                                        {contact.first_name} {contact.last_name}
                                                    </p>
                                                    <p className="text-xs text-slate-600">
                                                        {contact.email || contact.phone || 'Sin datos de contacto'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setPendingContacts(prev => prev.filter((_, i) => i !== idx))}
                                                    className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Eliminar contacto pendiente"
                                                >
                                                    <Trash2 size={16} className="text-red-600" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Get contacts linked to this prospect */}
                            {(() => {
                                const linkedContacts = contacts.filter(contact =>
                                    contact.companies.some(c =>
                                        c.companyId === prospect?.id &&
                                        c.companyType === 'prospect'
                                    )
                                ).map(contact => {
                                    const companyLink = contact.companies.find(c =>
                                        c.companyId === prospect?.id &&
                                        c.companyType === 'prospect'
                                    );
                                    return {
                                        ...contact,
                                        role: companyLink.role,
                                        isPrimary: companyLink.isPrimary
                                    };
                                });

                                return (
                                    <>
                                        {/* List of linked contacts */}
                                        {linkedContacts.length > 0 ? (
                                            <div className="space-y-2">
                                                {linkedContacts.map((contact) => {
                                                    const isContactExpanded = expandedContacts[contact.id] || false;

                                                    return (
                                                        <div key={contact.id} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                                            {/* Main Contact Card - Clickable */}
                                                            <div
                                                                className="p-4 flex items-start justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setExpandedContacts(prev => ({
                                                                        ...prev,
                                                                        [contact.id]: !prev[contact.id]
                                                                    }));
                                                                }}
                                                            >
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-bold text-sm text-slate-800">
                                                                            {contact.firstName} {contact.lastName}
                                                                        </span>
                                                                        {contact.isPrimary && (
                                                                            <span className="px-2 py-0.5 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-md text-[10px] font-bold flex items-center gap-1">
                                                                                <Star size={10} fill="currentColor" /> PRINCIPAL
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-xs text-slate-600 font-semibold mb-1">{contact.role}</div>

                                                                    {/* Quick Actions */}
                                                                    <div className="flex items-center gap-1 mt-2" onClick={(e) => {
                                                                        e.stopPropagation();
                                                                    }}>
                                                                        {contact.phone && (
                                                                            <>
                                                                                <a
                                                                                    href={`tel:${contact.phone}`}
                                                                                    className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                                                                                    title="Llamar"
                                                                                >
                                                                                    <Phone size={12} />
                                                                                </a>
                                                                                <a
                                                                                    href={`sms:${contact.phone}`}
                                                                                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                                                                                    title="Enviar mensaje"
                                                                                >
                                                                                    <MessageSquare size={12} />
                                                                                </a>
                                                                            </>
                                                                        )}
                                                                        {contact.email && (
                                                                            <a
                                                                                href={`mailto:${contact.email}`}
                                                                                className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                                                                                title="Enviar email"
                                                                            >
                                                                                <Mail size={12} />
                                                                            </a>
                                                                        )}
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                // Generate vCard
                                                                                const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.firstName} ${contact.lastName}
N:${contact.lastName};${contact.firstName};;;
${contact.email ? `EMAIL:${contact.email}` : ''}
${contact.phone ? `TEL:${contact.phone}` : ''}
ORG:${prospect.trade_name || prospect.legal_name}
TITLE:${contact.role}
END:VCARD`;
                                                                                const blob = new Blob([vCard], { type: 'text/vcard' });
                                                                                const url = window.URL.createObjectURL(blob);
                                                                                const a = document.createElement('a');
                                                                                a.href = url;
                                                                                a.download = `${contact.firstName}_${contact.lastName}.vcf`;
                                                                                a.click();
                                                                                window.URL.revokeObjectURL(url);
                                                                            }}
                                                                            className="p-1.5 bg-advanta-green/10 hover:bg-advanta-green/20 text-advanta-green rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                                                                            title="Agregar a contactos"
                                                                        >
                                                                            <UserPlus size={12} />
                                                                        </button>
                                                                    </div>

                                                                    {/* Contact Info (smaller, below actions) */}
                                                                    <div className="flex flex-col gap-0.5 text-[10px] text-slate-400 mt-2">
                                                                        {contact.email && <span>{contact.email}</span>}
                                                                        {contact.phone && <span>{contact.phone}</span>}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleUnlinkContact(contact.id, `${contact.firstName} ${contact.lastName}`);
                                                                    }}
                                                                    className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 size={16} className="text-red-600" />
                                                                </button>
                                                            </div>

                                                            {/* Expanded Details */}
                                                            {isContactExpanded && (
                                                                <div className="border-t border-slate-200 bg-white p-4 space-y-3">
                                                                    <h5 className="text-xs font-bold text-slate-500 uppercase">Empresas Vinculadas</h5>
                                                                    {contact.companies && contact.companies.map((company, idx) => (
                                                                        <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                                                            <div className="flex items-center justify-between mb-1">
                                                                                <span className="font-bold text-xs text-slate-700">{company.companyName}</span>
                                                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${company.companyType === 'client'
                                                                                    ? 'bg-green-100 text-green-700'
                                                                                    : 'bg-blue-100 text-blue-700'
                                                                                    }`}>
                                                                                    {company.companyType === 'client' ? 'CLIENTE' : 'PROSPECTO'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-[10px] text-slate-500">{company.role}</div>
                                                                        </div>
                                                                    ))}
                                                                    {contact.notes && (
                                                                        <div className="pt-2 border-t border-slate-200">
                                                                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Notas</p>
                                                                            <p className="text-xs text-slate-600 italic">"{contact.notes}"</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-sm text-center">
                                                No hay contactos vinculados a este prospecto
                                            </div>
                                        )}

                                        {/* ── Nueva sección: agregar contacto ── */}
                                        <div className="border-2 border-dashed border-slate-200 rounded-xl overflow-hidden">
                                            {/* Header */}
                                            <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
                                                <div className="flex items-center gap-2 text-slate-700 text-xs font-bold uppercase tracking-wide">
                                                    <Plus size={14} className="text-advanta-green" />
                                                    Contacto
                                                </div>
                                                {contactMode && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setContactMode(null); setNewContactForm({ first_name: '', last_name: '', email: '', phone: '', role: '' }); setContactSearchTerm(''); setSelectedContactToLink(null); setLinkRole(''); }}
                                                        className="text-slate-400 hover:text-slate-600 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Tip */}
                                            {!contactMode && (
                                                <div className="px-4 pt-3 pb-1">
                                                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                                        <span className="text-amber-400">💡</span>
                                                        Elegir comercial para ver la cartera de contactos
                                                    </p>
                                                </div>
                                            )}

                                            {/* Action buttons */}
                                            {!contactMode && (
                                                <div className="px-4 pb-4 pt-2 grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setContactMode('cartera'); }}
                                                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white border-2 border-slate-200 hover:border-advanta-green hover:bg-advanta-green/5 text-slate-600 hover:text-advanta-green rounded-xl text-xs font-bold transition-all"
                                                    >
                                                        <User size={14} />
                                                        Contacto del comercial
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleCreateContact(); }}
                                                        className="flex items-center justify-center gap-2 px-3 py-2.5 btn-brand text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                                                    >
                                                        <UserPlus size={14} />
                                                        Crear nuevo contacto
                                                    </button>
                                                </div>
                                            )}

                                            {/* ── Modo: Cartera del comercial ── */}
                                            {contactMode === 'cartera' && (() => {
                                                const comercialContacts = formData.comercial_id
                                                    ? availableContacts.filter(c => c.comercialId === formData.comercial_id)
                                                    : [];
                                                return (
                                                    <div className="px-4 pb-4 pt-2 space-y-2">
                                                        {!formData.comercial_id ? (
                                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
                                                                Asigná un comercial al prospecto para ver su cartera de contactos.
                                                            </div>
                                                        ) : comercialContacts.length === 0 ? (
                                                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
                                                                Este comercial no tiene contactos disponibles para vincular.
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <p className="text-[11px] text-slate-400 font-medium pb-1">{comercialContacts.length} contacto{comercialContacts.length !== 1 ? 's' : ''} disponible{comercialContacts.length !== 1 ? 's' : ''}</p>
                                                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                                                    {comercialContacts.map(contact => (
                                                                        <button
                                                                            key={contact.id}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedContactToLink(contact);
                                                                            }}
                                                                            className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${selectedContactToLink?.id === contact.id ? 'border-advanta-green bg-advanta-green/5' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                                                                        >
                                                                            <div className="font-semibold text-slate-800">{contact.firstName} {contact.lastName}</div>
                                                                            {contact.email && <div className="text-xs text-slate-500">{contact.email}</div>}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                {selectedContactToLink && (
                                                                    <div className="pt-2 space-y-2 border-t border-slate-200 mt-2">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Rol (ej: Gerente, Encargado de compras...)"
                                                                            value={linkRole}
                                                                            onChange={(e) => setLinkRole(e.target.value)}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:border-advanta-green outline-none"
                                                                        />
                                                                        <div className="flex gap-2">
                                                                            {prospect.id && prospect.id < 1000000 ? (
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleLinkExistingContact(); setContactMode(null); }}
                                                                                    disabled={isLinking || !linkRole.trim()}
                                                                                    className="flex-1 px-3 py-2 btn-brand text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                                                                >
                                                                                    {isLinking ? 'Vinculando...' : 'Vincular'}
                                                                                </button>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        if (!linkRole.trim()) return;
                                                                                        setPendingContacts(prev => [...prev, {
                                                                                            first_name: selectedContactToLink.firstName,
                                                                                            last_name: selectedContactToLink.lastName,
                                                                                            email: selectedContactToLink.email,
                                                                                            phone: selectedContactToLink.phone,
                                                                                            role: linkRole,
                                                                                            _existingId: selectedContactToLink.id,
                                                                                        }]);
                                                                                        setContactMode(null);
                                                                                        setSelectedContactToLink(null);
                                                                                        setLinkRole('');
                                                                                    }}
                                                                                    disabled={!linkRole.trim()}
                                                                                    className="flex-1 px-3 py-2 btn-brand text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                                                                >
                                                                                    Agregar (pendiente)
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); setSelectedContactToLink(null); setLinkRole(''); }}
                                                                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors"
                                                                            >
                                                                                Cancelar
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                        </div>

                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Comercial Assignment */}
                    <div className="space-y-3 pt-4">
                        <ComercialSelector
                            value={formData.comercial_id}
                            onChange={(value) => setFormData(prev => ({ ...prev, comercial_id: value }))}
                            label="Asignar a Comercial"
                        />
                    </div>

                    {/* Notas */}
                    <div className="space-y-4 h-full flex flex-col">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Notas y Detalles Adicionales</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Escribe aquí cualquier información relevante sobre el prospecto..."
                                className="w-full h-48 p-4 bg-yellow-50/30 border border-yellow-200 rounded-xl focus:bg-white focus:border-advanta-green focus:ring-1 focus:ring-advanta-green/50 outline-none text-sm leading-relaxed resize-none"
                            />
                        </div>
                    </div>




                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-brand text-white font-bold shadow-lg shadow-advanta-green/30 hover:shadow-advanta-green/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Save size={18} />
                        Confirmar
                    </button>
                </div>
            </div>

            {/* Contact Modal for creating new contacts */}
            <ContactModal
                isOpen={isContactModalOpen}
                onClose={() => {
                    setIsContactModalOpen(false);
                    setPreselectedCompany(null);
                }}
                onSave={handleContactSave}
                preselectedCompany={preselectedCompany}
            />
        </div>,
        document.body
    );
};

export default EditProspectModal;
