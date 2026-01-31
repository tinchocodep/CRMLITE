import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Building2, User, Phone, Mail, FileDigit, Link, Save, Check } from 'lucide-react';
import { format } from 'date-fns';

const statusOptions = [
    { id: 'contacted', label: 'Contacto Inicial', logo: '/logo_frio.png', color: 'bg-blue-50 text-blue-700' },
    { id: 'quoted', label: 'Cotizado', logo: '/logo_tibio.png', color: 'bg-orange-50 text-orange-700' },
    { id: 'near_closing', label: 'Cierre Cercano', logo: '/logo_urgente.png', color: 'bg-red-50 text-red-700' },
];

const EditProspectModal = ({ isOpen, onClose, prospect, onSave }) => {
    if (!isOpen || !prospect) return null;

    const [formData, setFormData] = useState({ ...prospect });
    const [activeTab, setActiveTab] = useState('details'); // details | contact | notes

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
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Contacto Principal</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        name="contact"
                                        value={formData.contact}
                                        onChange={handleChange}
                                        placeholder="Email o Teléfono"
                                        className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-red outline-none"
                                    />
                                </div>
                            </div>

                            {/* Placeholder for future fields */}
                            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-blue-700 text-xs font-medium flex gap-2">
                                <Link size={16} />
                                <span>Aquí podrás vincular múltiples contactos, teléfonos y direcciones en el futuro.</span>
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
        </div>,
        document.body
    );
};

export default EditProspectModal;
