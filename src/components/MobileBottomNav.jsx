import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, Package, Box, Menu, Plus, X, Users, UserCheck, FileText, User, UserPlus, Calendar, MapPin, Receipt, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileBottomNav = ({ onQuickAction, currentContext = 'crm' }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [quickActionsOpen, setQuickActionsOpen] = useState(false);

    // Define CRM routes
    const crmRoutes = ['/dashboard', '/prospectos', '/contactos', '/empresas', '/oportunidades', '/pedidos', '/legajos'];
    const isInCRM = crmRoutes.some(route => location.pathname.startsWith(route));

    // Define Cotizador routes
    const cotizadorRoutes = ['/cotizador', '/cotizaciones', '/comprobantes', '/cuenta-corriente', '/stock'];
    const isInCotizador = cotizadorRoutes.some(route => location.pathname.startsWith(route));

    // CRM Quick Actions
    const crmActions = [
        { label: 'Prospecto', action: 'prospect', Icon: Users, bgColor: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600 dark:text-blue-400', borderColor: 'border-blue-200 dark:border-blue-800' },
        { label: 'Convertir Prospecto', action: 'convert', Icon: UserPlus, bgColor: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600 dark:text-blue-400', borderColor: 'border-blue-200 dark:border-blue-800' },
        { label: 'Cliente', action: 'client', Icon: UserCheck, bgColor: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600 dark:text-blue-400', borderColor: 'border-blue-200 dark:border-blue-800' },
        { label: 'Contacto', action: 'contact', Icon: User, bgColor: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600 dark:text-blue-400', borderColor: 'border-blue-200 dark:border-blue-800' },
        { label: 'Actividad', action: 'event', Icon: Calendar, bgColor: 'bg-green-50 dark:bg-green-900/20', iconColor: 'text-green-600 dark:text-green-400', borderColor: 'border-green-200 dark:border-green-800' },
        { label: 'Visita', action: 'visit', Icon: MapPin, bgColor: 'bg-green-50 dark:bg-green-900/20', iconColor: 'text-green-600 dark:text-green-400', borderColor: 'border-green-200 dark:border-green-800' },
        { label: 'Oportunidad', action: 'opportunity', Icon: Briefcase, bgColor: 'bg-green-50 dark:bg-green-900/20', iconColor: 'text-green-600 dark:text-green-400', borderColor: 'border-green-200 dark:border-green-800' }
    ];

    // Cotizador Quick Actions - Only implemented features
    const cotizadorActions = [
        { label: 'Generar Factura', action: 'generate-invoice', Icon: Receipt, bgColor: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600 dark:text-blue-400', borderColor: 'border-blue-200 dark:border-blue-800' },
        { label: 'Agregar Stock', action: 'add-stock', Icon: TrendingUp, bgColor: 'bg-green-50 dark:bg-green-900/20', iconColor: 'text-green-600 dark:text-green-400', borderColor: 'border-green-200 dark:border-green-800' }
    ];

    const actions = currentContext === 'cotizador' ? cotizadorActions : crmActions;

    const handleActionClick = (action) => {
        if (action.path) {
            navigate(action.path);
        } else if (action.action) {
            onQuickAction?.(action.action);
        }
        setQuickActionsOpen(false);
    };

    // CRM Navigation Items
    const crmLeftNavItems = [
        {
            name: 'Prospectos',
            path: '/prospectos',
            icon: Users,
            isActive: location.pathname.startsWith('/prospectos')
        },
        {
            name: 'Clientes',
            path: '/clientes',
            icon: UserCheck,
            isActive: location.pathname.startsWith('/clientes')
        }
    ];

    const crmRightNavItems = [
        {
            name: 'Oportun.',
            path: '/oportunidades',
            icon: Briefcase,
            isActive: location.pathname.startsWith('/oportunidades')
        },
        {
            name: 'Menú',
            path: '/menu',
            icon: Menu,
            isActive: false,
            isButton: true
        }
    ];

    // Cotizador Navigation Items
    const cotizadorLeftNavItems = [
        {
            name: 'Cotizaciones',
            path: '/cotizaciones',
            icon: FileText,
            isActive: location.pathname.startsWith('/cotizaciones')
        },
        {
            name: 'Pedidos',
            path: '/pedidos',
            icon: Package,
            isActive: location.pathname.startsWith('/pedidos')
        }
    ];

    const cotizadorRightNavItems = [
        {
            name: 'Stock',
            path: '/stock',
            icon: Box,
            isActive: location.pathname.startsWith('/stock')
        },
        {
            name: 'Menú',
            path: '/menu',
            icon: Menu,
            isActive: false,
            isButton: true
        }
    ];

    // Select nav items based on context
    const leftNavItems = currentContext === 'cotizador' ? cotizadorLeftNavItems : crmLeftNavItems;
    const rightNavItems = currentContext === 'cotizador' ? cotizadorRightNavItems : crmRightNavItems;

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {quickActionsOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setQuickActionsOpen(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] xl:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Quick Actions Bottom Sheet */}
            <AnimatePresence>
                {quickActionsOpen && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-[70] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl xl:hidden pb-20 max-h-[85vh] overflow-y-auto"
                    >
                        {/* Handle Bar */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                        </div>

                        {/* Header */}
                        <div className="px-6 pb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                {currentContext === 'cotizador' ? 'Nuevo:' : 'Crear:'}
                            </h3>
                        </div>

                        {/* Actions Grid */}
                        <div className="px-4 pb-6 grid grid-cols-2 gap-3">
                            {actions.map((action, index) => {
                                const IconComponent = action.Icon;
                                return (
                                    <motion.button
                                        key={action.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handleActionClick(action)}
                                        className={`flex flex-col items-center justify-center p-6 rounded-2xl ${action.bgColor} border-2 ${action.borderColor} transition-all active:scale-95 gap-3`}
                                    >
                                        <IconComponent className={`w-12 h-12 ${action.iconColor}`} strokeWidth={1.5} />
                                        <span className="text-sm font-bold text-slate-800 dark:text-white text-center">
                                            {action.label}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 xl:hidden">
                <div className="relative flex items-center justify-between h-16 px-4">
                    {/* Left Side - 2 buttons */}
                    <div className="flex items-center gap-2 flex-1 justify-start">
                        {leftNavItems.map((item) => (
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

                    {/* Center - Quick Actions Button (Elevated) */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-20">
                        <button
                            onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                            className="relative w-16 h-16 rounded-full bg-gradient-to-br from-advanta-green to-green-700 shadow-2xl shadow-green-500/50 dark:shadow-green-900/50 flex items-center justify-center hover:scale-110 transition-all duration-300 border-4 border-white dark:border-slate-900"
                        >
                            <AnimatePresence mode="wait">
                                {quickActionsOpen ? (
                                    <motion.div
                                        key="close"
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <X size={28} className="text-white" strokeWidth={3} />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="plus"
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Plus size={28} className="text-white" strokeWidth={3} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>

                    {/* Right Side - 2 buttons */}
                    <div className="flex items-center gap-2 flex-1 justify-end">
                        {rightNavItems.map((item) => (
                            item.isButton ? (
                                <button
                                    key={item.name}
                                    onClick={() => onQuickAction?.('menu')}
                                    className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="text-[10px] font-semibold">{item.name}</span>
                                </button>
                            ) : (
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
                            )
                        ))}
                    </div>
                </div>
            </nav>
        </>
    );
};

export default MobileBottomNav;
