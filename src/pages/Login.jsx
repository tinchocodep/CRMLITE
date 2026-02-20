import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenantBranding } from '../contexts/TenantBrandingContext';
import { ArrowRight, Lock, Mail, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();
    const { branding, isLoading: brandingLoading } = useTenantBranding();

    const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    useEffect(() => {
        if (isAuthenticated) {
            navigate(isMobile ? '/dashboard' : '/ficha-360', { replace: true });
        }
    }, [isAuthenticated, navigate, isMobile]);

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email) newErrors.email = 'El email es requerido';
        else if (!validateEmail(formData.email)) newErrors.email = 'Email inválido';
        if (!formData.password) newErrors.password = 'La contraseña es requerida';
        else if (formData.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAuthError('');
        if (!validateForm()) return;
        setIsLoading(true);
        try {
            const result = await login(formData.email, formData.password, formData.rememberMe);
            if (result.success) {
                setTimeout(() => navigate(isMobile ? '/dashboard' : '/ficha-360', { replace: true }), 100);
            } else {
                setAuthError(result.error || 'Error al iniciar sesión');
            }
        } catch {
            setAuthError('Error al conectar con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        setAuthError('');
    };

    // Mientras carga el branding, mostramos un fondo neutro para evitar flash
    if (brandingLoading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-slate-100">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: branding.primaryColor }}
        >
            {/* Decoración de fondo — círculos sutiles */}
            <div
                className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20"
                style={{ background: `radial-gradient(circle, ${branding.secondaryColor}, transparent)` }}
            />
            <div
                className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-15"
                style={{ background: `radial-gradient(circle, ${branding.secondaryColor}, transparent)` }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="container mx-auto px-4 z-10 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-24 min-h-screen py-8 lg:py-0"
            >
                {/* Left Side: Logo del tenant */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full lg:w-1/2 h-[200px] md:h-[300px] lg:h-[600px] flex items-center justify-center"
                >
                    {branding.logoUrl ? (
                        <img
                            src={branding.logoUrl}
                            alt={branding.appName}
                            className="w-full max-w-[320px] md:max-w-[440px] lg:max-w-[520px] h-auto object-contain drop-shadow-2xl"
                            onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                        />
                    ) : (
                        <span className="text-5xl font-black text-white/80">{branding.appName}</span>
                    )}
                </motion.div>

                {/* Right Side: Login Form */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="w-full lg:w-[440px]"
                >
                    <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-6 md:p-10">
                        <div className="mb-8">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1">
                                Bienvenido
                            </h1>
                            <p className="text-sm font-semibold" style={{ color: branding.primaryColor }}>
                                {branding.appName} CRM
                            </p>
                        </div>

                        {authError && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
                            >
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{authError}</p>
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail size={20} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="usuario@empresa.com"
                                        className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border ${errors.email ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-900 placeholder:text-slate-400 touch-manipulation`}
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-xs text-red-600 ml-1 flex items-center gap-1">
                                        <AlertCircle size={12} />{errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Contraseña</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock size={20} className="text-slate-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 border ${errors.password ? 'border-red-400' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-900 placeholder:text-slate-400 touch-manipulation`}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-red-600 ml-1 flex items-center gap-1">
                                        <AlertCircle size={12} />{errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="rememberMe"
                                        checked={formData.rememberMe}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        className="w-4 h-4 rounded border-slate-300 cursor-pointer touch-manipulation"
                                    />
                                    <span className="text-slate-600">Recordarme</span>
                                </label>
                                <a
                                    href="#"
                                    style={{ color: branding.primaryColor }}
                                    className="font-semibold hover:opacity-75 transition-opacity"
                                    onClick={(e) => { e.preventDefault(); alert('Función de recuperación próximamente'); }}
                                >
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                style={{ background: `linear-gradient(to right, ${branding.primaryColor}, ${branding.secondaryColor})` }}
                                className="w-full text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-manipulation"
                            >
                                {isLoading ? (
                                    <><Loader2 size={20} className="animate-spin" />Iniciando sesión...</>
                                ) : (
                                    <><span>Ingresar</span><ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
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
