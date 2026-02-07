import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Shield, Users, AlertCircle, UserCog, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../hooks/useUsers';
import CreateUserModal from '../components/settings/CreateUserModal';
import TeamManagement from './TeamManagement';

const UserManagement = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        users,
        loading,
        isAdmin,
        isSupervisor,
        isUser: isRegularUser,
        createUser,
        updateUserRole,
        assignComercial,
        toggleUserActive
    } = useUsers();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('usuarios'); // 'usuarios' or 'equipos'

    // Filter users
    const filteredUsers = users.filter(u =>
        (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRoleChange = async (userId, newRole) => {
        if (!isAdmin) return;

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
        if (!isAdmin) return;

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

    const handleCreateUser = async (userData) => {
        const result = await createUser(userData);
        if (result.success) {
            setIsCreateModalOpen(false);
        }
        return result;
    };

    const handleAssignComercial = async (userId, comercialId) => {
        if (!isAdmin && !isSupervisor) return;

        const result = await assignComercial(userId, comercialId);
        if (!result.success) {
            alert('Error al asignar comercial: ' + result.error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-advanta-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Cargando usuarios...</p>
                </div>
            </div>
        );
    }

    // Get permission level text
    const getPermissionText = () => {
        if (isAdmin) return 'Administrador - Acceso Total';
        if (isSupervisor) return 'Supervisor - Ver y Asignar';
        return 'Usuario - Solo Lectura';
    };

    return (
        <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-40">
            {/* Header */}
            <div className="bg-gradient-to-br from-white via-green-50 to-green-100 dark:from-slate-800 dark:via-slate-900 dark:to-black px-4 pt-6 pb-8 border-b border-green-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-advanta-green rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Usuarios</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{getPermissionText()}</p>
                        </div>
                    </div>

                    {/* Create User Button - Admin Only */}
                    {isAdmin && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#44C12B] to-[#4BA323] text-white rounded-xl font-semibold hover:from-[#3a9120] hover:to-[#3d8a1f] transition shadow-lg"
                        >
                            <UserPlus size={20} />
                            <span className="hidden sm:inline">Crear Usuario</span>
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => setActiveTab('usuarios')}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition ${activeTab === 'usuarios'
                            ? 'bg-advanta-green text-white shadow-lg'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        👤 Usuarios
                    </button>
                    <button
                        onClick={() => setActiveTab('equipos')}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition ${activeTab === 'equipos'
                            ? 'bg-advanta-green text-white shadow-lg'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        👥 Equipos
                    </button>
                </div>

                {/* Search Bar - Only for usuarios tab */}
                {activeTab === 'usuarios' && (
                    <>
                        <div className="relative mt-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-advanta-green text-slate-800 dark:text-white"
                            />
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">{users.length}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Activos</p>
                                <p className="text-2xl font-bold text-green-600">{users.filter(u => u.is_active).length}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Admins</p>
                                <p className="text-2xl font-bold text-advanta-green">{users.filter(u => u.role === 'admin').length}</p>
                            </div>
                        </div>
                    </>
                )}
            </div>


            {/* Content - Conditional based on active tab */}
            {activeTab === 'usuarios' ? (
                <div className="p-4 space-y-3">
                    {filteredUsers.length === 0 ? (
                        <div className="text-center py-12">
                            <Users size={64} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">No se encontraron usuarios</p>
                        </div>
                    ) : (
                        filteredUsers.map((userItem) => (
                            <div
                                key={userItem.id}
                                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-slate-800 dark:text-white">
                                                {userItem.full_name || 'Sin nombre'}
                                            </h3>
                                            {userItem.id === user.id && (
                                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                                    Tú
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{userItem.email}</p>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Role Badge */}
                                            <span className={`px-2 py-1 text-xs rounded-lg font-medium ${userItem.role === 'admin'
                                                ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                                                : userItem.role === 'supervisor'
                                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}>
                                                {userItem.role === 'admin' ? 'Administrador' :
                                                    userItem.role === 'supervisor' ? 'Supervisor' : 'Usuario'}
                                            </span>

                                            {/* Status Badge */}
                                            <span className={`px-2 py-1 text-xs rounded-lg font-medium ${userItem.is_active
                                                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}>
                                                {userItem.is_active ? 'Activo' : 'Inactivo'}
                                            </span>

                                            {/* Comercial Info */}
                                            {userItem.comercial_name && (
                                                <span className="px-2 py-1 text-xs rounded-lg font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                                                    Comercial: {userItem.comercial_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions - Role Based */}
                                    <div className="flex flex-col gap-2 ml-4">
                                        {/* Admin Actions */}
                                        {isAdmin && userItem.id !== user.id && (
                                            <>
                                                <select
                                                    value={userItem.role}
                                                    onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                                                    className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                                >
                                                    <option value="user">Usuario</option>
                                                    <option value="supervisor">Supervisor</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                <button
                                                    onClick={() => handleToggleActive(userItem.id, userItem.is_active)}
                                                    className={`px-3 py-1 text-sm rounded-lg font-medium transition ${userItem.is_active
                                                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                                                        : 'bg-green-200 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-300'
                                                        }`}
                                                >
                                                    {userItem.is_active ? 'Desactivar' : 'Activar'}
                                                </button>
                                            </>
                                        )}

                                        {/* Supervisor Actions */}
                                        {isSupervisor && !isAdmin && (
                                            <button
                                                onClick={() => {/* TODO: Open assign modal */ }}
                                                className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg font-medium hover:bg-blue-200 transition flex items-center gap-1"
                                            >
                                                <UserCog size={14} />
                                                Asignar
                                            </button>
                                        )}

                                        {/* User View - No Actions */}
                                        {isRegularUser && !isAdmin && !isSupervisor && (
                                            <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                                                <Eye size={14} />
                                                Solo lectura
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <TeamManagement />
            )}

            {/* Create User Modal */}
            {isAdmin && (
                <CreateUserModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreateUser={handleCreateUser}
                />
            )}
        </div>
    );
};

export default UserManagement;
