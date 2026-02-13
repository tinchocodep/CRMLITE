import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import sailoLogo from '/logo-advanta.svg';
import { ArrowRight, Lock, Mail, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();
    const { addNotification } = useNotifications();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    // Detect if mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'El email es requerido';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        if (!formData.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (formData.password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAuthError('');

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const result = await login(formData.email, formData.password, formData.rememberMe);

            if (result.success) {
                // Redirect to dashboard after successful login
                setTimeout(() => {
                    navigate('/dashboard', { replace: true });
                }, 100);
            } else {
                setAuthError(result.error || 'Error al iniciar sesión');
            }
        } catch (error) {
            setAuthError('Error al conectar con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        setAuthError('');
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-50 via-transparent to-transparent dark:from-orange-950/20 dark:via-transparent dark:to-transparent z-0" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-yellow-50 via-transparent to-transparent dark:from-yellow-950/20 dark:via-transparent dark:to-transparent z-0" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="container mx-auto px-4 z-10 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-24 min-h-screen py-8 lg:py-0"
            >

                {/* Left Side: Logo */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full lg:w-1/2 h-[200px] md:h-[300px] lg:h-[600px] flex items-center justify-center relative px-8"
                >
                    <img
                        src={sailoLogo}
                        alt="Advanta CRM"
                        className="w-full max-w-[380px] md:max-w-[480px] lg:max-w-[580px] h-auto object-contain drop-shadow-2xl"
                    />
                </motion.div>

                {/* Right Side: Login Form */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="w-full lg:w-[440px]"
                >
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl rounded-3xl p-6 md:p-10">
                        <div className="mb-8 text-center lg:text-left">
                            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-slate-100 dark:via-white dark:to-slate-100 bg-clip-text text-transparent mb-2">
                                Bienvenido
                            </h1>
                        </div>

                        {/* Auth Error Alert */}
                        {authError && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3"
                            >
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 dark:text-red-300">{authError}</p>
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                    Email
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail size={20} className={`transition-colors ${errors.email ? 'text-red-500' : 'text-slate-400 group-focus-within:text-advanta-bronze-dark dark:group-focus-within:text-advanta-orange'}`} />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="usuario@empresa.com"
                                        className={`w-full pl-12 pr-4 py-3.5 md:py-4 bg-slate-50 dark:bg-slate-800 border ${errors.email ? 'border-red-500 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl focus:outline-none focus:ring-2 ${errors.email ? 'focus:ring-red-500/20' : 'focus:ring-advanta-bronze-dark/20 dark:focus:ring-advanta-orange/20'} focus:border-advanta-bronze-dark dark:focus:border-advanta-orange transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 touch-manipulation`}
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.email && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-xs text-red-600 dark:text-red-400 ml-1 flex items-center gap-1"
                                    >
                                        <AlertCircle size={12} />
                                        {errors.email}
                                    </motion.p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                    Contraseña
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock size={20} className={`transition-colors ${errors.password ? 'text-red-500' : 'text-slate-400 group-focus-within:text-advanta-bronze-dark dark:group-focus-within:text-advanta-orange'}`} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className={`w-full pl-12 pr-12 py-3.5 md:py-4 bg-slate-50 dark:bg-slate-800 border ${errors.password ? 'border-red-500 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl focus:outline-none focus:ring-2 ${errors.password ? 'focus:ring-red-500/20' : 'focus:ring-advanta-bronze-dark/20 dark:focus:ring-advanta-orange/20'} focus:border-advanta-bronze-dark dark:focus:border-advanta-orange transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 touch-manipulation`}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors touch-manipulation"
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-xs text-red-600 dark:text-red-400 ml-1 flex items-center gap-1"
                                    >
                                        <AlertCircle size={12} />
                                        {errors.password}
                                    </motion.p>
                                )}
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        name="rememberMe"
                                        checked={formData.rememberMe}
                                        onChange={handleChange}
                                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-advanta-bronze-dark focus:ring-advanta-bronze-dark dark:focus:ring-advanta-orange bg-slate-50 dark:bg-slate-800 cursor-pointer touch-manipulation"
                                        disabled={isLoading}
                                    />
                                    <span className="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                                        Recordarme
                                    </span>
                                </label>
                                <a
                                    href="#"
                                    className="text-advanta-bronze-dark dark:text-advanta-orange hover:text-advanta-orange dark:hover:text-advanta-orange-light font-semibold transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        addNotification({
                                            id: `password-recovery-${Date.now()}`,
                                            title: 'ℹ️ Próximamente',
                                            description: 'La función de recuperación de contraseña estará disponible pronto',
                                            priority: 'medium',
                                            timeAgo: 'Ahora'
                                        });
                                    }}
                                >
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-advanta-green to-green-600 dark:from-advanta-green dark:to-green-500 hover:from-green-600 hover:to-green-700 dark:hover:from-green-500 dark:hover:to-green-600 text-white font-bold py-4 md:py-4.5 rounded-xl shadow-lg shadow-advanta-green/30 dark:shadow-advanta-green/30 hover:shadow-advanta-green/50 dark:hover:shadow-advanta-green/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-manipulation"
                                style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Iniciando sesión...
                                    </>
                                ) : (
                                    <>
                                        Ingresar
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Login;
