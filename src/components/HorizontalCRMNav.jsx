import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    UserCheck, Users, User, Calendar,
    Briefcase, Map, Target, AlertCircle, ShieldCheck, Search, LayoutDashboard
} from 'lucide-react';

const crmModules = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Ficha 360°', path: '/ficha-360', icon: Search },
    { name: 'Prospectos', path: '/prospectos', icon: UserCheck },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Contactos', path: '/contactos', icon: User },
    { name: 'Agenda', path: '/agenda', icon: Calendar },
    { name: 'Oportunidades', path: '/oportunidades', icon: Briefcase },
    { name: 'Visitas', path: '/visitas', icon: Map },
    { name: 'Territorios', path: '/territorios', icon: Target },
    { name: 'Reclamos', path: '/reclamos', icon: AlertCircle }
];

export function HorizontalCRMNav({ isMainSidebarExpanded }) {
    const location = useLocation();

    return (
        <nav className={`bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 ${isMainSidebarExpanded ? 'ml-72' : 'ml-20'}`}>
            <div className="w-full px-4 pr-6">
                <div className="flex items-center gap-2 overflow-x-auto py-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#87a330 transparent' }}>
                    {crmModules.map((module, index) => {
                        const isActive = location.pathname === module.path;

                        return (
                            <NavLink
                                key={module.path}
                                to={module.path}
                                className={`
                                    flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all duration-200 font-medium text-sm flex-shrink-0
                                    ${isActive
                                        ? 'bg-[#87a330] text-white shadow-md'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                                    }
                                `}
                            >
                                <module.icon
                                    size={18}
                                    className="flex-shrink-0"
                                />
                                <span>{module.name}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
