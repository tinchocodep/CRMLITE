import React, { useState, useRef } from 'react';
import { X, Minus, AlertCircle, Package, Warehouse, Save, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { egressStockProduct } from '../../services/stockService';
import { useWarehouses } from '../../hooks/useWarehouses';

// ─── Sub-componente: selector de depósito con autocomplete + guardar ───────────
const WarehouseInput = ({ label, value, onChange, savedWarehouses, placeholder, error, onSave }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const inputRef = useRef(null);

    const filtered = savedWarehouses.filter(w =>
        w.name.toLowerCase().includes(value.toLowerCase()) && w.name.toLowerCase() !== value.toLowerCase()
    );

    const handleSave = async () => {
        if (!value.trim()) return;
        setSaveStatus('saving');
        const result = await onSave(value);
        setSaveStatus(result.success ? 'saved' : 'error');
        setTimeout(() => setSaveStatus(null), 2500);
    };

    const alreadySaved = savedWarehouses.some(w => w.name.toLowerCase() === value.trim().toLowerCase());

    return (
        <div className="relative">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {label} *
            </label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={e => { onChange(e.target.value); setShowSuggestions(true); }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        placeholder={placeholder}
                        className={`w-full px-3 py-2 rounded-lg border ${error
                            ? 'border-red-300 focus:ring-red-400'
                            : 'border-blue-200 dark:border-blue-700 focus:ring-blue-400'
                            } bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:border-transparent outline-none`}
                    />
                    <AnimatePresence>
                        {showSuggestions && filtered.length > 0 && (
                            <motion.ul
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="absolute top-full left-0 right-0 z-30 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-40 overflow-y-auto"
                            >
                                {filtered.map(w => (
                                    <li
                                        key={w.id}
                                        onMouseDown={() => { onChange(w.name); setShowSuggestions(false); }}
                                        className="px-3 py-2 text-sm text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2"
                                    >
                                        <Warehouse className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                        {w.name}
                                    </li>
                                ))}
                            </motion.ul>
                        )}
                    </AnimatePresence>
                </div>
                {value.trim() && !alreadySaved && (
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saveStatus === 'saving'}
                        title="Guardar este depósito para usarlo en el futuro"
                        className={`flex-shrink-0 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border ${saveStatus === 'saved'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : saveStatus === 'error'
                                ? 'bg-red-50 border-red-300 text-red-600'
                                : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                            } disabled:opacity-60`}
                    >
                        {saveStatus === 'saved' ? (
                            <><Check className="w-3.5 h-3.5" /> Guardado</>
                        ) : saveStatus === 'error' ? (
                            <><AlertCircle className="w-3.5 h-3.5" /> Error</>
                        ) : (
                            <><Save className="w-3.5 h-3.5" /> Guardar</>
                        )}
                    </button>
                )}
                {alreadySaved && value.trim() && (
                    <span className="flex-shrink-0 px-2.5 py-2 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Guardado
                    </span>
                )}
            </div>
            {error && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {error}
                </p>
            )}
        </div>
    );
};

// ─── Motivos de egreso ─────────────────────────────────────────────────────────
const EGRESS_REASONS = [
    { value: 'sale', label: '🛒 Venta' },
    { value: 'adjustment', label: '🔧 Ajuste de inventario' },
    { value: 'loss', label: '⚠️ Merma / Pérdida' },
    { value: 'devolution', label: '↩️ Devolución a proveedor' },
    { value: 'transfer', label: '🚚 Transferencia a otro depósito' },
    { value: 'other', label: '📝 Otro' },
];

