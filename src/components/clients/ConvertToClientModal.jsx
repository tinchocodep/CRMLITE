import React, { useState, useEffect } from 'react';
import { X, UserPlus, Building2, User, Phone, Mail, UserCheck } from 'lucide-react';
import ComercialSelector from '../shared/ComercialSelector';
import CompanyContactsSection from '../shared/CompanyContactsSection';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useSystemToast } from '../../hooks/useSystemToast';
const ConvertToClientModal = ({ isOpen, onClose, prospect, onConvert, title, allContacts = [] }) => {
    const { comercialId } = useAuth();
    const { addNotification } = useNotifications();
    const { showWarningLong } = useSystemToast();
    const [formData, setFormData] = useState({
        legalName: '',
        tradeName: '',
        cuit: '',
        email: '',
        phone: '',
        city: '',
        province: '',
        address: '',
        comercialId: null,
        businessUnitId: null
    });


    useEffect(() => {
        if (prospect) {
            setFormData(prev => ({
                ...prev,
                legalName: prospect.legal_name || prospect.legalName || prospect.companyName || '',
                tradeName: prospect.trade_name || prospect.tradeName || '',
                cuit: prospect.cuit || '',
                email: prospect.email || '',
                phone: prospect.phone || '',
                city: prospect.city || '',
                province: prospect.province || '',
                address: prospect.address || '',
                id: prospect.id,
                comercialId: prospect.comercial_id || null,
                businessUnitId: prospect.business_unit_id || null
            }));
        } else {
            setFormData({
                legalName: '', tradeName: '', cuit: '', email: '', phone: '',
                city: '', province: '', address: '', comercialId: null, businessUnitId: null
            });
        }
    }, [prospect]);

    // Reset adicional: limpiar cuando el modal se abre en modo "Nuevo" (sin prospect)
    // Cubre el caso donde prospect era null antes y sigue siendo null, por lo que
    // el efecto anterior no se re-dispara y los datos del último formulario persisten.
    useEffect(() => {
        if (isOpen && !prospect) {
            setFormData({
                legalName: '', tradeName: '', cuit: '', email: '', phone: '',
                city: '', province: '', address: '', comercialId: null, businessUnitId: null
            });
        }
    }, [isOpen]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // CUIT es obligatorio para convertir a cliente
        if (!formData.cuit || !formData.cuit.trim()) {
            showWarningLong(
                '⚠️ CUIT requerido',
                'Para convertir un prospecto a cliente es necesario cargar el número de CUIT. Completá el campo antes de confirmar.'
            );
            return;
        }

        const finalComercialId = formData.comercialId || comercialId;
        const finalBusinessUnitId = formData.businessUnitId || null;

        // Require at least one: comercial or business unit
        if (!finalComercialId && !finalBusinessUnitId) {
            addNotification({
                id: `validation-commercial-${Date.now()}`,
                title: '⚠️ Asignar comercial',
                description: 'Debe asignar un comercial o unidad de negocio antes de guardar',
                priority: 'medium',
                timeAgo: 'Ahora'
            });
            return;
        }

        const dataToSubmit = {
            id: formData.id || null,
            trade_name: formData.tradeName,
            legal_name: formData.legalName,
            cuit: formData.cuit.trim(),
            email: formData.email || null,
            phone: formData.phone || null,
            city: formData.city,
            province: formData.province,
            address: formData.address,
            client_since: (() => {
                const now = new Date();
                return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            })(),
            comercial_id: finalBusinessUnitId ? null : finalComercialId,
            business_unit_id: finalBusinessUnitId,
        };

        onConvert(dataToSubmit);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
            <div className="w-full md:max-w-4xl h-[100dvh] md:h-auto md:max-h-[90vh] bg-white md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300">

                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-100 p-4 md:p-6 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-advanta-green/10 text-advanta-green rounded-2xl">
                            <UserPlus size={24} className="md:w-7 md:h-7" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-bold text-slate-800">
                                {title || (prospect ? 'Convertir a Cliente' : 'Alta de Cliente')}
                            </h3>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">

                    {/* 1. Datos Principales */}
                    <section>
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Building2 size={16} /> Datos Administrativos
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">Razón Social</label>
                                <input name="legalName" value={formData.legalName} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-advanta-green focus:bg-white focus:ring-4 ring-advanta-green/5 transition-all outline-none" placeholder="Nombre Legal S.A." />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">Nombre Comercial</label>
                                <input name="tradeName" value={formData.tradeName} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-advanta-green focus:bg-white focus:ring-4 ring-advanta-green/5 transition-all outline-none" placeholder="Marca Comercial" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">CUIT <span className="text-red-500">*</span></label>
                                <input name="cuit" value={formData.cuit} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-700 focus:border-advanta-green focus:bg-white focus:ring-4 ring-advanta-green/5 transition-all outline-none" placeholder="XX-XXXXXXXX-X" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">Dirección</label>
                                <input name="address" value={formData.address} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-advanta-green focus:bg-white focus:ring-4 ring-advanta-green/5 transition-all outline-none" placeholder="Calle y Altura" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">Localidad</label>
                                <input name="city" value={formData.city} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-advanta-green focus:bg-white focus:ring-4 ring-advanta-green/5 transition-all outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">Provincia</label>
                                <input name="province" value={formData.province} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-advanta-green focus:bg-white focus:ring-4 ring-advanta-green/5 transition-all outline-none" />
                            </div>
                        </div>
                        {/* Phone & Email row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1"><Phone size={12} /> Teléfono</label>
                                <input name="phone" value={formData.phone} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-advanta-green focus:bg-white focus:ring-4 ring-advanta-green/5 transition-all outline-none" placeholder="Ej: +54 9 11 1234-5678" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1"><Mail size={12} /> Email</label>
                                <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-advanta-green focus:bg-white focus:ring-4 ring-advanta-green/5 transition-all outline-none" placeholder="empresa@ejemplo.com" />
                            </div>
                        </div>
                    </section>

                    {/* Comercial Assignment */}
                    <section className="pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <User size={16} /> Datos Comerciales
                        </h4>
                        <ComercialSelector
                            value={formData.comercialId}
                            businessUnitValue={formData.businessUnitId}
                            onChange={(cId, buId) => setFormData(prev => ({
                                ...prev,
                                comercialId: cId,
                                businessUnitId: buId
                            }))}
                            label="Asignar a Comercial"
                        />
                    </section>

                    {/* Contactos Vinculados - solo visible al editar un cliente existente */}
                    {prospect?.id && (
                        <section className="pt-4 border-t border-slate-100">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <UserCheck size={16} /> Contactos Vinculados
                            </h4>
                            <CompanyContactsSection
                                contacts={allContacts}
                                companyId={prospect.id}
                                companyName={prospect.trade_name || prospect.legal_name}
                                companyType="client"
                                isCompact={false}
                            />
                        </section>
                    )}


                </form>

                {/* Footer Actions */}
                <div className="shrink-0 p-4 border-t border-slate-100 bg-white flex justify-end gap-3 z-10 pb-20 md:pb-4">
                    <button type="button" onClick={onClose} className="px-5 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm">Cancelar</button>
                    <button onClick={handleSubmit} type="submit" className="px-6 py-3 rounded-xl bg-brand text-white font-bold shadow-lg shadow-advanta-green/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-sm">
                        <UserPlus size={18} />
                        Confirmar
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ConvertToClientModal;
