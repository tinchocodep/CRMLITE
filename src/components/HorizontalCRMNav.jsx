import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, UserCheck, Users, User, Calendar,
    Briefcase, Map, Target, AlertCircle, ShieldCheck
} from 'lucide-react';

const crmModules = [
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

export function HorizontalCRMNav() {
    const location = useLocation();

    return (
        <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="max-w-[1920px] mx-auto px-6">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3">
                    {crmModules.map((module) => {
                        const isActive = location.pathname === module.path ||
                            (module.path === '/dashboard' && location.pathname === '/');

                        return (
                            <NavLink
                                key={module.path}
                                to={module.path}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200
                                    ${isActive
                                        ? 'bg-brand-red text-white shadow-md'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                                    }
                                `}
                            >
                                <module.icon
                                    size={18}
                                    className="flex-shrink-0"
                                />
                                <span className="font-medium text-sm">{module.name}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
