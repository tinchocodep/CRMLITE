import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Home, Users, Briefcase, Package, TrendingUp,
    Megaphone, Truck, Leaf, DollarSign, Building2,
    Plus, Settings, ShieldCheck, Lock
} from 'lucide-react';

const sidebarModules = [
    { name: 'Home', path: '/dashboard', icon: Home, locked: false },
    { name: 'Portal Clientes', path: '/portal-clientes', icon: Users, locked: true },
    { name: 'CRM', path: '/dashboard', icon: Briefcase, isCRM: true, locked: false },
    { name: 'Usuarios', path: '/usuarios', icon: Users },
    { name: 'Cotizador Insumos', path: '/cotizador', icon: Package, locked: false },
    { name: 'Mercado de Granos', path: '/mercado-granos', icon: TrendingUp, locked: true },
    { name: 'Marketing', path: '/marketing', icon: Megaphone, locked: true },
    { name: 'Logística (TMS)', path: '/logistica', icon: Truck, locked: true },
    { name: 'Sustentabilidad', path: '/sustentabilidad', icon: Leaf, locked: true },
    { name: 'Soluciones Financieras', path: '/finanzas', icon: DollarSign, locked: true },
    { name: 'Portal Proveedores', path: '/proveedores', icon: Building2, locked: true }
];

export function VerticalSidebar({ onQuickActions, onHoverChange }) {
    const [isHovered, setIsHovered] = useState(false);

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
            <div className="h-20 flex items-center justify-center border-b border-slate-200">
                <img
                    src="/logo-advanta-zoom.svg"
                    alt="Advanta"
                    className={`object-contain transition-all duration-300 ${isHovered ? 'w-16 h-16' : 'w-14 h-14'
                        }`}
                />
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 py-2 overflow-y-auto">
                {sidebarModules.map((module) => {
                    if (module.locked) {
                        // Render locked modules as divs
                        return (
                            <div
                                key={module.path}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                style={{ backgroundColor: '#f5f5f5' }}
                                className="flex items-center gap-4 px-4 py-2.5 mx-2 rounded-xl transition-all duration-200 relative opacity-50 cursor-not-allowed text-slate-400"
                            >
                                <module.icon
                                    size={22}
                                    className="flex-shrink-0"
                                />
                                <span
                                    className={`font-semibold text-sm whitespace-nowrap transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                                        }`}
                                >
                                    {module.name}
                                </span>
                                {isHovered && (
                                    <Lock
                                        size={16}
                                        className="ml-auto flex-shrink-0 text-slate-400"
                                    />
                                )}
                            </div>
                        );
                    }

                    // Render unlocked modules as NavLinks
                    return (
                        <NavLink
                            key={module.path}
                            to={module.path}
                            className={({ isActive }) => {
                                const baseClasses = 'flex items-center gap-4 px-4 py-2.5 mx-2 rounded-xl transition-all duration-200 relative text-slate-800';
                                if (isActive || module.isCRM) {
                                    return `${baseClasses} shadow-lg`;
                                }
                                return `${baseClasses} hover:bg-slate-100`;
                            }}
                            style={({ isActive }) => ({
                                backgroundColor: (isActive || module.isCRM) ? '#a1c349' : 'transparent'
                            })}
                        >
                            <module.icon
                                size={22}
                                className="flex-shrink-0"
                            />
                            <span
                                className={`font-semibold text-sm whitespace-nowrap transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                                    }`}
                            >
                                {module.name}
                            </span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="border-t border-slate-200 p-2">
                {/* Quick Actions Button */}
                <button
                    onClick={onQuickActions}
                    style={{ backgroundColor: '#a1c349' }}
                    className="w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-slate-800 hover:opacity-80 transition-all duration-200 mb-2"
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
