import React, { useState, useEffect } from 'react';
import { X, Search, User, Users, Briefcase, DollarSign, Calendar, TrendingUp, FileText, Clock } from 'lucide-react';
import { useCompanies } from '../../hooks/useCompanies';
import { useContacts } from '../../hooks/useContacts';
import { supabase } from '../../lib/supabase';

export default function EditOpportunityModal({ isOpen, opportunity, onClose, onSave }) {
    const { companies } = useCompanies();
    const { contacts } = useContacts();

    // Filter companies by type
    const clients = companies.filter(c => c.company_type === 'client');
    const prospects = companies.filter(c => c.company_type === 'prospect');

    // State for users (comerciales)
    const [comerciales, setComerciales] = useState([]);

    // Fetch comerciales (active only)
    useEffect(() => {
        const fetchComerciales = async () => {
            const { data } = await supabase
                .from('comerciales')
                .select('id, name, email')
                .eq('is_active', true)
                .order('name');
            if (data) setComerciales(data);
        };
        fetchComerciales();
    }, []);

    // Initialize form data from opportunity (transform snake_case to camelCase)
    const [formData, setFormData] = useState({
        comercialId: '',
        opportunityName: '',
        linkedEntityType: '',
        linkedEntityId: '',
        contactId: '',
        productType: '',
        amount: '',
        closeDate: '',
        status: 'iniciado',
        probability: 20,
        nextAction: '',
        nextActionDate: '',
        notes: ''
    });

    const [searchResults, setSearchResults] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [availableContacts, setAvailableContacts] = useState([]);

    // Pre-populate form when opportunity changes
    useEffect(() => {
        if (opportunity && isOpen) {
            // Determine linked entity type from the company data
            const linkedEntityType = opportunity.linkedEntity?.type || 'client';

            setFormData({
                comercialId: opportunity.comercial?.id || '',
                opportunityName: opportunity.opportunityName || '',
                linkedEntityType: linkedEntityType,
                linkedEntityId: opportunity.linkedEntity?.id?.toString() || '',
                contactId: opportunity.contact?.id?.toString() || '',
                productType: opportunity.productType || '',
                amount: opportunity.amount?.toString() || '',
                closeDate: opportunity.closeDate || '',
                status: opportunity.status || 'iniciado',
                probability: opportunity.probability || 20,
                nextAction: opportunity.nextAction || '',
                nextActionDate: opportunity.nextActionDate || '',
                notes: opportunity.notes || ''
            });
        }
    }, [opportunity, isOpen]);

    // Auto-search when opportunity name changes
    useEffect(() => {
        if (formData.opportunityName.length >= 3) {
            const clientResults = clients.map(c => ({
                ...c,
                type: 'client',
                displayName: c.trade_name || c.legal_name
            }));
            const prospectResults = prospects.map(p => ({
                ...p,
                type: 'prospect',
                displayName: p.trade_name
            }));

            const allResults = [...clientResults, ...prospectResults];
            const searchTerm = formData.opportunityName.toLowerCase();

            const filtered = allResults.filter(entity => {
                const nameMatch = entity.displayName && entity.displayName.toLowerCase().includes(searchTerm);
                const cuitMatch = entity.cuit && entity.cuit.toLowerCase().includes(searchTerm);
                return nameMatch || cuitMatch;
            });

            setSearchResults(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setSearchResults([]);
            setShowSuggestions(false);
        }
    }, [formData.opportunityName, clients, prospects]);

    // Update available contacts when entity is selected
    useEffect(() => {
        if (formData.linkedEntityId) {
            const entityContacts = contacts.filter(contact => {
                const hasCompany = contact.companies && contact.companies.some(c => {
                    const matches = c.companyId === parseInt(formData.linkedEntityId) &&
                        c.companyType === formData.linkedEntityType;
                    return matches;
                });
                return hasCompany;
            });

            setAvailableContacts(entityContacts);
        } else {
            setAvailableContacts([]);
        }
    }, [formData.linkedEntityId, formData.linkedEntityType, contacts]);

    // Update probability based on status
    useEffect(() => {
        const probabilityDefaults = {
            iniciado: 20,
            presupuestado: 40,
            negociado: 70,
            ganado: 100,
            perdido: 0
        };
        setFormData(prev => ({
            ...prev,
            probability: probabilityDefaults[prev.status] || 20
        }));
    }, [formData.status]);

    const handleSelectEntity = (entity) => {
        setFormData(prev => ({
            ...prev,
            linkedEntityType: entity.type,
            linkedEntityId: entity.id,
            opportunityName: `${formData.productType || 'Oportunidad'} - ${entity.displayName}`
        }));
        setShowSuggestions(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Transform to database schema (camelCase to snake_case)
        const updates = {
            opportunity_name: formData.opportunityName,
            comercial_id: formData.comercialId,
            company_id: parseInt(formData.linkedEntityId),
            contact_id: formData.contactId ? parseInt(formData.contactId) : null,
            product_type: formData.productType,
            amount: parseFloat(formData.amount),
            close_date: formData.closeDate,
            status: formData.status,
            probability: parseInt(formData.probability),
            next_action: formData.nextAction,
            next_action_date: formData.nextActionDate || null,
            notes: formData.notes
        };

        onSave(opportunity.id, updates);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end xl:items-center justify-center pb-16 xl:pb-0">
            <div className="bg-white w-full xl:max-w-2xl xl:rounded-2xl rounded-t-3xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-red to-red-600 text-white p-4 flex items-center justify-between xl:rounded-t-2xl flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold">Editar Oportunidad</h2>
                        <p className="text-red-100 text-xs mt-0.5">Modifica la información</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all">
                        <X size={18} />
                    </button>
                </div>

                {/* Form - Scrollable Content */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="p-4 space-y-4 overflow-y-auto flex-1">
                        {/* Comercial */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                <User size={14} className="inline mr-1.5" />
                                Comercial *
                            </label>
                            <select
                                required
                                value={formData.comercialId}
                                onChange={(e) => setFormData({ ...formData, comercialId: e.target.value })}
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-red focus:ring-2 focus:ring-red-100 outline-none"
                            >
                                <option value="">Seleccionar comercial</option>
                                {comerciales.map(comercial => (
                                    <option key={comercial.id} value={comercial.id}>
                                        {comercial.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Product Type */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                <Briefcase size={14} className="inline mr-1.5" />
                                Tipo de Producto *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.productType}
                                onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                                placeholder="Ej: Fertilizantes, Semillas..."
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-red focus:ring-2 focus:ring-red-100 outline-none"
                            />
                        </div>

                        {/* Opportunity Name with Auto-search */}
                        <div className="relative">
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                <Search size={14} className="inline mr-1.5" />
                                Nombre de Oportunidad *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.opportunityName}
                                onChange={(e) => setFormData({ ...formData, opportunityName: e.target.value })}
                                placeholder="Buscar empresa..."
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-red focus:ring-2 focus:ring-red-100 outline-none"
                            />

                            {/* Auto-suggestions */}
                            {showSuggestions && (
                                <div className="absolute z-10 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                    {searchResults.map(entity => (
                                        <button
                                            key={`${entity.type}-${entity.id}`}
                                            type="button"
                                            onClick={() => handleSelectEntity(entity)}
                                            className="w-full px-3 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2.5 border-b border-slate-100 last:border-0"
                                        >
                                            <div className={`w-8 h-8 rounded-lg ${entity.type === 'client' ? 'bg-emerald-100' : 'bg-purple-100'} flex items-center justify-center flex-shrink-0`}>
                                                {entity.type === 'client' ? <Users size={16} className="text-emerald-600" /> : <User size={16} className="text-purple-600" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-slate-800 truncate">{entity.displayName}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs text-slate-500 capitalize">{entity.type === 'client' ? 'Cliente' : 'Prospecto'}</p>
                                                    {entity.cuit && (
                                                        <>
                                                            <span className="text-xs text-slate-300">•</span>
                                                            <p className="text-xs text-slate-500 font-mono">CUIT: {entity.cuit}</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Selected Entity Display */}
                            {formData.linkedEntityId && (
                                <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-lg ${formData.linkedEntityType === 'client' ? 'bg-emerald-100' : 'bg-purple-100'} flex items-center justify-center flex-shrink-0`}>
                                        {formData.linkedEntityType === 'client' ? <Users size={16} className="text-emerald-600" /> : <User size={16} className="text-purple-600" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-emerald-700 font-medium capitalize">Vinculado a {formData.linkedEntityType === 'client' ? 'Cliente' : 'Prospecto'}</p>
                                        <p className="font-semibold text-sm text-emerald-900 truncate">
                                            {formData.linkedEntityType === 'client'
                                                ? clients.find(c => c.id === parseInt(formData.linkedEntityId))?.trade_name
                                                : prospects.find(p => p.id === parseInt(formData.linkedEntityId))?.trade_name
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Contact */}
                        {availableContacts.length > 0 && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    <User size={14} className="inline mr-1.5" />
                                    Contacto
                                </label>
                                <select
                                    value={formData.contactId}
                                    onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-red focus:ring-2 focus:ring-red-100 outline-none"
                                >
                                    <option value="">Seleccionar contacto</option>
                                    {availableContacts.map(contact => {
                                        const fullName = contact.firstName && contact.lastName
                                            ? `${contact.firstName} ${contact.lastName}`
                                            : '';
                                        const displayText = fullName
                                            ? `${fullName} - ${contact.email}`
                                            : contact.email;

                                        return (
                                            <option key={contact.id} value={contact.id}>
                                                {displayText}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        )}

                        {/* Amount & Close Date */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    <DollarSign size={14} className="inline mr-1.5" />
                                    Monto (ARS) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="1000"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0"
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-red focus:ring-2 focus:ring-red-100 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    <Calendar size={14} className="inline mr-1.5" />
                                    Fecha Cierre *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.closeDate}
                                    onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-red focus:ring-2 focus:ring-red-100 outline-none"
                                />
                            </div>
                        </div>

                        {/* Status & Probability */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Estado *
                                </label>
                                <select
                                    required
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-red focus:ring-2 focus:ring-red-100 outline-none"
                                >
                                    <option value="iniciado">🚀 Iniciado</option>
                                    <option value="presupuestado">📋 Presupuestado</option>
                                    <option value="negociado">🤝 Negociado</option>
                                    <option value="ganado">✅ Ganado</option>
                                    <option value="perdido">❌ Perdido</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    <TrendingUp size={14} className="inline mr-1.5" />
                                    Probabilidad: {formData.probability}%
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={formData.probability}
                                    onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
                                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-red mt-1"
                                />
                            </div>
                        </div>

                        {/* Next Action */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                <FileText size={14} className="inline mr-1.5" />
                                Próxima Acción
                            </label>
                            <textarea
                                value={formData.nextAction}
                                onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
                                placeholder="Describe la próxima acción..."
                                rows="2"
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-red focus:ring-2 focus:ring-red-100 outline-none resize-none"
                            />
                        </div>

                        {/* Next Action Date */}
                        {formData.nextAction && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    <Clock size={14} className="inline mr-1.5" />
                                    Fecha Próxima Acción
                                </label>
                                <input
                                    type="date"
                                    value={formData.nextActionDate}
                                    onChange={(e) => setFormData({ ...formData, nextActionDate: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-red focus:ring-2 focus:ring-red-100 outline-none"
                                />
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Notas
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Información adicional..."
                                rows="2"
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-red focus:ring-2 focus:ring-red-100 outline-none resize-none"
                            />
                        </div>
                    </div>

                    {/* Footer - Fixed Buttons */}
                    <div className="flex gap-3 p-4 border-t border-slate-200 bg-white flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-gradient-to-r from-brand-red to-red-600 text-white font-semibold hover:shadow-lg transition-all"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
