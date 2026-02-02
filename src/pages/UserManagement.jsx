import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Shield, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../hooks/useUsers';

const UserManagement = () => {
    const navigate = useNavigate();
    const { isAdmin, user } = useAuth();
    const { users, loading, updateUserRole, assignComercial, toggleUserActive } = useUsers();
    const [searchTerm, setSearchTerm] = useState('');

    // Redirect if not admin
    if (!isAdmin) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Acceso Denegado</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">Solo los administradores pueden acceder a esta página</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-brand-red text-white rounded-xl font-semibold hover:bg-red-700 transition"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    // Filter users
    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRoleChange = async (userId, newRole) => {
        // Prevent admin from removing their own admin role
        if (userId === user.id && newRole !== 'admin') {
            alert('No puedes cambiar tu propio rol de administrador');
            return;
        }

        const result = await updateUserRole(userId, newRole);
        if (!result.success) {
            alert('Error al actualizar rol: ' + result.error);
        }
    };

    const handleToggleActive = async (userId, currentStatus) => {
        // Prevent admin from deactivating themselves
        if (userId === user.id) {
            alert('No puedes desactivar tu propia cuenta');
            return;
        }

        const result = await toggleUserActive(userId, !currentStatus);
        if (!result.success) {
            alert('Error al cambiar estado: ' + result.error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-white via-red-50 to-red-100 dark:from-slate-800 dark:via-slate-900 dark:to-black px-4 pt-6 pb-8 border-b border-red-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200">Gestión de Usuarios</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Administra roles y permisos</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 pt-6">
                <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 ring-brand-red/10 transition-all">
                    <Search size={20} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar usuario..."
                        className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{users.length}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">Total Usuarios</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-red-200 dark:border-red-900 shadow-sm">
                    <div className="text-2xl font-bold text-red-700 dark:text-red-400">{users.filter(u => u.role === 'admin').length}</div>
                    <div className="text-xs text-red-600 dark:text-red-500 font-semibold uppercase tracking-wide">Admins</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-blue-200 dark:border-blue-900 shadow-sm">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{users.filter(u => u.role === 'supervisor').length}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-500 font-semibold uppercase tracking-wide">Supervisores</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-green-200 dark:border-green-900 shadow-sm">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">{users.filter(u => u.comercial_id).length}</div>
                    <div className="text-xs text-green-600 dark:text-green-500 font-semibold uppercase tracking-wide">Comerciales</div>
                </div>
            </div>

            {/* User Table */}
            <div className="px-4 pb-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-slate-400">Cargando usuarios...</div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Usuario</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Email</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Rol</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Comercial</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800 dark:text-slate-200">{u.full_name || 'Sin nombre'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-600 dark:text-slate-400">{u.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={u.role}
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                    disabled={u.id === user.id}
                                                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-red/20 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <option value="user">Usuario</option>
                                                    <option value="supervisor">Supervisor</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                                    {u.comercial_name || (
                                                        <span className="text-slate-400 dark:text-slate-500 italic">No asignado</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleActive(u.id, u.is_active)}
                                                    disabled={u.id === user.id}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${u.is_active
                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                                                        }`}
                                                >
                                                    {u.is_active ? 'Activo' : 'Inactivo'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
