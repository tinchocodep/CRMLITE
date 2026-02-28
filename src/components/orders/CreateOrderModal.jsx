import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Package, Calendar, DollarSign, Warehouse, Handshake, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useCurrentTenant } from '../../hooks/useCurrentTenant';
import { getStockBalances } from '../../services/stockService';
import { products as productsMaster } from '../../data/products';
import BusinessUnitPicker from '../shared/BusinessUnitPicker';

// ─── Constantes de diseño ──────────────────────────────────────────────────────
const IVA_OPTIONS = [
    { value: 0, label: 'Sin IVA (0%)' },
    { value: 10.5, label: 'IVA 10.5%' },
    { value: 21, label: 'IVA 21%' },
];

const PAYMENT_CONDITIONS = [
    { value: 'cash', label: '💵 Contado' },
    { value: '30d', label: '📅 30 días' },
    { value: '60d', label: '📅 60 días' },
    { value: '90d', label: '📅 90 días' },
];

const PRODUCT_SOURCES = [
    { value: 'own', label: '🏢 Nuestro depósito' },
    { value: 'consigned', label: '📦 Consignado' },
    { value: 'third_party', label: '🤝 Tercero' },
];

const DEFAULT_LINE = () => ({
    id: crypto.randomUUID(),
    product_sap_code: '',
    product_name: '',
    product_search: '',
    showProductDropdown: false,
    quantity: 1,
    unit_price: 0,
    unit: 'Unid.',
    tax_rate: 21,
    product_source: 'own',
    // Computed
    get subtotal() { return this.quantity * this.unit_price; },
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatCurrency = (n) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n ?? 0);

const calcLineTotals = (line) => {
    const subtotal = (line.quantity ?? 0) * (line.unit_price ?? 0);
    const iva = subtotal * ((line.tax_rate ?? 0) / 100);
    return { subtotal, iva, total: subtotal + iva };
};

const calcSummary = (lines) => {
    const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
    const tax = lines.reduce((s, l) => {
        const { iva } = calcLineTotals(l);
        return s + iva;
    }, 0);
    return { subtotal, tax, total: subtotal + tax };
};

// ─── Componente principal ──────────────────────────────────────────────────────
const CreateOrderModal = ({ isOpen, onClose, onSuccess }) => {
    const { tenantId } = useCurrentTenant();

    // Productos del stock (localStorage)
    const [stockProducts, setStockProducts] = useState([]);

    // Cargar stock al abrir
    useEffect(() => {
        if (!isOpen) return;
        const balances = getStockBalances();
        // Combinar con productos maestros para tener precio de referencia
        const merged = balances.map(b => {
            const master = productsMaster.find(p => p.sapCode === b.productSapCode);
            return {
                productSapCode: b.productSapCode,
                productName: b.productName,
                cropDescription: b.cropDescription,
                balance: b.balance,
                unitPrice: master?.precio || 0,
            };
        });
        setStockProducts(merged);
    }, [isOpen]);

    // Form state
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [linkedEntityId, setLinkedEntityId] = useState('');
    const [linkedEntityType, setLinkedEntityType] = useState('');
    const [lines, setLines] = useState([DEFAULT_LINE()]);
    const [paymentCondition, setPaymentCondition] = useState('cash');
    const [deliveryDate, setDeliveryDate] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Fetch companies when modal opens
    useEffect(() => {
        if (!isOpen || !tenantId) return;
        const fetchCompanies = async () => {
            const { data } = await supabase
                .from('companies')
                .select('id, trade_name, legal_name, cuit, company_type')
                .eq('tenant_id', tenantId)
                .order('trade_name');
            setCompanies(data || []);
        };
        fetchCompanies();
    }, [isOpen, tenantId]);

    // Derived lists for BusinessUnitPicker
    const clientsList = companies.filter(c => c.company_type === 'client');
    const prospectsList = companies.filter(c => c.company_type === 'prospect');

    // Reset when closed
    useEffect(() => {
        if (!isOpen) {
            setSelectedCompany(null);
            setLinkedEntityId('');
            setLinkedEntityType('');
            setLines([DEFAULT_LINE()]);
            setPaymentCondition('cash');
            setDeliveryDate('');
            setNotes('');
            setErrors({});
            setSubmitting(false);
        }
    }, [isOpen]);

    // ─── Line handlers ─────────────────────────────────────────────────────────
    const addLine = () => setLines(prev => [...prev, DEFAULT_LINE()]);

    const removeLine = (id) => setLines(prev => prev.filter(l => l.id !== id));

    const updateLine = (id, field, value) => {
        setLines(prev => prev.map(l => {
            if (l.id !== id) return l;
            const updated = { ...l, [field]: value };
            return updated;
        }));
    };

    // ─── Validation ────────────────────────────────────────────────────────────
    const validate = () => {
        const newErrors = {};
        if (!selectedCompany) newErrors.company = 'Seleccioná un cliente';
        if (lines.length === 0) newErrors.lines = 'Agregá al menos un producto';
        lines.forEach((l, i) => {
            if (!l.product_name.trim()) newErrors[`line_name_${i}`] = 'Nombre requerido';
            if ((l.quantity ?? 0) <= 0) newErrors[`line_qty_${i}`] = 'Cantidad > 0';
            if ((l.unit_price ?? 0) <= 0) newErrors[`line_price_${i}`] = 'Precio > 0';
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ─── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            const { subtotal, tax, total } = calcSummary(lines);

            const orderData = {
                company_id: selectedCompany.id,
                client_name: selectedCompany.trade_name || selectedCompany.legal_name,
                client_cuit: selectedCompany.cuit,
                subtotal,
                tax,
                total,
                payment_condition: paymentCondition,
                delivery_date: deliveryDate || null,
                notes: notes || null,
                status: 'pending',
                sale_type: (() => {
                    const sources = new Set(lines.map(l => l.product_source));
                    if (sources.size > 1) return 'mixed';
                    const src = lines[0]?.product_source;
                    if (src === 'third_party') return 'partner';
                    if (src === 'consigned') return 'consigned';
                    return 'own';
                })(),
                lines: lines.map(l => ({
                    product_sap_code: l.product_sap_code || null,
                    product_name: l.product_name,
                    quantity: Number(l.quantity),
                    unit_price: Number(l.unit_price),
                    unit: l.unit || 'Unid.',
                    subtotal: Number(l.quantity) * Number(l.unit_price),
                    tax_rate: l.tax_rate,
                    total: calcLineTotals(l).total,
                    product_source: l.product_source,
                })),
            };

            await onSuccess(orderData);
            onClose();
        } catch (err) {
            console.error('Error creando pedido:', err);
            setErrors({ submit: err.message || 'Error al crear el pedido' });
        } finally {
            setSubmitting(false);
        }
    };

    const summary = calcSummary(lines);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center shadow-md">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nuevo Pedido</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Creación manual de pedido</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">

                            {/* ── Cliente / Prospecto ── */}
                            <div>
                                {errors.company && <p className="text-xs text-red-500 mb-1">{errors.company}</p>}
                                <BusinessUnitPicker
                                    value={linkedEntityId}
                                    entityType={linkedEntityType}
                                    onChange={(entityId, entityType, entity) => {
                                        setLinkedEntityId(entityId);
                                        setLinkedEntityType(entityType);
                                        setSelectedCompany(entity);
                                        if (errors.company) setErrors(prev => ({ ...prev, company: undefined }));
                                    }}
                                    clients={clientsList}
                                    prospects={prospectsList}
                                    required={true}
                                    label="Cliente / Prospecto"
                                />
                            </div>

                            {/* ── Condición de pago + Fecha entrega ── */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        <DollarSign className="inline w-4 h-4 mr-1 -mt-0.5" />
                                        Condición de pago
                                    </label>
                                    <select
                                        value={paymentCondition}
                                        onChange={e => setPaymentCondition(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent"
                                    >
                                        {PAYMENT_CONDITIONS.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        <Calendar className="inline w-4 h-4 mr-1 -mt-0.5" />
                                        Fecha de entrega
                                    </label>
                                    <input
                                        type="date"
                                        value={deliveryDate}
                                        onChange={e => setDeliveryDate(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* ── Líneas de producto ── */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Productos *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addLine}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-brand dark:text-green-400 rounded-lg text-xs font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                                    >
                                        <Plus size={14} />
                                        Agregar línea
                                    </button>
                                </div>

                                {errors.lines && <p className="text-xs text-red-500 mb-2">{errors.lines}</p>}

                                <div className="space-y-3">
                                    {lines.map((line, idx) => {
                                        const { subtotal, iva, total } = calcLineTotals({
                                            quantity: Number(line.quantity) || 0,
                                            unit_price: Number(line.unit_price) || 0,
                                            tax_rate: line.tax_rate,
                                        });
                                        return (
                                            <motion.div
                                                key={line.id}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4"
                                            >
                                                {/* Fila 1: Nombre (buscador con dropdown) + Código SAP */}
                                                <div className="grid grid-cols-3 gap-3 mb-3">
                                                    <div className="col-span-2 relative">
                                                        <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nombre del producto</label>
                                                        <div className="relative mt-1">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                                            <input
                                                                type="text"
                                                                placeholder="Buscar en stock..."
                                                                value={line.product_search !== undefined ? line.product_search : line.product_name}
                                                                onChange={e => updateLine(line.id, 'product_search', e.target.value)}
                                                                onFocus={() => updateLine(line.id, 'showProductDropdown', true)}
                                                                onBlur={() => setTimeout(() => updateLine(line.id, 'showProductDropdown', false), 150)}
                                                                className={`w-full pl-8 pr-3 py-2 rounded-lg border ${errors[`line_name_${idx}`] ? 'border-red-400 bg-red-50' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                                                    } text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent`}
                                                            />
                                                        </div>
                                                        {/* Dropdown de productos del stock */}
                                                        <AnimatePresence>
                                                            {line.showProductDropdown && (() => {
                                                                const q = (line.product_search || '').toLowerCase();
                                                                const filtered = stockProducts.filter(p =>
                                                                    p.productName.toLowerCase().includes(q) ||
                                                                    String(p.productSapCode).includes(q) ||
                                                                    (p.cropDescription || '').toLowerCase().includes(q)
                                                                ).slice(0, 8);
                                                                return (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: -4 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, y: -4 }}
                                                                        className="absolute top-full left-0 right-0 z-20 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-52 overflow-y-auto"
                                                                    >
                                                                        {filtered.length === 0 ? (
                                                                            <div className="px-4 py-3 text-sm text-slate-500">Sin resultados — escribí el nombre manualmente</div>
                                                                        ) : filtered.map(p => (
                                                                            <button
                                                                                key={p.productSapCode}
                                                                                type="button"
                                                                                onMouseDown={() => {
                                                                                    setLines(prev => prev.map(l => l.id !== line.id ? l : {
                                                                                        ...l,
                                                                                        product_name: p.productName,
                                                                                        product_search: p.productName,
                                                                                        product_sap_code: String(p.productSapCode),
                                                                                        unit_price: p.unitPrice || l.unit_price,
                                                                                        showProductDropdown: false,
                                                                                    }));
                                                                                }}
                                                                                className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
                                                                            >
                                                                                <div className="flex items-center justify-between">
                                                                                    <div>
                                                                                        <div className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{p.productName}</div>
                                                                                        <div className="text-xs text-slate-500">SAP: {p.productSapCode} · {p.cropDescription}</div>
                                                                                    </div>
                                                                                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 ml-2 shrink-0">Stock: {p.balance}</span>
                                                                                </div>
                                                                            </button>
                                                                        ))}
                                                                    </motion.div>
                                                                );
                                                            })()}
                                                        </AnimatePresence>
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Código SAP</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Opcional"
                                                            value={line.product_sap_code}
                                                            onChange={e => updateLine(line.id, 'product_sap_code', e.target.value)}
                                                            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Fila 2: Cantidad + Precio + IVA */}
                                                <div className="grid grid-cols-4 gap-3 mb-3">
                                                    <div>
                                                        <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Cantidad</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={line.quantity}
                                                            onChange={e => updateLine(line.id, 'quantity', e.target.value)}
                                                            className={`mt-1 w-full px-3 py-2 rounded-lg border ${errors[`line_qty_${idx}`] ? 'border-red-400 bg-red-50' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'} text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-400 focus:border-transparent`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Precio Unit.</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={line.unit_price}
                                                            onChange={e => updateLine(line.id, 'unit_price', e.target.value)}
                                                            className={`mt-1 w-full px-3 py-2 rounded-lg border ${errors[`line_price_${idx}`] ? 'border-red-400 bg-red-50' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'} text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-400 focus:border-transparent`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">IVA</label>
                                                        <select
                                                            value={line.tax_rate}
                                                            onChange={e => updateLine(line.id, 'tax_rate', Number(e.target.value))}
                                                            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                                        >
                                                            {IVA_OPTIONS.map(o => (
                                                                <option key={o.value} value={o.value}>{o.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="flex items-end justify-end pb-0.5">
                                                        <div className="text-right">
                                                            <div className="text-[10px] text-slate-400">Subtotal</div>
                                                            <div className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(subtotal)}</div>
                                                            {iva > 0 && <div className="text-[10px] text-slate-400">+ IVA {formatCurrency(iva)}</div>}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Fila 3: Origen */}
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5">
                                                            Origen del producto
                                                        </label>
                                                        <div className="flex gap-2">
                                                            {PRODUCT_SOURCES.map(src => (
                                                                <button
                                                                    key={src.value}
                                                                    type="button"
                                                                    onClick={() => updateLine(line.id, 'product_source', src.value)}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${line.product_source === src.value
                                                                        ? 'bg-brand text-white border-brand shadow-md'
                                                                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-brand'
                                                                        }`}
                                                                >
                                                                    {src.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {lines.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeLine(line.id)}
                                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── Notas ── */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Notas (opcional)</label>
                                <textarea
                                    rows={2}
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Observaciones, instrucciones de entrega..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent resize-none"
                                />
                            </div>

                            {errors.submit && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                                    ❌ {errors.submit}
                                </div>
                            )}
                        </div>

                        {/* Footer: Resumen + Botones */}
                        <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-6 py-4">
                            <div className="flex items-center justify-between gap-4">
                                {/* Summary */}
                                <div className="flex items-center gap-6 text-sm">
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400">Subtotal: </span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(summary.subtotal)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400">IVA: </span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(summary.tax)}</span>
                                    </div>
                                    <div className="text-base">
                                        <span className="text-slate-500 dark:text-slate-400">Total: </span>
                                        <span className="font-bold text-brand">{formatCurrency(summary.total)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={submitting}
                                        className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="px-6 py-2.5 rounded-xl btn-brand text-white text-sm font-bold shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Creando...
                                            </>
                                        ) : (
                                            <>
                                                <Package size={16} />
                                                Crear Pedido
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CreateOrderModal;
