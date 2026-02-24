import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Home, Users, Briefcase, Package,
    Plus, Settings, BarChart2, ShieldCheck, Lock, Truck, UserSquare2, BarChart3
} from 'lucide-react';
import { useTenantBranding } from '../contexts/TenantBrandingContext';
import { useTenantModules } from '../hooks/useTenantModules';
import { useAuth } from '../contexts/AuthContext';

// moduleKey must match the `module_key` column in `tenant_modules`.
// Items without a moduleKey are always visible (e.g. Settings).
const sidebarModules = [
    { id: 'home', name: 'Home', path: '/dashboard', icon: Home, moduleKey: 'home' },
    { id: 'crm', name: 'CRM', path: '/dashboard', icon: Briefcase, moduleKey: 'crm', isCRM: true },
    { id: 'cotizador', name: 'Cotizador', path: '/cotizador', icon: Package, moduleKey: 'cotizador', isCotizador: true },
    { id: 'comercial', name: 'Administración', path: '/comercial', icon: BarChart2, moduleKey: 'comercial', isComercial: true },
    { id: 'usuarios', name: 'Usuarios', path: '/usuarios', icon: Users, moduleKey: 'usuarios' },
    { id: 'admin', name: 'Admin', path: '/admin/tenants', icon: ShieldCheck, moduleKey: 'tenant-manager' },
];

/** Modules not yet implemented — shown as locked in the sidebar */
const lockedModules = [
    { id: 'logistica', name: 'Logística', icon: Truck },
    { id: 'rrhh', name: 'RRHH', icon: UserSquare2 },
    { id: 'reportes', name: 'Reportes', icon: BarChart3 },
];

export function VerticalSidebar({ onQuickActions, onHoverChange }) {
    const [isHovered, setIsHovered] = useState(false);
    const location = useLocation();
    const { branding } = useTenantBranding();
    const { enabledModules, isLoading: modulesLoading } = useTenantModules();

    // Filter modules: show only those present in the tenant's enabledModules Set.
    // Items without a moduleKey are always visible.
    const visibleModules = sidebarModules.filter(
        (m) => !m.moduleKey || enabledModules.has(m.moduleKey)
    );

    // Define CRM routes
    const crmRoutes = ['/dashboard', '/prospectos', '/contactos', '/empresas', '/oportunidades', '/pedidos', '/legajos', '/visitas', '/campos'];
    const isInCRM = crmRoutes.some(route => location.pathname.startsWith(route));

    // Administración: oportunidades, cotizaciones, pedidos
    const cotizadorRoutes = ['/cotizador', '/cotizaciones', '/pedidos'];
    const isInCotizador = cotizadorRoutes.some(route => location.pathname.startsWith(route));

    // Comercial: stock, comprobantes, cuenta corriente
    const comercialRoutes = ['/comercial', '/stock', '/comprobantes', '/cuenta-corriente'];
    const isInComercial = comercialRoutes.some(route => location.pathname.startsWith(route));

    const handleMouseEnter = () => {
        setIsHovered(true);
        onHoverChange?.(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        onHoverChange?.(false);
    };

    return (
        <aside
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 shadow-xl z-30 transition-all duration-300 ease-in-out ${isHovered ? 'w-72' : 'w-20'
                }`}
        >
            {/* Logo Section */}
            <div className="h-20 flex items-center justify-center border-b border-slate-200 overflow-hidden px-2">
                <img
                    src={branding.logoUrl || '/logo-potenza-color.png'}
                    alt={branding.companyName || 'CRM'}
                    style={{
                        maxWidth: isHovered ? '120px' : '44px',
                        maxHeight: isHovered ? '56px' : '44px',
                        width: 'auto',
                        height: 'auto',
                    }}
                    className="object-contain transition-all duration-300"
                />
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 py-2 overflow-y-auto">
                {modulesLoading ? null : visibleModules.map((module) => (
                    <NavLink
                        key={module.id}
                        to={module.path}
                        className={({ isActive }) => {
                            const baseClasses = 'flex items-center gap-4 px-4 py-2.5 mx-2 rounded-xl transition-all duration-200 relative';
                            const shouldHighlight = module.isCRM ? isInCRM
                                : module.isCotizador ? isInCotizador
                                    : module.isComercial ? isInComercial
                                        : isActive;
                            return shouldHighlight
                                ? `${baseClasses} text-white shadow-md`
                                : `${baseClasses} text-slate-700`;
                        }}
                        style={({ isActive }) => {
                            const shouldHighlight = module.isCRM ? isInCRM
                                : module.isCotizador ? isInCotizador
                                    : module.isComercial ? isInComercial
                                        : isActive;
                            return shouldHighlight ? {
                                background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent))',
                                boxShadow: '0 4px 12px color-mix(in srgb, var(--color-brand-primary) 35%, transparent)',
                            } : { backgroundColor: 'transparent' };
                        }}
                        onMouseEnter={e => {
                            if (!e.currentTarget.style.background) {
                                e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-brand-primary) 10%, white)';
                            }
                        }}
                        onMouseLeave={e => {
                            if (!e.currentTarget.style.background) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }
                        }}
                    >
                        <module.icon size={22} className="flex-shrink-0" />
                        <span className={`font-semibold text-sm whitespace-nowrap transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                            }`}>
                            {module.name}
                        </span>
                    </NavLink>
                ))}

                {/* Locked / Coming Soon modules */}
                {lockedModules.map((mod) => (
                    <div
                        key={mod.id}
                        className="flex items-center gap-4 px-4 py-2.5 mx-2 rounded-xl opacity-40 cursor-not-allowed select-none relative"
                        title={`${mod.name} — Próximamente`}
                    >
                        <mod.icon size={22} className="flex-shrink-0 text-slate-400" />
                        <span className={`font-semibold text-sm whitespace-nowrap text-slate-400 transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                            {mod.name}
                        </span>
                        {isHovered && (
                            <Lock size={11} className="absolute right-3 text-slate-400" />
                        )}
                    </div>
                ))}
            </nav>

            {/* Bottom Actions */}
            <div className="border-t border-slate-200 p-2">
                {/* Quick Actions Button */}
                <button
                    onClick={onQuickActions}
                    className="w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-slate-800 transition-all duration-200 mb-2 bg-slate-100"
                    style={{ '--hover-bg': 'color-mix(in srgb, var(--color-brand-primary) 15%, white)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-brand-primary) 15%, white)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                >
                    <Plus size={22} className="flex-shrink-0" />
                    <span
                        className={`font-semibold text-sm whitespace-nowrap transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                            }`}
                    >
                        Acciones Rápidas
                    </span>
                </button>

                {/* Settings Button */}
                <NavLink
                    to="/configuracion"
                    className="w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-slate-800 hover:bg-slate-100 transition-all duration-200"
                >
                    <Settings size={22} className="flex-shrink-0" />
                    <span
                        className={`font-semibold text-sm whitespace-nowrap transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                            }`}
                    >
                        Configuración
                    </span>
                </NavLink>
            </div>
        </aside>
    );
}
