import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Building2, User, Phone, Mail, FileDigit, Link, Save, Check, Star, Trash2, UserPlus, Plus, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { mockContacts } from '../../data/mockContacts';
import ContactModal from '../contacts/ContactModal';

const statusOptions = [
    { id: 'contacted', label: 'Contacto Inicial', logo: '/logo_frio.png', color: 'bg-blue-50 text-blue-700' },
    { id: 'quoted', label: 'Cotizado', logo: '/logo_tibio.png', color: 'bg-orange-50 text-orange-700' },
    { id: 'near_closing', label: 'Cierre Cercano', logo: '/logo_urgente.png', color: 'bg-red-50 text-red-700' },
];

const EditProspectModal = ({ isOpen, onClose, prospect, onSave, onContactsUpdate }) => {
    if (!isOpen || !prospect) return null;

    const [formData, setFormData] = useState({ ...prospect });
    const [activeTab, setActiveTab] = useState('details'); // details | contact | notes
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [preselectedCompany, setPreselectedCompany] = useState(null);

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
        if (window.confirm(`¿Desvincular a ${contactName}?`)) {
            // Update mockContacts to remove this company from the contact's companies array
            const contactIndex = mockContacts.findIndex(c => c.id === contactId);
            if (contactIndex !== -1) {
                mockContacts[contactIndex].companies = mockContacts[contactIndex].companies.filter(
                    c => !(c.companyId === prospect.id && c.companyType === 'prospect')
                );

                // Notify parent to refresh
                if (onContactsUpdate) {
                    onContactsUpdate();
                }

                // Force re-render by updating formData
                setFormData({ ...formData });
            }
        }
    };

    const handleCreateContact = () => {
        setPreselectedCompany({
            companyId: prospect.id,
            companyName: prospect.tradeName || prospect.companyName,
            companyType: 'prospect'
        });
        setIsContactModalOpen(true);
    };

    const handleContactSave = (contactData) => {
        // Contact will be saved with the preselected company
        // Notify parent to refresh
        if (onContactsUpdate) {
            onContactsUpdate();
        }
        setIsContactModalOpen(false);
        setPreselectedCompany(null);
        // Force re-render
        setFormData({ ...formData });
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {(!prospect.tradeName && !prospect.companyName) ? 'Crear Prospecto' : 'Editar Prospecto'}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                            {(!prospect.tradeName && !prospect.companyName) ? 'Completa los datos del nuevo prospecto' : 'Actualiza la información y el estado'}
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
                                        name="tradeName"
                                        value={formData.tradeName}
                                        onChange={handleChange}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-red outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Razón Social</label>
                                    <input
                                        name="companyName"
                                        value={formData.companyName}
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
                                        value={format(new Date(formData.date), 'yyyy-MM-dd')}
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
                                            <img src={option.logo} alt={option.label} className={`w-6 h-6 object-contain transition-transform ${formData.status === option.id ? 'scale-110' : 'grayscale-[0.3]'}`} />
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
                                    const linkedContacts = mockContacts.filter(contact =>
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
                                                    {linkedContacts.map((contact) => (
                                                        <div key={contact.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start justify-between">
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
                                                                <div className="flex items-center gap-1 mt-2">
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
                                                                        onClick={() => alert('Agendar reunión con ' + contact.firstName)}
                                                                        className="p-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                                                                        title="Agendar reunión"
                                                                    >
                                                                        <Calendar size={12} />
                                                                    </button>
                                                                </div>

                                                                {/* Contact Info (smaller, below actions) */}
                                                                <div className="flex flex-col gap-0.5 text-[10px] text-slate-400 mt-2">
                                                                    {contact.email && <span>{contact.email}</span>}
                                                                    {contact.phone && <span>{contact.phone}</span>}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleUnlinkContact(contact.id, `${contact.firstName} ${contact.lastName}`)}
                                                                className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={16} className="text-red-600" />
                                                            </button>
                                                        </div>
                                                    ))}
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
                                                    className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
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
                                    if (window.confirm(`¿Convertir "${formData.tradeName || formData.companyName}" a Cliente?`)) {
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
