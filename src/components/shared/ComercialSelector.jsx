import React, { useState, useEffect } from 'react';
import { User, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Componente para seleccionar un comercial
 * Solo visible para Admins
 * Para Supervisores y Comerciales, usa automáticamente su comercial_id
 */
const ComercialSelector = ({
    value,
    onChange,
    required = true,
    label = "Asignar a Comercial",
    className = ""
}) => {
    const { isAdmin, isSupervisor, comercialId } = useAuth();
    const [comerciales, setComerciales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Si no es Admin, usar automáticamente el comercial_id del usuario
        if (!isAdmin) {
            if (comercialId) {
                onChange(comercialId);
            }
            setLoading(false);
            return;
        }

        // Si es Admin, cargar lista de comerciales
        fetchComerciales();
    }, [isAdmin, comercialId]);

    const fetchComerciales = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('comerciales')
                .select('id, name, email')
                .eq('is_active', true)
                .order('name');

            if (fetchError) throw fetchError;

            setComerciales(data || []);

            // Si solo hay un comercial, seleccionarlo automáticamente
            if (data && data.length === 1 && !value) {
                onChange(data[0].id);
            }
        } catch (err) {
            console.error('Error fetching comerciales:', err);
            setError('Error al cargar comerciales');
        } finally {
            setLoading(false);
        }
    };

    // Si no es Admin, no mostrar el selector (se asigna automáticamente)
    if (!isAdmin) {
        return null;
    }

    if (loading) {
        return (
            <div className={`space-y-2 ${className}`}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl">
                    <div className="w-4 h-4 border-2 border-advanta-green border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">Cargando comerciales...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`space-y-2 ${className}`}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                </div>
            </div>
        );
    }

    if (comerciales.length === 0) {
        return (
            <div className={`space-y-2 ${className}`}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600 dark:text-yellow-400">
                        No hay comerciales activos disponibles
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <select
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
                    required={required}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-advanta-green text-slate-800 dark:text-white appearance-none cursor-pointer"
                >
                    <option value="">Seleccionar comercial...</option>
                    {comerciales.map((comercial) => (
                        <option key={comercial.id} value={comercial.id}>
                            {comercial.name} {comercial.email ? `(${comercial.email})` : ''}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            {value && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Los datos se asignarán a este comercial
                </p>
            )}
        </div>
    );
};

export default ComercialSelector;
