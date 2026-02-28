import React, { useState, useEffect } from 'react';
import { User, Users, AlertCircle, Plus, X, Check, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrentTenant } from '../../hooks/useCurrentTenant';
import useBusinessUnits from '../../hooks/useBusinessUnits';

/**
 * ComercialSelector v2 — Dual mode: Individual / Business Unit
 * Admin: can toggle between single comercial and business unit assignment
 * Non-admin: auto-assigns to their comercial_id (unchanged behavior)
 *
 * Props:
 *   value              - current comercial_id (single mode)
 *   businessUnitValue  - current business_unit_id (unit mode)
 *   onChange           - (comercialId, businessUnitId) => void
 *   required           - boolean
 *   label              - string
 *   className          - string
 */
const ComercialSelector = ({
    value,
    businessUnitValue,
    onChange,
    required = true,
    label = "Asignar a Comercial",
    className = ""
}) => {
    const { isAdmin, comercialId } = useAuth();
    const { tenantId } = useCurrentTenant();
    const { units, loading: unitsLoading, createUnit, deleteUnit } = useBusinessUnits();

    const [comerciales, setComerciales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dual mode state
    const [mode, setMode] = useState('individual'); // 'individual' | 'unit'
    const [showCreateUnit, setShowCreateUnit] = useState(false);
    const [newUnitName, setNewUnitName] = useState('');
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [createError, setCreateError] = useState('');
    const [expandedUnitId, setExpandedUnitId] = useState(null);

    // Initialize mode from existing values
    useEffect(() => {
        if (businessUnitValue) {
            setMode('unit');
        } else {
            setMode('individual');
        }
    }, [businessUnitValue]);

    useEffect(() => {
        if (!isAdmin) {
            if (comercialId) {
                onChange(comercialId, null);
            }
            setLoading(false);
            return;
        }
        fetchComerciales();
    }, [isAdmin, comercialId, tenantId]);

    const fetchComerciales = async () => {
        try {
            setLoading(true);
            setError(null);
            if (!tenantId) {
                setLoading(false);
                return;
            }

            const { data, error: fetchError } = await supabase
                .from('comerciales')
                .select('id, name, email')
                .eq('tenant_id', tenantId)
                .eq('is_active', true)
                .order('name');

            if (fetchError) throw fetchError;
            setComerciales(data || []);

            if (data && data.length === 1 && !value && !businessUnitValue) {
                onChange(data[0].id, null);
            }
        } catch (err) {
            console.error('Error fetching comerciales:', err);
            setError('Error al cargar comerciales');
        } finally {
            setLoading(false);
        }
    };

    // Handle mode switch
    const handleModeSwitch = (newMode) => {
        setMode(newMode);
        setShowCreateUnit(false);
        setCreateError('');
        if (newMode === 'individual') {
            onChange(value || null, null);
        } else {
            onChange(null, businessUnitValue || null);
        }
    };

    // Handle single comercial selection
    const handleSingleSelect = (selectedId) => {
        onChange(selectedId || null, null);
    };

    // Handle business unit selection
    const handleUnitSelect = (unitId) => {
        onChange(null, unitId ? parseInt(unitId, 10) : null);
    };

    // Toggle member for new unit creation
    const toggleMember = (comercialId) => {
        setSelectedMemberIds(prev =>
            prev.includes(comercialId)
                ? prev.filter(id => id !== comercialId)
                : [...prev, comercialId]
        );
    };

    // Create new business unit
    const handleCreateUnit = async () => {
        setCreateError('');
        if (!newUnitName.trim()) {
            setCreateError('El nombre es requerido');
            return;
        }
        if (selectedMemberIds.length < 2) {
            setCreateError('Seleccioná al menos 2 comerciales');
            return;
        }

        try {
            const unit = await createUnit(newUnitName, selectedMemberIds);
            // Auto-select the new unit
            onChange(null, unit.id);
            setShowCreateUnit(false);
            setNewUnitName('');
            setSelectedMemberIds([]);
        } catch (err) {
            setCreateError(err.message || 'Error al crear la unidad');
        }
    };

    // Handle unit deletion
    const handleDeleteUnit = async (unitId, e) => {
        e.stopPropagation();
        if (!confirm('¿Eliminar esta unidad de negocio? Las empresas asignadas quedarán sin asignar.')) return;
        try {
            await deleteUnit(unitId);
            if (businessUnitValue === unitId) {
                onChange(null, null);
            }
        } catch (err) {
            console.error('Error deleting unit:', err);
        }
    };

    // ── Non-admin: read-only ──
    if (!isAdmin) {
        if (loading) {
            return (
                <div className={`space-y-2 ${className}`}>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl">
                        <div className="w-4 h-4 border-2 border-advanta-green border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-slate-500 dark:text-slate-400">Cargando...</span>
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
                    <div className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300">
                        Asignado automáticamente a tu comercial
                    </div>
                </div>
            </div>
        );
    }

    // ── Loading / Error states ──
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

    // ── Admin: dual mode selector ──
    return (
        <div className={`space-y-3 ${className}`}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            {/* Mode Toggle */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-700 p-1 gap-1">
                <button
                    type="button"
                    onClick={() => handleModeSwitch('individual')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${mode === 'individual'
                        ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                >
                    <User size={14} /> Comercial Individual
                </button>
                <button
                    type="button"
                    onClick={() => handleModeSwitch('unit')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${mode === 'unit'
                        ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                >
                    <Users size={14} /> Unidad de Negocio
                </button>
            </div>

            {/* Individual Mode */}
            {mode === 'individual' && (
                <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <select
                        value={value || ''}
                        onChange={(e) => handleSingleSelect(e.target.value || null)}
                        required={required && mode === 'individual'}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-advanta-green text-slate-800 dark:text-white appearance-none cursor-pointer"
                    >
                        <option value="">Seleccionar comercial...</option>
                        {comerciales.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name} {c.email ? `(${c.email})` : ''}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    </div>
                </div>
            )}

            {/* Unit Mode */}
            {mode === 'unit' && (
                <div className="space-y-2">
                    {/* Existing Units List */}
                    {!unitsLoading && units.length > 0 && (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {units.map(unit => (
                                <div key={unit.id}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleUnitSelect(unit.id);
                                            setExpandedUnitId(expandedUnitId === unit.id ? null : unit.id);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left text-sm transition-all ${businessUnitValue === unit.id
                                            ? 'border-advanta-green bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                                            : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            {businessUnitValue === unit.id && <Check size={14} className="text-advanta-green flex-shrink-0" />}
                                            <Users size={14} className="text-slate-400 flex-shrink-0" />
                                            <span className="font-semibold truncate">{unit.name}</span>
                                            <span className="text-xs text-slate-400 flex-shrink-0">
                                                ({unit.members?.length || 0})
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteUnit(unit.id, e)}
                                                className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={12} className="text-red-400" />
                                            </button>
                                            {expandedUnitId === unit.id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                                        </div>
                                    </button>
                                    {/* Expanded: show members */}
                                    {expandedUnitId === unit.id && unit.members?.length > 0 && (
                                        <div className="ml-6 mt-1 space-y-1">
                                            {unit.members.map(m => (
                                                <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                    <User size={12} />
                                                    <span className="font-medium">{m.name}</span>
                                                    {m.email && <span className="text-slate-400">({m.email})</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {!unitsLoading && units.length === 0 && !showCreateUnit && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 py-2 text-center">
                            No hay unidades de negocio creadas
                        </p>
                    )}

                    {/* Create New Unit */}
                    {!showCreateUnit ? (
                        <button
                            type="button"
                            onClick={() => setShowCreateUnit(true)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-500 hover:border-advanta-green hover:text-advanta-green transition-colors"
                        >
                            <Plus size={16} /> Crear nueva unidad
                        </button>
                    ) : (
                        <div className="border border-slate-200 dark:border-slate-600 rounded-xl p-4 bg-slate-50 dark:bg-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Nueva Unidad de Negocio
                                </h5>
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateUnit(false); setCreateError(''); setSelectedMemberIds([]); setNewUnitName(''); }}
                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                                >
                                    <X size={14} className="text-slate-400" />
                                </button>
                            </div>

                            <input
                                type="text"
                                value={newUnitName}
                                onChange={(e) => setNewUnitName(e.target.value)}
                                placeholder="Nombre (ej: Equipo GR)"
                                className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-advanta-green"
                            />

                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                                    Seleccionar comerciales ({selectedMemberIds.length} seleccionados)
                                </p>
                                {comerciales.map(c => (
                                    <label
                                        key={c.id}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedMemberIds.includes(c.id)
                                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                            : 'bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedMemberIds.includes(c.id)}
                                            onChange={() => toggleMember(c.id)}
                                            className="w-4 h-4 rounded border-slate-300 text-advanta-green focus:ring-advanta-green accent-emerald-600"
                                        />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{c.name}</span>
                                        {c.email && <span className="text-xs text-slate-400">{c.email}</span>}
                                    </label>
                                ))}
                            </div>

                            {createError && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle size={12} /> {createError}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={handleCreateUnit}
                                disabled={!newUnitName.trim() || selectedMemberIds.length < 2}
                                className="w-full py-2.5 bg-brand text-white font-bold text-sm rounded-xl shadow-lg shadow-advanta-green/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                <Plus size={14} /> Crear Unidad "{newUnitName || '...'}"
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Selection Summary */}
            {mode === 'individual' && value && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Los datos se asignarán a este comercial
                </p>
            )}
            {mode === 'unit' && businessUnitValue && (
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    ✅ Asignado a unidad de negocio — todos los miembros verán este cliente
                </p>
            )}
        </div>
    );
};

export default ComercialSelector;