const BulkEgressModal = ({ isOpen, onClose, items = [], onSuccess }) => {
    // Per-item editable quantities
    const [quantities, setQuantities] = useState({});
    const [reason, setReason] = useState('sale');
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');

    // Warehouses hook for autocomplete + save
    const { warehouses: savedWarehouses, createWarehouse } = useWarehouses();

    // Initialize quantities when items change
    React.useEffect(() => {
        if (isOpen && items.length > 0) {
            const initialQuantities = {};
            items.forEach(item => {
                initialQuantities[item.productSapCode] = item.balance;
            });
            setQuantities(initialQuantities);
            setReason('sale');
            setNotes('');
            setOrigin('');
            setDestination('');
            setErrors({});
        }
    }, [isOpen, items]);

    const getQuantity = (sapCode) => quantities[sapCode] ?? 0;

    const setItemQuantity = (sapCode, value) => {
        setQuantities(prev => ({ ...prev, [sapCode]: value }));
        // Clear error for this item
        if (errors[sapCode]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[sapCode];
                return next;
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        let hasAtLeastOne = false;

        items.forEach(item => {
            const qty = Number(getQuantity(item.productSapCode));
            if (qty > 0) hasAtLeastOne = true;
            if (qty < 0) {
                newErrors[item.productSapCode] = 'La cantidad no puede ser negativa';
            }
            if (qty > item.balance) {
                newErrors[item.productSapCode] = `Máximo disponible: ${item.balance.toLocaleString()}`;
            }
        });

        if (!hasAtLeastOne) {
            newErrors.general = 'Debés ingresar cantidad en al menos un producto';
        }

        if (!reason) {
            newErrors.reason = 'Seleccioná un motivo';
        }

        if (reason === 'transfer') {
            if (!origin.trim()) newErrors.origin = 'El depósito de origen es requerido';
            if (!destination.trim()) newErrors.destination = 'El depósito de destino es requerido';
            if (origin.trim() && destination.trim() && origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
                newErrors.destination = 'El destino debe ser diferente al origen';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const itemsToEgress = items.filter(item => {
                const qty = Number(getQuantity(item.productSapCode));
                return qty > 0;
            });

            itemsToEgress.forEach(item => {
                egressStockProduct({
                    productSapCode: item.productSapCode,
                    quantity: Number(getQuantity(item.productSapCode)),
                    reason,
                    notes: notes || `Egreso masivo desde Totalizador (${itemsToEgress.length} productos)`,
                    origin: reason === 'transfer' ? origin : undefined,
                    destination: reason === 'transfer' ? destination : undefined,
                });
            });

            onSuccess?.();
            onClose();
        } catch (err) {
            setErrors({ general: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalUnitsToEgress = items.reduce((sum, item) => {
        const qty = Number(getQuantity(item.productSapCode)) || 0;
        return sum + (qty > 0 ? qty : 0);
    }, 0);

    const totalValueToEgress = items.reduce((sum, item) => {
        const qty = Number(getQuantity(item.productSapCode)) || 0;
        return sum + (qty > 0 ? qty * (item.unitPrice || 0) : 0);
    }, 0);

    const formatCurrency = (amount) => new Intl.NumberFormat('es-AR', {
        style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                                <Minus className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Egreso Masivo</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {items.length} producto(s) seleccionados del Totalizador
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Scrollable content */}
                    <div className="overflow-y-auto flex-1 p-5 space-y-4">
                        {/* Products list with editable quantities */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Productos — Cantidad a egresar
                            </label>
                            <div className="space-y-2">
                                {items.map(item => {
                                    const qty = getQuantity(item.productSapCode);
                                    const error = errors[item.productSapCode];
                                    return (
                                        <div
                                            key={item.productSapCode}
                                            className={`p-3 rounded-xl border transition-all ${error
                                                ? 'border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-700'
                                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                        {item.productName}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        SAP {item.productSapCode} · {item.warehouse} · Disponible: <span className="font-bold text-emerald-600">{item.balance.toLocaleString()}</span>
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={item.balance}
                                                        value={qty}
                                                        onChange={(e) => setItemQuantity(item.productSapCode, e.target.value)}
                                                        className={`w-24 px-3 py-1.5 text-sm font-bold text-right rounded-lg border ${error
                                                            ? 'border-red-300 focus:ring-red-400'
                                                            : 'border-slate-300 dark:border-slate-600 focus:ring-green-500'
                                                            } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setItemQuantity(item.productSapCode, item.balance)}
                                                        className="px-2 py-1.5 text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                        title="Poner máximo disponible"
                                                    >
                                                        MAX
                                                    </button>
                                                </div>
                                            </div>
                                            {error && (
                                                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> {error}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Motivo */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Motivo *
                            </label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-lg border ${errors.reason
                                    ? 'border-red-300 focus:ring-red-500'
                                    : 'border-slate-200 dark:border-slate-700 focus:ring-green-500'
                                    } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent text-sm`}
                            >
                                {EGRESS_REASONS.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                            {errors.reason && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" /> {errors.reason}
                                </p>
                            )}
                        </div>

                        {/* Origin / Destination (only for transfer) */}
                        {reason === 'transfer' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl">
                                <WarehouseInput
                                    label="Depósito Origen"
                                    value={origin}
                                    onChange={setOrigin}
                                    savedWarehouses={savedWarehouses}
                                    placeholder="Ej: Depósito Central"
                                    error={errors.origin}
                                    onSave={(name) => createWarehouse(name)}
                                />
                                <WarehouseInput
                                    label="Depósito Destino"
                                    value={destination}
                                    onChange={setDestination}
                                    savedWarehouses={savedWarehouses}
                                    placeholder="Ej: Sucursal Norte"
                                    error={errors.destination}
                                    onSave={(name) => createWarehouse(name)}
                                />
                            </div>
                        )}

                        {/* Notas */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Notas adicionales
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Observaciones opcionales..."
                                rows={2}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none"
                            />
                        </div>

                        {/* Summary bar */}
                        {totalUnitsToEgress > 0 && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-red-700 dark:text-red-400 font-medium">
                                        Total a egresar: <span className="font-bold">{totalUnitsToEgress.toLocaleString()} unidades</span>
                                    </span>
                                    {totalValueToEgress > 0 && (
                                        <span className="text-red-600 dark:text-red-400 font-bold">
                                            {formatCurrency(totalValueToEgress)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* General error */}
                        {errors.general && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" /> {errors.general}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            <Minus className="w-4 h-4" />
                            {isSubmitting ? 'Procesando...' : 'Confirmar Egreso'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default BulkEgressModal;
