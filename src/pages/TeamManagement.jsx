import React, { useState, useEffect } from 'react';
import { Users, UserPlus, X, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useSystemToast } from '../hooks/useSystemToast';

const TeamManagement = () => {
    const { userProfile, isAdmin } = useAuth();
    const { showSuccess, showError } = useSystemToast();
    const [loading, setLoading] = useState(true);
    const [supervisors, setSupervisors] = useState([]);
    const [comerciales, setComerciales] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [selectedSupervisor, setSelectedSupervisor] = useState(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    useEffect(() => {
        if (!isAdmin) return;
        fetchData();
    }, [isAdmin]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch supervisors
            const { data: supervisorUsers, error: supervisorError } = await supabase
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
                .order('full_name');

            if (supervisorError) throw supervisorError;

            // Fetch all comerciales
            const { data: allComerciales, error: comercialesError } = await supabase
                .from('comerciales')
                .select('id, name, email')
                .eq('is_active', true)
                .order('name');

            if (comercialesError) throw comercialesError;

            // Fetch assignments
            const { data: assignmentsData, error: assignmentsError } = await supabase
                .from('supervisor_comerciales')
                .select(`
                    id,
                    supervisor_id,
                    comercial_id,
                    supervisor:comerciales!supervisor_comerciales_supervisor_id_fkey(id, name),
                    comercial:comerciales!supervisor_comerciales_comercial_id_fkey(id, name, email)
                `);

            if (assignmentsError) throw assignmentsError;

            setSupervisors(supervisorUsers || []);
            setComerciales(allComerciales || []);
            setAssignments(assignmentsData || []);
        } catch (error) {
            console.error('Error fetching team data:', error);
            showError('Error al cargar datos del equipo');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignComercial = async (supervisorId, comercialId) => {
        try {
            const { error } = await supabase
                .from('supervisor_comerciales')
                .insert([{
                    supervisor_id: supervisorId,
                    comercial_id: comercialId,
                    created_by: userProfile.id
                }]);

            if (error) throw error;

            showSuccess('Comercial asignado exitosamente');
            fetchData();
            setIsAssignModalOpen(false);
        } catch (error) {
            console.error('Error assigning comercial:', error);
            showError('Error al asignar comercial: ' + error.message);
        }
    };

    const handleRemoveAssignment = async (assignmentId) => {
        if (!confirm('¿Estás seguro de eliminar esta asignación?')) return;

        try {
            const { error } = await supabase
                .from('supervisor_comerciales')
                .delete()
                .eq('id', assignmentId);

            if (error) throw error;

            showSuccess('Asignación eliminada');
            fetchData();
        } catch (error) {
            console.error('Error removing assignment:', error);
            showError('Error al eliminar asignación');
        }
    };

    const getAssignedComerciales = (supervisorComercialId) => {
        return assignments.filter(a => a.supervisor_id === supervisorComercialId);
    };

    const getAvailableComerciales = (supervisorComercialId) => {
        const assignedIds = getAssignedComerciales(supervisorComercialId).map(a => a.comercial_id);
        // Exclude the supervisor's own comercial_id
        return comerciales.filter(c =>
            !assignedIds.includes(c.id) && c.id !== supervisorComercialId
        );
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
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
                    <div className="w-16 h-16 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Cargando equipos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen pb-40">
            {/* Header */}
            <div className="bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-slate-800 dark:via-slate-900 dark:to-black px-4 pt-6 pb-8 border-b border-blue-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                            Gestión de Equipos
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Asignar comerciales a supervisores
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Supervisores</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{supervisors.length}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Comerciales</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{comerciales.length}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Asignaciones</p>
                        <p className="text-2xl font-bold text-blue-600">{assignments.length}</p>
                    </div>
                </div>
            </div>

            {/* Supervisors List */}
            <div className="p-4 space-y-4">
                {supervisors.length === 0 ? (
                    <div className="text-center py-12">
                        <Users size={64} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">
                            No hay supervisores registrados
                        </p>
                    </div>
                ) : (
                    supervisors.map((supervisor) => {
                        const supervisorComercialId = supervisor.comercial?.id;
                        const assignedComerciales = getAssignedComerciales(supervisorComercialId);
                        const availableComerciales = getAvailableComerciales(supervisorComercialId);

                        return (
                            <div
                                key={supervisor.id}
                                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm"
                            >
                                {/* Supervisor Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-slate-800 dark:text-white">
                                            {supervisor.full_name}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {supervisor.email}
                                        </p>
                                        {supervisor.comercial && (
                                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                                Comercial: {supervisor.comercial.name}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedSupervisor(supervisor);
                                            setIsAssignModalOpen(true);
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                                        disabled={!supervisorComercialId || availableComerciales.length === 0}
                                    >
                                        <UserPlus size={16} />
                                        Asignar
                                    </button>
                                </div>

                                {/* Assigned Comerciales */}
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                                        Comerciales Asignados ({assignedComerciales.length})
                                    </p>
                                    {assignedComerciales.length === 0 ? (
                                        <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                                            No hay comerciales asignados
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {assignedComerciales.map((assignment) => (
                                                <div
                                                    key={assignment.id}
                                                    className="flex items-center justify-between bg-slate-50 dark:bg-slate-700 rounded-lg p-3"
                                                >
                                                    <div>
                                                        <p className="font-medium text-slate-800 dark:text-white text-sm">
                                                            {assignment.comercial?.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            {assignment.comercial?.email}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveAssignment(assignment.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Assign Modal */}
            {isAssignModalOpen && selectedSupervisor && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                Asignar Comercial
                            </h3>
                            <button
                                onClick={() => setIsAssignModalOpen(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Supervisor: <span className="font-semibold">{selectedSupervisor.full_name}</span>
                        </p>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {getAvailableComerciales(selectedSupervisor.comercial?.id).map((comercial) => (
                                <button
                                    key={comercial.id}
                                    onClick={() => handleAssignComercial(selectedSupervisor.comercial?.id, comercial.id)}
                                    className="w-full text-left p-3 bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                >
                                    <p className="font-medium text-slate-800 dark:text-white">{comercial.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{comercial.email}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManagement;
