import React, { useState } from 'react';
import { Package, Search, Filter, Plus, Edit2, AlertTriangle, TrendingDown, TrendingUp, Box, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const Stock = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all'); // all, low, out, available

    // Mock data - esto se conectará con Supabase
    const [products, setProducts] = useState([
        {
            id: 1,
            code: 'PROD-001',
            name: 'Semilla Maíz Premium',
            category: 'Semillas',
            currentStock: 150,
            minStock: 50,
            maxStock: 500,
            unit: 'bolsas',
            price: 12500,
            location: 'Depósito A - Estante 3'
        },
        {
            id: 2,
            code: 'PROD-002',
            name: 'Fertilizante NPK',
            category: 'Fertilizantes',
            currentStock: 25,
            minStock: 100,
            maxStock: 300,
            unit: 'kg',
            price: 850,
            location: 'Depósito B - Estante 1'
        },
        {
            id: 3,
            code: 'PROD-003',
            name: 'Herbicida Glifosato',
            category: 'Agroquímicos',
            currentStock: 0,
            minStock: 20,
            maxStock: 100,
            unit: 'litros',
            price: 3200,
            location: 'Depósito C - Estante 2'
        },
        {
            id: 4,
            code: 'PROD-004',
            name: 'Semilla Soja RR',
            category: 'Semillas',
            currentStock: 320,
            minStock: 100,
            maxStock: 500,
            unit: 'bolsas',
            price: 15000,
            location: 'Depósito A - Estante 1'
        }
    ]);

    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock);
    const outOfStockProducts = products.filter(p => p.currentStock === 0);
    const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.price), 0);

    const stats = [
        {
            label: 'Total Productos',
            value: totalProducts,
            icon: Package,
            color: 'from-blue-500 to-blue-600',
            textColor: 'text-blue-600'
        },
        {
            label: 'Stock Bajo',
            value: lowStockProducts.length,
            icon: AlertTriangle,
            color: 'from-amber-500 to-amber-600',
            textColor: 'text-amber-600'
        },
        {
            label: 'Sin Stock',
            value: outOfStockProducts.length,
            icon: TrendingDown,
            color: 'from-red-500 to-red-600',
            textColor: 'text-red-600'
        },
        {
            label: 'Valor Total',
            value: `$${(totalValue / 1000).toFixed(0)}K`,
            icon: TrendingUp,
            color: 'from-green-500 to-green-600',
            textColor: 'text-green-600'
        }
    ];

    const getStockStatus = (product) => {
        if (product.currentStock === 0) {
            return { label: 'Sin Stock', color: 'bg-red-100 text-red-700 border-red-200', icon: TrendingDown };
        }
        if (product.currentStock <= product.minStock) {
            return { label: 'Stock Bajo', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle };
        }
        return { label: 'Disponible', color: 'bg-green-100 text-green-700 border-green-200', icon: TrendingUp };
    };

    const getStockPercentage = (product) => {
        return Math.min((product.currentStock / product.maxStock) * 100, 100);
    };

    const categories = ['all', ...new Set(products.map(p => p.category))];

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.code?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;

        let matchesStock = true;
        if (stockFilter === 'low') matchesStock = product.currentStock > 0 && product.currentStock <= product.minStock;
        if (stockFilter === 'out') matchesStock = product.currentStock === 0;
        if (stockFilter === 'available') matchesStock = product.currentStock > product.minStock;

        return matchesSearch && matchesCategory && matchesStock;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-24 xl:pb-8">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                <Box className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Stock</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Control de inventario de productos</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-advanta-green to-green-600 text-white rounded-lg hover:shadow-lg transition-all">
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Nuevo Producto</span>
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                                    <span className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-advanta-green focus:border-transparent"
                            />
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-advanta-green focus:border-transparent"
                        >
                            <option value="all">Todas las categorías</option>
                            {categories.filter(c => c !== 'all').map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                        <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-advanta-green focus:border-transparent"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="available">Disponible</option>
                            <option value="low">Stock Bajo</option>
                            <option value="out">Sin Stock</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Products List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-16">
                        <Box className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            No hay productos
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            {searchTerm || categoryFilter !== 'all' || stockFilter !== 'all'
                                ? 'No se encontraron productos con los filtros aplicados'
                                : 'Agrega productos para comenzar a gestionar tu inventario'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredProducts.map((product, index) => {
                            const status = getStockStatus(product);
                            const StatusIcon = status.icon;

                            return (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                        {product.name}
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${status.color} flex items-center gap-1`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {status.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                                    <span className="font-mono">{product.code}</span>
                                                    <span>•</span>
                                                    <span>{product.category}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Layers className="w-3 h-3" />
                                                        {product.location}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors">
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Stock Actual</p>
                                                <p className="text-lg font-bold text-slate-900 dark:text-white">
                                                    {product.currentStock} {product.unit}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Stock Mínimo</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {product.minStock} {product.unit}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Stock Máximo</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {product.maxStock} {product.unit}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Precio Unitario</p>
                                                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                    ${product.price.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Valor Total</p>
                                                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                    ${(product.currentStock * product.price).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Stock Progress Bar */}
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                                                <span>Nivel de Stock</span>
                                                <span>{getStockPercentage(product).toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${product.currentStock === 0
                                                            ? 'bg-red-500'
                                                            : product.currentStock <= product.minStock
                                                                ? 'bg-amber-500'
                                                                : 'bg-green-500'
                                                        }`}
                                                    style={{ width: `${getStockPercentage(product)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Stock;
