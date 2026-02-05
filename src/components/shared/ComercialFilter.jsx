import React from 'react';
import { Filter } from 'lucide-react';

/**
 * Componente de filtro por comercial para Admin y Supervisor
 * @param {Object} props
 * @param {Array} props.comerciales - Lista de comerciales disponibles
 * @param {string} props.selectedComercialId - ID del comercial seleccionado
 * @param {Function} props.onComercialChange - Callback cuando cambia la selección
 * @param {boolean} props.showAllOption - Si mostrar la opción "Todos" (solo admin)
 * @param {boolean} props.loading - Estado de carga
 */
export function ComercialFilter({
    comerciales = [],
    selectedComercialId = 'all',
    onComercialChange,
    showAllOption = false,
    loading = false
}) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Filter size={16} className="flex-shrink-0" />
                <span className="text-xs font-bold uppercase whitespace-nowrap">Comercial:</span>
            </div>
            <select
                value={selectedComercialId}
                onChange={(e) => onComercialChange(e.target.value)}
                disabled={loading}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-brand-red/20 outline-none min-w-[150px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {showAllOption && <option value="all">Todos los comerciales</option>}
                {comerciales.map(comercial => (
                    <option key={comercial.id} value={comercial.id}>
                        {comercial.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
