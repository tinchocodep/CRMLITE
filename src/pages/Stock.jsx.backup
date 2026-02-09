import React, { useState, useEffect, useRef } from 'react';
import { Package, Search, Filter, Plus, Edit2, AlertTriangle, TrendingDown, TrendingUp, Box, Layers, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { stockBalances, stockMovementsIn, stockMovementsOut } from '../data/stock';

const Stock = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockTypeFilter, setStockTypeFilter] = useState('all'); // all, own, consigned
    const [warehouseFilter, setWarehouseFilter] = useState('all');
    const [viewMode, setViewMode] = useState('balances'); // balances, movements
    const [headerVisible, setHeaderVisible] = useState(true);
    const lastScrollY = useRef(0);

    // Handle scroll to hide/show header on mobile
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            console.log('📊 STOCK SCROLL - Y:', currentScrollY, 'Last:', lastScrollY.current, 'Visible:', headerVisible);

            // Show header when scrolling up or at top
            if (currentScrollY < lastScrollY.current || currentScrollY < 10) {
                setHeaderVisible(true);
            }
            // Hide header when scrolling down and past threshold
            else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                setHeaderVisible(false);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Calcular estadísticas
    const totalProducts = stockBalances.length;
    const totalUnits = stockBalances.reduce((sum, p) => sum + p.balance, 0);
    const ownStock = stockBalances.filter(p => p.stockType === 'own');
    const consignedStock = stockBalances.filter(p => p.stockType === 'consigned');

    // Valor estimado (precio promedio $1,400/unidad)
    const estimatedPrice = 1400;
    const totalValue = stockBalances.reduce((sum, p) => sum + (p.balance * estimatedPrice), 0);

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

    // Combinar movimientos
    const allMovements = [...stockMovementsIn, ...stockMovementsOut].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    const filteredMovements = allMovements.filter(movement => {
        const matchesSearch = movement.lines?.some(line =>
            line.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            line.productSapCode?.toString().includes(searchTerm)
        );
        return matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-24 xl:pb-8 xl:pt-14">
            {/* Header - Auto-Hide on Scroll (All Screen Sizes) */}
            <motion.div
                initial={{ y: 0 }}
                animate={{ y: headerVisible ? 0 : -800 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10"
            >
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
                    {/* Title */}
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                            <Box className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">Stock</h1>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 hidden sm:block">Control de inventario y movimientos</p>
                        </div>
                    </div>

                    {/* View Mode Tabs - Mobile Optimized */}
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <button
                            onClick={() => setViewMode('balances')}
                            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${viewMode === 'balances'
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            📦 Balances
                        </button>
                        <button
                            onClick={() => setViewMode('movements')}
                            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${viewMode === 'movements'
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            📊 Movimientos
                        </button>
                    </div>

                    {/* Stats Cards - Mobile Optimized */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-6">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-lg sm:rounded-xl p-2 sm:p-4 border border-slate-200 dark:border-slate-700 shadow-sm"
                            >
                                <div className="flex flex-col items-center gap-1 sm:gap-2">
                                    <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.textColor}`} />
                                    <span className={`text-lg sm:text-2xl font-bold ${stat.textColor}`}>{stat.value}</span>
                                    <p className="text-[9px] sm:text-xs text-slate-600 dark:text-slate-400 font-medium text-center leading-tight">{stat.label}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Valor Total */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-90 mb-1">Valor Total del Stock</p>
                                <p className="text-4xl font-bold">{formatCurrency(totalValue)}</p>
                                <p className="text-xs opacity-75 mt-1">Estimado a precio promedio de ${estimatedPrice}/unidad</p>
                            </div>
                            <TrendingUp className="w-16 h-16 opacity-20" />
                        </div>
                    </div>

                    {/* Search - Mobile Optimized */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        {viewMode === 'balances' && (
                            <>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="all">Todos los cultivos</option>
                                    {categories.filter(c => c !== 'all').map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                                <select
                                    value={stockTypeFilter}
                                    onChange={(e) => setStockTypeFilter(e.target.value)}
                                    className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="all">Todos los tipos</option>
                                    <option value="own">Propio</option>
                                    <option value="consigned">Consignado</option>
                                </select>
                                <select
                                    value={warehouseFilter}
                                    onChange={(e) => setWarehouseFilter(e.target.value)}
                                    className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="all">Todos los depósitos</option>
                                    {warehouses.filter(w => w !== 'all').map(warehouse => (
                                        <option key={warehouse} value={warehouse}>{warehouse}</option>
                                    ))}
                                </select>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {viewMode === 'balances' ? (
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
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${product.stockType === 'own'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                        }`}>
                                                        {product.stockType === 'own' ? '🏢 Propio' : '🤝 Consignado'}
                                                    </span>
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
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
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
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Valor Estimado</p>
                                                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                                    {formatCurrency(product.balance * estimatedPrice)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )
                ) : (
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
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                    {movement.type === 'in' ? 'Ingreso de Stock' : 'Egreso de Stock'}
                                                </h3>
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

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-sm">
                                            <div>
                                                <p className="text-slate-500 dark:text-slate-400">Origen</p>
                                                <p className="font-semibold text-slate-900 dark:text-white">{movement.origin}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 dark:text-slate-400">Destino</p>
                                                <p className="font-semibold text-slate-900 dark:text-white">{movement.destination}</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div >
    );
};

export default Stock;
