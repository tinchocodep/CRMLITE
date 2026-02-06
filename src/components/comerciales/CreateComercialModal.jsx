import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrentTenant } from '../../hooks/useCurrentTenant';

const CreateComercialModal = ({ isOpen, onClose, onCreateComercial }) => {
    const { tenantId } = useCurrentTenant();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        supervisorId: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [supervisors, setSupervisors] = useState([]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validations
        if (!formData.name || !formData.email) {
            setError('Nombre y email son obligatorios');
            setLoading(false);
            return;
        }

        const result = await onCreateComercial(formData);

        if (result.success) {
            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: ''
            });
            onClose();
        } else {
            setError(result.error || 'Error al crear comercial');
        }

        setLoading(false);
    };

    // Load supervisors
    useEffect(() => {
        const fetchSupervisors = async () => {
            if (!tenantId) return;

            const { data, error } = await supabase
                .from('users')
                .select(`
                    id,
                    full_name,
                    email,
                    comercial_id,
                    comercial:comerciales!users_comercial_id_fkey(id, name)
                `)
                .eq('role', 'supervisor')
                .eq('is_active', true)
                .eq('tenant_id', tenantId)
                .order('full_name');

            if (!error && data) {
                setSupervisors(data);
            }
        };

        if (isOpen) {
            fetchSupervisors();
        }
    }, [isOpen, tenantId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Crear Comercial</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Nombre Completo *
                        </label>
                        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 ring-purple-600/20">
                            <User size={18} className="text-slate-400" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Juan Pérez"
                                className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none w-full"
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Email *
                        </label>
                        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 ring-purple-600/20">
                            <Mail size={18} className="text-slate-400" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="comercial@empresa.com"
                                className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none w-full"
                                required
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Teléfono
                        </label>
                        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 ring-purple-600/20">
                            <Phone size={18} className="text-slate-400" />
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+54 9 11 1234-5678"
                                className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none w-full"
                            />
                        </div>
                    </div>

                    {/* Supervisor Assignment (Optional) */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Asignar a Supervisor (Opcional)
                        </label>
                        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 ring-purple-600/20">
                            <UserCheck size={18} className="text-slate-400" />
                            <select
                                value={formData.supervisorId || ''}
                                onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value || null })}
                                className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none w-full"
                            >
                                <option value="">Sin supervisor</option>
                                {supervisors.map((supervisor) => (
                                    <option key={supervisor.id} value={supervisor.comercial?.id}>
                                        {supervisor.full_name} ({supervisor.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-1">
                            Si seleccionas un supervisor, este comercial será asignado automáticamente a él
                        </p>
                    </div>

                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                            💡 El comercial se creará activo. Podrás vincularlo a un usuario después.
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creando...' : 'Crear Comercial'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateComercialModal;
