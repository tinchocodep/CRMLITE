import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Home, Users, Briefcase, Package, TrendingUp,
    Megaphone, Truck, Leaf, DollarSign, Building2,
    Plus, Settings
} from 'lucide-react';

const sidebarModules = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'Portal Clientes', path: '/portal-clientes', icon: Users },
    { name: 'CRM', path: '/dashboard', icon: Briefcase, isCRM: true },
    { name: 'Cotizador Insumos', path: '/cotizador', icon: Package },
    { name: 'Mercado de Granos', path: '/mercado-granos', icon: TrendingUp },
    { name: 'Marketing', path: '/marketing', icon: Megaphone },
    { name: 'Logística (TMS)', path: '/logistica', icon: Truck },
    { name: 'Sustentabilidad', path: '/sustentabilidad', icon: Leaf },
    { name: 'Soluciones Financieras', path: '/finanzas', icon: DollarSign },
    { name: 'Portal Proveedores', path: '/proveedores', icon: Building2 }
];

export function VerticalSidebar({ onQuickActions }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <aside
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 shadow-xl z-50 transition-all duration-300 ease-in-out ${isHovered ? 'w-72' : 'w-20'
                }`}
        >
            {/* Logo Section */}
            <div className="h-20 flex items-center justify-center border-b border-slate-200">
                <img
                    src="/logo.png"
                    alt="SAILO"
                    className={`object-contain transition-all duration-300 ${isHovered ? 'w-12 h-12' : 'w-10 h-10'
                        }`}
                />
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 py-4 overflow-y-auto">
                {sidebarModules.map((module) => (
                    <NavLink
                        key={module.path}
                        to={module.path}
                        className={({ isActive }) => `
                            flex items-center gap-4 px-4 py-3 mx-2 rounded-xl transition-all duration-200
                            ${isActive || module.isCRM
                                ? 'bg-gradient-to-r from-brand-red to-red-600 text-white shadow-lg shadow-red-500/30'
                                : 'text-slate-600 hover:bg-red-50 hover:text-brand-red'
                            }
                        `}
                    >
                        <module.icon
                            size={24}
                            className="flex-shrink-0"
                        />
                        <span
                            className={`font-semibold text-sm whitespace-nowrap transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                                }`}
                        >
                            {module.name}
                        </span>
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Actions */}
            <div className="border-t border-slate-200 p-2">
                {/* Quick Actions Button */}
                <button
                    onClick={onQuickActions}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-gradient-to-r from-brand-red to-red-600 text-white hover:shadow-lg hover:shadow-red-500/30 transition-all duration-200 mb-2"
                >
                    <Plus size={24} className="flex-shrink-0" />
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
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition-all duration-200"
                >
                    <Settings size={24} className="flex-shrink-0" />
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
