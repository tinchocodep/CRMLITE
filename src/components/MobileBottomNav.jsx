import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Briefcase, Package, Box, Settings } from 'lucide-react';

const MobileBottomNav = () => {
    const location = useLocation();

    // Define CRM routes
    const crmRoutes = ['/dashboard', '/prospectos', '/contactos', '/empresas', '/oportunidades', '/pedidos', '/legajos'];
    const isInCRM = crmRoutes.some(route => location.pathname.startsWith(route));

    // Define Cotizador routes
    const cotizadorRoutes = ['/cotizador', '/cotizaciones', '/comprobantes', '/cuenta-corriente', '/stock'];
    const isInCotizador = cotizadorRoutes.some(route => location.pathname.startsWith(route));

    const navItems = [
        {
            name: 'Home',
            path: '/dashboard',
            icon: Home,
            isActive: location.pathname === '/dashboard' && !isInCRM
        },
        {
            name: 'CRM',
            path: '/dashboard',
            icon: Briefcase,
            isActive: isInCRM
        },
        {
            name: 'Cotizador',
            path: '/cotizador',
            icon: Package,
            isActive: isInCotizador
        },
        {
            name: 'Stock',
            path: '/stock',
            icon: Box,
            isActive: location.pathname === '/stock'
        },
        {
            name: 'Config',
            path: '/configuracion',
            icon: Settings,
            isActive: location.pathname === '/configuracion'
        }
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 xl:hidden">
            <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px] ${item.isActive
                                ? 'bg-gradient-to-r from-advanta-green to-green-600 text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="text-[10px] font-semibold">{item.name}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default MobileBottomNav;
