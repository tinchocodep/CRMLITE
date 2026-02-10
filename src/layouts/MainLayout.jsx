import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, FileText, Map, Target, AlertCircle, Briefcase, UserCheck, Search, Plus, X, UserPlus, User, LogOut, Bell, Home, Menu, Settings, ShieldCheck, Receipt, Package, CreditCard, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';
import CreateEventModal from '../components/agenda/CreateEventModal';
import EditProspectModal from '../components/prospects/EditProspectModal';
import ConvertToClientModal from '../components/clients/ConvertToClientModal';
import ProspectPickerModal from '../components/prospects/ProspectPickerModal';
import ContactModal from '../components/contacts/ContactModal';
import MobileMenuModal from '../components/MobileMenuModal';
import MobileBottomNav from '../components/MobileBottomNav';
import { VerticalSidebar } from '../components/VerticalSidebar';
import { CRMSubmoduleSidebar } from '../components/CRMSubmoduleSidebar';
import { HorizontalCRMNav } from '../components/HorizontalCRMNav';
import { HorizontalCotizadorNav } from '../components/cotizador/HorizontalCotizadorNav';
import { RightSidebarAgenda } from '../components/RightSidebarAgenda';
import { useCompanies } from '../hooks/useCompanies';
import { ConfirmModal } from '../components/ConfirmModal';
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
    { label: 'Nueva Oportunidad', icon: Briefcase, color: 'text-advanta-bronze bg-orange-50' },
];

