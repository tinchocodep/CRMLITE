import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Users, UserCheck, Briefcase, Calendar, TrendingUp, Clock, MapPin, Phone, Mail, ChevronRight, Sparkles, Bell, LogOut, Map } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import EventCard from '../components/agenda/EventCard';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { useCompanies } from '../hooks/useCompanies';
import { useOpportunities } from '../hooks/useOpportunities';
import { useContacts } from '../hooks/useContacts';
import { useActivities } from '../hooks/useActivities';
import { useToast } from '../contexts/ToastContext';
import { useNotifications } from '../hooks/useNotifications';


const Dashboard = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const [headerVisible, setHeaderVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const notificationsRef = useRef(null);

    // Fetch real data from Supabase
    const { companies: allCompanies, loading: loadingCompanies } = useCompanies();
    const { opportunities, loading: loadingOpportunities } = useOpportunities();
    const { contacts, loading: loadingContacts } = useContacts();
    const { activities, loading: loadingActivities, updateActivity, deleteActivity } = useActivities(7); // Next 7 days
    const { showToast } = useToast();
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

    const testToast = () => {
        showToast({
            id: `test-${Date.now()}`,
            type: 'test',
            priority: 'high',
            title: '🎉 Toast Test',
            description: 'Si ves esto, el sistema de toasts funciona correctamente!',
            timestamp: new Date(),
            timeAgo: 'Ahora',
            icon: Bell,
            color: 'bg-blue-100 text-blue-600',
            action: '/dashboard'
        });
    };

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    // Handle scroll to hide/show header
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show header when scrolling up or at top
            if (currentScrollY < lastScrollY || currentScrollY < 10) {
                setHeaderVisible(true);
            }
            // Hide header when scrolling down and past threshold
            else if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setHeaderVisible(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Close notifications when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    // Calculate stats from real data
    const prospects = allCompanies.filter(c => c.company_type === 'prospect' && c.is_active);
    const clients = allCompanies.filter(c => c.company_type === 'client' && c.is_active);

    const stats = {
        prospects: prospects.length,
        contacts: contacts.length,
        opportunities: opportunities.filter(o => o.stage === 'negotiation' || o.stage === 'proposal').length,
        clients: clients.length
    };

    // Get upcoming events sorted by proximity to current time
    const now = new Date();
    const upcomingEvents = activities
        .filter(activity => {
            if (!activity.scheduled_date) return false;

            try {
                // Combine scheduled_date and scheduled_time
                const dateStr = activity.scheduled_date;
                const timeStr = activity.scheduled_time || '00:00';
                const eventDateTime = new Date(`${dateStr}T${timeStr}`);

                if (isNaN(eventDateTime.getTime())) return false;

                // Show activities from today onwards (including past activities from today)
                const todayStart = new Date(now);
                todayStart.setHours(0, 0, 0, 0);

                return eventDateTime >= todayStart;
            } catch {
                return false;
            }
        })
        .map(activity => {
            try {
                const dateStr = activity.scheduled_date;
                const timeStr = activity.scheduled_time || '00:00';
                const eventDateTime = new Date(`${dateStr}T${timeStr}`);

                return {
                    ...activity,
                    id: activity.id,
                    start: eventDateTime,
                    type: activity.activity_type,
                    title: activity.title,
                    description: activity.description,
                    // Calculate time difference in milliseconds for sorting
                    timeDiff: Math.abs(eventDateTime - now)
                };
            } catch {
                return {
                    ...activity,
                    id: activity.id,
                    start: new Date(),
                    type: activity.activity_type,
                    title: activity.title,
                    description: activity.description,
                    timeDiff: Infinity
                };
            }
        })
        .sort((a, b) => {
            // Sort by proximity to current time (closest first)
            return a.timeDiff - b.timeDiff;
        })
        .slice(0, 5); // Show only 5 closest activities

    const getEventTypeConfig = (type) => {
        const configs = {
            visit: { label: 'Visita', color: 'bg-amber-500', icon: MapPin },
            meeting: { label: 'Reunión', color: 'bg-blue-500', icon: Users },
            call: { label: 'Llamada', color: 'bg-purple-500', icon: Phone },
            email: { label: 'Email', color: 'bg-teal-500', icon: Mail },
            default: { label: 'Actividad', color: 'bg-slate-500', icon: Calendar }
        };
        return configs[type] || configs.default;
    };

    const getDateLabel = (date) => {
        // Validate date first
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
            return 'Fecha inválida';
        }

        // date is already a Date object
        if (isToday(date)) return 'Hoy';
        if (isTomorrow(date)) return 'Mañana';
        return format(date, "EEE d 'de' MMM", { locale: es });
    };

    // Safe format wrapper to prevent RangeError
    const safeFormat = (date, formatStr, options = {}) => {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
            return 'Fecha inválida';
        }
        return format(date, formatStr, options);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100
            }
        }
    };

    return (
        <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-40 px-4 md:px-8 pt-8 relative">

            {/* Floating Action Buttons - Top Right (inside content area) */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2 md:right-8">
                <button
                    onClick={() => navigate('/agenda')}
                    className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-md border border-slate-200 dark:border-slate-600 hover:scale-105"
                    title="Ir a Agenda"
                >
                    <Calendar className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                </button>
                <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-md border border-slate-200 dark:border-slate-600 hover:scale-105"
                    title="Notificaciones"
                >
                    <Bell className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                </button>
                <button
                    onClick={() => setLogoutModalOpen(true)}
                    className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center hover:bg-red-500 dark:hover:bg-red-600 hover:text-white transition-all shadow-md border border-slate-200 dark:border-slate-600 hover:scale-105 group"
                    title="Cerrar Sesión"
                >
                    <LogOut className="w-5 h-5 text-slate-700 dark:text-slate-200 group-hover:text-white" />
                </button>
            </div>

            {/* Dashboard Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-8"
            >
                <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 mb-2">
                    Dashboard
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                    {safeFormat(currentTime, "EEEE, d 'de' MMMM", { locale: es })}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {safeFormat(currentTime, "HH:mm")}
                </p>
            </motion.div>



            {/* Stats Grid - Compact Design */}
            <motion.div
                className="px-4 mt-2 relative z-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="grid grid-cols-4 gap-2 mb-4">
                    {/* Prospectos */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-[#17A2B8]/10 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 border border-[#17A2B8]/30 dark:border-purple-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="w-8 h-8 bg-[#17A2B8]/20 dark:bg-purple-600/40 rounded-lg flex items-center justify-center mb-2 mx-auto">
                            <UserCheck className="w-4 h-4 text-[#17A2B8] dark:text-purple-200" />
                        </div>
                        <div className="text-2xl font-black text-[#333333] dark:text-purple-100 text-center">{stats.prospects}</div>
                        <div className="text-[10px] font-semibold text-[#666666] dark:text-purple-300 text-center mt-1">Prospectos</div>
                    </motion.div>

                    {/* Contactos */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-[#87a330]/10 dark:from-teal-900 dark:via-teal-800 dark:to-teal-900 border border-[#87a330]/30 dark:border-teal-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="w-8 h-8 bg-[#87a330]/20 dark:bg-teal-600/40 rounded-lg flex items-center justify-center mb-2 mx-auto">
                            <Users className="w-4 h-4 text-[#87a330] dark:text-teal-200" />
                        </div>
                        <div className="text-2xl font-black text-[#333333] dark:text-teal-100 text-center">{stats.contacts}</div>
                        <div className="text-[10px] font-semibold text-[#666666] dark:text-teal-300 text-center mt-1">Contactos</div>
                    </motion.div>

                    {/* Oportunidades */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-[#FFC107]/10 dark:from-rose-900 dark:via-rose-800 dark:to-rose-900 border border-[#FFC107]/30 dark:border-rose-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="w-8 h-8 bg-[#FFC107]/20 dark:bg-rose-600/40 rounded-lg flex items-center justify-center mb-2 mx-auto">
                            <Briefcase className="w-4 h-4 text-[#FFC107] dark:text-rose-200" />
                        </div>
                        <div className="text-2xl font-black text-[#333333] dark:text-rose-100 text-center">{stats.opportunities}</div>
                        <div className="text-[10px] font-semibold text-[#666666] dark:text-rose-300 text-center mt-1">En Cierre</div>
                    </motion.div>

                    {/* Clientes */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-[#28A745]/10 dark:from-emerald-900 dark:via-emerald-800 dark:to-emerald-900 border border-[#28A745]/30 dark:border-emerald-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="w-8 h-8 bg-[#28A745]/20 dark:bg-emerald-600/40 rounded-lg flex items-center justify-center mb-2 mx-auto">
                            <Users className="w-4 h-4 text-[#28A745] dark:text-emerald-200" />
                        </div>
                        <div className="text-2xl font-black text-[#333333] dark:text-emerald-100 text-center">{stats.clients}</div>
                        <div className="text-[10px] font-semibold text-[#666666] dark:text-emerald-300 text-center mt-1">Clientes</div>
                    </motion.div>
                </div>

                {/* Agenda Summary */}
                <motion.div variants={itemVariants} className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#17A2B8] rounded-xl flex items-center justify-center shadow-sm">
                                <Calendar className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-[#333333] dark:text-slate-200">Próximas Actividades</h2>
                        </div>
                        <Link
                            to="/agenda"
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:gap-2 transition-all"
                        >
                            Ver todo
                            <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>

                    {upcomingEvents.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center shadow-sm border border-slate-100 dark:border-slate-700">
                            <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No hay actividades programadas</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">¡Tu agenda está libre!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingEvents.map((event, index) => {
                                const typeConfig = getEventTypeConfig(event.type);
                                const TypeIcon = typeConfig.icon;

                                return (
                                    <div key={event.id} className="w-full">
                                        <EventCard event={event} view="list" onUpdate={updateActivity} onDelete={deleteActivity} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Quick Insights */}
                <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-5 border border-indigo-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">Insights Rápidos</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-slate-700 dark:text-slate-300">
                                <span className="font-bold">{stats.prospects}</span> prospectos activos
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-slate-700 dark:text-slate-300">
                                <span className="font-bold">{stats.opportunities}</span> oportunidades en cierre
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-slate-700 dark:text-slate-300">
                                <span className="font-bold">{upcomingEvents.length}</span> actividades próximas
                            </span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Logout Confirmation Modal */}
            <ConfirmModal
                isOpen={logoutModalOpen}
                onClose={() => setLogoutModalOpen(false)}
                onConfirm={handleLogout}
                title="Cerrar Sesión"
                message="¿Estás seguro que deseas cerrar sesión? Tendrás que volver a iniciar sesión para acceder."
                confirmText="Cerrar Sesión"
                cancelText="Cancelar"
                type="danger"
            />
        </div>
    );
};

export default Dashboard;
