import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FileText, Package, Receipt, CreditCard, Box, TrendingUp } from 'lucide-react';

const cotizadorTabs = [
    { name: 'Home', path: '/cotizador', icon: Home },
    { name: 'Oportunidades', path: '/oportunidades', icon: TrendingUp },
    { name: 'Cotizaciones', path: '/cotizaciones', icon: FileText },
    { name: 'Pedidos', path: '/pedidos', icon: Package },
    { name: 'Comprobantes', path: '/comprobantes', icon: Receipt },
    { name: 'Cuenta Corriente', path: '/cuenta-corriente', icon: CreditCard },
    { name: 'Stock', path: '/stock', icon: Box }
];

export function HorizontalCotizadorNav({ isMainSidebarExpanded }) {
    return (
        <div
            className={`fixed top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-20 transition-all duration-300 ${isMainSidebarExpanded ? 'left-72' : 'left-20'
                } right-0`}
        >
            <div className="flex items-center gap-2 px-6 py-3 overflow-x-auto">
                {cotizadorTabs.map((tab) => (
                    <NavLink
                        key={tab.path}
                        to={tab.path}
                        className={({ isActive }) =>
                            `flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${isActive
                                ? 'bg-gradient-to-r from-advanta-green to-green-600 text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <tab.icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                                <span className="text-sm font-semibold">{tab.name}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </div>
    );
}
