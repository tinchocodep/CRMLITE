import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Home, Users, Briefcase, Package,
    Plus, Settings, BarChart2, ShieldCheck, Truck, UserSquare2, BarChart3,
} from 'lucide-react';
import { useTenantBranding } from '../contexts/TenantBrandingContext';
import { useTenantModules } from '../hooks/useTenantModules';

const sidebarModules = [
    { id: 'home', name: 'Home', path: '/dashboard', icon: Home, moduleKey: 'home' },
    { id: 'crm', name: 'CRM', path: '/dashboard', icon: Briefcase, moduleKey: 'crm', isCRM: true },
    { id: 'cotizador', name: 'Cotizador', path: '/cotizador', icon: Package, moduleKey: 'cotizador', isCotizador: true },
    { id: 'comercial', name: 'Administración', path: '/comercial', icon: BarChart2, moduleKey: 'comercial', isComercial: true },
    { id: 'usuarios', name: 'Usuarios', path: '/usuarios', icon: Users, moduleKey: 'usuarios' },
    { id: 'admin', name: 'Admin', path: '/admin/tenants', icon: ShieldCheck, moduleKey: 'tenant-manager' },
    { id: 'logistica', name: 'Logística', path: '/logistica', icon: Truck, moduleKey: 'logistica' },
    { id: 'rrhh', name: 'RRHH', path: '/rrhh', icon: UserSquare2, moduleKey: 'rrhh' },
    { id: 'reportes', name: 'Reportes', path: '/reportes', icon: BarChart3, moduleKey: 'reportes' },
];

// Sidebar arranca en top-14 (debajo del black top bar full-width de MainLayout).
export function VerticalSidebar({ onQuickActions, isExpanded }) {
    const location = useLocation();
    const { branding } = useTenantBranding();
    const { enabledModules, isLoading: modulesLoading } = useTenantModules();

    const visibleModules = sidebarModules.filter(
        (m) => !m.moduleKey || enabledModules.has(m.moduleKey)
    );

    const crmRoutes = ['/dashboard', '/prospectos', '/contactos', '/empresas', '/oportunidades', '/pedidos', '/legajos', '/visitas', '/campos'];
    const isInCRM = crmRoutes.some(route => location.pathname.startsWith(route));

    const cotizadorRoutes = ['/cotizador', '/cotizaciones', '/pedidos'];
    const isInCotizador = cotizadorRoutes.some(route => location.pathname.startsWith(route));

    const comercialRoutes = ['/comercial', '/stock', '/comprobantes', '/cuenta-corriente'];
    const isInComercial = comercialRoutes.some(route => location.pathname.startsWith(route));

    const getModuleStyle = (isActive) => isActive
        ? {
            background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent))',
            boxShadow: '0 4px 12px color-mix(in srgb, var(--color-brand-primary) 35%, transparent)',
        }
        : { backgroundColor: 'transparent' };

    const baseClasses = 'flex items-center gap-4 px-4 py-2.5 mx-2 rounded-xl transition-all duration-200';

    return (
        <aside className={`fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-white border-r border-slate-200 shadow-xl z-30 transition-all duration-300 ease-in-out flex flex-col ${isExpanded ? 'w-72' : 'w-20'}`}>

            {/* Botón Acciones Rápidas */}
            <div className="px-2 pt-3 pb-3 border-b border-slate-200 flex-shrink-0">
                <button
                    onClick={onQuickActions}
                    className="w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-white transition-all duration-200"
                    style={{ background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent))' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                    <Plus size={22} className="flex-shrink-0" />
                    <span className={`font-semibold text-sm whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                        Acciones Rápidas
                    </span>
                </button>
            </div>

            {/* Navigation Items */}
            <nav className="py-2 overflow-y-auto flex flex-col">
                {modulesLoading ? null : visibleModules.map((module) => {
                    const shouldHighlight = module.isCRM ? isInCRM
                        : module.isCotizador ? isInCotizador
                            : module.isComercial ? isInComercial
                                : location.pathname === module.path;

                    return (
                        <NavLink
                            key={module.id}
                            to={module.path}
                            className={`${baseClasses} ${shouldHighlight ? 'text-white shadow-md' : 'text-slate-700'}`}
                            style={() => getModuleStyle(shouldHighlight)}
                            onMouseEnter={e => { if (!shouldHighlight) e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-brand-primary) 10%, white)'; }}
                            onMouseLeave={e => { if (!shouldHighlight) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                            <module.icon size={22} className="flex-shrink-0" />
                            <span className={`font-semibold text-sm whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                                {module.name}
                            </span>
                        </NavLink>
                    );
                })}

                {/* Separador + Configuración (pegado a los módulos, no al fondo) */}
                <div className="mx-4 my-2 border-t border-slate-200" />
                <NavLink
                    to="/configuracion"
                    className={({ isActive }) => `${baseClasses} ${isActive ? 'text-white shadow-md' : 'text-slate-700'}`}
                    style={({ isActive }) => getModuleStyle(isActive)}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-brand-primary) 10%, white)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                    <Settings size={22} className="flex-shrink-0" />
                    <span className={`font-semibold text-sm whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                        Configuración
                    </span>
                </NavLink>
            </nav>
        </aside>
    );
}
