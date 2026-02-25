import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, AlertCircle, Search, Package, TrendingDown, ChevronDown, ArrowRight, Warehouse, Plus, Save, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStockBalances, egressStockProduct } from '../../services/stockService';
import { useWarehouses } from '../../hooks/useWarehouses';

// ─── Motivos de egreso ─────────────────────────────────────────────────────────
const EGRESS_REASONS = [
    { value: 'sale', label: '🛒 Venta' },
    { value: 'adjustment', label: '🔧 Ajuste de inventario' },
    { value: 'loss', label: '⚠️ Merma / Pérdida' },
    { value: 'devolution', label: '↩️ Devolución a proveedor' },
    { value: 'transfer', label: '🚚 Transferencia a otro depósito' },
    { value: 'other', label: '📝 Otro' },
];

// ─── Sub-componente: selector de depósito con autocomplete + guardar ───────────
const WarehouseInput = ({ label, value, onChange, savedWarehouses, placeholder, error, onSave }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error'
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

    // ¿Ya está guardado exactamente?
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

                    {/* Dropdown de sugerencias */}
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

                {/* Botón guardar */}
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

// ─── Componente principal ──────────────────────────────────────────────────────
const EgressStockModal = ({ isOpen, onClose, onSuccess }) => {
    const [stockBalances, setStockBalances] = useState([]);

    // Búsqueda de producto
    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Campos del egreso
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('sale');
    const [notes, setNotes] = useState('');

    // Campos de transferencia (solo si reason === 'transfer')
    const [transferOrigin, setTransferOrigin] = useState('');
    const [transferDestination, setTransferDestination] = useState('');

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const searchRef = useRef(null);

    // Hook de depósitos persistidos
    const { warehouses, createWarehouse } = useWarehouses();

    // Cargar balances al abrir
    useEffect(() => {
        if (isOpen) {
            setStockBalances(getStockBalances());
        }
    }, [isOpen]);

    // Reset al cerrar
    useEffect(() => {
        if (!isOpen) {
            setProductSearch('');
            setSelectedProduct(null);
            setQuantity('');
            setReason('sale');
            setNotes('');
            setTransferOrigin('');
            setTransferDestination('');
            setErrors({});
            setIsSubmitting(false);
            setShowProductDropdown(false);
        }
    }, [isOpen]);

    // Cierre del dropdown con click fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowProductDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filtrado de productos con balance > 0
    const filteredProducts = stockBalances.filter(p => {
        if (p.balance <= 0) return false;
        const q = productSearch.toLowerCase();
        return (
            p.productName?.toLowerCase().includes(q) ||
            p.productSapCode?.toString().includes(q) ||
            p.warehouse?.toLowerCase().includes(q)
        );
    });

    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setProductSearch(product.productName);
        setShowProductDropdown(false);
        if (errors.product) setErrors(prev => ({ ...prev, product: undefined }));
    };

    const handleClearProduct = () => {
        setSelectedProduct(null);
        setProductSearch('');
        setQuantity('');
        setErrors({});
        searchRef.current?.querySelector('input')?.focus();
    };

    // ─── Validación ──────────────────────────────────────────────────────────────
    const validate = () => {
        const newErrors = {};
        if (!selectedProduct) newErrors.product = 'Seleccioná un producto del stock';
        if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
            newErrors.quantity = 'La cantidad debe ser mayor a 0';
        } else if (selectedProduct && Number(quantity) > selectedProduct.balance) {
            newErrors.quantity = `Stock insuficiente. Disponible: ${selectedProduct.balance.toLocaleString()} unidades`;
        }
        // Validación extra para transferencias
        if (reason === 'transfer') {
            if (!transferOrigin.trim()) newErrors.transferOrigin = 'Indicá el depósito de origen';
            if (!transferDestination.trim()) newErrors.transferDestination = 'Indicá el depósito de destino';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ─── Submit ──────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            egressStockProduct({
                productSapCode: selectedProduct.productSapCode,
                quantity: Number(quantity),
                reason,
                notes: notes || null,
                // Solo se incluyen si es una transferencia
                ...(reason === 'transfer' && {
                    transferOrigin: transferOrigin.trim(),
                    transferDestination: transferDestination.trim(),
                }),
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            setErrors({ submit: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // Balance restante proyectado
    const projectedBalance = selectedProduct && quantity && !isNaN(quantity)
        ? selectedProduct.balance - Number(quantity)
        : null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* ── Header ── */}
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                                    <TrendingDown className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                        Egresar Stock
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Registrar salida de productos del inventario
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                    </div>

                    {/* ── Form ── */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-5">

                        {/* Producto */}
                        <div ref={searchRef} className="relative">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Producto *
                            </label>

                            {selectedProduct ? (
                                <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700">
                                    <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <Package className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                            {selectedProduct.productName}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            SAP {selectedProduct.productSapCode} · {selectedProduct.warehouse} · <span className="font-semibold text-emerald-600">{selectedProduct.balance.toLocaleString()} disponibles</span>
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleClearProduct}
                                        className="p-1 hover:bg-emerald-100 dark:hover:bg-slate-600 rounded-full transition-colors flex-shrink-0"
                                    >
                                        <X className="w-4 h-4 text-slate-500" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={productSearch}
                                            onChange={(e) => {
                                                setProductSearch(e.target.value);
                                                setShowProductDropdown(true);
                                            }}
                                            onFocus={() => setShowProductDropdown(true)}
                                            placeholder="Buscar por nombre, SAP o depósito..."
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.product
                                                ? 'border-red-300 focus:ring-red-500'
                                                : 'border-slate-200 dark:border-slate-700 focus:ring-red-500'
                                                } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent text-sm`}
                                        />
                                    </div>

                                    <AnimatePresence>
                                        {showProductDropdown && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                className="absolute top-full left-0 right-0 z-20 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto"
                                            >
                                                {filteredProducts.length === 0 ? (
                                                    <p className="px-4 py-3 text-sm text-slate-500">
                                                        {stockBalances.length === 0
                                                            ? 'No hay productos en stock'
                                                            : 'Sin resultados. Todos los productos con stock disponible están mostrados.'}
                                                    </p>
                                                ) : filteredProducts.map((p) => (
                                                    <button
                                                        key={p.productSapCode}
                                                        type="button"
                                                        onClick={() => handleSelectProduct(p)}
                                                        className="w-full text-left px-4 py-2.5 hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                                    {p.productName}
                                                                </p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                    SAP {p.productSapCode} · {p.warehouse}
                                                                </p>
                                                            </div>
                                                            <span className="ml-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                                                {p.balance.toLocaleString()} u.
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}

                            {errors.product && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.product}
                                </p>
                            )}
                        </div>

                        {/* Cantidad */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Cantidad a egresar *
                            </label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => {
                                    setQuantity(e.target.value);
                                    if (errors.quantity) setErrors(prev => ({ ...prev, quantity: undefined }));
                                }}
                                className={`w-full px-4 py-2.5 rounded-lg border ${errors.quantity
                                    ? 'border-red-300 focus:ring-red-500'
                                    : 'border-slate-200 dark:border-slate-700 focus:ring-red-500'
                                    } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent text-sm`}
                                placeholder="Ej: 200"
                                min="1"
                                max={selectedProduct?.balance}
                            />
                            {errors.quantity && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.quantity}
                                </p>
                            )}
                            {projectedBalance !== null && !errors.quantity && (
                                <p className={`mt-1 text-xs font-medium flex items-center gap-1 ${projectedBalance >= 0 ? 'text-slate-500' : 'text-red-500'}`}>
                                    {projectedBalance >= 0
                                        ? `✅ Balance resultante: ${projectedBalance.toLocaleString()} unidades`
                                        : `⛔ Cantidad supera el stock disponible`}
                                </p>
                            )}
                        </div>

                        {/* Motivo */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Motivo *
                            </label>
                            <div className="relative">
                                <select
                                    value={reason}
                                    onChange={(e) => {
                                        setReason(e.target.value);
                                        if (e.target.value !== 'transfer') {
                                            setTransferOrigin('');
                                            setTransferDestination('');
                                            setErrors(prev => ({ ...prev, transferOrigin: undefined, transferDestination: undefined }));
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm appearance-none"
                                >
                                    {EGRESS_REASONS.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Mini-formulario de transferencia */}
                        <AnimatePresence>
                            {reason === 'transfer' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-3"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <Warehouse className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                                Datos de la transferencia
                                            </span>
                                        </div>
                                        {warehouses.length > 0 && (
                                            <span className="text-[10px] text-blue-500 dark:text-blue-400">
                                                {warehouses.length} depósito{warehouses.length !== 1 ? 's' : ''} guardado{warehouses.length !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>

                                    {/* Depósito de Origen */}
                                    <WarehouseInput
                                        label="Depósito de origen"
                                        value={transferOrigin}
                                        onChange={(val) => {
                                            setTransferOrigin(val);
                                            if (errors.transferOrigin) setErrors(prev => ({ ...prev, transferOrigin: undefined }));
                                        }}
                                        savedWarehouses={warehouses}
                                        placeholder="Ej: Depósito Central, Planta Norte..."
                                        error={errors.transferOrigin}
                                        onSave={createWarehouse}
                                    />

                                    {/* Flecha visual */}
                                    <div className="flex justify-center">
                                        <ArrowRight className="w-4 h-4 text-blue-400" />
                                    </div>

                                    {/* Depósito de Destino */}
                                    <WarehouseInput
                                        label="Depósito de destino"
                                        value={transferDestination}
                                        onChange={(val) => {
                                            setTransferDestination(val);
                                            if (errors.transferDestination) setErrors(prev => ({ ...prev, transferDestination: undefined }));
                                        }}
                                        savedWarehouses={warehouses}
                                        placeholder="Ej: Sucursal Rosario, Almacén Sur..."
                                        error={errors.transferDestination}
                                        onSave={createWarehouse}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Notas */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Notas adicionales
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                placeholder="Observaciones opcionales..."
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none"
                            />
                        </div>

                        {/* Error global */}
                        {errors.submit && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.submit}
                                </p>
                            </div>
                        )}
                    </form>

                    {/* ── Footer ── */}
                    <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
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

export default EgressStockModal;
