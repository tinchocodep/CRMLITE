import React, { useState, useEffect } from 'react';
import { X, Building2, UserPlus, Plus, Trash2, Star, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompanies } from '../../hooks/useCompanies';
import { useContacts } from '../../hooks/useContacts';
import { useToast } from '../../contexts/ToastContext';
import ComercialSelector from '../shared/ComercialSelector';


const ContactModal = ({ isOpen, onClose, onSave, contact = null, preselectedCompany = null }) => {
    const { companies } = useCompanies();
    const { createContact, updateContact } = useContacts();
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        notes: '',
        comercialId: null,
        companies: []
    });

    const [newCompany, setNewCompany] = useState({
        companyId: '',
        companyName: '',
        companyType: '',
        role: '',
        isPrimary: false
    });

    const [validationErrors, setValidationErrors] = useState({
        role: false,
        company: false
    });

    const [errors, setErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    // Get all available companies from Supabase
    const allCompanies = companies.map(c => ({
        id: c.id,
        name: c.trade_name || c.legal_name || '',
        type: c.company_type,
        fullName: c.legal_name || ''
    }));

    // Filter companies for autocomplete
    const filteredCompanies = allCompanies.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Initialize form when contact changes or preselectedCompany is provided
    useEffect(() => {
        if (contact) {
            setFormData({
                firstName: contact.firstName || '',
                lastName: contact.lastName || '',
                email: contact.email || '',
                phone: contact.phone || '',
                notes: contact.notes || '',
                comercialId: contact.comercialId || contact.comercial_id || null,
                companies: contact.companies || []
            });
        } else {
            // If creating new contact with preselected company, add it automatically
            // BUT only if the company has a valid ID (prospect must be saved first)
            const initialCompanies = (preselectedCompany && preselectedCompany.companyId) ? [{
                companyId: preselectedCompany.companyId,
                companyName: preselectedCompany.companyName,
                companyType: preselectedCompany.companyType,
                companyStatus: 'active',
                isCompanyActive: true,
                role: '', // User will fill this
                isPrimary: true,
                addedDate: new Date().toISOString()
            }] : [];

            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                notes: '',
                comercialId: null,
                companies: initialCompanies
            });
        }
        setErrors({});
    }, [contact, isOpen, preselectedCompany]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSelectCompany = (company) => {
        setNewCompany({
            companyId: company.id,
            companyName: company.name,
            companyType: company.type,
            role: '',
            isPrimary: formData.companies.length === 0 // First company is primary by default
        });
        setSearchTerm('');
    };

    const handleAddCompany = () => {
        // Reset validation errors
        setValidationErrors({ role: false, company: false });

        // Validate
        if (!newCompany.companyId) {
            setValidationErrors(prev => ({ ...prev, company: true }));
            return;
        }
        if (!newCompany.role.trim()) {
            setValidationErrors(prev => ({ ...prev, role: true }));
            return;
        }
        // Check if company already added
        if (formData.companies.some(c => c.companyId === newCompany.companyId)) {
            showToast('Esta empresa ya está vinculada a este contacto', 'warning');
            return;
        }

        const companyData = allCompanies.find(c => c.id === newCompany.companyId);

        setFormData(prev => ({
            ...prev,
            companies: [...prev.companies, {
                companyId: newCompany.companyId,
                companyName: newCompany.companyName,
                companyType: newCompany.companyType,
                companyStatus: 'active',
                isCompanyActive: true,
                role: newCompany.role,
                isPrimary: newCompany.isPrimary,
                addedDate: new Date().toISOString()
            }]
        }));

        // Reset new company form
        setNewCompany({
            companyId: '',
            companyName: '',
            companyType: '',
            role: '',
            isPrimary: false
        });
    };

    const handleRemoveCompany = (companyId) => {
        const updatedCompanies = formData.companies.filter(c => c.companyId !== companyId);

        // If we removed the primary contact and there are still companies, make the first one primary
        const hadPrimary = formData.companies.find(c => c.companyId === companyId)?.isPrimary;
        if (hadPrimary && updatedCompanies.length > 0) {
            updatedCompanies[0].isPrimary = true;
        }

        setFormData(prev => ({ ...prev, companies: updatedCompanies }));
    };

    const handleTogglePrimary = (companyId) => {
        setFormData(prev => ({
            ...prev,
            companies: prev.companies.map(c => ({
                ...c,
                isPrimary: c.companyId === companyId
            }))
        }));
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'El nombre es obligatorio';
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'El apellido es obligatorio';
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }
        // Require comercial_id
        if (!formData.comercialId) {
            newErrors.comercialId = 'Debe asignar un comercial';
        }
        // Companies are optional - contacts can exist without being linked to any company
        // Only validate if there ARE companies that at least one is active
        // Check that at least one company is active
        const hasActiveCompany = formData.companies.some(c => c.isCompanyActive);
        if (!hasActiveCompany && formData.companies.length > 0) {
            newErrors.companies = 'Debe tener al menos una empresa activa';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        try {


            // CRITICAL: Check if this is a pending contact (no valid company ID)
            // This happens when creating a contact for an unsaved prospect
            const hasValidCompanyId = formData.companies.some(c => c.companyId && c.companyId !== null);

            if (!hasValidCompanyId && formData.companies.length > 0) {

                // This is a pending contact for an unsaved prospect
                // Just pass the data to the parent via onSave callback
                // The parent (EditProspectModal) will handle closing the modal
                if (onSave) {
                    await onSave(formData);
                }
                // Don't call onClose() here - let parent handle it to avoid race condition
                return;
            }

            if (contact?.id) {
                // Update existing contact
                const result = await updateContact(contact.id, formData);
                if (result.success) {
                    // Wait for onSave callback to complete before closing
                    if (onSave) {
                        await onSave(result.data);
                    }
                    onClose();
                } else {
                    showToast({
                        id: `error-update-contact-${Date.now()}`,
                        title: '❌ Error al actualizar',
                        description: result.error || 'No se pudo actualizar el contacto',
                        priority: 'high',
                        timeAgo: 'Ahora'
                    });
                }
            } else {
                // Create new contact
                const result = await createContact(formData);
                if (result.success) {
                    // Show success notification
                    showToast({
                        id: `success-create-contact-${Date.now()}`,
                        title: '✅ Contacto creado exitosamente',
                        description: `${formData.firstName} ${formData.lastName} ha sido agregado`,
                        priority: 'medium',
                        timeAgo: 'Ahora'
                    });

                    // Wait for onSave callback to complete before closing
                    if (onSave) {
                        await onSave(result.data);
                    }
                    onClose();
                } else {
                    showToast({
                        id: `error-create-contact-${Date.now()}`,
                        title: '❌ Error al crear contacto',
                        description: result.error || 'No se pudo crear el contacto',
                        priority: 'high',
                        timeAgo: 'Ahora'
                    });
                }
            }
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            showToast({
                id: `error-submit-${Date.now()}`,
                title: '❌ Error inesperado',
                description: error.message || 'Ocurrió un error al procesar la solicitud',
                priority: 'high',
                timeAgo: 'Ahora'
            });
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full md:w-[600px] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-green-50 to-orange-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-advanta-green/10 flex items-center justify-center">
                                <UserPlus className="w-5 h-5 text-advanta-green" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {contact ? 'Editar Contacto' : 'Nuevo Contacto'}
                                </h2>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center transition-colors"
                        >
                            <X size={18} className="text-slate-600" />
                        </button>
                    </div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Personal Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Datos Personales</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 ${errors.firstName
                                            ? 'border-red-300 focus:ring-red-200'
                                            : 'border-slate-200 focus:ring-advanta-green/20'
                                            }`}
                                        placeholder="Juan"
                                    />
                                    {errors.firstName && (
                                        <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Apellido *
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 ${errors.lastName
                                            ? 'border-red-300 focus:ring-red-200'
                                            : 'border-slate-200 focus:ring-advanta-green/20'
                                            }`}
                                        placeholder="Pérez"
                                    />
                                    {errors.lastName && (
                                        <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 ${errors.email
                                        ? 'border-red-300 focus:ring-red-200'
                                        : 'border-slate-200 focus:ring-advanta-green/20'
                                        }`}
                                    placeholder="juan.perez@example.com"
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-advanta-green/20"
                                    placeholder="+54 9 11 1234-5678"
                                />
                            </div>

                            {/* Comercial Assignment */}
                            <div>
                                <ComercialSelector
                                    value={formData.comercialId}
                                    onChange={(value) => setFormData(prev => ({ ...prev, comercialId: value }))}
                                    label="Asignar a Comercial *"
                                    required={true}
                                />
                                {errors.comercialId && (
                                    <p className="text-xs text-red-600 mt-1">{errors.comercialId}</p>
                                )}
                            </div>
                        </div>

                        {/* Companies */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                <Building2 size={14} />
                                Empresas Vinculadas *
                            </h3>

                            {errors.companies && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                    <p className="text-xs text-red-700 font-semibold">{errors.companies}</p>
                                </div>
                            )}

                            {/* Existing Companies List */}
                            {formData.companies.length > 0 && (
                                <div className="space-y-2">
                                    {formData.companies.map((company, idx) => (
                                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-sm text-slate-800">{company.companyName}</span>
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${company.companyType === 'client'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {company.companyType === 'client' ? 'CLIENTE' : 'PROSPECTO'}
                                                    </span>
                                                    {company.isPrimary && (
                                                        <span className="px-2 py-0.5 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-md text-[10px] font-bold flex items-center gap-1">
                                                            <Star size={10} fill="currentColor" /> PRINCIPAL
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-600 font-semibold">{company.role}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!company.isPrimary && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTogglePrimary(company.companyId)}
                                                        className="p-1.5 hover:bg-yellow-100 rounded-lg transition-colors"
                                                        title="Marcar como principal"
                                                    >
                                                        <Star size={16} className="text-slate-400" />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCompany(company.companyId)}
                                                    className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} className="text-red-600" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Preselected Company Info or Add New Company */}
                            {preselectedCompany ? (
                                // Show info message when company is preselected
                                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-green-700">
                                        <CheckCircle size={18} className="flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-bold">
                                                Este contacto se vinculará a: {preselectedCompany.companyName}
                                            </p>
                                            <p className="text-xs text-green-600 mt-1">
                                                El contacto quedará automáticamente asociado a esta empresa
                                            </p>
                                        </div>
                                    </div>

                                    {/* Allow editing the role for preselected company */}
                                    {formData.companies.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                                Rol/Cargo en esta empresa
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.companies[0]?.role || ''}
                                                onChange={(e) => {
                                                    const updatedCompanies = [...formData.companies];
                                                    updatedCompanies[0].role = e.target.value;
                                                    setFormData(prev => ({ ...prev, companies: updatedCompanies }));
                                                }}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-advanta-green/20"
                                                placeholder="Ej: Gerente General, Dueño, Encargado..."
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Show company selection UI when no preselected company
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase">
                                        <Plus size={14} />
                                        Agregar Empresa
                                    </div>

                                    {/* Company Search/Select */}
                                    <div className="relative">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                            Seleccionar Empresa
                                        </label>
                                        <input
                                            type="text"
                                            value={newCompany.companyId ? newCompany.companyName : searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setNewCompany(prev => ({ ...prev, companyId: '', companyName: '', companyType: '' }));
                                            }}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-advanta-green/20"
                                            placeholder="Buscar empresa..."
                                            disabled={!!newCompany.companyId}
                                        />

                                        {/* Autocomplete Dropdown */}
                                        {searchTerm && !newCompany.companyId && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                                                {filteredCompanies.length > 0 ? (
                                                    filteredCompanies.map(company => (
                                                        <button
                                                            key={company.id}
                                                            type="button"
                                                            onClick={() => handleSelectCompany(company)}
                                                            className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between text-sm"
                                                        >
                                                            <span className="font-semibold text-slate-800">{company.name}</span>
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${company.type === 'client'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-blue-100 text-blue-700'
                                                                }`}>
                                                                {company.type === 'client' ? 'CLIENTE' : 'PROSPECTO'}
                                                            </span>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-2 text-sm text-slate-500">No se encontraron empresas</div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Role Input */}
                                    {newCompany.companyId && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                                    Rol/Cargo
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newCompany.role}
                                                    onChange={(e) => {
                                                        setNewCompany(prev => ({ ...prev, role: e.target.value }));
                                                        if (validationErrors.role) {
                                                            setValidationErrors(prev => ({ ...prev, role: false }));
                                                        }
                                                    }}
                                                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 ${validationErrors.role
                                                            ? 'border-red-500 focus:ring-red-200'
                                                            : 'border-slate-200 focus:ring-advanta-green/20'
                                                        }`}
                                                    placeholder="Gerente Comercial"
                                                />
                                            </div>

                                            {/* Primary Checkbox */}
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={newCompany.isPrimary}
                                                    onChange={(e) => setNewCompany(prev => ({ ...prev, isPrimary: e.target.checked }))}
                                                    className="w-4 h-4 text-advanta-green border-slate-300 rounded focus:ring-2 focus:ring-advanta-green/20"
                                                />
                                                <span className="text-xs font-semibold text-slate-600">Contacto principal de esta empresa</span>
                                            </label>

                                            {/* Add Button */}
                                            <button
                                                type="button"
                                                onClick={handleAddCompany}
                                                className="w-full px-4 py-2 bg-gradient-to-r from-[#44C12B] to-[#4BA323] hover:from-[#3a9120] hover:to-[#3d8a1f] text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Plus size={16} />
                                                Agregar Empresa
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Notas
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-advanta-green/20 resize-none"
                                placeholder="Información adicional sobre el contacto..."
                            />
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="flex items-center gap-3 p-6 border-t border-slate-200 bg-slate-50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-[#44C12B] to-[#4BA323] hover:from-[#3a9120] hover:to-[#3d8a1f] text-white rounded-xl font-bold transition-colors"
                        >
                            {contact ? 'Guardar' : 'Crear Contacto'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence >
    );
};

export default ContactModal;
