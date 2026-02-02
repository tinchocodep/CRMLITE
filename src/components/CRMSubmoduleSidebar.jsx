import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, UserCheck, Users, User, Calendar,
    Briefcase, Map, Target, AlertCircle, ShieldCheck
} from 'lucide-react';

const crmSubmodules = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Prospectos', path: '/prospectos', icon: UserCheck },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Contactos', path: '/contactos', icon: User },
    { name: 'Agenda', path: '/agenda', icon: Calendar },
    { name: 'Oportunidades', path: '/oportunidades', icon: Briefcase },
    { name: 'Usuarios', path: '/usuarios', icon: ShieldCheck },
    { name: 'Visitas', path: '/visitas', icon: Map },
    { name: 'Territorios', path: '/territorios', icon: Target },
    { name: 'Reclamos', path: '/reclamos', icon: AlertCircle }
];

export function CRMSubmoduleSidebar({ isMainSidebarExpanded }) {
    const location = useLocation();

    return (
        <aside className={`fixed top-0 h-screen w-52 bg-slate-800 border-r border-slate-700 shadow-xl z-20 transition-all duration-300 ${isMainSidebarExpanded ? 'left-72' : 'left-20'}`}>
            {/* Header */}
            <div className="h-20 flex items-center px-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-red to-red-600 flex items-center justify-center shadow-lg">
                        <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white">CRM</h2>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Módulos</p>
                    </div>
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="py-4 px-2 overflow-y-auto h-[calc(100vh-80px)]">
                {crmSubmodules.map((module) => {
                    const isActive = location.pathname === module.path ||
                        (module.path === '/dashboard' && location.pathname === '/');

                    return (
                        <NavLink
                            key={module.path}
                            to={module.path}
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200
                                ${isActive
                                    ? 'bg-slate-700 text-white border-l-4 border-brand-red shadow-lg'
                                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white border-l-4 border-transparent'
                                }
                            `}
                        >
                            <module.icon
                                size={18}
                                className={`flex-shrink-0 ${isActive ? 'text-brand-red' : ''}`}
                            />
                            <span className="font-medium text-sm">{module.name}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
}
