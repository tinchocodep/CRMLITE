import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Users, UserCheck, Briefcase, Calendar, TrendingUp, Clock, MapPin, Phone, Mail, ChevronRight, Sparkles, Bell, LogOut } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { mockProspects } from '../data/mockProspects';
import { mockClients } from '../data/mockClients';
import { mockContacts } from '../data/mockContacts';
import { mockEvents } from '../data/mockAgenda';
import EventCard from '../components/agenda/EventCard';
import { useAuth } from '../contexts/AuthContext';


const Dashboard = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());

    const handleLogout = () => {
        if (window.confirm('¿Estás seguro que deseas cerrar sesión?')) {
            logout();
            navigate('/login', { replace: true });
        }
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Calculate stats
    const stats = {
        prospects: mockProspects.filter(p => p.isActive !== false).length,
        contacts: mockContacts.length,
        opportunities: mockProspects.filter(p => p.status === 'near_closing').length,
        clients: mockClients.filter(c => c.isActive !== false).length
    };

    // Get upcoming events (next 7 days)
    const upcomingEvents = mockEvents
        .filter(event => {
            const eventDate = event.start; // start is already a Date object
            const today = new Date();
            const weekFromNow = new Date();
            weekFromNow.setDate(today.getDate() + 7);
            return eventDate >= today && eventDate <= weekFromNow;
        })
        .sort((a, b) => a.start - b.start)
        .slice(0, 5);

    const getEventTypeConfig = (type) => {
        const configs = {
            visit: { label: 'Visita', color: 'bg-amber-500', icon: MapPin },
            meeting: { label: 'Reunión', color: 'bg-blue-500', icon: Users },
            call: { label: 'Llamada', color: 'bg-purple-500', icon: Phone },
            email: { label: 'Email', color: 'bg-teal-500', icon: Mail },
            default: { label: 'Evento', color: 'bg-slate-500', icon: Calendar }
        };
        return configs[type] || configs.default;
    };

    const getDateLabel = (date) => {
        // date is already a Date object
        if (isToday(date)) return 'Hoy';
        if (isTomorrow(date)) return 'Mañana';
        return format(date, "EEE d 'de' MMM", { locale: es });
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-24">
            {/* Custom Curved Header - Only for Dashboard */}
            <div className="relative bg-gradient-to-br from-white via-red-50 to-red-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-800 dark:text-slate-100 px-4 pt-4 pb-16 overflow-hidden">
                {/* Decorative curves */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-100/30 dark:bg-red-500/5 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-red-200/20 dark:bg-purple-500/5 rounded-full blur-3xl"></div>
                </div>

                {/* Floating Logo - Left */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', duration: 0.8 }}
                    className="absolute left-4 top-4 z-10"
                >
                    <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center transform hover:scale-110 transition-transform border border-red-100 dark:border-slate-700">
                        <img src="/logo.png" alt="SAILO" className="w-9 h-9 object-contain" />
                    </div>
                </motion.div>

                {/* Action Buttons - Right */}
                <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate('/agenda');
                        }}
                        onTouchStart={(e) => {
                            e.stopPropagation();
                        }}
                        className="w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-all shadow-lg border border-red-100 dark:border-slate-600 hover:scale-105 active:scale-95 cursor-pointer touch-manipulation"
                        title="Ir a Agenda"
                        type="button"
                        aria-label="Ir a Agenda"
                    >
                        <Calendar className="w-5 h-5 text-slate-700 dark:text-slate-200 pointer-events-none" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            alert('Notificaciones: Esta función estará disponible próximamente');
                        }}
                        onTouchStart={(e) => {
                            e.stopPropagation();
                        }}
                        className="relative w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-all shadow-lg border border-red-100 dark:border-slate-600 hover:scale-105 active:scale-95 cursor-pointer touch-manipulation"
                        title="Notificaciones"
                        type="button"
                        aria-label="Notificaciones"
                    >
                        <Bell className="w-5 h-5 text-slate-700 dark:text-slate-200 pointer-events-none" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse pointer-events-none"></span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleLogout();
                        }}
                        onTouchStart={(e) => {
                            e.stopPropagation();
                        }}
                        className="w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-red-500 dark:hover:bg-red-600 hover:text-white transition-all shadow-lg border border-red-100 dark:border-slate-600 hover:scale-105 active:scale-95 group cursor-pointer touch-manipulation"
                        title="Cerrar Sesión"
                        type="button"
                        aria-label="Cerrar Sesión"
                    >
                        <LogOut className="w-5 h-5 text-slate-700 dark:text-slate-200 group-hover:text-white pointer-events-none" />
                    </button>
                </div>

                {/* Center Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="relative z-10 text-center pt-12"
                >
                    {/* Brand Name */}
                    <div className="mb-1">
                        <h1 className="text-base font-black tracking-tight leading-none">
                            <span className="text-blue-900 dark:text-blue-300">SaiLO CRM</span>
                            <span className="text-brand-red dark:text-red-400 text-[10px] ml-1 font-bold">Lite</span>
                        </h1>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide uppercase mt-0.5">Mobile</p>
                    </div>

                    {/* Dashboard Title */}
                    <div className="mb-3">
                        <h2 className="text-3xl font-black bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 dark:from-slate-100 dark:via-white dark:to-slate-100 bg-clip-text text-transparent">
                            Dashboard
                        </h2>
                        <div className="flex items-center justify-center gap-1 mt-1">
                            <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-brand-red dark:via-red-400 to-transparent rounded-full"></div>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {format(currentTime, "EEEE, d 'de' MMMM", { locale: es })}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {format(currentTime, "HH:mm")}
                    </p>
                </motion.div>

                {/* Bottom Curve */}
                <div className="absolute bottom-0 left-0 right-0 z-0">
                    <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                        <path d="M0 0C240 60 480 80 720 80C960 80 1200 60 1440 0V80H0V0Z" fill="rgb(248, 250, 252)" className="dark:fill-slate-900" />
                    </svg>
                </div>
            </div>

            {/* Stats Grid */}
            <motion.div
                className="px-4 -mt-4 relative z-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {/* Prospectos */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-gradient-to-br from-purple-300 via-purple-200 to-purple-100 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 border border-purple-300 dark:border-purple-700 rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 bg-purple-400/40 dark:bg-purple-600/40 rounded-xl flex items-center justify-center">
                                <UserCheck className="w-5 h-5 text-purple-800 dark:text-purple-200" />
                            </div>
                            <div className="flex items-center gap-1 bg-purple-400/40 dark:bg-purple-600/40 px-2 py-1 rounded-full">
                                <TrendingUp className="w-3 h-3 text-purple-800 dark:text-purple-200" />
                                <span className="text-[10px] font-bold text-purple-800 dark:text-purple-200">+12%</span>
                            </div>
                        </div>
                        <div className="text-3xl font-black text-purple-900 dark:text-purple-100 mb-1">{stats.prospects}</div>
                        <div className="text-xs font-semibold text-purple-800 dark:text-purple-300">Prospectos</div>
                    </motion.div>

                    {/* Contactos */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-gradient-to-br from-teal-300 via-teal-200 to-teal-100 dark:from-teal-900 dark:via-teal-800 dark:to-teal-900 border border-teal-300 dark:border-teal-700 rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 bg-teal-400/40 dark:bg-teal-600/40 rounded-xl flex items-center justify-center">
                                <Users className="w-5 h-5 text-teal-800 dark:text-teal-200" />
                            </div>
                            <div className="flex items-center gap-1 bg-teal-400/40 dark:bg-teal-600/40 px-2 py-1 rounded-full">
                                <TrendingUp className="w-3 h-3 text-teal-800 dark:text-teal-200" />
                                <span className="text-[10px] font-bold text-teal-800 dark:text-teal-200">+8%</span>
                            </div>
                        </div>
                        <div className="text-3xl font-black text-teal-900 dark:text-teal-100 mb-1">{stats.contacts}</div>
                        <div className="text-xs font-semibold text-teal-800 dark:text-teal-300">Contactos</div>
                    </motion.div>

                    {/* Oportunidades */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-gradient-to-br from-rose-300 via-rose-200 to-rose-100 dark:from-rose-900 dark:via-rose-800 dark:to-rose-900 border border-rose-300 dark:border-rose-700 rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 bg-rose-400/40 dark:bg-rose-600/40 rounded-xl flex items-center justify-center">
                                <Briefcase className="w-5 h-5 text-rose-800 dark:text-rose-200" />
                            </div>
                            <div className="flex items-center gap-1 bg-rose-400/40 dark:bg-rose-600/40 px-2 py-1 rounded-full">
                                <TrendingUp className="w-3 h-3 text-rose-800 dark:text-rose-200" />
                                <span className="text-[10px] font-bold text-rose-800 dark:text-rose-200">+5%</span>
                            </div>
                        </div>
                        <div className="text-3xl font-black text-rose-900 dark:text-rose-100 mb-1">{stats.opportunities}</div>
                        <div className="text-xs font-semibold text-rose-800 dark:text-rose-300">En Cierre</div>
                    </motion.div>

                    {/* Clientes */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-gradient-to-br from-emerald-300 via-emerald-200 to-emerald-100 dark:from-emerald-900 dark:via-emerald-800 dark:to-emerald-900 border border-emerald-300 dark:border-emerald-700 rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 bg-emerald-400/40 dark:bg-emerald-600/40 rounded-xl flex items-center justify-center">
                                <Users className="w-5 h-5 text-emerald-800 dark:text-emerald-200" />
                            </div>
                            <div className="flex items-center gap-1 bg-emerald-400/40 dark:bg-emerald-600/40 px-2 py-1 rounded-full">
                                <TrendingUp className="w-3 h-3 text-emerald-800 dark:text-emerald-200" />
                                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-200">+15%</span>
                            </div>
                        </div>
                        <div className="text-3xl font-black text-emerald-900 dark:text-emerald-100 mb-1">{stats.clients}</div>
                        <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Clientes</div>
                    </motion.div>
                </div>

                {/* Agenda Summary */}
                <motion.div variants={itemVariants} className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                                <Calendar className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Próximas Actividades</h2>
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
                                        <EventCard event={event} view="list" />
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
        </div>
    );
};

export default Dashboard;
