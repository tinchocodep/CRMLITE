import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, FileText, Map, Target, AlertCircle, Briefcase, UserCheck, Search, Plus, X, UserPlus, User, LogOut, Bell, Home, Menu, Settings, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';
import CreateEventModal from '../components/agenda/CreateEventModal';
import EditProspectModal from '../components/prospects/EditProspectModal';
import ConvertToClientModal from '../components/clients/ConvertToClientModal';
import ProspectPickerModal from '../components/prospects/ProspectPickerModal';
import ContactModal from '../components/contacts/ContactModal';
import { VerticalSidebar } from '../components/VerticalSidebar';
import { CRMSubmoduleSidebar } from '../components/CRMSubmoduleSidebar';
import { HorizontalCRMNav } from '../components/HorizontalCRMNav';
import { RightSidebarAgenda } from '../components/RightSidebarAgenda';
import { useCompanies } from '../hooks/useCompanies';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { supabase } from '../lib/supabase';

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
    const { companies, createCompany } = useCompanies();
    const { user } = useAuth();
    const { notifications, unreadCount, dismissNotification } = useNotifications();

    // Filter only prospects
    const prospects = companies.filter(c => c.company_type === 'prospect');

    // Check if we're on the dashboard
    const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';

    // Check if we're in CRM module (any CRM submodule)
    const crmPaths = ['/dashboard', '/prospectos', '/clientes', '/contactos', '/agenda', '/oportunidades', '/visitas', '/territorios', '/reclamos', '/ficha-360'];
    const isCRMActive = crmPaths.includes(location.pathname) || location.pathname === '/';

    // ========== MOBILE STATE (Separate) ==========
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileNavMenuOpen, setMobileNavMenuOpen] = useState(false);

    // ========== DESKTOP STATE (Separate) ==========
    const [desktopActionMenuOpen, setDesktopActionMenuOpen] = useState(false);
    const [mainSidebarExpanded, setMainSidebarExpanded] = useState(false);
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

    // Outlet will automatically re-render when location changes via React Router

    // ========== SHARED HANDLERS ==========
    const handleLogout = () => {
        navigate('/');
    };

    const handleGlobalCreateProspect = () => {
        setProspectData({
            // No ID for new prospects to avoid confusion in EditProspectModal
            // id: Date.now(), 
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

    const handleGlobalCreateOpportunity = () => {
        navigate('/oportunidades');
        // Trigger modal open after navigation
        setTimeout(() => {
            const event = new CustomEvent('openOpportunityModal');
            window.dispatchEvent(event);
        }, 100);
        setDesktopActionMenuOpen(false);
        setMobileMenuOpen(false);
    };

    // Desktop: Split modules for central logo
    const leftModules = modules.slice(0, 5);
    const rightModules = modules.slice(5);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col font-sans text-slate-800 dark:text-slate-200">

            {/* ========== MOBILE VERSION ========== */}
            <div className="xl:hidden flex flex-col h-screen">
                {/* Mobile Header - Simple Top Bar (Hidden on Dashboard) */}
                {!isDashboard && (
                    <header className="sticky top-0 z-[60] bg-gradient-to-r from-white via-red-50 to-red-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-red-200 dark:border-slate-700 shadow-md">
                        <div className="flex items-center justify-between h-16 px-4">
                            {/* Logo SAILO - Clickable to Home */}
                            <button
                                onClick={() => safeNavigate('/dashboard')}
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                            >
                                <img src="/logo.png" alt="SAILO" className="w-9 h-9 object-contain drop-shadow-sm" />
                            </button>

                            {/* Right Actions */}
                            <div className="flex items-center gap-2">
                                {/* Agenda Button */}
                                <button
                                    onClick={() => safeNavigate('/agenda')}
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
                                    {/* Dynamic Badge Count */}
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-brand-red text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
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

                            {/* Notifications List - Dynamic */}
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500">No hay notificaciones</p>
                                        <p className="text-xs text-slate-400 mt-1">Estás al día con todo</p>
                                    </div>
                                ) : (
                                    notifications.map(notification => {
                                        const IconComponent = notification.icon;
                                        return (
                                            <div
                                                key={notification.id}
                                                className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors relative group"
                                            >
                                                <div
                                                    onClick={() => {
                                                        navigate(notification.action);
                                                        setNotificationsOpen(false);
                                                    }}
                                                    className="flex gap-3 cursor-pointer"
                                                >
                                                    <div className={`w-10 h-10 rounded-lg ${notification.color} flex items-center justify-center flex-shrink-0`}>
                                                        <IconComponent className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 pr-6">
                                                        <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
                                                        <p className="text-xs text-slate-500 mt-1">{notification.description}</p>
                                                        <span className={`text-xs font-medium mt-1 inline-block ${notification.priority === 'critical' ? 'text-red-600' :
                                                            notification.priority === 'high' ? 'text-orange-600' :
                                                                notification.priority === 'medium' ? 'text-amber-600' :
                                                                    'text-blue-600'
                                                            }`}>
                                                            {notification.timeAgo}
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* Dismiss Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        dismissNotification(notification.id);
                                                    }}
                                                    className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                                                    title="Descartar notificación"
                                                >
                                                    <X size={16} className="stroke-2" />
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
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
                <main className="flex-1 w-full overflow-y-auto">
                    <Outlet />
                </main>

                {/* Bottom Navigation Bar */}
                <nav className="fixed bottom-0 left-0 right-0 z-[20000] pointer-events-auto bg-gradient-to-r from-white via-white to-red-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-2xl xl:hidden">
                    <div className="relative flex items-center justify-between h-16 px-4">
                        {/* Left Side - 2 buttons */}
                        <div className="flex items-center gap-2 flex-1 justify-start relative z-10">
                            {/* Prospectos Button */}
                            <NavLink
                                to="/prospectos"
                                end
                                className={({ isActive }) => `
                                    flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-200
                                    ${isActive ? 'text-brand-red' : 'text-slate-600 dark:text-slate-400'}
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        <Users size={22} strokeWidth={isActive ? 2.5 : 2} className={`transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`} />
                                        <span className="text-[9px] font-semibold mt-0.5">Prospectos</span>
                                    </>
                                )}
                            </NavLink>

                            {/* Clientes Button */}
                            <NavLink
                                to="/clientes"
                                end
                                className={({ isActive }) => `
                                    flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-200
                                    ${isActive ? 'text-brand-red' : 'text-slate-600'}
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        <UserCheck size={22} strokeWidth={isActive ? 2.5 : 2} className={`transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`} />
                                        <span className="text-[9px] font-semibold mt-0.5">Clientes</span>
                                    </>
                                )}
                            </NavLink>
                        </div>

                        {/* Center - Quick Actions Button (Elevated) */}
                        <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-20">
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
                        <div className="flex items-center gap-2 flex-1 justify-end relative z-10">
                            {/* Oportunidades Button */}
                            <NavLink
                                to="/oportunidades"
                                end
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
                                className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl xl:hidden pb-20 max-h-[85vh] overflow-y-auto"
                            >
                                {/* Handle Bar */}
                                <div className="flex justify-center pt-3 pb-2">
                                    <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
                                </div>

                                {/* Header */}
                                <div className="px-6 pb-4">
                                    <h3 className="text-lg font-bold text-slate-800">Nuevo:</h3>
                                </div>

                                {/* Actions Grid */}
                                <div className="px-4 pb-6 grid grid-cols-2 gap-3">
                                    {/* PERSONAS - Azul */}

                                    {/* Prospecto */}
                                    <button
                                        onClick={() => {
                                            handleGlobalCreateProspect();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all active:scale-95 gap-2"
                                    >
                                        <Users className="w-8 h-8 text-blue-600" strokeWidth={2} />
                                        <span className="text-xs font-bold text-slate-800">Prospecto</span>
                                    </button>

                                    {/* Convertir Prospecto */}
                                    <button
                                        onClick={() => {
                                            handleGlobalPromoteProspect();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all active:scale-95 gap-2"
                                    >
                                        <UserPlus className="w-8 h-8 text-blue-600" strokeWidth={2} />
                                        <span className="text-xs font-bold text-slate-800">Convertir Prospecto</span>
                                    </button>

                                    {/* Cliente */}
                                    <button
                                        onClick={() => {
                                            handleGlobalCreateClient();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all active:scale-95 gap-2"
                                    >
                                        <UserCheck className="w-8 h-8 text-blue-600" strokeWidth={2} />
                                        <span className="text-xs font-bold text-slate-800">Cliente</span>
                                    </button>

                                    {/* Contacto */}
                                    <button
                                        onClick={() => {
                                            handleGlobalCreateContact();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all active:scale-95 gap-2"
                                    >
                                        <User className="w-8 h-8 text-blue-600" strokeWidth={2} />
                                        <span className="text-xs font-bold text-slate-800">Contacto</span>
                                    </button>

                                    {/* PROCESOS - Verde */}

                                    {/* Actividad */}
                                    <button
                                        onClick={() => {
                                            setIsCreateModalOpen(true);
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-green-50 border border-green-200 hover:bg-green-100 transition-all active:scale-95 gap-2"
                                    >
                                        <Calendar className="w-8 h-8 text-green-600" strokeWidth={2} />
                                        <span className="text-xs font-bold text-slate-800">Actividad</span>
                                    </button>

                                    {/* Visita */}
                                    <button
                                        onClick={() => {
                                            navigate('/visitas');
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-green-50 border border-green-200 hover:bg-green-100 transition-all active:scale-95 gap-2"
                                    >
                                        <Map className="w-8 h-8 text-green-600" strokeWidth={2} />
                                        <span className="text-xs font-bold text-slate-800">Visita</span>
                                    </button>

                                    {/* Oportunidad */}
                                    <button
                                        onClick={() => {
                                            handleGlobalCreateOpportunity();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-green-50 border border-green-200 hover:bg-green-100 transition-all active:scale-95 gap-2"
                                    >
                                        <Briefcase className="w-8 h-8 text-green-600" strokeWidth={2} />
                                        <span className="text-xs font-bold text-slate-800">Oportunidad</span>
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
                                        <h3 className="text-lg font-bold text-slate-800">Menú</h3>
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
                                    {/* 1. Dashboard */}
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

                                    {/* 2. Agenda */}
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

                                    {/* 3. Visitas */}
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

                                    {/* 4. Ficha 360 */}
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

                                    {/* 5. Contactos */}
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

                                    {/* 6. Legajo */}
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

                                    {/* 7. Territorio (singular) */}
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
                                                <span className={`text-xs font-bold text-center ${isActive ? 'text-brand-red' : 'text-slate-800'}`}>Territorio</span>
                                            </>
                                        )}
                                    </NavLink>

                                    {/* 8. Objetivos */}
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

                                    {/* 9. Reclamos */}
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

                                    {/* 10. Usuarios */}
                                    <NavLink
                                        to="/usuarios"
                                        onClick={() => setMobileNavMenuOpen(false)}
                                        className={({ isActive }) => `
                                            flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95
                                            ${isActive ? 'bg-gradient-to-br from-red-50 to-red-100 border-brand-red shadow-lg' : 'bg-slate-50 border-slate-200 hover:shadow-md'}
                                        `}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <ShieldCheck className={`w-6 h-6 mb-2 ${isActive ? 'text-brand-red' : 'text-slate-600'}`} />
                                                <span className={`text-xs font-bold text-center ${isActive ? 'text-brand-red' : 'text-slate-800'}`}>Usuarios</span>
                                            </>
                                        )}
                                    </NavLink>

                                    {/* 11. Configuración */}
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
            <div className="hidden xl:block">
                {/* Vertical Sidebar */}
                <VerticalSidebar
                    onQuickActions={() => setDesktopActionMenuOpen(!desktopActionMenuOpen)}
                    onHoverChange={setMainSidebarExpanded}
                />

                {/* Quick Actions Modal - Desktop */}
                <AnimatePresence>
                    {desktopActionMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                            onClick={() => setDesktopActionMenuOpen(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, x: -20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="fixed left-24 top-1/2 -translate-y-1/2 w-80 bg-white rounded-2xl shadow-2xl p-6"
                            >
                                <h3 className="text-xl font-bold text-slate-800 mb-4">Acciones Rápidas</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {actions.map((action, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (action.label === 'Crear Actividad') setIsCreateModalOpen(true);
                                                else if (action.label === 'Nuevo Prospecto') handleGlobalCreateProspect();
                                                else if (action.label === 'Convertir Prospecto') handleGlobalPromoteProspect();
                                                else if (action.label === 'Nuevo Cliente') handleGlobalCreateClient();
                                                else if (action.label === 'Nuevo Contacto') handleGlobalCreateContact();
                                                else if (action.label === 'Registrar Visita') navigate('/visitas');
                                                else if (action.label === 'Nueva Oportunidad') handleGlobalCreateOpportunity();
                                                setDesktopActionMenuOpen(false);
                                            }}
                                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:shadow-lg transition-all active:scale-95"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-700 flex items-center justify-center mb-2 shadow-md">
                                                <action.icon className="w-6 h-6 text-white" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-800 text-center">{action.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* CRM Horizontal Navigation - Above Content */}
                {isCRMActive && <HorizontalCRMNav isMainSidebarExpanded={mainSidebarExpanded} />}

                {/* Right Sidebar Agenda */}
                <RightSidebarAgenda isMainSidebarExpanded={mainSidebarExpanded} />

                {/* Desktop Main Content */}
                <main className={`min-h-screen transition-all duration-300 ${mainSidebarExpanded ? 'ml-72' : 'ml-20 xl:mr-70'}`}>
                    <Outlet key={location.pathname} />
                </main>
            </div>

            {/* ========== GLOBAL MODALS (Shared) ========== */}
            {/* ========== GLOBAL MODALS (Shared) ========== */}
            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                companies={companies}
                onCreate={async (newEvent) => {
                    console.log('Global Event Created:', newEvent);
                    try {
                        const { error } = await supabase
                            .from('activities')
                            .insert([{
                                title: newEvent.title,
                                description: newEvent.description,
                                type: newEvent.type, // visit, call, etc
                                status: 'pending',
                                priority: newEvent.priority,
                                scheduled_date: newEvent.start,
                                scheduled_time: new Date(newEvent.start).toLocaleTimeString(),
                                duration_minutes: newEvent.duration,
                                company_id: newEvent.company_id || null,
                                created_by: user?.id,
                                assigned_to: newEvent.assignedTo || [user?.id] // Array of UUIDs
                            }]);

                        if (error) throw error;
                        alert('Actividad creada exitosamente');
                    } catch (err) {
                        console.error('Error saving event:', err);
                        alert('Error al guardar la actividad: ' + err.message);
                    }
                }}
            />

            <EditProspectModal
                isOpen={isProspectModalOpen}
                onClose={() => setIsProspectModalOpen(false)}
                prospect={prospectData}
                onSave={async (newProspect) => {
                    console.log('Global Prospect Created:', newProspect);

                    // Remove dummy ID if present (from initialization)
                    // eslint-disable-next-line no-unused-vars
                    const { id, ...prospectDataToSave } = newProspect;

                    const result = await createCompany({
                        ...prospectDataToSave,
                        company_type: 'prospect',
                        // Ensure required fields for safety
                        trade_name: prospectDataToSave.trade_name || '',
                        legal_name: prospectDataToSave.legal_name || ''
                    });

                    if (result.success) {
                        alert('Prospecto creado exitosamente');
                        setIsProspectModalOpen(false);
                    } else {
                        alert('Error al crear prospecto: ' + result.error);
                    }
                }}
            />

            <ProspectPickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                prospects={prospects}
                onSelect={handlePickerSelect}
            />

            <ConvertToClientModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                prospect={prospectToConvert}
                onConvert={(newClient) => {
                    console.log('Client Created/Converted:', newClient);
                    alert('Cliente convertido! (Lógica real pendiente en componente)');
                    setIsClientModalOpen(false);
                }}
            />

            <ContactModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                onSave={(newContact) => {
                    console.log('Global Contact Created:', newContact);
                    alert('Contacto creado! (Lógica real pendiente en componente)');
                    setIsContactModalOpen(false);
                }}
                contact={null}
            />
        </div>
    );
};

export default MainLayout;
