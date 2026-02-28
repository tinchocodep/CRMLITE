import React, { useState } from 'react';
import { X, Plus, Trash2, Package, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { products } from '../data/products';
import { useCompanies } from '../hooks/useCompanies';
import BusinessUnitPicker from './shared/BusinessUnitPicker';

const FIELD_CLASS =
    'w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-advanta-green focus:ring-2 focus:ring-red-100 outline-none transition-all';

const LABEL_CLASS = 'block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1.5';

const PRODUCT_SOURCES = [
    { value: 'own', label: '🏢 Nuestro depósito' },
    { value: 'consigned', label: '📦 Consignado' },
    { value: 'third_party', label: '🤝 Tercero' },
];

const buildEmptyLine = () => ({
    _uid: `line-${Date.now()}-${Math.random()}`,
    productSapCode: products[0]?.sapCode ?? '',
    productName: products[0]?.hybridNameAtSkuLevel ?? '',
    quantity: 1,
    unitPrice: products[0]?.precio ?? 0,
    subtotal: products[0]?.precio ?? 0,
    taxRate: 21,
    total: (products[0]?.precio ?? 0) * 1.21,
    productSource: 'own',
});

const INITIAL_FORM = {
    company_id: '',
    company_type: '',
    client_name: '',
    sale_type: 'own',
    payment_condition: '30d',
    delivery_date: '',
    origin_address: '',
    destination_address: '',
    lines: [],
};

const CreateQuotationModal = ({ isOpen, onClose, onSave, isSaving = false }) => {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [validationError, setValidationError] = useState('');

    const { companies } = useCompanies();
    const clients = companies.filter(c => c.company_type === 'client');
    const prospects = companies.filter(c => c.company_type === 'prospect');

    const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    const handleEntityChange = (entityId, entityType, entity) => {
        setFormData(prev => ({
            ...prev,
            company_id: entityId,
            company_type: entityType,
            client_name: entity ? (entity.trade_name || entity.legal_name || '') : '',
        }));
    };

    // ── Line helpers ──────────────────────────────────────────
    const addLine = () =>
        setFormData(prev => ({ ...prev, lines: [...prev.lines, buildEmptyLine()] }));

    const removeLine = (uid) =>
        setFormData(prev => ({ ...prev, lines: prev.lines.filter(l => l._uid !== uid) }));

    const updateLine = (uid, field, rawValue) => {
        setFormData(prev => ({
            ...prev,
            lines: prev.lines.map(line => {
                if (line._uid !== uid) return line;
                const updated = { ...line, [field]: rawValue };

                if (field === 'productSapCode') {
                    const product = products.find(p => p.sapCode === parseInt(rawValue));
                    if (product) {
                        updated.productName = product.hybridNameAtSkuLevel;
                        updated.unitPrice = product.precio;
                    }
                }

                if (['quantity', 'unitPrice', 'productSapCode', 'taxRate'].includes(field)) {
                    updated.subtotal = (updated.quantity || 0) * (updated.unitPrice || 0);
                    updated.total = updated.subtotal * (1 + (updated.taxRate || 0) / 100);
                }

                return updated;
            }),
        }));
    };

    // ── Totals ────────────────────────────────────────────────
    const subtotal = formData.lines.reduce((s, l) => s + (l.subtotal || 0), 0);
    const tax = formData.lines.reduce((s, l) => s + ((l.subtotal || 0) * (l.taxRate || 0) / 100), 0);
    const total = subtotal + tax;

    const formatCurrency = (n) =>
        new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
        }).format(n);

    // ── Submit ────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationError('');

        if (!formData.company_id) return setValidationError('Seleccioná un cliente o prospecto.');
        if (!formData.delivery_date) return setValidationError('Ingresá la fecha de entrega.');
        if (formData.lines.length === 0) return setValidationError('Agregá al menos un producto.');

        await onSave({
            company_id: formData.company_id,
            client_name: formData.client_name,
            sale_type: formData.sale_type,
            payment_condition: formData.payment_condition,
            delivery_date: formData.delivery_date,
            origin_address: formData.origin_address,
            destination_address: formData.destination_address,
            status: 'draft',
            subtotal,
            tax,
            total,
            lines: formData.lines.map((l, index) => ({
                productSapCode: l.productSapCode,
                productName: l.productName,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                subtotal: l.subtotal,
                taxRate: l.taxRate,
                total: l.total,
                productSource: l.productSource || 'own',
                line_order: index,
            })),
        });

        setFormData(INITIAL_FORM);
    };

    const handleClose = () => {
        setFormData(INITIAL_FORM);
        setValidationError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl my-8"
                >
                    {/* ── Header ───────────────────────────── */}
                    <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-5 rounded-t-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nueva Cotización</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Se creará como Borrador</p>
                            </div>
                        </div>
                        <button type="button" onClick={handleClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500 dark:text-slate-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

                        {/* ── Error ────────────────────────── */}
                        {validationError && (
                            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                <AlertCircle size={16} className="flex-shrink-0" />
                                {validationError}
                            </div>
                        )}

                        {/* ── Cliente / Prospecto ──────────── */}
                        <BusinessUnitPicker
                            value={formData.company_id}
                            entityType={formData.company_type}
                            onChange={handleEntityChange}
                            clients={clients}
                            prospects={prospects}
                            required={true}
                            label="Cliente / Prospecto"
                        />

                        {/* ── Campos principales ───────────── */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className={LABEL_CLASS}>Fecha de Entrega *</label>
                                <input
                                    type="date"
                                    value={formData.delivery_date}
                                    onChange={(e) => set('delivery_date', e.target.value)}
                                    className={FIELD_CLASS}
                                    required
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Tipo de Venta</label>
                                <select
                                    value={formData.sale_type}
                                    onChange={(e) => set('sale_type', e.target.value)}
                                    className={FIELD_CLASS}
                                >
                                    <option value="own">Venta Propia</option>
                                    <option value="consigned">Consignado</option>
                                    <option value="partner">Venta Socio</option>
                                </select>
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Condición de Pago</label>
                                <select
                                    value={formData.payment_condition}
                                    onChange={(e) => set('payment_condition', e.target.value)}
                                    className={FIELD_CLASS}
                                >
                                    <option value="cash">Contado</option>
                                    <option value="30d">30 días</option>
                                    <option value="60d">60 días</option>
                                    <option value="90d">90 días</option>
                                </select>
                            </div>
                        </div>

                        {/* ── Direcciones ──────────────────── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL_CLASS}>Dirección de Origen</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Establecimiento San Carlos"
                                    value={formData.origin_address}
                                    onChange={(e) => set('origin_address', e.target.value)}
                                    className={FIELD_CLASS}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Dirección de Destino</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Av. Corrientes 1234, CABA"
                                    value={formData.destination_address}
                                    onChange={(e) => set('destination_address', e.target.value)}
                                    className={FIELD_CLASS}
                                />
                            </div>
                        </div>

                        {/* ── Líneas de Productos ──────────── */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                                    <Package size={16} className="text-blue-600" />
                                    Productos
                                    {formData.lines.length > 0 && (
                                        <span className="text-xs font-normal text-slate-400">
                                            ({formData.lines.length} ítem{formData.lines.length !== 1 ? 's' : ''})
                                        </span>
                                    )}
                                </h3>
                                <button
                                    type="button"
                                    onClick={addLine}
                                    className="px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                                >
                                    <Plus size={14} />
                                    Agregar Producto
                                </button>
                            </div>

                            {formData.lines.length === 0 ? (
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-sm text-slate-400">
                                    <Package size={28} className="mx-auto mb-2 opacity-30" />
                                    Sin productos. Hacé clic en "Agregar Producto".
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {formData.lines.map((line) => (
                                        <div
                                            key={line._uid}
                                            className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-700"
                                        >
                                            {/* Row: Producto | Cantidad | Precio | IVA | Subtotal+delete */}
                                            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">

                                                {/* Producto */}
                                                <div className="col-span-2 md:col-span-2">
                                                    <label className={LABEL_CLASS}>Producto</label>
                                                    <select
                                                        value={line.productSapCode}
                                                        onChange={(e) => updateLine(line._uid, 'productSapCode', e.target.value)}
                                                        className={FIELD_CLASS}
                                                    >
                                                        {products.map(p => (
                                                            <option key={p.sapCode} value={p.sapCode}>
                                                                {p.hybridNameAtSkuLevel}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Cantidad */}
                                                <div>
                                                    <label className={LABEL_CLASS}>Cantidad</label>
                                                    <input
                                                        type="number"
                                                        value={line.quantity}
                                                        onChange={(e) => updateLine(line._uid, 'quantity', parseFloat(e.target.value) || 0)}
                                                        min="1"
                                                        className={FIELD_CLASS}
                                                    />
                                                </div>

                                                {/* Precio unitario */}
                                                <div>
                                                    <label className={LABEL_CLASS}>Precio Unit.</label>
                                                    <input
                                                        type="number"
                                                        value={line.unitPrice}
                                                        onChange={(e) => updateLine(line._uid, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        min="0"
                                                        step="0.01"
                                                        className={FIELD_CLASS}
                                                    />
                                                </div>

                                                {/* IVA */}
                                                <div>
                                                    <label className={LABEL_CLASS}>IVA</label>
                                                    <select
                                                        value={line.taxRate}
                                                        onChange={(e) => updateLine(line._uid, 'taxRate', parseFloat(e.target.value))}
                                                        className={FIELD_CLASS}
                                                    >
                                                        <option value={0}>0% (Exento)</option>
                                                        <option value={10.5}>10.5%</option>
                                                        <option value={21}>21%</option>
                                                    </select>
                                                </div>

                                                {/* Subtotal + eliminar */}
                                                <div className="flex items-end gap-2">
                                                    <div className="flex-1">
                                                        <label className={LABEL_CLASS}>Subtotal</label>
                                                        <div className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold">
                                                            {formatCurrency(line.subtotal)}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLine(line._uid)}
                                                        className="p-2.5 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0"
                                                        title="Eliminar línea"
                                                    >
                                                        <Trash2 size={16} className="text-red-500" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Origen del producto */}
                                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3">
                                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex-shrink-0">
                                                    Origen:
                                                </span>
                                                <div className="flex gap-2">
                                                    {PRODUCT_SOURCES.map(src => (
                                                        <button
                                                            key={src.value}
                                                            type="button"
                                                            onClick={() => updateLine(line._uid, 'productSource', src.value)}
                                                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${line.productSource === src.value
                                                                ? 'bg-brand text-white border-brand shadow-sm'
                                                                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-brand'
                                                                }`}
                                                        >
                                                            {src.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Totales ──────────────────────── */}
                        {formData.lines.length > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                                        <span>Subtotal neto</span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                                        <span>IVA total</span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(tax)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                        <span>TOTAL</span>
                                        <span>{formatCurrency(total)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Actions ──────────────────────── */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isSaving}
                                className="flex-1 px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 px-5 py-3 rounded-xl bg-brand text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <FileText size={16} />
                                        Crear Cotización
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CreateQuotationModal;
