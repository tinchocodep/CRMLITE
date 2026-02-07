import React, { useState } from 'react';
import { Users, Plus, Mail, Phone, CheckCircle, XCircle, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useComerciales } from '../hooks/useComerciales';
import { useSystemToast } from '../hooks/useSystemToast';
import CreateComercialModal from '../components/comerciales/CreateComercialModal';

const ComercialesManagement = () => {
    const { isAdmin } = useAuth();
    const { comerciales, loading, createComercial, toggleComercialActive } = useComerciales();
    const { showSuccess, showError } = useSystemToast();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleCreateComercial = async (comercialData) => {
        const result = await createComercial(comercialData);

        if (result.success) {
            showSuccess('Comercial creado exitosamente');
            setIsCreateModalOpen(false);
        } else {
            showError('Error al crear comercial: ' + result.error);
        }

        return result;
    };

    const handleToggleActive = async (comercialId, currentStatus) => {
        const result = await toggleComercialActive(comercialId, !currentStatus);

        if (result.success) {
            showSuccess(currentStatus ? 'Comercial desactivado' : 'Comercial activado');
        } else {
            showError('Error al cambiar estado');
        }
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                        Acceso Denegado
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                        Solo los administradores pueden acceder a esta sección
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-advanta-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Cargando comerciales...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen pb-40">
            {/* Header */}
            <div className="bg-gradient-to-br from-white via-red-50 to-green-100 dark:from-slate-800 dark:via-slate-900 dark:to-black px-4 pt-6 pb-8 border-b border-red-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-advanta-green rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                                Gestión de Comerciales
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Administrar representantes comerciales
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-advanta-green to-green-700 hover:from-red-700 hover:to-green-800 text-white rounded-xl font-semibold transition shadow-lg"
                    >
                        <Plus size={20} />
                        <span className="hidden md:inline">Nuevo Comercial</span>
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Comerciales</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{comerciales.length}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Activos</p>
                        <p className="text-2xl font-bold text-green-600">
                            {comerciales.filter(c => c.is_active).length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Comerciales List */}
            <div className="p-4">
                {comerciales.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <Users size={64} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 mb-4">
                            No hay comerciales registrados
                        </p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-6 py-3 bg-advanta-green text-white rounded-xl font-semibold hover:bg-red-700 transition"
                        >
                            Crear Primer Comercial
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {comerciales.map((comercial) => (
                            <div
                                key={comercial.id}
                                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-800 dark:text-white text-lg">
                                            {comercial.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            ID: {comercial.id}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleToggleActive(comercial.id, comercial.is_active)}
                                        className={`p-2 rounded-lg transition ${comercial.is_active
                                            ? 'bg-green-50 dark:bg-green-900/20 text-green-600'
                                            : 'bg-red-50 dark:bg-red-900/20 text-red-600'
                                            }`}
                                    >
                                        {comercial.is_active ? (
                                            <CheckCircle size={20} />
                                        ) : (
                                            <XCircle size={20} />
                                        )}
                                    </button>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail size={16} className="text-slate-400" />
                                        <span className="text-slate-600 dark:text-slate-300">
                                            {comercial.email}
                                        </span>
                                    </div>
                                    {comercial.phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone size={16} className="text-slate-400" />
                                            <span className="text-slate-600 dark:text-slate-300">
                                                {comercial.phone}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* User Link */}
                                {comercial.user && (
                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-advanta-green dark:text-red-400">
                                            👤 Vinculado a: {comercial.user.full_name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Rol: {comercial.user.role}
                                        </p>
                                    </div>
                                )}

                                {/* Status Badge */}
                                <div className="mt-3">
                                    <span
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${comercial.is_active
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                            }`}
                                    >
                                        {comercial.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <CreateComercialModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreateComercial={handleCreateComercial}
            />
        </div>
    );
};

export default ComercialesManagement;
