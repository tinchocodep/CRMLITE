import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Building2, User, Phone, Mail, FileDigit, Link, Save, Check, Star, Trash2, UserPlus, Plus, MessageSquare } from 'lucide-react';
import { safeFormat } from '../../utils/dateUtils';
import { useContacts } from '../../hooks/useContacts';
import ContactModal from '../contacts/ContactModal';

const statusOptions = [
    { id: 'contacted', label: 'Contacto Inicial', color: 'bg-blue-50 text-blue-700' },
    { id: 'quoted', label: 'Cotizado', color: 'bg-orange-50 text-orange-700' },
    { id: 'near_closing', label: 'Cierre Cercano', color: 'bg-red-50 text-red-700' },
];

const EditProspectModal = ({ isOpen, onClose, prospect, onSave, onContactsUpdate }) => {
    const { contacts, unlinkFromCompany, createContact } = useContacts();

    const [formData, setFormData] = useState(prospect || {});
    const [activeTab, setActiveTab] = useState('details'); // details | contact | notes
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [preselectedCompany, setPreselectedCompany] = useState(null);
    const [expandedContacts, setExpandedContacts] = useState({});

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

    const handleUnlinkContact = async (contactId, contactName) => {
        if (window.confirm(`¿Desvincular a ${contactName}?`)) {
            try {
                await unlinkFromCompany(contactId, prospect.id);

                // Notify parent to refresh
                if (onContactsUpdate) {
                    onContactsUpdate();
                }
            } catch (error) {
                alert('Error al desvincular contacto');
            }

            // Force re-render by updating formData
            setFormData({ ...formData });
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
                            {(!prospect.trade_name && !prospect.legal_name) ? 'Crear Prospecto' : 'Editar Prospecto'}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                            {(!prospect.trade_name && !prospect.legal_name) ? 'Completa los datos del nuevo prospecto' : 'Actualiza la información y el estado'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-6 border-b border-slate-100 bg-slate-50/50">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-brand-red text-brand-red' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Detalles
                    </button>
                    <button
                        onClick={() => setActiveTab('contact')}
                        className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'contact' ? 'border-brand-red text-brand-red' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Contacto
                    </button>
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'notes' ? 'border-brand-red text-brand-red' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Notas & Info Extra
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">

                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            {/* Company Info - FIRST */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Nombre Comercial</label>
                                    <input
                                        name="trade_name"
                                        value={formData.trade_name || ''}
                                        onChange={handleChange}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-red outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Razón Social</label>
                                    <input
                                        name="legal_name"
                                        value={formData.legal_name || ''}
                                        onChange={handleChange}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-red outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">CUIT</label>
                                    <input
                                        name="cuit"
                                        value={formData.cuit}
                                        onChange={handleChange}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-red outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Localidad</label>
                                    <input
                                        name="city"
                                        value={formData.city || ''}
                                        onChange={handleChange}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-red outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Provincia</label>
                                    <input
                                        name="province"
                                        value={formData.province || ''}
                                        onChange={handleChange}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-red outline-none"
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

                            {/* Status Selector - COMPACT & BELOW */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Estado Actual</label>
                                <div className="flex gap-3">
                                    {statusOptions.map(option => (
                                        <button
                                            key={option.id}
                                            onClick={() => setFormData({ ...formData, status: option.id })}
                                            className={`
                                                flex-1 relative cursor-pointer rounded-xl p-3 border-2 transition-all duration-200 flex items-center gap-2 justify-center
                                                ${formData.status === option.id
                                                    ? `${option.color.replace('text-', 'border-').replace('bg-', 'bg-opacity-20 ')} bg-opacity-20 ring-2 ring-offset-1`
                                                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                                                }
                                            `}
                                        >
                                            <span className={`text-sm font-bold ${formData.status === option.id ? 'text-slate-900' : 'text-slate-600'}`}>
                                                {option.label}
                                            </span>
                                            {formData.status === option.id && (
                                                <Check size={14} strokeWidth={3} className="text-brand-red absolute top-2 right-2" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'contact' && (
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
                                                                                className="p-1.5 bg-brand-red/10 hover:bg-brand-red/20 text-brand-red rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
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

                                                <button
                                                    onClick={handleCreateContact}
                                                    className="w-full px-4 py-3 bg-brand-red hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <UserPlus size={16} />
                                                    Crear Nuevo Contacto
                                                </button>

                                                <div className="text-xs text-slate-500 text-center">
                                                    También puedes vincular contactos existentes desde la página de Contactos
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="space-y-4 h-full flex flex-col">
                            <div className="flex-1 space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Notas y Detalles Adicionales</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder="Escribe aquí cualquier información relevante sobre el prospecto..."
                                    className="w-full h-48 p-4 bg-yellow-50/30 border border-yellow-200 rounded-xl focus:bg-white focus:border-brand-red focus:ring-1 focus:ring-brand-red/50 outline-none text-sm leading-relaxed resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Convert to Client Button - At end of scrollable area */}
                    {prospect.id && (
                        <div className="pt-6 border-t border-slate-200">
                            <button
                                onClick={() => {
                                    if (window.confirm(`¿Convertir "${formData.trade_name || formData.legal_name}" a Cliente?`)) {
                                        alert('Funcionalidad de conversión a cliente pendiente de implementación');
                                    }
                                }}
                                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:from-emerald-600 hover:to-emerald-700 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                            >
                                <Check size={20} strokeWidth={2.5} />
                                Convertir a Cliente
                            </button>
                        </div>
                    )}

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
                        className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-brand-red text-white font-bold shadow-lg shadow-brand-red/30 hover:shadow-brand-red/50 hover:bg-red-700 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Save size={18} />
                        Guardar
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