const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { companies, createCompany } = useCompanies();
    const { user, logout } = useAuth();
    const { notifications } = useNotifications();

    // Local state for dismissed notifications (session only)
    const [dismissedIds, setDismissedIds] = useState([]);

    // Filter out dismissed notifications
    const visibleNotifications = notifications.filter(n => !dismissedIds.includes(n.id));
    const unreadCount = visibleNotifications.length;

    // Dismiss handler
    const dismissNotification = (id) => {
        setDismissedIds(prev => [...prev, id]);
    };

    // TEMPORARY: Add hardcoded test notification
    const testNotification = {
        id: 'test-hardcoded-1',
        type: 'test',
        priority: 'high',
        title: 'Notificación de Prueba',
        description: 'Si ves el botón X a la derecha, el sistema funciona correctamente',
        timestamp: new Date(),
        timeAgo: 'Ahora',
        icon: Bell,
        color: 'bg-blue-100 text-blue-600',
        action: '/dashboard',
        relatedId: 'test-1'
    };

    // Combine test notification with real ones
    const allNotifications = [testNotification, ...visibleNotifications];

    // Filter only prospects
    const prospects = companies.filter(c => c.company_type === 'prospect');

    // Check if we're on the dashboard
    const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';

    // Check if we're in CRM module (any CRM submodule)
    const crmPaths = ['/dashboard', '/prospectos', '/clientes', '/contactos', '/agenda', '/oportunidades', '/visitas', '/territorios', '/reclamos', '/ficha-360'];
    const isCRMActive = crmPaths.includes(location.pathname) || location.pathname === '/';

    // Check if we're in Cotizador module (any Cotizador submodule)
    const cotizadorPaths = ['/cotizador', '/cotizaciones', '/pedidos', '/comprobantes', '/cuenta-corriente', '/stock'];
    const isCotizadorActive = cotizadorPaths.includes(location.pathname);

    // Determine current context for mobile menu
    const currentContext = isCotizadorActive ? 'cotizador' : 'crm';

    // ========== MOBILE STATE (Separate) ==========
    const [mobileNavMenuOpen, setMobileNavMenuOpen] = useState(false);

    // ========== DESKTOP STATE (Separate) ==========
    const [desktopActionMenuOpen, setDesktopActionMenuOpen] = useState(false);
    const [mainSidebarExpanded, setMainSidebarExpanded] = useState(false);
    const desktopMenuRef = useRef(null);

    // ========== NOTIFICATIONS STATE ==========
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
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

    // TEMPORARY: Clear dismissed notifications for testing
    useEffect(() => {
        localStorage.removeItem('dismissedNotifications');
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
                    <header className="sticky top-0 z-[60] bg-gradient-to-r from-white via-red-50 to-green-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-red-200 dark:border-slate-700 shadow-md">
                        <div className="flex items-center justify-between h-16 px-4">
                            {/* Logo SAILO - Clickable to Home */}
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                            >
                                <img src="/logo-advanta.png" alt="Advanta" className="w-9 h-9 object-contain drop-shadow-sm" />
                            </button>

                            {/* Right Actions */}
                            <div className="flex items-center gap-2">
                                {/* Agenda Button */}
                                <button
                                    onClick={() => navigate('/agenda')}
                                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-advanta-bronze dark:hover:text-advanta-orange transition-colors"
                                >
                                    <Calendar size={20} />
                                </button>

                                {/* Notifications Button */}
                                <button
                                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                                    className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-advanta-bronze dark:hover:text-advanta-orange transition-colors"
                                >
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-advanta-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>


                                {/* Logout Button */}
                                <button onClick={handleLogout} className="p-2 text-slate-600 dark:text-slate-400 hover:text-advanta-bronze dark:hover:text-advanta-orange transition-colors">
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
                            className="fixed top-16 right-4 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] xl:top-20"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-slate-200 bg-slate-50">
                                <h3 className="font-bold text-slate-800">Notificaciones</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Mantente al día con tu CRM</p>
                            </div>

                            {/* Notifications List - Dynamic */}
                            <div className="max-h-96 overflow-y-auto">
                                {allNotifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500">No hay notificaciones</p>
                                        <p className="text-xs text-slate-400 mt-1">Estás al día con todo</p>
                                    </div>
                                ) : (
                                    allNotifications.map(notification => {
                                        const IconComponent = notification.icon;
                                        return (
                                            <div
                                                key={notification.id}
                                                className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors flex gap-3 items-start"
                                            >
                                                <div
                                                    onClick={() => {
                                                        navigate(notification.action);
                                                        setNotificationsOpen(false);
                                                    }}
                                                    className="flex gap-3 cursor-pointer items-start flex-1"
                                                >
                                                    <div className={`w-10 h-10 rounded-lg ${notification.color} flex items-center justify-center flex-shrink-0`}>
                                                        <IconComponent className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1">
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
                                                {/* Dismiss Button - Clean and Visible */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        dismissNotification(notification.id);
                                                    }}
                                                    className="w-7 h-7 rounded-full bg-slate-200 hover:bg-red-100 flex items-center justify-center text-slate-600 hover:text-red-600 transition-all flex-shrink-0 group"
                                                    title="Descartar"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-3 border-t border-slate-200 bg-slate-50">
                                <button className="w-full text-center text-sm font-semibold text-advanta-bronze hover:text-advanta-orange transition-colors">
                                    Ver todas las notificaciones
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Floating Action Buttons - Top Right (Desktop Only) */}
                <div className="hidden xl:flex absolute top-20 right-4 z-50 items-center gap-2">
                    <button
                        onClick={() => navigate('/agenda')}
                        className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-md border border-slate-200 dark:border-slate-600 hover:scale-105"
                        title="Ir a Agenda"
                    >
                        <Calendar size={20} />
                    </button>
                    <button
                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                        className="relative w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-md border border-slate-200 dark:border-slate-600 hover:scale-105"
                        title="Notificaciones"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                        )}
                    </button>
                    <button
                        onClick={() => setLogoutModalOpen(true)}
                        className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center hover:bg-red-500 dark:hover:bg-red-600 hover:text-white transition-all shadow-md border border-slate-200 dark:border-slate-600 hover:scale-105 group"
                        title="Cerrar Sesión"
                    >
                        <LogOut size={20} className="text-slate-700 dark:text-slate-200 group-hover:text-white" />
                    </button>
                </div>

                {/* Mobile Main Content */}
                <main className="flex-1 w-full overflow-y-auto pb-16">
                    <Outlet />
                </main>

                {/* Mobile Bottom Navigation */}
                <MobileBottomNav
                    currentContext={currentContext}
                    onQuickAction={(action) => {
                        if (action === 'menu') {
                            setMobileNavMenuOpen(true);
                        } else if (action === 'opportunity') {
                            handleGlobalCreateOpportunity();
                        } else if (action === 'prospect') {
                            handleGlobalCreateProspect();
                        } else if (action === 'client') {
                            handleGlobalCreateClient();
                        } else if (action === 'event') {
                            setIsCreateModalOpen(true);
                        } else if (action === 'convert') {
                            // TODO: Implement convert prospect action
                            console.log('Convert prospect action');
                        } else if (action === 'contact') {
                            // TODO: Implement create contact action
                            console.log('Create contact action');
                        } else if (action === 'visit') {
                            // TODO: Implement create visit action
                            console.log('Create visit action');
                        } else if (action === 'generate-invoice') {
                            // Navigate to Cotizaciones to select a won quote
                            navigate('/cotizaciones?filter=won');
                        } else if (action === 'add-stock') {
                            // Navigate to Stock page
                            navigate('/stock');
                        }
                    }}
                />

                {/* Navigation Menu - Context Aware */}
                <MobileMenuModal
                    isOpen={mobileNavMenuOpen}
                    onClose={() => setMobileNavMenuOpen(false)}
                    currentContext={currentContext}
                />
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
                                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-red-200 hover:shadow-lg transition-all active:scale-95"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#44C12B] to-[#4BA323] flex items-center justify-center mb-2 shadow-md">
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

                {/* Cotizador Horizontal Navigation - Above Content */}
                {isCotizadorActive && <HorizontalCotizadorNav isMainSidebarExpanded={mainSidebarExpanded} />}

                {/* Right Sidebar Agenda */}
                <RightSidebarAgenda isMainSidebarExpanded={mainSidebarExpanded} />

                {/* Desktop Main Content */}
                <main className={`min-h-screen transition-all duration-300 ${mainSidebarExpanded ? 'ml-72' : 'ml-20 xl:mr-70'}`}>
                    <Outlet />
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

            {/* Logout Confirmation Modal */}
            <ConfirmModal
                isOpen={logoutModalOpen}
                onClose={() => setLogoutModalOpen(false)}
                onConfirm={() => {
                    logout();
                    navigate('/login');
                }}
                title="Cerrar Sesión"
                message="¿Estás seguro que desés cerrar sesión?"
                confirmText="Cerrar Sesión"
                cancelText="Cancelar"
            />
        </div>
    );
};

export default MainLayout;
