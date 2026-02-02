import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, FileText, Map, Target, AlertCircle, Briefcase, UserCheck, Search, Plus, X, UserPlus, LogOut, Bell, Home, Menu, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';
import CreateEventModal from '../components/agenda/CreateEventModal';
import EditProspectModal from '../components/prospects/EditProspectModal';
import ConvertToClientModal from '../components/clients/ConvertToClientModal';
import ProspectPickerModal from '../components/prospects/ProspectPickerModal';
import ContactModal from '../components/contacts/ContactModal';
import { mockProspects } from '../data/mockProspects';

// ========== SHARED CONSTANTS ==========
const modules = [
    { name: 'Ficha 360°', path: '/ficha-360', icon: Search },
    { name: 'Agenda', path: '/agenda', icon: Calendar },
    { name: 'Prospectos', path: '/prospectos', icon: UserCheck },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Contactos', path: '/contactos', icon: UserCheck },
    { name: 'Legajo', path: '/legajo', icon: FileText },
    { name: 'Visitas', path: '/visitas', icon: Map },
    { name: 'Oportunidades', path: '/oportunidades', icon: Briefcase },
    { name: 'Objetivos', path: '/objetivos', icon: Target },
    { name: 'Territorios', path: '/territorios', icon: Map },
    { name: 'Reclamos', path: '/reclamos', icon: AlertCircle },
];

