/**
 * Stock Service
 * Manages stock balances and movements in localStorage
 */

import { stockBalances } from '../data/stock';

// Local storage key
const STOCK_BALANCES_KEY = 'crm_stock_balances';

/**
 * Initialize stock data from mock data if localStorage is empty
 */
export const initializeStockData = () => {
    try {
        const existing = localStorage.getItem(STOCK_BALANCES_KEY);
        if (!existing) {
            localStorage.setItem(STOCK_BALANCES_KEY, JSON.stringify(stockBalances));
        }
    } catch (error) {
        console.error('Error initializing stock data:', error);
    }
};

/**
 * Get all stock balances from localStorage
 * @returns {Array} Array of stock balance objects
 */
export const getStockBalances = () => {
    try {
        const stored = localStorage.getItem(STOCK_BALANCES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading stock balances:', error);
        return [];
    }
};

/**
 * Add new product to stock
 * @param {Object} product - Product data
 * @param {number} product.productSapCode - SAP code
 * @param {string} product.productName - Product name
 * @param {string} product.cropDescription - Crop/category
 * @param {string} product.stockType - 'own' or 'consigned'
 * @param {string} product.warehouse - Warehouse location
 * @param {number} product.initialQuantity - Initial quantity
 * @returns {Object} Added product
 */
export const addStockProduct = (product) => {
    try {
        const balances = getStockBalances();

        // Check if SAP code already exists
        const exists = balances.find(p => p.productSapCode === product.productSapCode);
        if (exists) {
            throw new Error(`Product with SAP code ${product.productSapCode} already exists`);
        }

        // Create new product with proper structure
        const newProduct = {
            productSapCode: product.productSapCode,
            productName: product.productName,
            cropDescription: product.cropDescription,
            stockType: product.stockType,
            warehouse: product.warehouse,
            entries: product.initialQuantity,
            exits: 0,
            balance: product.initialQuantity
        };

        balances.push(newProduct);
        localStorage.setItem(STOCK_BALANCES_KEY, JSON.stringify(balances));

        return newProduct;
    } catch (error) {
        console.error('Error adding product to stock:', error);
        throw error;
    }
};

/**
 * Update existing product balance
 * @param {number} sapCode - SAP code of product
 * @param {number} quantityChange - Quantity to add (positive) or subtract (negative)
 * @returns {Object} Updated product
 */
export const updateStockBalance = (sapCode, quantityChange) => {
    try {
        const balances = getStockBalances();
        const productIndex = balances.findIndex(p => p.productSapCode === sapCode);

        if (productIndex === -1) {
            throw new Error(`Product with SAP code ${sapCode} not found`);
        }

        const product = balances[productIndex];

        if (quantityChange > 0) {
            product.entries += quantityChange;
        } else {
            product.exits += Math.abs(quantityChange);
        }

        product.balance = product.entries - product.exits;

        balances[productIndex] = product;
        localStorage.setItem(STOCK_BALANCES_KEY, JSON.stringify(balances));

        return product;
    } catch (error) {
        console.error('Error updating product balance:', error);
        throw error;
    }
};

/**
 * Register a stock egress (exit) for an existing product
 * @param {Object} egress
 * @param {number} egress.productSapCode - SAP code of product to deduct
 * @param {number} egress.quantity       - Units to remove (must be > 0)
 * @param {string} egress.reason         - Egress reason key
 * @param {string} [egress.notes]        - Optional notes
 * @returns {Object} Updated product balance
 */
export const egressStockProduct = (egress) => {
    try {
        const balances = getStockBalances();
        const product = balances.find(p => p.productSapCode === egress.productSapCode);

        if (!product) {
            throw new Error(`No se encontró el producto con código SAP ${egress.productSapCode}`);
        }
        if (egress.quantity <= 0) {
            throw new Error('La cantidad del egreso debe ser mayor a 0');
        }
        if (egress.quantity > product.balance) {
            throw new Error(
                `Stock insuficiente. Disponible: ${product.balance.toLocaleString()} unidades`
            );
        }

        return updateStockBalance(egress.productSapCode, -egress.quantity);
    } catch (error) {
        console.error('Error registering stock egress:', error);
        throw error;
    }
};

/**
 * Get product by SAP code
 * @param {number} sapCode - SAP code
 * @returns {Object|null} Product or null if not found
 */
export const getProductBySapCode = (sapCode) => {
    const balances = getStockBalances();
    return balances.find(p => p.productSapCode === sapCode) || null;
};

/**
 * Get unique categories from stock
 * @returns {Array} Array of category names
 */
export const getCategories = () => {
    const balances = getStockBalances();
    return [...new Set(balances.map(p => p.cropDescription))].sort();
};

/**
 * Get unique warehouses from stock
 * @returns {Array} Array of warehouse names
 */
export const getWarehouses = () => {
    const balances = getStockBalances();
    return [...new Set(balances.map(p => p.warehouse))].sort();
};
