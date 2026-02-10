import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { X, Grid, Briefcase, Package, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Mobile Menu Modal - Context-aware navigation
 * Shows only modules from the current context (CRM or Cotizador)
 * Includes a "Main" button to switch between contexts
 */
const MobileMenuModal = ({ isOpen, onClose, currentContext }) => {
    const [showMainMenu, setShowMainMenu] = useState(false);

    // Define module contexts
    const contexts = {
        crm: {
            name: 'CRM',
            icon: Briefcase,
            color: 'from-blue-500 to-blue-600',
            modules: [
                { name: 'Dashboard', path: '/dashboard', icon: '📊' },
                { name: 'Agenda', path: '/agenda', icon: '📅' },
                { name: 'Prospectos', path: '/prospectos', icon: '👥' },
                { name: 'Clientes', path: '/clientes', icon: '✅' },
                { name: 'Contactos', path: '/contactos', icon: '👤' },
                { name: 'Oportunidades', path: '/oportunidades', icon: '💼' },
                { name: 'Ficha 360', path: '/ficha-360', icon: '🔍' },
                { name: 'Legajo', path: '/legajo', icon: '📄' },
                { name: 'Visitas', path: '/visitas', icon: '🗺️' },
                { name: 'Territorio', path: '/territorios', icon: '🗺️' },
                { name: 'Objetivos', path: '/objetivos', icon: '🎯' },
                { name: 'Reclamos', path: '/reclamos', icon: '⚠️' }
            ]
        },
        cotizador: {
            name: 'Administración',
            icon: Package,
            color: 'from-green-500 to-green-600',
            modules: [
                { name: 'Home', path: '/cotizador', icon: '🏠' },
                { name: 'Cotizaciones', path: '/cotizaciones', icon: '📋' },
                { name: 'Pedidos', path: '/pedidos', icon: '📦' },
                { name: 'Comprobantes', path: '/comprobantes', icon: '📄' },
                { name: 'Cuenta Corriente', path: '/cuenta-corriente', icon: '💳' },
                { name: 'Stock', path: '/stock', icon: '📊' }
            ]
        }
    };

    const handleContextSwitch = (contextKey) => {
        setShowMainMenu(false);
        // Navigate to the first module of the selected context
        const firstModule = contexts[contextKey].modules[0];
        window.location.href = firstModule.path;
        onClose();
    };

    const currentContextData = contexts[currentContext] || contexts.crm;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-[60] xl:hidden"
                    />

                    {/* Main Menu Selection */}
                    <AnimatePresence>
                        {showMainMenu && (
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                className="fixed inset-y-0 right-0 w-full bg-white z-[80] xl:hidden"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                                    <h2 className="text-lg font-bold text-slate-900">Seleccionar Módulo</h2>
                                    <button
                                        onClick={() => setShowMainMenu(false)}
                                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                                    >
                                        <X className="w-5 h-5 text-slate-600" />
                                    </button>
                                </div>

                                {/* Context List */}
                                <div className="p-4 space-y-3">
                                    {/* CRM */}
                                    <button
                                        onClick={() => handleContextSwitch('crm')}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${currentContext === 'crm'
                                            ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-500'
                                            : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${contexts.crm.color} flex items-center justify-center`}>
                                                <Briefcase className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-slate-900">CRM</p>
                                                <p className="text-xs text-slate-600">Gestión comercial</p>
                                            </div>
                                        </div>
                                        {currentContext === 'crm' && (
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        )}
                                    </button>

                                    {/* Cotizador */}
                                    <button
                                        onClick={() => handleContextSwitch('cotizador')}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${currentContext === 'cotizador'
                                            ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-500'
                                            : 'bg-slate-50 border-slate-200 hover:border-green-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${contexts.cotizador.color} flex items-center justify-center`}>
                                                <Package className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-slate-900">Administración</p>
                                                <p className="text-xs text-slate-600">Ventas y facturación</p>
                                            </div>
                                        </div>
                                        {currentContext === 'cotizador' && (
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                        )}
                                    </button>

                                    {/* Locked modules */}
                                    <div className="w-full flex items-center justify-between p-4 rounded-xl border-2 bg-slate-100 border-slate-200 opacity-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-slate-300 flex items-center justify-center">
                                                <Lock className="w-6 h-6 text-slate-500" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-slate-600">Otros Módulos</p>
                                                <p className="text-xs text-slate-500">Próximamente</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Context Menu */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[70] xl:hidden pb-20 max-h-[85vh] overflow-y-auto"
                    >
                        {/* Handle Bar */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pb-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${currentContextData.color} flex items-center justify-center`}>
                                    <currentContextData.icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Menú {currentContextData.name}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowMainMenu(true)}
                                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1"
                                >
                                    <Grid className="w-4 h-4 text-slate-600" />
                                    <span className="text-xs font-semibold text-slate-700">Main</span>
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-600" />
                                </button>
                            </div>
                        </div>

                        {/* Modules Grid */}
                        <div className="px-4 pb-6 grid grid-cols-3 gap-3">
                            {currentContextData.modules.map((module) => (
                                <NavLink
                                    key={module.path}
                                    to={module.path}
                                    onClick={onClose}
                                    className={({ isActive }) => `
                                        flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all
                                        ${isActive
                                            ? `bg-gradient-to-br from-green-50 to-green-100 border-advanta-green shadow-lg`
                                            : 'bg-slate-50 border-slate-200 hover:shadow-md'
                                        }
                                    `}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span className="text-2xl mb-2">{module.icon}</span>
                                            <span className={`text-xs font-bold text-center ${isActive ? 'text-advanta-green' : 'text-slate-800'}`}>
                                                {module.name}
                                            </span>
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MobileMenuModal;
