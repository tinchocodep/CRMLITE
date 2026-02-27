import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, DollarSign, Calendar, TrendingUp, FileText, Clock, Truck, MapPin } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useCompanies } from '../../hooks/useCompanies';
import { useComerciales } from '../../hooks/useComerciales';
import BusinessUnitPicker from '../shared/BusinessUnitPicker';
import ProductSelector from '../shared/ProductSelector';

export default function EditOpportunityModal({ isOpen, opportunity, onClose, onSave }) {
    const location = useLocation();

    const { companies } = useCompanies();
    const { comerciales } = useComerciales();

    // Filter companies by type
    const clients = companies.filter(c => c.company_type === 'client');
    const prospects = companies.filter(c => c.company_type === 'prospect');

    // Initialize form data from opportunity
    const [formData, setFormData] = useState({
        comercialId: '',
        opportunityName: '',
        linkedEntityType: '',
        linkedEntityId: '',
        contactId: '',
        productType: '',
        amount: '',
        closeDate: '',
        status: 'prospecting',
        probability: 20,
        nextAction: '',
        nextActionDate: '',
        notes: '',
        // NEW FIELDS for quotation
        products: [],
        saleType: 'own',
        paymentCondition: 'cash',
        customPaymentDetail: '',
        deliveryDate: '',
        originAddress: '',
        destinationAddress: ''
    });

    const [availableContacts, setAvailableContacts] = useState([]);
    const [loadingContacts, setLoadingContacts] = useState(false);

    // Pre-populate form when opportunity changes
    useEffect(() => {

        if (opportunity && isOpen) {
            const linkedEntityType = opportunity.linkedEntity?.type || 'client';

            const newFormData = {
                comercialId: opportunity.comercial?.id || '',
                opportunityName: opportunity.opportunityName || '',
                linkedEntityType: linkedEntityType,
                linkedEntityId: opportunity.linkedEntity?.id?.toString() || '',
                contactId: opportunity.contact?.id?.toString() || '',
                productType: opportunity.productType || '',
                amount: opportunity.amount?.toString() || '',
                closeDate: opportunity.closeDate || '',
                status: opportunity.status || 'prospecting',
                probability: opportunity.probability || 20,
                nextAction: opportunity.nextAction || '',
                nextActionDate: opportunity.nextActionDate || '',
                notes: opportunity.notes || '',
                // NEW FIELDS
                products: opportunity.products || [],
                saleType: opportunity.saleType || 'own',
                paymentCondition: opportunity.paymentCondition || 'cash',
                customPaymentDetail: opportunity.customPaymentDetail || '',
                deliveryDate: opportunity.deliveryDate || '',
                originAddress: opportunity.originAddress || '',
                destinationAddress: opportunity.destinationAddress || ''
            };

            setFormData(newFormData);
        }
    }, [opportunity, isOpen]);

    // Fetch contacts for the selected company from Supabase
    useEffect(() => {
        const fetchContactsForCompany = async () => {
            if (!formData.linkedEntityId) {
                setAvailableContacts([]);
                return;
            }

            setLoadingContacts(true);
            try {
                const { data, error } = await supabase
                    .from('contact_companies')
                    .select(`
                        contact:contacts!contact_id(
                            id, first_name, last_name, email, phone
                        )
                    `)
                    .eq('company_id', parseInt(formData.linkedEntityId));

                if (error) throw error;

                // Extract unique contacts from the join result
                const contacts = (data || [])
                    .map(row => row.contact)
                    .filter(Boolean)
                    .filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);

                setAvailableContacts(contacts);
            } catch (err) {
                console.error('[EditOppModal] Error fetching contacts:', err);
                setAvailableContacts([]);
            } finally {
                setLoadingContacts(false);
            }
        };

        fetchContactsForCompany();
    }, [formData.linkedEntityId]);

    // Update probability based on status
    useEffect(() => {
        const probabilityDefaults = {
            prospecting: 20,
            qualification: 40,
            proposal: 60,
            negotiation: 80,
            won: 100,
            lost: 0
        };
        setFormData(prev => ({
            ...prev,
            probability: probabilityDefaults[prev.status] || 20
        }));
    }, [formData.status]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Transform to database schema
        const updates = {
            opportunity_name: formData.opportunityName,
            comercial_id: formData.comercialId,
            company_id: parseInt(formData.linkedEntityId),
            contact_id: formData.contactId ? parseInt(formData.contactId) : null,
            product_type: formData.productType,
            amount: formData.amount ? parseFloat(formData.amount) : null,
            close_date: formData.closeDate,
            status: formData.status,
            probability: parseInt(formData.probability),
            next_action: formData.nextAction,
            next_action_date: formData.nextActionDate || null,
            notes: formData.notes,
            // NEW FIELDS
            products: formData.products,
            sale_type: formData.saleType,
            payment_condition: formData.paymentCondition,
            custom_payment_detail: formData.customPaymentDetail,
            delivery_date: formData.deliveryDate || null,
            origin_address: formData.originAddress,
            destination_address: formData.destinationAddress
        };

        onSave(opportunity.id, updates);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-end xl:items-center justify-center">
            <div className="bg-white w-full xl:max-w-4xl xl:rounded-2xl rounded-t-3xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-advanta-green to-green-600 text-white p-4 flex items-center justify-between xl:rounded-t-2xl flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold">Editar Oportunidad</h2>
                        <p className="text-green-100 text-xs mt-0.5">Modifica la información y productos</p>
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
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-green-100 outline-none"
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
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-green-100 outline-none"
                            />
                        </div>


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
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-green-100 outline-none"
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
                                    contactId: '' // Reset contact when company changes
                                }));
                            }}
                            clients={clients}
                            prospects={prospects}
                            required={true}
                            label="Cliente / Prospecto"
                        />

                        {/* Contact — only shows contacts linked to the selected company */}
                        {(availableContacts.length > 0 || loadingContacts) && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    <User size={14} className="inline mr-1.5" />
                                    Contacto
                                </label>
                                <select
                                    value={formData.contactId}
                                    onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                                    disabled={loadingContacts}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-green-100 outline-none disabled:opacity-50"
                                >
                                    <option value="">{loadingContacts ? 'Cargando contactos...' : 'Seleccionar contacto'}</option>
                                    {availableContacts.map(contact => {
                                        const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Sin nombre';
                                        const emailInfo = contact.email ? ` (${contact.email})` : '';
                                        return (
                                            <option key={contact.id} value={contact.id}>
                                                {fullName}{emailInfo}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        )}

                        {/* PRODUCTS SECTION */}
                        <div className="border-t-2 border-slate-200 pt-4 mt-4">
                            <h3 className="text-sm font-bold text-slate-700 mb-3">📦 Productos y Condiciones</h3>

                            <ProductSelector
                                selectedProducts={formData.products}
                                onChange={(products) => setFormData({ ...formData, products })}
                            />
                        </div>

                        {/* Sale Type & Payment Condition */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    <Truck size={14} className="inline mr-1.5" />
                                    Tipo de Venta
                                </label>
                                <select
                                    value={formData.saleType}
                                    onChange={(e) => setFormData({ ...formData, saleType: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-green-100 outline-none"
                                >
                                    <option value="own">Propia</option>
                                    <option value="advanta">Advanta</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    <DollarSign size={14} className="inline mr-1.5" />
                                    Condición de Pago
                                </label>
                                <select
                                    value={formData.paymentCondition}
                                    onChange={(e) => setFormData({ ...formData, paymentCondition: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-green-100 outline-none"
                                >
                                    <option value="cash">Contado</option>
                                    <option value="30d">30 días</option>
                                    <option value="60d">60 días</option>
                                    <option value="90d">90 días</option>
                                    <option value="custom">Personalizado</option>
                                </select>
                            </div>
                        </div>

                        {/* Custom Payment Condition - Shows only when 'Personalizado' is selected */}
                        {formData.paymentCondition === 'custom' && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    <DollarSign size={14} className="inline mr-1.5" />
                                    Detalle de Condición Personalizada *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.customPaymentDetail || ''}
                                    onChange={(e) => setFormData({ ...formData, customPaymentDetail: e.target.value })}
                                    placeholder="Ej: 50% anticipo, 50% a 45 días"
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-green-100 outline-none"
                                />
                            </div>
                        )}
                        {/* Delivery Date */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                <Calendar size={14} className="inline mr-1.5" />
                                Fecha de Entrega
                            </label>
                            <input
                                type="date"
                                value={formData.deliveryDate}
                                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-green-100 outline-none"
                            />
                        </div>

                        {/* Addresses */}
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    <MapPin size={14} className="inline mr-1.5" />
                                    Dirección de Origen
                                </label>
                                <input
                                    type="text"
                                    value={formData.originAddress}
                                    onChange={(e) => setFormData({ ...formData, originAddress: e.target.value })}
                                    placeholder="Ej: Depósito Central - Av. Libertador 1500, CABA"
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-green-100 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    <MapPin size={14} className="inline mr-1.5" />
                                    Dirección de Destino
                                </label>
                                <input
                                    type="text"
                                    value={formData.destinationAddress}
                                    onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                                    placeholder="Ej: Campo Verde - Ruta 89 Km 230, Formosa"
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-green-100 outline-none"
                                />
                            </div>
                        </div>

                        {/* Amount & Close Date */}
                        <div className="grid grid-cols-2 gap-3 border-t-2 border-slate-200 pt-4 mt-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    <DollarSign size={14} className="inline mr-1.5" />
                                    Monto (ARS)
                                </label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0"
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-green-100 outline-none"
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
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-green-100 outline-none"
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
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-green-100 outline-none"
                                >
                                    <option value="prospecting">🔍 Prospección</option>
                                    <option value="qualification">📊 Calificación</option>
                                    <option value="proposal">📝 Propuesta</option>
                                    <option value="negotiation">💼 Negociación</option>
                                    <option value="won">🏆 Ganado</option>
                                    <option value="lost">❌ Perdido</option>
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

                        {/* Next Action + Date */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-green-100 outline-none resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    <Clock size={14} className="inline mr-1.5" />
                                    Fecha Próxima Acción
                                </label>
                                <input
                                    type="date"
                                    value={formData.nextActionDate}
                                    onChange={(e) => setFormData({ ...formData, nextActionDate: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-green-100 outline-none"
                                />
                            </div>
                        </div>

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
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-green-100 outline-none resize-none"
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
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
