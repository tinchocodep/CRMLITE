import React, { useState, useEffect } from 'react';
import { X, UserPlus, CheckCircle2, Building2, MapPin, FileText, Tractor, Leaf, DollarSign, User, Briefcase, Target, Map, Plus, Trash2 } from 'lucide-react';

const importanceConfig = [
    { id: 'low', label: 'Baja', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { id: 'medium', label: 'Media', color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { id: 'high', label: 'Alta', color: 'bg-red-50 border-red-200 text-red-700' }
];

const ConvertToClientModal = ({ isOpen, onClose, prospect, onConvert, title }) => {
    const [formData, setFormData] = useState({
        // Basic Info (Inherited from prospect)
        legalName: '',
        tradeName: '',
        cuit: '',
        city: '',
        province: '',
        address: '',

        // Client-specific fields
        paymentTerms: '',
        creditLimit: '',
        detail: '',

        // Segment (Multiple Units) - will be saved separately
        segments: [{ id: Date.now(), name: 'Principal', hectares: '', crops: '', machinery: '' }],

        // Importance
        importance: 'medium'
    });

    useEffect(() => {
        if (prospect) {
            setFormData(prev => ({
                ...prev,
                // Map common fields from prospect - support both snake_case and camelCase
                legalName: prospect.legal_name || prospect.legalName || prospect.companyName || '',
                tradeName: prospect.trade_name || prospect.tradeName || '',
                cuit: prospect.cuit || '',
                city: prospect.city || '',
                province: prospect.province || '',
                address: prospect.address || '',
                // Client-specific fields
                paymentTerms: prospect.payment_terms || prospect.paymentTerms || '',
                creditLimit: prospect.credit_limit || prospect.creditLimit || '',
                detail: prospect.detail || '',
                segments: (prospect.segments && prospect.segments.length > 0)
                    ? prospect.segments
                    : [{ id: Date.now(), name: 'Principal', hectares: '', crops: '', machinery: '' }],
                importance: prospect.importance || 'medium',
                // Keep ID if exists
                id: prospect.id,
            }));
        } else {
            // Reset form for new entry
            setFormData({
                legalName: '', tradeName: '', cuit: '', city: '', province: '', address: '',
                paymentTerms: '', creditLimit: '', detail: '',
                segments: [{ id: Date.now(), name: 'Principal', hectares: '', crops: '', machinery: '' }],
                importance: 'medium'
            });
        }
    }, [prospect]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Only send fields that exist in the companies table
        const dataToSubmit = {
            // Include ID if editing existing client
            ...(formData.id && { id: formData.id }),
            // Map camelCase to snake_case for existing DB fields
            trade_name: formData.tradeName,
            legal_name: formData.legalName,
            cuit: formData.cuit,
            city: formData.city,
            province: formData.province,
            address: formData.address,
            detail: formData.detail || null,
            importance: formData.importance || 'medium',
            segments: formData.segments || [],
            // Client-specific fields - use local date
            client_since: (() => {
                const now = new Date();
                return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            })(),
            payment_terms: formData.paymentTerms || null,
            credit_limit: formData.creditLimit || null
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
                        <div className="p-3 bg-brand-red/10 text-brand-red rounded-2xl">
                            <UserPlus size={24} className="md:w-7 md:h-7" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-bold text-slate-800">
                                {title || (prospect ? 'Editar Cliente' : 'Alta de Cliente')}
                            </h3>
                            <p className="text-xs md:text-sm text-slate-500 font-medium leading-tight">Complete la ficha técnica para vincular el legajo</p>
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
                            <Building2 size={16} /> Identidad Fiscal y Ubicación
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">Razón Social</label>
                                <input name="legalName" value={formData.legalName} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-red focus:bg-white focus:ring-4 ring-brand-red/5 transition-all outline-none" placeholder="Nombre Legal S.A." />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">Nombre de Fantasía</label>
                                <input name="tradeName" value={formData.tradeName} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-red focus:bg-white focus:ring-4 ring-brand-red/5 transition-all outline-none" placeholder="Marca Comercial" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">CUIT</label>
                                <input name="cuit" value={formData.cuit} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-700 focus:border-brand-red focus:bg-white focus:ring-4 ring-brand-red/5 transition-all outline-none" placeholder="XX-XXXXXXXX-X" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">Dirección</label>
                                <input name="address" value={formData.address} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-brand-red focus:bg-white focus:ring-4 ring-brand-red/5 transition-all outline-none" placeholder="Calle y Altura" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">Localidad</label>
                                <input name="city" value={formData.city} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-brand-red focus:bg-white focus:ring-4 ring-brand-red/5 transition-all outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">Provincia</label>
                                <input name="province" value={formData.province} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-brand-red focus:bg-white focus:ring-4 ring-brand-red/5 transition-all outline-none" />
                            </div>
                        </div>
                    </section>

                    {/* 2. Negocio y Segmentación (Multiple Units) */}
                    <section className="pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Target size={16} /> Unidades Productivas / Campos
                            </h4>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({
                                    ...prev,
                                    segments: [...prev.segments, { id: Date.now(), name: '', hectares: '', crops: '', machinery: '' }]
                                }))}
                                className="text-xs font-bold text-brand-red hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                            >
                                <Plus size={14} /> Agregar Campo
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.segments.map((segment, index) => (
                                <div key={segment.id} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 relative group hover:border-slate-200 transition-colors">
                                    {formData.segments.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, segments: prev.segments.filter(s => s.id !== segment.id) }))}
                                            className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        <div className="md:col-span-3 space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre / Ubicación</label>
                                            <input
                                                value={segment.name}
                                                onChange={(e) => {
                                                    const newSegments = [...formData.segments];
                                                    newSegments[index].name = e.target.value;
                                                    setFormData(prev => ({ ...prev, segments: newSegments }));
                                                }}
                                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-brand-red outline-none"
                                                placeholder="Ej. Campo Norte"
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Hectáreas</label>
                                            <div className="relative">
                                                <Map size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                                                <input
                                                    type="number"
                                                    value={segment.hectares}
                                                    onChange={(e) => {
                                                        const newSegments = [...formData.segments];
                                                        newSegments[index].hectares = e.target.value;
                                                        setFormData(prev => ({ ...prev, segments: newSegments }));
                                                    }}
                                                    className="w-full pl-8 p-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-brand-red outline-none"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        <div className="md:col-span-3 space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Cultivos</label>
                                            <input
                                                value={segment.crops}
                                                onChange={(e) => {
                                                    const newSegments = [...formData.segments];
                                                    newSegments[index].crops = e.target.value;
                                                    setFormData(prev => ({ ...prev, segments: newSegments }));
                                                }}
                                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-brand-red outline-none"
                                                placeholder="Soja, Maíz..."
                                            />
                                        </div>
                                        <div className="md:col-span-4 space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Maquinaria</label>
                                            <input
                                                value={segment.machinery}
                                                onChange={(e) => {
                                                    const newSegments = [...formData.segments];
                                                    newSegments[index].machinery = e.target.value;
                                                    setFormData(prev => ({ ...prev, segments: newSegments }));
                                                }}
                                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-brand-red outline-none"
                                                placeholder="Tractores..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 ml-1">Detalle General del Negocio</label>
                            <textarea name="detail" rows="2" value={formData.detail} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-brand-red focus:bg-white focus:ring-4 ring-brand-red/5 transition-all outline-none resize-none" placeholder="Descripción operativa general..." />
                        </div>
                    </section>

                    {/* 3. Datos de Cliente */}
                    <section className="pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Briefcase size={16} /> Información de Cliente
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">Condiciones de Pago</label>
                                <select name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-red focus:bg-white focus:ring-4 ring-brand-red/5 transition-all outline-none">
                                    <option value="">Seleccionar...</option>
                                    <option value="contado">Contado</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="30_dias">30 días</option>
                                    <option value="60_dias">60 días</option>
                                    <option value="90_dias">90 días</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">Límite de Crédito</label>
                                <div className="relative">
                                    <DollarSign size={16} className="absolute left-3 top-3 text-slate-400" />
                                    <input
                                        name="creditLimit"
                                        type="number"
                                        value={formData.creditLimit}
                                        onChange={handleChange}
                                        className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-brand-red focus:border-brand-red focus:bg-white focus:ring-4 ring-brand-red/5 transition-all outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 4. Importancia (Logos) */}
                    <section className="pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Target size={16} /> Clasificación de Importancia
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                            {importanceConfig.map((level) => (
                                <button
                                    key={level.id}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, importance: level.id }))}
                                    className={`
                                        relative p-2 md:p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 md:gap-3 group
                                        ${formData.importance === level.id
                                            ? `${level.color} shadow-lg scale-[1.02]`
                                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'}
                                    `}
                                >
                                    <span className="font-bold text-xs md:text-sm tracking-wide text-center">{level.label}</span>

                                    {formData.importance === level.id && (
                                        <div className="absolute top-1 md:top-3 right-1 md:right-3 text-current animate-in zoom-in">
                                            <CheckCircle2 size={14} className="md:w-[18px] md:h-[18px]" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>

                </form>

                {/* Footer Actions */}
                <div className="shrink-0 p-4 border-t border-slate-100 bg-white flex justify-end gap-3 z-10 pb-20 md:pb-4">
                    <button type="button" onClick={onClose} className="px-5 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm">Cancelar</button>
                    <button onClick={handleSubmit} type="submit" className="px-6 py-3 rounded-xl bg-brand-red text-white font-bold shadow-lg shadow-brand-red/30 hover:bg-red-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-sm">
                        <UserPlus size={18} />
                        Guardar
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ConvertToClientModal;
