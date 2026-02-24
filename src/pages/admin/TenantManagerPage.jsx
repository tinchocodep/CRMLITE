/**
 * TenantManagerPage — Sailo Super Admin view.
 *
 * Shows all tenants in a card grid. Each card can be expanded to toggle
 * modules via switches. The super_admin can also "enter" any tenant to
 * browse their CRM as if they were that tenant.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, LogIn, Building2, ShieldCheck, ToggleLeft, ToggleRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useSuperAdminData, AVAILABLE_MODULES } from '../../hooks/useSuperAdminData';
import { useSuperAdmin } from '../../contexts/SuperAdminContext';

// ─────────────────────────────────────────────
// Module toggle row
// ─────────────────────────────────────────────
function ModuleToggle({ label, description, enabled, onToggle, loading }) {
    return (
        <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
            <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
            </div>
            <button
                onClick={onToggle}
                disabled={loading}
                className="flex-shrink-0 ml-4 transition-transform active:scale-95"
                title={enabled ? 'Desactivar módulo' : 'Activar módulo'}
            >
                {enabled
                    ? <ToggleRight size={28} className="text-green-500" />
                    : <ToggleLeft size={28} className="text-slate-300 dark:text-slate-600" />
                }
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────
// Single tenant card
// ─────────────────────────────────────────────
function TenantCard({ tenant, enabledModules, onToggleModule, onEnter }) {
    const [expanded, setExpanded] = useState(false);
    const [togglingKey, setTogglingKey] = useState(null);

    const handleToggle = async (moduleKey, currentEnabled) => {
        setTogglingKey(moduleKey);
        try {
            await onToggleModule(tenant.id, moduleKey, !currentEnabled);
        } finally {
            setTogglingKey(null);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all">
            {/* Card Header */}
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    {/* Color dot */}
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0"
                        style={{ backgroundColor: `hsl(${tenant.primary_color})` }}
                    >
                        <Building2 size={18} className="text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100">{tenant.name}</h3>
                            {tenant.is_system && (
                                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                    Sistema
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            ID #{tenant.id} · {enabledModules.size} módulo{enabledModules.size !== 1 ? 's' : ''} activo{enabledModules.size !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Enter tenant button */}
                    {!tenant.is_system && (
                        <button
                            onClick={() => onEnter(tenant)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand text-white rounded-lg hover:opacity-90 transition-all shadow-sm"
                            title={`Entrar como ${tenant.name}`}
                        >
                            <LogIn size={14} />
                            Entrar
                        </button>
                    )}
                    {/* Expand modules */}
                    <button
                        onClick={() => setExpanded(e => !e)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>

            {/* Expanded: modules */}
            {expanded && (
                <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3 space-y-1">
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Módulos</p>
                    {AVAILABLE_MODULES.map(mod => (
                        <ModuleToggle
                            key={mod.key}
                            label={mod.label}
                            description={mod.description}
                            enabled={enabledModules.has(mod.key)}
                            loading={togglingKey === mod.key}
                            onToggle={() => handleToggle(mod.key, enabledModules.has(mod.key))}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
const TenantManagerPage = () => {
    const navigate = useNavigate();
    const { tenants, loading, error, toggleModule, getEnabledModules, refetch } = useSuperAdminData();
    const { enterTenant } = useSuperAdmin();

    const handleEnterTenant = (tenant) => {
        enterTenant({ id: tenant.id, name: tenant.name, primaryColor: tenant.primary_color });
        navigate('/dashboard');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                        <ShieldCheck size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Panel de Administración</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Gestión de tenants y módulos — Sailo</p>
                    </div>
                </div>
                <button
                    onClick={refetch}
                    disabled={loading}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Actualizar"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Error state */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-6 text-red-700 dark:text-red-400">
                    <AlertCircle size={18} className="flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Loading state */}
            {loading && !tenants.length && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            )}

            {/* Stats bar */}
            {!loading && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'Empresas', value: tenants.filter(t => !t.is_system).length },
                        { label: 'Módulos disponibles', value: AVAILABLE_MODULES.length },
                        { label: 'Tenants totales', value: tenants.length },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Tenant cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tenants.map(tenant => (
                    <TenantCard
                        key={tenant.id}
                        tenant={tenant}
                        enabledModules={getEnabledModules(tenant.id)}
                        onToggleModule={toggleModule}
                        onEnter={handleEnterTenant}
                    />
                ))}
            </div>
        </div>
    );
};

export default TenantManagerPage;