const actions = [
    { label: 'Crear Actividad', icon: Calendar, color: 'text-blue-600 bg-blue-50' },
    { label: 'Nuevo Prospecto', icon: UserCheck, color: 'text-purple-600 bg-purple-50' },
    { label: 'Convertir Prospecto', icon: UserPlus, color: 'text-pink-600 bg-pink-50' },
    { label: 'Nuevo Cliente', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Nuevo Contacto', icon: UserCheck, color: 'text-teal-600 bg-teal-50' },
    { label: 'Registrar Visita', icon: Map, color: 'text-amber-600 bg-amber-50' },
    { label: 'Nueva Oportunidad', icon: Briefcase, color: 'text-brand-red bg-red-50' },
];

const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we're on the dashboard
    const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';

    // ========== MOBILE STATE (Separate) ==========
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileNavMenuOpen, setMobileNavMenuOpen] = useState(false);

    // ========== DESKTOP STATE (Separate) ==========
    const [desktopActionMenuOpen, setDesktopActionMenuOpen] = useState(false);
    const desktopMenuRef = useRef(null);

    // ========== NOTIFICATIONS STATE ==========
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const notificationsRef = useRef(null);

    // ========== SHARED STATE (Global Modals) ==========
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isProspectModalOpen, setIsProspectModalOpen] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [prospectData, setProspectData] = useState(null);
    const [prospectToConvert, setProspectToConvert] = useState(false);

    // Desktop: Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target)) {
                setDesktopActionMenuOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // ========== SHARED HANDLERS ==========
    const handleLogout = () => {
        navigate('/');
    };

    const handleGlobalCreateProspect = () => {
        setProspectData({
            id: Date.now(),
            date: new Date().toISOString(),
            status: 'contacted',
            tradeName: '',
            companyName: '',
            cuit: '',
            contact: '',
            city: '',
            province: '',
            notes: '',
            segments: [{ id: Date.now(), name: 'Principal', hectares: '', crops: '', machinery: '' }]
        });
        setIsProspectModalOpen(true);
        setDesktopActionMenuOpen(false);
    };

    const handleGlobalPromoteProspect = () => {
        setIsPickerOpen(true);
        setDesktopActionMenuOpen(false);
    };

    const handlePickerSelect = (prospect) => {
        setProspectToConvert(prospect);
        setIsPickerOpen(false);
        setIsClientModalOpen(true);
    };

    const handleGlobalCreateClient = () => {
        setProspectToConvert(null);
        setIsClientModalOpen(true);
        setDesktopActionMenuOpen(false);
    };

    const handleGlobalCreateContact = () => {
        setIsContactModalOpen(true);
        setDesktopActionMenuOpen(false);
        setMobileMenuOpen(false);
    };

    // Desktop: Split modules for central logo
    const leftModules = modules.slice(0, 5);
    const rightModules = modules.slice(5);

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-slate-900 flex flex-col font-sans text-slate-800 dark:text-slate-200">

            {/* ========== MOBILE VERSION ========== */}
            <div className="xl:hidden flex flex-col h-screen">
                {/* Mobile Header - Simple Top Bar (Hidden on Dashboard) */}
                {!isDashboard && (
                    <header className="sticky top-0 z-50 bg-gradient-to-r from-white via-red-50 to-red-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-red-200 dark:border-slate-700 shadow-md">
                        <div className="flex items-center justify-between h-16 px-4">
                            {/* Logo SAILO - Clickable to Home */}
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                            >
                                <img src="/logo.png" alt="SAILO" className="w-9 h-9 object-contain drop-shadow-sm" />
                                <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-slate-200">
                                    SAILO <span className="text-brand-red">CRM</span>
                                </span>
                            </button>

                            {/* Right Actions */}
                            <div className="flex items-center gap-2">
                                {/* Agenda Button */}
                                <button
                                    onClick={() => navigate('/agenda')}
                                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-brand-red dark:hover:text-brand-red transition-colors"
                                >
                                    <Calendar size={20} />
                                </button>

                                {/* Notifications Button */}
                                <button
                                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                                    className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-brand-red dark:hover:text-brand-red transition-colors"
                                >
                                    <Bell size={20} />
                                    {/* Badge */}
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-brand-red rounded-full"></span>
                                </button>

                                {/* Logout Button */}
                                <button onClick={handleLogout} className="p-2 text-slate-600 dark:text-slate-400 hover:text-brand-red dark:hover:text-brand-red transition-colors">
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </div>
                    </header>
                )}

                {/* Shared Notifications Dropdown - Positioned absolutely */}
                <AnimatePresence>
                    {notificationsOpen && (
                        <motion.div
                            ref={notificationsRef}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="fixed top-16 right-4 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-[100] xl:top-20"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-slate-200 bg-slate-50">
                                <h3 className="font-bold text-slate-800">Notificaciones</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Mantente al día con tu CRM</p>
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-96 overflow-y-auto">
                                {/* Actividad Próxima */}
                                <div className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <Calendar className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-slate-800">Reunión en 30 minutos</p>
                                            <p className="text-xs text-slate-500 mt-1">Reunión con Robert Mols - 15:30</p>
                                            <span className="text-xs text-blue-600 font-medium mt-1 inline-block">Hace 5 min</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recordatorio Oportunidad */}
                                <div className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                            <Briefcase className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-slate-800">Registrar oportunidad</p>
                                            <p className="text-xs text-slate-500 mt-1">No olvides anotar la oportunidad de venta con Empresa XYZ</p>
                                            <span className="text-xs text-amber-600 font-medium mt-1 inline-block">Hace 2 horas</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Seguimiento Prospecto */}
                                <div className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                            <UserCheck className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-slate-800">Seguimiento pendiente</p>
                                            <p className="text-xs text-slate-500 mt-1">Contactar a Claudia Sharlin - Prospecto caliente</p>
                                            <span className="text-xs text-purple-600 font-medium mt-1 inline-block">Ayer</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Resumen Visita */}
                                <div className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <Map className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-slate-800">Completar resumen de visita</p>
                                            <p className="text-xs text-slate-500 mt-1">Visita a Donald Cotta - Agregar notas y próximos pasos</p>
                                            <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">Hace 3 días</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-3 border-t border-slate-200 bg-slate-50">
                                <button className="w-full text-center text-sm font-semibold text-brand-red hover:text-red-700 transition-colors">
                                    Ver todas las notificaciones
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile Main Content */}
                <main className="flex-1 w-full overflow-y-auto pb-20">
                    <Outlet />
                </main>

                {/* Bottom Navigation Bar */}
                <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-white via-white to-red-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-2xl xl:hidden">
                    <div className="relative flex items-center justify-between h-16 px-4">
                        {/* Left Side - 2 buttons */}
                        <div className="flex items-center gap-2 flex-1 justify-start">
                            {/* Prospectos Button */}
                            <NavLink
                                to="/prospectos"
                                className={({ isActive }) => `
                                    flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-200
                                    ${isActive ? 'text-brand-red' : 'text-slate-600 dark:text-slate-400'}
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        <UserCheck size={22} strokeWidth={isActive ? 2.5 : 2} className={`transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`} />
                                        <span className="text-[9px] font-semibold mt-0.5">Prospectos</span>
                                    </>
                                )}
                            </NavLink>

                            {/* Clientes Button */}
                            <NavLink
                                to="/clientes"
                                className={({ isActive }) => `
                                    flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-200
                                    ${isActive ? 'text-brand-red' : 'text-slate-600'}
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        <Users size={22} strokeWidth={isActive ? 2.5 : 2} className={`transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`} />
                                        <span className="text-[9px] font-semibold mt-0.5">Clientes</span>
                                    </>
                                )}
                            </NavLink>
                        </div>

                        {/* Center - Quick Actions Button (Elevated) */}
                        <div className="absolute left-1/2 -translate-x-1/2 -top-6">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="relative w-16 h-16 rounded-full bg-gradient-to-br from-brand-red to-red-700 shadow-2xl shadow-red-500/50 dark:shadow-red-900/50 flex items-center justify-center hover:scale-110 transition-all duration-300 border-4 border-white dark:border-slate-800"
                            >
                                <AnimatePresence mode="wait">
                                    {mobileMenuOpen ? (
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
                            {/* Oportunidades Button */}
                            <NavLink
                                to="/oportunidades"
                                className={({ isActive }) => `
                                    flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-200
                                    ${isActive ? 'text-brand-red' : 'text-slate-600'}
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        <Briefcase size={22} strokeWidth={isActive ? 2.5 : 2} className={`transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`} />
                                        <span className="text-[9px] font-semibold mt-0.5">Oportun.</span>
                                    </>
                                )}
                            </NavLink>

                            {/* Menu Button */}
                            <button
                                onClick={() => setMobileNavMenuOpen(!mobileNavMenuOpen)}
                                className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-200 ${mobileNavMenuOpen ? 'text-brand-red' : 'text-slate-600'
                                    }`}
                            >
                                <Menu size={22} strokeWidth={mobileNavMenuOpen ? 2.5 : 2} className={`transition-all duration-200 ${mobileNavMenuOpen ? 'scale-110' : 'scale-100'}`} />
                                <span className="text-[9px] font-semibold mt-0.5">Menú</span>
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Quick Actions Bottom Sheet */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setMobileMenuOpen(false)}
                                className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm xl:hidden"
                            />

                            {/* Bottom Sheet */}
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl xl:hidden pb-20"
                            >
                                {/* Handle Bar */}
                                <div className="flex justify-center pt-3 pb-2">
                                    <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
                                </div>

                                {/* Header */}
                                <div className="px-6 pb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">Acciones Rápidas</h3>
                                        <p className="text-xs text-slate-500 mt-1">Selecciona una acción para comenzar</p>
                                    </div>
                                    <button
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-4 h-4 text-slate-600" />
                                    </button>
                                </div>

                                {/* Actions Grid */}
                                <div className="px-4 pb-6 grid grid-cols-2 gap-3">
                                    {/* Crear Actividad */}
                                    <button
                                        onClick={() => {
                                            setIsCreateModalOpen(true);
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:shadow-lg transition-all active:scale-95"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-red to-red-600 flex items-center justify-center mb-3 shadow-md">
                                            <Calendar className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-800">Crear Actividad</span>
                                    </button>

                                    {/* Nuevo Prospecto */}
                                    <button
                                        onClick={() => {
                                            handleGlobalCreateProspect();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:shadow-lg transition-all active:scale-95"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-red to-red-600 flex items-center justify-center mb-3 shadow-md">
                                            <UserCheck className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-800">Nuevo Prospecto</span>
                                    </button>

                                    {/* Convertir Prospecto */}
                                    <button
                                        onClick={() => {
                                            handleGlobalPromoteProspect();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:shadow-lg transition-all active:scale-95"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-red to-red-600 flex items-center justify-center mb-3 shadow-md">
                                            <UserPlus className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-800">Convertir Prospecto</span>
                                    </button>

                                    {/* Nuevo Cliente */}
                                    <button
                                        onClick={() => {
                                            handleGlobalCreateClient();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:shadow-lg transition-all active:scale-95"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-red to-red-600 flex items-center justify-center mb-3 shadow-md">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-800">Nuevo Cliente</span>
                                    </button>

                                    {/* Nuevo Contacto */}
                                    <button
                                        onClick={() => {
                                            handleGlobalCreateContact();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:shadow-lg transition-all active:scale-95"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-red to-red-600 flex items-center justify-center mb-3 shadow-md">
                                            <UserCheck className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-800">Nuevo Contacto</span>
                                    </button>

                                    {/* Registrar Visita */}
                                    <button
                                        onClick={() => {
                                            navigate('/visitas');
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:shadow-lg transition-all active:scale-95"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-red to-red-600 flex items-center justify-center mb-3 shadow-md">
                                            <Map className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-800">Registrar Visita</span>
                                    </button>

                                    {/* Nueva Oportunidad */}
                                    <button
                                        onClick={() => {
                                            navigate('/oportunidades');
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:shadow-lg transition-all active:scale-95"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-red to-red-600 flex items-center justify-center mb-3 shadow-md">
                                            <Briefcase className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-800">Nueva Oportunidad</span>
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Navigation Menu Bottom Sheet */}
                <AnimatePresence>
                    {mobileNavMenuOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setMobileNavMenuOpen(false)}
                                className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm xl:hidden"
                            />

                            {/* Bottom Sheet */}
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl xl:hidden pb-20"
                            >
                                {/* Handle Bar */}
                                <div className="flex justify-center pt-3 pb-2">
                                    <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
                                </div>

                                {/* Header */}
                                <div className="px-6 pb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">Menú de Navegación</h3>
                                        <p className="text-xs text-slate-500 mt-1">Accede a todas las secciones del CRM</p>
                                    </div>
                                    <button
                                        onClick={() => setMobileNavMenuOpen(false)}
                                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-4 h-4 text-slate-600" />
                                    </button>
                                </div>

                                {/* Navigation Grid */}
                                <div className="px-4 pb-6 grid grid-cols-3 gap-3">
                                    {/* Dashboard */}
                                    <NavLink
                                        to="/dashboard"
                                        onClick={() => setMobileNavMenuOpen(false)}
                                        className={({ isActive }) => `
                                            flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95
                                            ${isActive ? 'bg-gradient-to-br from-red-50 to-red-100 border-brand-red shadow-lg' : 'bg-slate-50 border-slate-200 hover:shadow-md'}
                                        `}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <LayoutDashboard className={`w-6 h-6 mb-2 ${isActive ? 'text-brand-red' : 'text-slate-600'}`} />
                                                <span className={`text-xs font-bold text-center ${isActive ? 'text-brand-red' : 'text-slate-800'}`}>Dashboard</span>
                                            </>
                                        )}
                                    </NavLink>

                                    {/* Ficha 360 */}
                                    <NavLink
                                        to="/ficha-360"
                                        onClick={() => setMobileNavMenuOpen(false)}
                                        className={({ isActive }) => `
                                            flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95
                                            ${isActive ? 'bg-gradient-to-br from-red-50 to-red-100 border-brand-red shadow-lg' : 'bg-slate-50 border-slate-200 hover:shadow-md'}
                                        `}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <Search className={`w-6 h-6 mb-2 ${isActive ? 'text-brand-red' : 'text-slate-600'}`} />
                                                <span className={`text-xs font-bold text-center ${isActive ? 'text-brand-red' : 'text-slate-800'}`}>Ficha 360</span>
                                            </>
                                        )}
                                    </NavLink>

                                    {/* Agenda */}
                                    <NavLink
                                        to="/agenda"
                                        onClick={() => setMobileNavMenuOpen(false)}
                                        className={({ isActive }) => `
                                            flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95
                                            ${isActive ? 'bg-gradient-to-br from-red-50 to-red-100 border-brand-red shadow-lg' : 'bg-slate-50 border-slate-200 hover:shadow-md'}
                                        `}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <Calendar className={`w-6 h-6 mb-2 ${isActive ? 'text-brand-red' : 'text-slate-600'}`} />
                                                <span className={`text-xs font-bold text-center ${isActive ? 'text-brand-red' : 'text-slate-800'}`}>Agenda</span>
                                            </>
                                        )}
                                    </NavLink>

                                    {/* Legajo */}
                                    <NavLink
                                        to="/legajo"
                                        onClick={() => setMobileNavMenuOpen(false)}
                                        className={({ isActive }) => `
                                            flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95
                                            ${isActive ? 'bg-gradient-to-br from-red-50 to-red-100 border-brand-red shadow-lg' : 'bg-slate-50 border-slate-200 hover:shadow-md'}
                                        `}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <FileText className={`w-6 h-6 mb-2 ${isActive ? 'text-brand-red' : 'text-slate-600'}`} />
                                                <span className={`text-xs font-bold text-center ${isActive ? 'text-brand-red' : 'text-slate-800'}`}>Legajo</span>
                                            </>
                                        )}
                                    </NavLink>

                                    {/* Contactos */}
                                    <NavLink
                                        to="/contactos"
                                        onClick={() => setMobileNavMenuOpen(false)}
                                        className={({ isActive }) => `
                                            flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95
                                            ${isActive ? 'bg-gradient-to-br from-red-50 to-red-100 border-brand-red shadow-lg' : 'bg-slate-50 border-slate-200 hover:shadow-md'}
                                        `}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <UserCheck className={`w-6 h-6 mb-2 ${isActive ? 'text-brand-red' : 'text-slate-600'}`} />
                                                <span className={`text-xs font-bold text-center ${isActive ? 'text-brand-red' : 'text-slate-800'}`}>Contactos</span>
                                            </>
                                        )}
                                    </NavLink>

                                    {/* Visitas */}
                                    <NavLink
                                        to="/visitas"
                                        onClick={() => setMobileNavMenuOpen(false)}
                                        className={({ isActive }) => `
                                            flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95
                                            ${isActive ? 'bg-gradient-to-br from-red-50 to-red-100 border-brand-red shadow-lg' : 'bg-slate-50 border-slate-200 hover:shadow-md'}
                                        `}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <Map className={`w-6 h-6 mb-2 ${isActive ? 'text-brand-red' : 'text-slate-600'}`} />
                                                <span className={`text-xs font-bold text-center ${isActive ? 'text-brand-red' : 'text-slate-800'}`}>Visitas</span>
                                            </>
                                        )}
                                    </NavLink>

                                    {/* Objetivos */}
                                    <NavLink
                                        to="/objetivos"
                                        onClick={() => setMobileNavMenuOpen(false)}
                                        className={({ isActive }) => `
                                            flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95
                                            ${isActive ? 'bg-gradient-to-br from-red-50 to-red-100 border-brand-red shadow-lg' : 'bg-slate-50 border-slate-200 hover:shadow-md'}
                                        `}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <Target className={`w-6 h-6 mb-2 ${isActive ? 'text-brand-red' : 'text-slate-600'}`} />
                                                <span className={`text-xs font-bold text-center ${isActive ? 'text-brand-red' : 'text-slate-800'}`}>Objetivos</span>
                                            </>
                                        )}
                                    </NavLink>

                                    {/* Territorios */}
                                    <NavLink
                                        to="/territorios"
                                        onClick={() => setMobileNavMenuOpen(false)}
                                        className={({ isActive }) => `
                                            flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95
                                            ${isActive ? 'bg-gradient-to-br from-red-50 to-red-100 border-brand-red shadow-lg' : 'bg-slate-50 border-slate-200 hover:shadow-md'}
                                        `}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <Map className={`w-6 h-6 mb-2 ${isActive ? 'text-brand-red' : 'text-slate-600'}`} />
                                                <span className={`text-xs font-bold text-center ${isActive ? 'text-brand-red' : 'text-slate-800'}`}>Territorios</span>
                                            </>
                                        )}
                                    </NavLink>

                                    {/* Reclamos */}
                                    <NavLink
                                        to="/reclamos"
                                        onClick={() => setMobileNavMenuOpen(false)}
                                        className={({ isActive }) => `
                                            flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95
                                            ${isActive ? 'bg-gradient-to-br from-red-50 to-red-100 border-brand-red shadow-lg' : 'bg-slate-50 border-slate-200 hover:shadow-md'}
                                        `}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <AlertCircle className={`w-6 h-6 mb-2 ${isActive ? 'text-brand-red' : 'text-slate-600'}`} />
                                                <span className={`text-xs font-bold text-center ${isActive ? 'text-brand-red' : 'text-slate-800'}`}>Reclamos</span>
                                            </>
                                        )}
                                    </NavLink>

                                    {/* Configuración */}
                                    <button
                                        onClick={() => {
                                            setMobileNavMenuOpen(false);
                                            navigate('/configuracion');
                                        }}
                                        className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 bg-slate-50 border-slate-200 hover:shadow-md transition-all active:scale-95"
                                    >
                                        <Settings className="w-6 h-6 mb-2 text-slate-600" />
                                        <span className="text-xs font-bold text-center text-slate-800">Config</span>
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div >

            {/* ========== DESKTOP VERSION ========== */}
            < div className="hidden xl:block" >
                {/* Desktop Header */}
                < header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-sm transition-all duration-300" >
                    <div className="max-w-[1920px] mx-auto h-28 w-full">
                        <div className="flex items-center justify-between h-full px-6 w-full">

                            {/* Block 1: Logo (Fixed 300px) */}
                            <div className="w-[300px] flex-shrink-0 flex items-center gap-3">
                                <button onClick={() => window.location.href = '/agenda'} className="w-16 h-16 relative flex-shrink-0 flex items-center justify-center focus:outline-none">
                                    <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                                </button>
                                <div className="flex flex-col justify-center">
                                    <span className="font-bold text-2xl tracking-tight text-slate-800 leading-none">
                                        CRM <span className="text-brand-red">Lite</span>
                                    </span>
                                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Desktop</span>
                                </div>
                            </div>

                            {/* Block 2: Navigation (Flexible Center) */}
                            <nav className="flex-1 flex items-center justify-center h-full gap-2 px-4">
                                {/* Left Modules */}
                                <div className="flex items-center gap-1">
                                    {leftModules.map((module) => (
                                        <DesktopNavItem key={module.path} module={module} />
                                    ))}
                                </div>

                                {/* Center Action Button */}
                                <div className="relative mx-2 flex-shrink-0" ref={desktopMenuRef}>
                                    <button
                                        onClick={() => setDesktopActionMenuOpen(!desktopActionMenuOpen)}
                                        className="w-14 h-14 rounded-full bg-white border-2 border-slate-200 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center"
                                    >
                                        <div className="absolute inset-0 bg-brand-red/5 rounded-full" />
                                        <img src="/logo.png" alt="Menu" className={`w-7 h-7 object-contain transition-transform duration-300 ${desktopActionMenuOpen ? 'rotate-90 scale-0' : 'scale-100'}`} />
                                        <X size={24} className={`absolute text-brand-red transition-transform duration-300 ${desktopActionMenuOpen ? 'scale-100' : 'scale-0'}`} />
                                    </button>

                                    <AnimatePresence>
                                        {desktopActionMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-60 bg-white border border-slate-200 shadow-xl rounded-xl p-2 flex flex-col gap-1"
                                            >
                                                {actions.map((action, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            if (action.label === 'Crear Actividad') setIsCreateModalOpen(true);
                                                            else if (action.label === 'Nuevo Prospecto') handleGlobalCreateProspect();
                                                            else if (action.label === 'Convertir Prospecto') handleGlobalPromoteProspect();
                                                            else if (action.label === 'Nuevo Cliente') handleGlobalCreateClient();
                                                            else if (action.label === 'Nuevo Contacto') handleGlobalCreateContact();
                                                            setDesktopActionMenuOpen(false);
                                                        }}
                                                        className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors"
                                                    >
                                                        <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                                                            <action.icon size={16} />
                                                        </div>
                                                        <span className="text-xs font-semibold text-slate-700">{action.label}</span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Right Modules */}
                                <div className="flex items-center gap-1">
                                    {rightModules.map((module) => (
                                        <DesktopNavItem key={module.path} module={module} />
                                    ))}
                                </div>
                            </nav>

                            {/* Block 3: User (Fixed 300px) */}
                            <div className="w-[300px] flex-shrink-0 flex items-center justify-end gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-slate-700">Martin G.</p>
                                    <p className="text-[9px] text-slate-400 font-semibold tracking-wide uppercase">Admin</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-500">
                                    <Users size={18} />
                                </div>

                                {/* Notifications Button - Desktop */}
                                <div className="relative">
                                    <button
                                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                                        className="relative p-2 hover:text-brand-red transition-colors"
                                        title="Notificaciones"
                                    >
                                        <Bell size={18} />
                                        {/* Badge */}
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-brand-red rounded-full"></span>
                                    </button>
                                </div>

                                <button onClick={handleLogout} className="p-2 hover:text-brand-red transition-colors" title="Salir">
                                    <LogOut size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </header >

                {/* Desktop Main Content */}
                < main className="flex-1 max-w-[1920px] mx-auto w-full p-6 pt-6" >
                    <div className="w-full h-full glass-panel rounded-[2rem] p-8 min-h-[calc(100vh-140px)] animate-in fade-in zoom-in-95 duration-500 shadow-2xl shadow-slate-200/50 border border-white/60">
                        <Outlet />
                    </div>
                </main >
            </div >

            {/* ========== GLOBAL MODALS (Shared) ========== */}
            < CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={(newEvent) => {
                    console.log('Global Event Created:', newEvent);
                    import('../data/mockAgenda').then(module => {
                        module.mockEvents.push(newEvent);
                        alert('Actividad global creada! Ve a la Agenda para verla.');
                    });
                }}
            />

            < EditProspectModal
                isOpen={isProspectModalOpen}
                onClose={() => setIsProspectModalOpen(false)}
                prospect={prospectData}
                onSave={(newProspect) => {
                    console.log('Global Prospect Created:', newProspect);
                    import('../data/mockProspects').then(module => {
                        module.mockProspects.push(newProspect);
                        alert('Prospecto global creado! Ve a Prospectos para verlo.');
                    });
                    setIsProspectModalOpen(false);
                }}
            />

            < ProspectPickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                prospects={mockProspects}
                onSelect={handlePickerSelect}
            />

            <ConvertToClientModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                prospect={prospectToConvert}
                onConvert={(newClient) => {
                    console.log('Client Created/Converted:', newClient);
                    import('../data/mockClients').then(module => {
                        module.mockClients.push(newClient);
                        alert('Cliente Creado Exitosamente!');
                    });
                    setIsClientModalOpen(false);
                }}
            />

            <ContactModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                onSave={(newContact) => {
                    console.log('Global Contact Created:', newContact);
                    import('../data/mockContacts').then(module => {
                        module.mockContacts.push(newContact);
                        alert('Contacto creado exitosamente! Ve a Contactos para verlo.');
                    });
                    setIsContactModalOpen(false);
                }}
                contact={null}
            />
        </div >
    );
};

