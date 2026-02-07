import React, { useState, useEffect } from 'react';
import { X, Search, User, Users, Briefcase, DollarSign, Calendar, TrendingUp, FileText, Clock } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useCompanies } from '../../hooks/useCompanies';
import { useContacts } from '../../hooks/useContacts';
import { supabase } from '../../lib/supabase';
import ComercialSelector from '../shared/ComercialSelector';
import BusinessUnitPicker from '../shared/BusinessUnitPicker';

export default function CreateOpportunityModal({ isOpen, onClose, onSave }) {
    const location = useLocation();
    const { companies } = useCompanies();
    const { contacts } = useContacts();

    // Filter companies by type
    const clients = companies.filter(c => c.company_type === 'client');
    const prospects = companies.filter(c => c.company_type === 'prospect');

    // Auto-close modal when route changes (fixes navigation blocking)
    useEffect(() => {
        if (isOpen) {
            onClose();
        }
    }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const [availableContacts, setAvailableContacts] = useState([]);

    // Update available contacts when entity is selected
    useEffect(() => {
        if (formData.linkedEntityId) {
            console.log('Filtering contacts for entity:', {
                linkedEntityId: formData.linkedEntityId,
                linkedEntityType: formData.linkedEntityType,
                totalContacts: contacts.length
            });

            // Get contacts for the selected entity
            const entityContacts = contacts.filter(contact => {
                const hasCompany = contact.companies && contact.companies.some(c => {
                    const matches = c.companyId === parseInt(formData.linkedEntityId) &&
                        c.companyType === formData.linkedEntityType;
                    return matches;
                });
                return hasCompany;
            });

            console.log('Filtered contacts:', entityContacts.length, entityContacts);
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

    const handleSubmit = (e) => {
        e.preventDefault();

        console.log('=== CREATING OPPORTUNITY ===');
        console.log('Form Data:', formData);

        const linkedEntity = formData.linkedEntityType === 'client'
            ? clients.find(c => c.id === parseInt(formData.linkedEntityId))
            : prospects.find(p => p.id === parseInt(formData.linkedEntityId));
        const contact = contacts.find(c => c.id === parseInt(formData.contactId));

        console.log('Resolved entities:', { linkedEntity, contact });

        // Transform to database schema (only IDs, no nested objects)
        const newOpportunity = {
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

        console.log('Opportunity object to save:', newOpportunity);

        onSave(newOpportunity);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-end xl:items-center justify-center">
            <div className="bg-white w-full xl:max-w-2xl xl:rounded-2xl rounded-t-3xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between xl:rounded-t-2xl flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Nueva Oportunidad</h2>
                        <p className="text-slate-500 text-xs mt-0.5">Completa la información</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-all">
                        <X size={18} className="text-slate-600" />
                    </button>
                </div>

                {/* Form - Scrollable Content */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="p-4 space-y-4 overflow-y-auto flex-1">
                        {/* Comercial */}
                        <ComercialSelector
                            value={formData.comercialId}
                            onChange={(value) => setFormData({ ...formData, comercialId: value })}
                            required={true}
                            label="Asignar a Comercial"
                        />

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
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-red-100 outline-none"
                            />
                        </div>

                        {/* Business Unit Picker */}
                        <BusinessUnitPicker
                            value={formData.linkedEntityId}
                            entityType={formData.linkedEntityType}
                            onChange={(entityId, entityType, entity) => {
                                setFormData(prev => ({
                                    ...prev,
                                    linkedEntityId: entityId,
                                    linkedEntityType: entityType,
                                    // Auto-fill opportunity name if empty
                                    opportunityName: prev.opportunityName ||
                                        (entity ? `${prev.productType || 'Oportunidad'} - ${entity.displayName || entity.trade_name}` : '')
                                }));
                            }}
                            clients={clients}
                            prospects={prospects}
                            required={true}
                            label="Unidad de Negocio"
                        />

                        {/* Opportunity Name */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                <FileText size={14} className="inline mr-1.5" />
                                Nombre de Oportunidad *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.opportunityName}
                                onChange={(e) => setFormData({ ...formData, opportunityName: e.target.value })}
                                placeholder="Ej: Venta de fertilizantes Q1 2024"
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-red-100 outline-none"
                            />
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
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-red-100 outline-none"
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
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-red-100 outline-none"
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
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-red-100 outline-none"
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
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-red-100 outline-none"
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
                                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-advanta-green mt-1"
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
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-red-100 outline-none resize-none"
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
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-red-100 outline-none"
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
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-red-100 outline-none resize-none"
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
                            className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-gradient-to-r from-advanta-green to-green-600 text-white font-semibold hover:shadow-lg transition-all"
                        >
                            Crear Oportunidad
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
