import React, { useState, useEffect, useCallback } from 'react';
import { Package, Search, Filter, Plus, Minus, Edit2, AlertTriangle, TrendingDown, TrendingUp, Box, Layers, ArrowUpCircle, ArrowDownCircle, ClipboardList, Trash2, X, Download, History, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { getStockBalances, getStockMovements, initializeStockData } from '../services/stockService';
import AddStockModal from '../components/stock/AddStockModal';
import EgressStockModal from '../components/stock/EgressStockModal';
import EditStockProductModal from '../components/stock/EditStockProductModal';
import BulkEgressModal from '../components/stock/BulkEgressModal';
import * as XLSX from 'xlsx';

const TOTALIZER_HISTORY_KEY = 'crm_totalizer_history';

const Stock = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockTypeFilter, setStockTypeFilter] = useState('all');
    const [warehouseFilter, setWarehouseFilter] = useState('all');
    const [viewMode, setViewMode] = useState('balances');
    const [stockBalances, setStockBalances] = useState([]);
    const [movements, setMovements] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEgressModal, setShowEgressModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    const [showBulkEgressModal, setShowBulkEgressModal] = useState(false);

    // Movement filters
    const [movementTypeFilter, setMovementTypeFilter] = useState('all');
    const [movementStockTypeFilter, setMovementStockTypeFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Totalizer state
    const [totalizerItems, setTotalizerItems] = useState([]);
    const [totalizerSearch, setTotalizerSearch] = useState('');
    const [showTotalizerDropdown, setShowTotalizerDropdown] = useState(false);
    const [totalizerHistory, setTotalizerHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    // Load totalizer history from localStorage
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(TOTALIZER_HISTORY_KEY) || '[]');
            setTotalizerHistory(saved);
        } catch { setTotalizerHistory([]); }
    }, []);

    // Save totalizer to history
    const saveTotalizerToHistory = () => {
        const entry = {
            id: Date.now(),
            date: new Date().toLocaleString('es-AR'),
            itemCount: totalizerItems.length,
            totalUnits: totalizerItems.reduce((s, i) => s + i.balance, 0),
            totalValue: totalizerItems.reduce((s, i) => s + (i.balance * (i.unitPrice || 0)), 0),
            items: totalizerItems.map(i => ({ ...i })),
        };
        const updated = [entry, ...totalizerHistory].slice(0, 50);
        setTotalizerHistory(updated);
        localStorage.setItem(TOTALIZER_HISTORY_KEY, JSON.stringify(updated));
    };

    // Delete history entry
    const deleteHistoryEntry = (entryId) => {
        const updated = totalizerHistory.filter(e => e.id !== entryId);
        setTotalizerHistory(updated);
        localStorage.setItem(TOTALIZER_HISTORY_KEY, JSON.stringify(updated));
    };

    // Load history entry into totalizer
    const loadHistoryEntry = (entry) => {
        setTotalizerItems(entry.items.map(i => ({ ...i })));
        setShowHistory(false);
    };

    // Export totalizer to Excel
    const exportTotalizerToExcel = () => {
        const rows = totalizerItems.map(item => ({
            'Producto': item.productName,
            'Código SAP': item.productSapCode,
            'Categoría': item.cropDescription,
            'Depósito': item.warehouse,
            'Tipo Stock': item.stockType === 'own' ? 'Propio' : item.stockType === 'consigned' ? 'Consignado' : 'Tercero',
            'Balance': item.balance,
            'Precio Unitario': item.unitPrice || 0,
            'Valor Total': item.balance * (item.unitPrice || 0),
        }));

        // Add totals row
        rows.push({
            'Producto': 'TOTALES',
            'Código SAP': '',
            'Categoría': '',
            'Depósito': '',
            'Tipo Stock': '',
            'Balance': totalizerItems.reduce((s, i) => s + i.balance, 0),
            'Precio Unitario': '',
            'Valor Total': totalizerItems.reduce((s, i) => s + (i.balance * (i.unitPrice || 0)), 0),
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        // Set column widths
        ws['!cols'] = [
            { wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Totalizador');
        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `totalizador_stock_${dateStr}.xlsx`);
    };

    const loadStockData = useCallback(() => {
        setStockBalances(getStockBalances());
        setMovements(getStockMovements());
    }, []);

    // Load stock data from localStorage
    useEffect(() => {
        initializeStockData();
        loadStockData();
    }, [loadStockData]);

    // Calcular estadísticas
    const totalProducts = stockBalances.length;
    const totalUnits = stockBalances.reduce((sum, p) => sum + p.balance, 0);
    const ownStock = stockBalances.filter(p => p.stockType === 'own');
    const consignedStock = stockBalances.filter(p => p.stockType === 'consigned');
    const thirdPartyStock = stockBalances.filter(p => p.stockType === 'third_party');

    // Valor total calculado con precios unitarios reales (products sin precio se muestran como $0)
    const totalValue = stockBalances.reduce((sum, p) => sum + (p.balance * (p.unitPrice || 0)), 0);

    const stats = [
        {
            label: 'Total Productos',
            value: totalProducts,
            icon: Package,
            color: 'from-blue-500 to-blue-600',
            textColor: 'text-blue-600'
        },
        {
            label: 'Total Unidades',
            value: totalUnits.toLocaleString(),
            icon: Box,
            color: 'from-indigo-500 to-indigo-600',
            textColor: 'text-indigo-600'
        },
        {
            label: 'Stock Propio',
            value: ownStock.reduce((sum, p) => sum + p.balance, 0).toLocaleString(),
            icon: TrendingUp,
            color: 'from-green-500 to-green-600',
            textColor: 'text-green-600'
        },
        {
            label: 'Stock Consignado',
            value: consignedStock.reduce((sum, p) => sum + p.balance, 0).toLocaleString(),
            icon: Layers,
            color: 'from-purple-500 to-purple-600',
            textColor: 'text-purple-600'
        }
    ];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Obtener categorías únicas
    const categories = ['all', ...new Set(stockBalances.map(p => p.cropDescription))];
    const warehouses = ['all', ...new Set(stockBalances.map(p => p.warehouse))];

    // Filtrar productos
    const filteredBalances = stockBalances.filter(product => {
        const matchesSearch = product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.productSapCode?.toString().includes(searchTerm);

        const matchesCategory = categoryFilter === 'all' || product.cropDescription === categoryFilter;
        const matchesStockType = stockTypeFilter === 'all' || product.stockType === stockTypeFilter;
        const matchesWarehouse = warehouseFilter === 'all' || product.warehouse === warehouseFilter;

        return matchesSearch && matchesCategory && matchesStockType && matchesWarehouse;
    });

    // Filtrar movimientos con los nuevos filtros
    const filteredMovements = movements.filter(movement => {
        const matchesSearch = !searchTerm || movement.lines?.some(line =>
            line.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            line.productSapCode?.toString().includes(searchTerm)
        );
        const matchesMovementType = movementTypeFilter === 'all' || movement.type === movementTypeFilter;
        const matchesStockType = movementStockTypeFilter === 'all' || movement.stockType === movementStockTypeFilter;
        const matchesDateFrom = !dateFrom || movement.movementDate >= dateFrom;
        const matchesDateTo = !dateTo || movement.movementDate <= dateTo;
        return matchesSearch && matchesMovementType && matchesStockType && matchesDateFrom && matchesDateTo;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-24 xl:pb-8 xl:pt-14">
            {/* Compact Sticky Header - Only Logo, Title & Tabs */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
                    <div className="flex items-center justify-between">
                        {/* Logo & Title - Compact */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                                <Box className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">Stock</h1>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-1 sm:gap-2">
                            <button
                                onClick={() => setViewMode('balances')}
                                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${viewMode === 'balances'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}
                            >
                                📦 Balances
                            </button>
                            <button
                                onClick={() => setViewMode('movements')}
                                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${viewMode === 'movements'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}
                            >
                                📊 Movimientos
                            </button>
                            <button
                                onClick={() => setViewMode('totalizer')}
                                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${viewMode === 'totalizer'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}
                            >
                                📋 Totalizador
                            </button>
                            {/* Egresar */}
                            <button
                                onClick={() => setShowEgressModal(true)}
                                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-lg flex items-center gap-1"
                            >
                                <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Egresar Stock</span>
                                <span className="sm:hidden">➖</span>
                            </button>
                            {/* Agregar */}
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Agregar Stock</span>
                                <span className="sm:hidden">➕</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content - Stats, Search & Filters (only for balances/movements) */}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                {viewMode !== 'totalizer' && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700 shadow-sm"
                                >
                                    <div className="flex flex-col items-center gap-1 sm:gap-2">
                                        <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.textColor}`} />
                                        <span className={`text-xl sm:text-2xl font-bold ${stat.textColor}`}>{stat.value}</span>
                                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium text-center">{stat.label}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Valor Total */}
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 sm:p-6 text-white mb-4 sm:mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm opacity-90 mb-1">Valor Total del Stock</p>
                                    <p className="text-2xl sm:text-4xl font-bold">{formatCurrency(totalValue)}</p>
                                    <p className="text-xs opacity-75 mt-1">Calculado con precios unitarios asignados</p>
                                </div>
                                <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 opacity-20" />
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative mb-3 sm:mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {/* Filters */}
                        {viewMode === 'balances' && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="all">Todos los productos</option>
                                    {categories.filter(c => c !== 'all').map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                                <select
                                    value={stockTypeFilter}
                                    onChange={(e) => setStockTypeFilter(e.target.value)}
                                    className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="all">Tipo de stock</option>
                                    <option value="own">Propio</option>
                                    <option value="consigned">Consignado</option>
                                    <option value="third_party">Tercero</option>
                                </select>
                                <select
                                    value={warehouseFilter}
                                    onChange={(e) => setWarehouseFilter(e.target.value)}
                                    className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="all">Todos los depósitos</option>
                                    {warehouses.filter(w => w !== 'all').map(warehouse => (
                                        <option key={warehouse} value={warehouse}>{warehouse}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {viewMode === 'movements' && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                                <select
                                    value={movementTypeFilter}
                                    onChange={(e) => setMovementTypeFilter(e.target.value)}
                                    className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="all">📊 Todos los movimientos</option>
                                    <option value="in">⬆️ Solo Ingresos</option>
                                    <option value="out">⬇️ Solo Egresos</option>
                                </select>
                                <select
                                    value={movementStockTypeFilter}
                                    onChange={(e) => setMovementStockTypeFilter(e.target.value)}
                                    className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="all">Tipo de stock</option>
                                    <option value="own">🏢 Propio</option>
                                    <option value="consigned">📦 Consignado</option>
                                    <option value="third_party">🤝 Tercero</option>
                                </select>
                                <div className="relative">
                                    <label className="absolute -top-2 left-2 text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-1">Desde</label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="relative">
                                    <label className="absolute -top-2 left-2 text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-1">Hasta</label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Data Content */}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-6">
                {viewMode === 'balances' && (
                    // BALANCES VIEW
                    filteredBalances.length === 0 ? (
                        <div className="text-center py-16">
                            <Box className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                No hay productos
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                No se encontraron productos con los filtros aplicados
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredBalances.map((product, index) => (
                                <motion.div
                                    key={product.productSapCode}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                        {product.productName}
                                                    </h3>
                                                    {(() => {
                                                        const STOCK_BADGE = {
                                                            own: { label: '🏢 Propio', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
                                                            consigned: { label: '📦 Consignado', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
                                                            third_party: { label: '🤝 Tercero', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
                                                        };
                                                        const badge = STOCK_BADGE[product.stockType] || STOCK_BADGE.own;
                                                        return (
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                                                                {badge.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                                    <span className="font-mono">SAP: {product.productSapCode}</span>
                                                    <span>•</span>
                                                    <span>{product.cropDescription}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Layers className="w-3 h-3" />
                                                        {product.warehouse}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setProductToEdit(product);
                                                    setShowEditModal(true);
                                                }}
                                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                                                title="Editar producto"
                                            >
                                                <Edit2 size={18} className="text-blue-600 dark:text-blue-400" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ingresos</p>
                                                <p className="text-lg font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                                                    <ArrowUpCircle className="w-4 h-4" />
                                                    {product.entries.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Egresos</p>
                                                <p className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                                                    <ArrowDownCircle className="w-4 h-4" />
                                                    {product.exits.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Balance Actual</p>
                                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                                    {product.balance.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Precio Unit.</p>
                                                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                                    {product.unitPrice != null ? formatCurrency(product.unitPrice) : <span className="text-slate-400 text-sm">Sin precio</span>}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Valor Total</p>
                                                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                                    {product.unitPrice != null ? formatCurrency(product.balance * product.unitPrice) : <span className="text-slate-400 text-sm">—</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )
                )}

                {viewMode === 'movements' && (
                    // MOVEMENTS VIEW
                    filteredMovements.length === 0 ? (
                        <div className="text-center py-16">
                            <Package className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                No hay movimientos
                            </h3>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredMovements.map((movement, index) => (
                                <motion.div
                                    key={movement.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${movement.type === 'in'
                                                ? 'bg-green-100 dark:bg-green-900/30'
                                                : 'bg-red-100 dark:bg-red-900/30'
                                                }`}>
                                                {movement.type === 'in' ? (
                                                    <ArrowUpCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                                ) : (
                                                    <ArrowDownCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                        {movement.type === 'in' ? 'Ingreso de Stock' : 'Egreso de Stock'}
                                                    </h3>
                                                    {(() => {
                                                        const STOCK_BADGE = {
                                                            own: { label: '🏢 Propio', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
                                                            consigned: { label: '📦 Consignado', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
                                                            third_party: { label: '🤝 Tercero', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
                                                        };
                                                        const badge = STOCK_BADGE[movement.stockType] || STOCK_BADGE.own;
                                                        return (
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.cls}`}>
                                                                {badge.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    {movement.movementDate} • {movement.lines.length} producto(s)
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            {movement.lines.map((line, idx) => (
                                                <div key={line.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                                                    <div className="flex-1">
                                                        <span className="font-medium text-slate-900 dark:text-white">{line.productName}</span>
                                                        <span className="text-slate-500 dark:text-slate-400 ml-2">SAP: {line.productSapCode}</span>
                                                    </div>
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {line.quantity.toLocaleString()} unidades
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-sm">
                                            <div>
                                                <p className="text-slate-500 dark:text-slate-400">Origen</p>
                                                <p className="font-semibold text-slate-900 dark:text-white">{movement.origin || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 dark:text-slate-400">Destino</p>
                                                <p className="font-semibold text-slate-900 dark:text-white">{movement.destination || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 dark:text-slate-400">Motivo</p>
                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                    {{
                                                        sale: '🛒 Venta',
                                                        adjustment: '🔧 Ajuste',
                                                        loss: '⚠️ Merma',
                                                        devolution: '↩️ Devolución',
                                                        transfer: '🚚 Transferencia',
                                                        ingress: '📥 Ingreso',
                                                        other: '📝 Otro',
                                                    }[movement.reason] || movement.reason || '—'}
                                                </p>
                                            </div>
                                        </div>
                                        {movement.notes && (
                                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic border-t border-slate-100 dark:border-slate-700 pt-2">
                                                📝 {movement.notes}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )
                )}

                {/* TOTALIZER VIEW */}
                {viewMode === 'totalizer' && (
                    <div>
                        {/* Search & Add product */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-4 sm:mb-6">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                <ClipboardList className="w-4 h-4" />
                                Agregar productos al totalizador
                            </h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={totalizerSearch}
                                    onChange={(e) => {
                                        setTotalizerSearch(e.target.value);
                                        setShowTotalizerDropdown(e.target.value.length > 0);
                                    }}
                                    placeholder="Buscar producto por nombre o SAP..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                />
                                {showTotalizerDropdown && (
                                    <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                        {stockBalances
                                            .filter(p => {
                                                const q = totalizerSearch.toLowerCase();
                                                const matchesSearch = !q || p.productName?.toLowerCase().includes(q) || p.productSapCode?.toString().includes(q);
                                                const notAlreadyAdded = !totalizerItems.some(ti => ti.productSapCode === p.productSapCode);
                                                return matchesSearch && notAlreadyAdded && p.balance > 0;
                                            })
                                            .map(p => (
                                                <button
                                                    key={p.productSapCode}
                                                    type="button"
                                                    onClick={() => {
                                                        setTotalizerItems(prev => [...prev, { ...p }]);
                                                        setTotalizerSearch('');
                                                        setShowTotalizerDropdown(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-green-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{p.productName}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">SAP {p.productSapCode} · {p.warehouse} · {p.cropDescription}</p>
                                                        </div>
                                                        <div className="text-right ml-3 flex-shrink-0">
                                                            <span className="text-sm font-bold text-emerald-600">{p.balance.toLocaleString()} u.</span>
                                                            {p.unitPrice ? (
                                                                <p className="text-[10px] text-slate-400">{formatCurrency(p.unitPrice)}/u</p>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        {stockBalances.filter(p => {
                                            const q = totalizerSearch.toLowerCase();
                                            return (!q || p.productName?.toLowerCase().includes(q) || p.productSapCode?.toString().includes(q)) &&
                                                !totalizerItems.some(ti => ti.productSapCode === p.productSapCode) && p.balance > 0;
                                        }).length === 0 && (
                                                <p className="px-4 py-3 text-sm text-slate-500">No hay productos disponibles</p>
                                            )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Totalizer items list */}
                        {totalizerItems.length === 0 ? (
                            <div className="text-center py-16">
                                <ClipboardList className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                    Totalizador vacío
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Agregá productos del stock para ver el resumen y realizar acciones
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-3">
                                    {totalizerItems.map((item, index) => {
                                        const STOCK_BADGE = {
                                            own: { label: '🏢 Propio', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
                                            consigned: { label: '📦 Consignado', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
                                            third_party: { label: '🤝 Tercero', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
                                        };
                                        const badge = STOCK_BADGE[item.stockType] || STOCK_BADGE.own;
                                        const itemValue = item.balance * (item.unitPrice || 0);

                                        return (
                                            <motion.div
                                                key={item.productSapCode}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.productName}</h4>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.cls}`}>{badge.label}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                                            SAP {item.productSapCode} · {item.cropDescription} · {item.warehouse}
                                                        </p>
                                                        <div className="grid grid-cols-3 gap-3 text-xs">
                                                            <div>
                                                                <p className="text-slate-400">Balance</p>
                                                                <p className="font-bold text-slate-900 dark:text-white">{item.balance.toLocaleString()} u.</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-400">Precio Unit.</p>
                                                                <p className="font-bold text-slate-900 dark:text-white">
                                                                    {item.unitPrice ? formatCurrency(item.unitPrice) : 'Sin precio'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-400">Valor Total</p>
                                                                <p className="font-bold text-emerald-600">
                                                                    {itemValue > 0 ? formatCurrency(itemValue) : '—'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setTotalizerItems(prev => prev.filter(i => i.productSapCode !== item.productSapCode))}
                                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                                                        title="Quitar del totalizador"
                                                    >
                                                        <X className="w-4 h-4 text-red-400" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {/* Totalizer Summary Footer */}
                                <div className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-5 text-white">
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <p className="text-xs opacity-75">Productos</p>
                                            <p className="text-2xl font-bold">{totalizerItems.length}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs opacity-75">Unidades totales</p>
                                            <p className="text-2xl font-bold">{totalizerItems.reduce((s, i) => s + i.balance, 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs opacity-75">Valor total</p>
                                            <p className="text-2xl font-bold">{formatCurrency(totalizerItems.reduce((s, i) => s + (i.balance * (i.unitPrice || 0)), 0))}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-3 border-t border-white/20">
                                        <button
                                            onClick={() => setShowBulkEgressModal(true)}
                                            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg"
                                        >
                                            <Minus className="w-3.5 h-3.5" /> Egresar todo
                                        </button>
                                        <button
                                            onClick={exportTotalizerToExcel}
                                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Bajar a Excel
                                        </button>
                                        <button
                                            onClick={() => { saveTotalizerToHistory(); }}
                                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                        >
                                            <Clock className="w-3.5 h-3.5" /> Guardar en historial
                                        </button>
                                        <button
                                            onClick={() => setTotalizerItems([])}
                                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Limpiar todo
                                        </button>
                                        <button
                                            disabled
                                            className="px-3 py-1.5 bg-white/10 rounded-lg text-xs font-medium opacity-50 cursor-not-allowed flex items-center gap-1"
                                            title="Próximamente"
                                        >
                                            📝 Remitir desde stock
                                        </button>
                                        <button
                                            disabled
                                            className="px-3 py-1.5 bg-white/10 rounded-lg text-xs font-medium opacity-50 cursor-not-allowed flex items-center gap-1"
                                            title="Próximamente"
                                        >
                                            🧾 Facturar desde stock
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Totalizer History */}
                {viewMode === 'totalizer' && (
                    <div className="mt-6">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 hover:text-green-600 transition-colors"
                        >
                            <History className="w-4 h-4" />
                            Historial de totalizadores ({totalizerHistory.length})
                            <span className="text-xs text-slate-400">{showHistory ? '▲' : '▼'}</span>
                        </button>

                        {showHistory && (
                            <div className="space-y-2">
                                {totalizerHistory.length === 0 ? (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                                        No hay totalizadores guardados aún
                                    </p>
                                ) : (
                                    totalizerHistory.map(entry => (
                                        <div
                                            key={entry.id}
                                            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between gap-3"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {entry.date}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {entry.itemCount} producto(s) · {entry.totalUnits.toLocaleString()} u. · {formatCurrency(entry.totalValue)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                <button
                                                    onClick={() => loadHistoryEntry(entry)}
                                                    className="px-2.5 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                >
                                                    Cargar
                                                </button>
                                                <button
                                                    onClick={() => deleteHistoryEntry(entry.id)}
                                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Stock Modal */}
            <AddStockModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={loadStockData}
            />
            {/* Egress Stock Modal */}
            <EgressStockModal
                isOpen={showEgressModal}
                onClose={() => setShowEgressModal(false)}
                onSuccess={loadStockData}
            />
            {/* Edit Stock Product Modal */}
            <EditStockProductModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setProductToEdit(null);
                }}
                product={productToEdit}
                onSuccess={loadStockData}
            />
            {/* Bulk Egress Modal */}
            <BulkEgressModal
                isOpen={showBulkEgressModal}
                onClose={() => setShowBulkEgressModal(false)}
                items={totalizerItems}
                onSuccess={() => {
                    loadStockData();
                    setTotalizerItems([]);
                }}
            />
        </div >
    );
};

export default Stock;
