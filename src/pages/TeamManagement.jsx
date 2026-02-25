import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Users, UserPlus, X, Trash2, ChevronDown, ChevronRight, Shield, Map } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useSystemToast } from '../hooks/useSystemToast';
import { useConfirm } from '../contexts/ConfirmContext';
import { useCurrentTenant } from '../hooks/useCurrentTenant';

// ─────────────────────────────────────────────
// Roles y sus colores
// ─────────────────────────────────────────────
const ROLE_LABELS = {
    gerente_zona: 'Gerente de Zona',
    supervisor: 'Supervisor',
    user: 'Comercial',
};
const ROLE_COLORS = {
    gerente_zona: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    supervisor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    user: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
};

// ─────────────────────────────────────────────
// Modal: Asignar un usuario a un padre (GZ asigna supervisor, Supervisor asigna comercial)
// ─────────────────────────────────────────────
const AssignModal = ({ parent, parentRole, availableUsers, childRole, onAssign, onClose }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    Asignar {ROLE_LABELS[childRole] || 'Usuario'}
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition">
                    <X size={18} />
                </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {ROLE_LABELS[parentRole]}: <span className="font-semibold text-slate-800 dark:text-white">{parent.full_name || parent.email}</span>
            </p>

            {availableUsers.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-8">
                    No hay {ROLE_LABELS[childRole]?.toLowerCase() || 'usuarios'}s disponibles para asignar
                </p>
            ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {availableUsers.map((u) => (
                        <button
                            key={u.id}
                            onClick={() => onAssign(u.id)}
                            className="w-full text-left p-3 bg-slate-50 dark:bg-slate-700 hover:bg-advanta-green/10 dark:hover:bg-advanta-green/20 rounded-xl transition group"
                        >
                            <p className="font-medium text-slate-800 dark:text-white group-hover:text-advanta-green">
                                {u.full_name || u.email}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    </div>
);

// ─────────────────────────────────────────────
// Fila de usuario con botón quitar
// ─────────────────────────────────────────────
const UserRow = ({ user, role, canEdit, onRemove }) => (
    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
        <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {user.full_name || user.email}
            </p>
            <p className="text-xs text-slate-400">{user.email}</p>
        </div>
        {canEdit && (
            <button
                onClick={() => onRemove(user)}
                className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                title="Quitar asignación"
            >
                <Trash2 size={14} />
            </button>
        )}
    </div>
);

// ─────────────────────────────────────────────
// Card de Supervisor con sus comerciales
// ─────────────────────────────────────────────
const SupervisorCard = ({ supervisor, team, canEdit, onAssignComercial, onRemove }) => {
    const [expanded, setExpanded] = useState(true);
    return (
        <div className="ml-6 border-l-2 border-blue-200 dark:border-blue-800 pl-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden mb-2">
                {/* Header supervisor */}
                <div className="flex items-center justify-between px-3 py-2.5">
                    <button onClick={() => setExpanded(v => !v)} className="flex items-center gap-2 flex-1 text-left">
                        <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/50 rounded-md flex items-center justify-center flex-shrink-0">
                            <Users size={14} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                {supervisor.full_name || supervisor.email}
                            </p>
                            <p className="text-xs text-slate-500">{supervisor.email}</p>
                        </div>
                        <span className="ml-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded-full text-xs text-blue-600 dark:text-blue-400 font-medium">
                            {team.length}
                        </span>
                        {expanded ? <ChevronDown size={14} className="text-slate-400 ml-auto" /> : <ChevronRight size={14} className="text-slate-400 ml-auto" />}
                    </button>
                    {canEdit && (
                        <button
                            onClick={() => onAssignComercial(supervisor)}
                            className="ml-2 flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded-lg text-xs font-semibold hover:opacity-90 transition flex-shrink-0"
                        >
                            <UserPlus size={12} /> Comercial
                        </button>
                    )}
                    {canEdit && (
                        <button
                            onClick={() => onRemove(supervisor)}
                            className="ml-1 p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                            title="Quitar supervisor de esta zona"
                        >
                            <Trash2 size={13} />
                        </button>
                    )}
                </div>
                {/* Comerciales del supervisor */}
                {expanded && (
                    <div className="border-t border-slate-100 dark:border-slate-600">
                        {team.length === 0 ? (
                            <p className="text-xs text-slate-400 italic px-4 py-2">Sin comerciales asignados</p>
                        ) : (
                            team.map(u => (
                                <UserRow key={u.id} user={u} role="user" canEdit={canEdit} onRemove={onRemove} />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// Card de Gerente de Zona con sus supervisores
// ─────────────────────────────────────────────
const GerenteCard = ({ gerente, supervisors, allUsers, canEdit, onAssignSupervisor, onAssignComercial, onRemoveUser }) => {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Header GZ */}
            <div className="flex items-center justify-between p-4">
                <button onClick={() => setExpanded(v => !v)} className="flex items-center gap-3 flex-1 text-left">
                    <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Map size={18} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800 dark:text-white text-sm">
                            {gerente.full_name || gerente.email}
                        </p>
                        <p className="text-xs text-slate-500">{gerente.email}</p>
                    </div>
                    <span className="ml-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 rounded-full text-xs font-medium text-amber-600 dark:text-amber-400">
                        {supervisors.length} supervisores
                    </span>
                    {expanded ? <ChevronDown size={16} className="text-slate-400 ml-auto" /> : <ChevronRight size={16} className="text-slate-400 ml-auto" />}
                </button>

                {canEdit && (
                    <button
                        onClick={() => onAssignSupervisor(gerente)}
                        className="ml-3 flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:opacity-90 transition flex-shrink-0"
                    >
                        <UserPlus size={14} /> Supervisor
                    </button>
                )}
            </div>

            {/* Supervisores del GZ */}
            {expanded && (
                <div className="border-t border-slate-100 dark:border-slate-700 pb-3">
                    {supervisors.length === 0 ? (
                        <p className="text-xs text-slate-400 italic px-6 py-3">Sin supervisores asignados</p>
                    ) : (
                        supervisors.map(sup => {
                            const team = allUsers.filter(u => u.role === 'user' && u.supervisor_id === sup.id);
                            return (
                                <SupervisorCard
                                    key={sup.id}
                                    supervisor={sup}
                                    team={team}
                                    canEdit={canEdit}
                                    onAssignComercial={onAssignComercial}
                                    onRemove={onRemoveUser}
                                />
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
const TeamManagement = () => {
    const { userProfile, isAdmin, isGerenteZona, isSupervisor, canManageTeam } = useAuth();
    const { tenantId, loading: tenantLoading } = useCurrentTenant();
    const { showSuccess, showError } = useSystemToast();
    const { confirm } = useConfirm();

    const showErrorRef = useRef(showError);
    useEffect(() => { showErrorRef.current = showError; }, [showError]);
    const showSuccessRef = useRef(showSuccess);
    useEffect(() => { showSuccessRef.current = showSuccess; }, [showSuccess]);

    const [loading, setLoading] = useState(true);
    const [allUsers, setAllUsers] = useState([]);

    // assignModal: { parent, parentRole, childRole }
    const [assignModal, setAssignModal] = useState(null);

    // ── Fetch ──────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        if (tenantLoading) return;
        if (!tenantId) { setLoading(false); return; }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('users')
                .select('id, full_name, email, role, is_active, supervisor_id')
                .eq('tenant_id', tenantId)
                .eq('is_active', true)
                .order('full_name');

            if (error) throw error;
            setAllUsers(data || []);
        } catch (err) {
            console.error('Error fetching team data:', err);
            showErrorRef.current('Error al cargar datos del equipo');
        } finally {
            setLoading(false);
        }
    }, [tenantId, tenantLoading]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Derivaciones ──────────────────────────────────────────────
    const gerentes = allUsers.filter(u => u.role === 'gerente_zona');
    const supervisores = allUsers.filter(u => u.role === 'supervisor');
    const comerciales = allUsers.filter(u => u.role === 'user');

    // Usuarios sin asignar (sin supervisor_id y no son GZ)
    const supsSinGerente = supervisores.filter(s => !s.supervisor_id);
    const comercSinSup = comerciales.filter(c => !c.supervisor_id);

    const getVisibleGerentes = () => {
        if (isAdmin) return gerentes;
        if (isGerenteZona && userProfile?.id) return gerentes.filter(g => g.id === userProfile.id);
        return [];
    };

    const getAvailable = (childRole, parentId) => {
        if (childRole === 'supervisor') {
            // Supervisores aún sin gerente asignado (supervisor_id null)
            return supervisores.filter(s => s.supervisor_id == null);
        }
        if (childRole === 'user') {
            // Comerciales aún sin supervisor
            return comerciales.filter(c => c.supervisor_id == null);
        }
        return [];
    };

    // ── Acciones ───────────────────────────────────────────────────
    const handleAssign = async (userId) => {
        if (!assignModal) return;
        try {
            const { error } = await supabase
                .from('users')
                .update({ supervisor_id: assignModal.parent.id })
                .eq('id', userId);

            if (error) throw error;
            showSuccessRef.current('Asignado correctamente');
            setAssignModal(null);
            fetchData();
        } catch (err) {
            console.error(err);
            showErrorRef.current('Error al asignar: ' + err.message);
        }
    };

    const handleRemove = async (user) => {
        const label = ROLE_LABELS[user.role] || 'usuario';
        const ok = await confirm({
            title: 'Quitar asignación',
            description: `¿Querés quitar a ${user.full_name || user.email} de su ${user.role === 'supervisor' ? 'gerente' : 'supervisor'}?`,
            confirmLabel: 'Quitar',
            variant: 'danger',
        });
        if (!ok) return;
        try {
            const { error } = await supabase
                .from('users')
                .update({ supervisor_id: null })
                .eq('id', user.id);

            if (error) throw error;
            showSuccessRef.current(`${label} quitado de su asignación`);
            fetchData();
        } catch (err) {
            console.error(err);
            showErrorRef.current('Error al quitar: ' + err.message);
        }
    };

    // ── Render ─────────────────────────────────────────────────────
    if (!canManageTeam && !isSupervisor) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Shield size={48} className="text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Sin permisos para esta sección</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-advanta-green border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Vista supervisor: solo su equipo
    if (isSupervisor && !canManageTeam) {
        const myTeam = comerciales.filter(u => u.supervisor_id === userProfile?.id);
        return (
            <div className="p-4 space-y-4 pb-20">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Mi equipo ({myTeam.length})</p>
                    {myTeam.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">Sin comerciales asignados aún</p>
                    ) : (
                        myTeam.map(u => <UserRow key={u.id} user={u} canEdit={false} onRemove={() => { }} />)
                    )}
                </div>
            </div>
        );
    }

    const visibleGerentes = getVisibleGerentes();

    // Stats
    const totalGerentes = gerentes.length;
    const totalSupervisores = supervisores.length;
    const totalComerciales = comerciales.length;

    return (
        <div className="p-4 space-y-4 pb-20">

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Gerentes</p>
                    <p className="text-2xl font-bold text-amber-500">{totalGerentes}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Supervisores</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalSupervisores}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Comerciales</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalComerciales}</p>
                </div>
            </div>

            {/* ── MODO A: Jerarquía completa GZ → Supervisor → Comercial ─ */}
            {visibleGerentes.length > 0 && (
                <div className="space-y-4">
                    {visibleGerentes.map(gz => {
                        const mySupers = supervisores.filter(s => s.supervisor_id === gz.id);
                        return (
                            <GerenteCard
                                key={gz.id}
                                gerente={gz}
                                supervisors={mySupers}
                                allUsers={allUsers}
                                canEdit={canManageTeam}
                                onAssignSupervisor={(g) => setAssignModal({ parent: g, parentRole: 'gerente_zona', childRole: 'supervisor' })}
                                onAssignComercial={(s) => setAssignModal({ parent: s, parentRole: 'supervisor', childRole: 'user' })}
                                onRemoveUser={handleRemove}
                            />
                        );
                    })}
                </div>
            )}

            {/* ── MODO B: Sin GZ — Admin administra supervisores directo ── */}
            {visibleGerentes.length === 0 && supervisores.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                        <span className="text-xs text-slate-400 dark:text-slate-500">Sin Gerente de Zona asignado</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    </div>
                    {supervisores.map(sup => {
                        const team = allUsers.filter(u => u.role === 'user' && u.supervisor_id === sup.id);
                        return (
                            <SupervisorCard
                                key={sup.id}
                                supervisor={sup}
                                team={team}
                                canEdit={canManageTeam}
                                onAssignComercial={(s) => setAssignModal({ parent: s, parentRole: 'supervisor', childRole: 'user' })}
                                onRemove={handleRemove}
                            />
                        );
                    })}
                </div>
            )}

            {/* ── MODO C: Sin GZ y sin supervisores — Admin ve comerciales directos ── */}
            {visibleGerentes.length === 0 && supervisores.length === 0 && comerciales.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                            Comerciales del tenant ({comerciales.length})
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Sin jerarquía configurada — el admin gestiona directamente
                        </p>
                    </div>
                    {comerciales.map(u => (
                        <UserRow key={u.id} user={u} role="user" canEdit={false} onRemove={() => { }} />
                    ))}
                </div>
            )}

            {/* ── MODO D: Sin nadie — mensaje vacío ── */}
            {visibleGerentes.length === 0 && supervisores.length === 0 && comerciales.length === 0 && (
                <div className="text-center py-16">
                    <Map size={56} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">
                        No hay usuarios con roles asignados. Gestioná los roles desde <strong>Usuarios</strong>.
                    </p>
                </div>
            )}

            {/* Sin asignar — solo visible para Admin cuando hay jerarquía parcial */}
            {isAdmin && visibleGerentes.length > 0 && (supsSinGerente.length > 0 || comercSinSup.length > 0) && (
                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800 p-4 space-y-3">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">⚠️ Sin asignar a jerarquía</p>
                    {supsSinGerente.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-amber-600 dark:text-amber-500 mb-1">Supervisores sin Gerente ({supsSinGerente.length})</p>
                            {supsSinGerente.map(u => (
                                <div key={u.id} className="p-2 bg-white dark:bg-slate-800 rounded-lg mb-1">
                                    <span className="text-sm text-slate-700 dark:text-slate-200">{u.full_name || u.email}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {comercSinSup.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-amber-600 dark:text-amber-500 mb-1">Comerciales sin Supervisor ({comercSinSup.length})</p>
                            {comercSinSup.map(u => (
                                <div key={u.id} className="p-2 bg-white dark:bg-slate-800 rounded-lg mb-1">
                                    <span className="text-sm text-slate-700 dark:text-slate-200">{u.full_name || u.email}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal de asignación */}
            {assignModal && (
                <AssignModal
                    parent={assignModal.parent}
                    parentRole={assignModal.parentRole}
                    childRole={assignModal.childRole}
                    availableUsers={getAvailable(assignModal.childRole, assignModal.parent.id)}
                    onAssign={handleAssign}
                    onClose={() => setAssignModal(null)}
                />
            )}
        </div>
    );
};

export default TeamManagement;
