import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Building2, User, Phone, Mail, FileDigit, Link, Save, Check, Star, Trash2, UserPlus, Plus, MessageSquare } from 'lucide-react';
import { safeFormat } from '../../utils/dateUtils';
import { useContacts } from '../../hooks/useContacts';
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

    // Contact search and linking states
    const [contactSearchTerm, setContactSearchTerm] = useState('');
    const [selectedContactToLink, setSelectedContactToLink] = useState(null);
    const [linkRole, setLinkRole] = useState('');
    const [isLinking, setIsLinking] = useState(false);

    useEffect(() => {
        setFormData({ ...prospect });
    }, [prospect]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        onSave(formData);
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
            alert('Error al desvincular contacto');
        } finally {
            setConfirmUnlink({ isOpen: false, contactId: null, contactName: '' });
        }
    };

    const handleCreateContact = () => {
        setPreselectedCompany({
            companyId: prospect.id,
            companyName: prospect.trade_name || prospect.legal_name,
            companyType: 'prospect'
        });
        setIsContactModalOpen(true);
    };

    const handleContactSave = async (contactData) => {
        try {
            // Save contact to Supabase
            const result = await createContact(contactData);

            if (result.success) {
                // Notify parent to refresh
                if (onContactsUpdate) {
                    onContactsUpdate();
                }
                setIsContactModalOpen(false);
                setPreselectedCompany(null);
                // Force re-render
                setFormData({ ...formData });
            } else {
                alert('Error al guardar contacto: ' + result.error);
            }
        } catch (error) {
            console.error('Error saving contact:', error);
            alert('Error al guardar contacto');
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
            alert('Por favor selecciona un contacto y especifica el rol');
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
            alert('Error al vincular contacto');
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
                console.log('🔴 BACKDROP CLICKED - CLOSING MODAL', e.target);
                onClose();
            }}
        >
            <div
                className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]"
                onClick={(e) => {
                    console.log('✅ MODAL CONTENT CLICKED - STOPPING PROPAGATION', e.target);
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
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Fecha Creación</label>
                                <input
                                    type="date"
                                    disabled
                                    value={safeFormat(formData.created_at, 'yyyy-MM-dd', {}, '')}
                                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Estado Actual - Status Selector */}
                        <div className="space-y-3 pt-2">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Estado Actual</label>
                            <div className="grid grid-cols-3 gap-3">
                                {statusOptions.map(option => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFormData(prev => ({ ...prev, status: option.id }));
                                        }}
                                        className={`
                                            relative cursor-pointer rounded-xl p-3 border-2 transition-all duration-200 flex items-center gap-2 justify-center
                                            ${formData.status === option.id
                                                ? `${option.color} ring-2 ring-offset-1 ring-advanta-green/30`
                                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                            }
                                        `}
                                    >
                                        <span className={`text-xs font-bold ${formData.status === option.id ? '' : 'text-slate-600'}`}>
                                            {option.label}
                                        </span>
                                        {formData.status === option.id && (
                                            <Check size={14} strokeWidth={3} className="text-advanta-green absolute top-2 right-2" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Contactos Vinculados */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                <User size={14} />
                                Contactos Vinculados
                            </h3>

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
                                                                    console.log('🟢 CONTACT CARD CLICKED', {
                                                                        contactName: `${contact.firstName} ${contact.lastName}`,
                                                                        target: e.target,
                                                                        currentTarget: e.currentTarget
                                                                    });
                                                                    e.stopPropagation();
                                                                    console.log('✋ PROPAGATION STOPPED FOR CONTACT CARD');
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
                                                                        console.log('🔵 QUICK ACTIONS CLICKED - STOPPING PROPAGATION');
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

                                        {/* Add contact section */}
                                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 space-y-3">
                                            <div className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase">
                                                <Plus size={14} />
                                                Agregar Contacto
                                            </div>

                                            {/* Only show search for existing prospects (not new ones with temp IDs) */}
                                            {prospect.id && prospect.id < 1000000 ? (
                                                <>
                                                    {/* Search existing contacts */}
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-slate-500">Buscar contacto existente</label>
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                placeholder="Buscar por nombre o CUIT..."
                                                                value={contactSearchTerm}
                                                                onChange={(e) => setContactSearchTerm(e.target.value)}
                                                                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:border-advanta-green outline-none"
                                                            />
                                                            {contactSearchTerm && filteredContacts.length > 0 && !selectedContactToLink && (
                                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                                                                    {filteredContacts.map(contact => (
                                                                        <button
                                                                            key={contact.id}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedContactToLink(contact);
                                                                                setContactSearchTerm(`${contact.firstName} ${contact.lastName}`);
                                                                            }}
                                                                            className="w-full p-3 hover:bg-slate-50 text-left border-b border-slate-100 last:border-0"
                                                                        >
                                                                            <div className="font-semibold text-sm text-slate-800">
                                                                                {contact.firstName} {contact.lastName}
                                                                            </div>
                                                                            {contact._original?.cuit && (
                                                                                <div className="text-xs text-slate-500">CUIT: {contact._original.cuit}</div>
                                                                            )}
                                                                            {contact.email && (
                                                                                <div className="text-xs text-slate-400">{contact.email}</div>
                                                                            )}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Role input when contact selected */}
                                                        {selectedContactToLink && (
                                                            <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                                <div className="text-xs font-bold text-blue-700">
                                                                    Vincular: {selectedContactToLink.firstName} {selectedContactToLink.lastName}
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Rol (ej: Gerente, Encargado de Compras...)"
                                                                    value={linkRole}
                                                                    onChange={(e) => setLinkRole(e.target.value)}
                                                                    className="w-full p-2 bg-white border border-blue-300 rounded-lg text-sm focus:border-advanta-green outline-none"
                                                                />
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleLinkExistingContact();
                                                                        }}
                                                                        disabled={isLinking || !linkRole.trim()}
                                                                        className="flex-1 px-3 py-2 bg-gradient-to-r from-[#44C12B] to-[#4BA323] hover:from-[#3a9120] hover:to-[#3d8a1f] text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        {isLinking ? 'Vinculando...' : 'Vincular'}
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedContactToLink(null);
                                                                            setContactSearchTerm('');
                                                                            setLinkRole('');
                                                                        }}
                                                                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-bold transition-colors"
                                                                    >
                                                                        Cancelar
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="relative">
                                                        <div className="absolute inset-0 flex items-center">
                                                            <div className="w-full border-t border-slate-300"></div>
                                                        </div>
                                                        <div className="relative flex justify-center text-xs">
                                                            <span className="bg-white px-2 text-slate-500">o</span>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                                                    💡 <strong>Tip:</strong> Guarda el prospecto primero para poder vincular contactos existentes
                                                </div>
                                            )}

                                            {/* Create new contact button */}
                                            <button
                                                onClick={handleCreateContact}
                                                className="w-full px-4 py-3 bg-gradient-to-r from-[#44C12B] to-[#4BA323] hover:from-[#3a9120] hover:to-[#3d8a1f] text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                            >
                                                <UserPlus size={16} />
                                                Crear Nuevo Contacto
                                            </button>
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
                        className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#44C12B] to-[#4BA323] text-white font-bold shadow-lg shadow-advanta-green/30 hover:shadow-advanta-green/50 hover:from-[#3a9120] hover:to-[#3d8a1f] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
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
