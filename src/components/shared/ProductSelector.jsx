import React, { useState } from 'react';
import { Plus, X, Search, Package, DollarSign, Hash } from 'lucide-react';
import { products } from '../../data/products';

const ProductSelector = ({ selectedProducts = [], onChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showProductList, setShowProductList] = useState(false);

    const filteredProducts = products.filter(product =>
        product.hybridNameAtSkuLevel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sapCode.toString().includes(searchTerm) ||
        product.cropDescription.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addProduct = (product) => {
        const existingProduct = selectedProducts.find(p => p.productSapCode === product.sapCode);

        if (existingProduct) {
            // Increment quantity if already exists
            const updated = selectedProducts.map(p =>
                p.productSapCode === product.sapCode
                    ? { ...p, quantity: p.quantity + 1 }
                    : p
            );
            onChange(updated);
        } else {
            // Add new product
            const newProduct = {
                productSapCode: product.sapCode,
                productName: product.hybridNameAtSkuLevel,
                quantity: 1,
                unitPrice: product.precio
            };
            onChange([...selectedProducts, newProduct]);
        }

        setSearchTerm('');
        setShowProductList(false);
    };

    const removeProduct = (sapCode) => {
        onChange(selectedProducts.filter(p => p.productSapCode !== sapCode));
    };

    const updateQuantity = (sapCode, quantity) => {
        const updated = selectedProducts.map(p =>
            p.productSapCode === sapCode
                ? { ...p, quantity: Math.max(1, parseInt(quantity) || 1) }
                : p
        );
        onChange(updated);
    };

    const updatePrice = (sapCode, price) => {
        const updated = selectedProducts.map(p =>
            p.productSapCode === sapCode
                ? { ...p, unitPrice: Math.max(0, parseFloat(price) || 0) }
                : p
        );
        onChange(updated);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const calculateTotal = () => {
        return selectedProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
    };

    return (
        <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                <Package size={14} className="inline mr-1.5" />
                Productos
            </label>

            {/* Search and Add */}
            <div className="relative">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowProductList(true);
                        }}
                        onFocus={() => setShowProductList(true)}
                        placeholder="Buscar producto por nombre o código SAP..."
                        className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-advanta-green focus:ring-2 focus:ring-red-100 outline-none"
                    />
                </div>

                {/* Product Dropdown */}
                {showProductList && searchTerm && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.slice(0, 10).map((product) => (
                                <button
                                    key={product.sapCode}
                                    type="button"
                                    onClick={() => addProduct(product)}
                                    className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-slate-800">{product.hybridNameAtSkuLevel}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                SAP: {product.sapCode} • {product.cropDescription}
                                            </p>
                                        </div>
                                        <p className="text-sm font-bold text-advanta-green ml-3">{formatCurrency(product.precio)}</p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-slate-500 text-center">
                                No se encontraron productos
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Selected Products */}
            {selectedProducts.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-600 uppercase">Productos Seleccionados ({selectedProducts.length})</p>
                    {selectedProducts.map((product) => (
                        <div key={product.productSapCode} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                            <div className="flex items-start gap-3">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-800">{product.productName}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">SAP: {product.productSapCode}</p>

                                    {/* Quantity and Price Inputs */}
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div>
                                            <label className="text-xs text-slate-600 block mb-1">
                                                <Hash size={12} className="inline mr-1" />
                                                Cantidad
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={product.quantity}
                                                onChange={(e) => updateQuantity(product.productSapCode, e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:border-advanta-green focus:ring-1 focus:ring-red-100 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-600 block mb-1">
                                                <DollarSign size={12} className="inline mr-1" />
                                                Precio Unit.
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={product.unitPrice}
                                                onChange={(e) => updatePrice(product.productSapCode, e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:border-advanta-green focus:ring-1 focus:ring-red-100 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Subtotal */}
                                    <div className="mt-2 pt-2 border-t border-slate-200">
                                        <p className="text-xs text-slate-600">
                                            Subtotal: <span className="font-bold text-advanta-green">{formatCurrency(product.quantity * product.unitPrice)}</span>
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => removeProduct(product.productSapCode)}
                                    className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Total */}
                    <div className="bg-gradient-to-r from-advanta-green/10 to-green-100 rounded-lg p-3 border-2 border-advanta-green/30">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-700">Total Estimado</span>
                            <span className="text-lg font-bold text-advanta-green">{formatCurrency(calculateTotal())}</span>
                        </div>
                    </div>
                </div>
            )}

            {selectedProducts.length === 0 && (
                <div className="text-center py-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                    <Package size={32} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500">No hay productos seleccionados</p>
                    <p className="text-xs text-slate-400 mt-1">Busca y agrega productos arriba</p>
                </div>
            )}
        </div>
    );
};

export default ProductSelector;
