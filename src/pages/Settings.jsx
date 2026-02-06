import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Moon, Sun, Clock, Palette, LogOut } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

const Settings = () => {
    const { theme, themeMode } = useTheme();
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        console.log('handleLogout called, setting showLogoutConfirm to true');
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        console.log('confirmLogout called');
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-40">
            {/* Header */}
            <div className="bg-gradient-to-br from-white via-red-50 to-red-100 dark:from-slate-800 dark:via-slate-900 dark:to-black px-4 pt-6 pb-8 border-b border-red-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center">
                        <SettingsIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200">Configuración</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Personaliza tu experiencia</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6 space-y-6">
                {/* Appearance Section */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        <Palette className="w-5 h-5 text-brand-red" />
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Apariencia</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 block">
                                Tema de la aplicación
                            </label>
                            <ThemeToggle />
                        </div>

                        {/* Current Theme Info */}
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Tema activo:</span>
                                <div className="flex items-center gap-2">
                                    {theme === 'dark' ? (
                                        <>
                                            <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Oscuro</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sun className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Claro</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            {themeMode === 'auto' && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    Modo automático: Oscuro de 20:00 a 06:00
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Account Section */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Cuenta</h2>

                    {user && (
                        <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Usuario actual:</p>
                            <p className="text-base font-bold text-slate-800 dark:text-slate-200">{user.email}</p>
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2 group touch-manipulation"
                    >
                        <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
                        Cerrar Sesión
                    </button>
                </div>

                {/* Info Section */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                    <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2">Acerca del tema</h3>
                    <p className="text-xs text-blue-800 dark:text-blue-400 leading-relaxed">
                        El modo oscuro reduce el brillo de la pantalla y puede ayudar a reducir la fatiga visual en entornos con poca luz.
                        El modo automático cambia entre claro y oscuro según la hora del día.
                    </p>
                </div>
            </div>

            {/* Logout Confirmation Dialog */}
            {showLogoutConfirm && (
                <ConfirmDialog
                    isOpen={showLogoutConfirm}
                    onClose={() => {
                        console.log('ConfirmDialog onClose called');
                        setShowLogoutConfirm(false);
                    }}
                    onConfirm={confirmLogout}
                    title="Cerrar sesión"
                    message="¿Estás seguro que deseas cerrar sesión?"
                    confirmText="Cerrar sesión"
                    cancelText="Cancelar"
                    variant="warning"
                />
            )}
        </div>
    );
};

export default Settings;