// Desktop NavItem Component
const DesktopNavItem = ({ module }) => (
    <NavLink
        to={module.path}
        className={({ isActive }) => `
        relative px-1 py-1 rounded-2xl text-[9px] font-bold uppercase tracking-wide transition-all duration-300 group flex justify-center items-center w-auto
        ${isActive
                ? 'text-brand-red'
                : 'text-slate-400 hover:text-slate-600'}
    `}
    >
        {({ isActive }) => (
            <div className="flex flex-col items-center gap-0.5 w-full">
                <div className={`
                relative p-1 rounded-xl transition-all duration-300
                ${isActive ? 'bg-red-50 text-brand-red shadow-sm transform scale-105' : 'bg-transparent group-hover:bg-slate-50'}
            `}>
                    <module.icon
                        size={14}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={`transition-all duration-300 ${isActive ? 'drop-shadow-sm' : 'opacity-70 group-hover:opacity-100'}`}
                    />
                </div>
                <span className="relative z-10 text-center leading-none whitespace-nowrap mt-0.5">{module.name}</span>

                {isActive && (
                    <span className="absolute -bottom-0.5 w-1/2 h-[1.5px] bg-brand-red rounded-full left-1/2 transform -translate-x-1/2 shadow-sm" />
                )}
            </div>
        )}
    </NavLink>
);

export default MainLayout;
