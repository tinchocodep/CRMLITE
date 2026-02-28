/**
 * Stock Service
 * Manages stock balances and movements in localStorage
 */

import { stockBalances, stockMovementsIn, stockMovementsOut } from '../data/stock';

// Local storage keys
const STOCK_BALANCES_KEY = 'crm_stock_balances';
const STOCK_MOVEMENTS_KEY = 'crm_stock_movements';

// ─── Initialization ──────────────────────────────────────────────────────────

/**
 * Initialize stock data from mock data if localStorage is empty
 */
export const initializeStockData = () => {
    try {
        const existingBalances = localStorage.getItem(STOCK_BALANCES_KEY);
        if (!existingBalances) {
            localStorage.setItem(STOCK_BALANCES_KEY, JSON.stringify(stockBalances));
        }

        const existingMovements = localStorage.getItem(STOCK_MOVEMENTS_KEY);
        if (!existingMovements) {
            const mockMovements = [...stockMovementsIn, ...stockMovementsOut];
            localStorage.setItem(STOCK_MOVEMENTS_KEY, JSON.stringify(mockMovements));
        }
    } catch (error) {
        console.error('Error initializing stock data:', error);
    }
};

// ─── Balances ─────────────────────────────────────────────────────────────────

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

// ─── Movements ────────────────────────────────────────────────────────────────

/**
 * Get all stock movements from localStorage, sorted by date descending
 * @returns {Array} Array of movement objects
 */
export const getStockMovements = () => {
    try {
        const stored = localStorage.getItem(STOCK_MOVEMENTS_KEY);
        const movements = stored ? JSON.parse(stored) : [];
        return movements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
        console.error('Error loading stock movements:', error);
        return [];
    }
};

/**
 * Save a new movement record to localStorage (private helper)
 * @param {Object} movement - Movement data
 */
const saveMovement = (movement) => {
    try {
        const movements = getStockMovements();
        movements.push(movement);
        localStorage.setItem(STOCK_MOVEMENTS_KEY, JSON.stringify(movements));
    } catch (error) {
        console.error('Error saving stock movement:', error);
    }
};

// ─── Product Operations ───────────────────────────────────────────────────────

/**
 * Add new product to stock
 * Also registers an ingress movement automatically
 * @param {Object} product - Product data
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
            balance: product.initialQuantity,
            unitPrice: product.unitPrice ?? null
        };

        balances.push(newProduct);
        localStorage.setItem(STOCK_BALANCES_KEY, JSON.stringify(balances));

        // Register ingress movement
        saveMovement({
            id: `stock-in-${Date.now()}`,
            type: 'in',
            stockType: product.stockType,
            origin: 'Ingreso inicial',
            destination: product.warehouse,
            movementDate: new Date().toISOString().split('T')[0],
            lines: [{
                id: 'line-1',
                productSapCode: product.productSapCode,
                productName: product.productName,
                quantity: product.initialQuantity,
            }],
            createdAt: new Date().toISOString()
        });

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
 * Also registers an egress movement automatically
 * @param {Object} egress
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

        const updatedProduct = updateStockBalance(egress.productSapCode, -egress.quantity);

        // Determine destination label
        let destination = 'Egreso';
        if (egress.destination) {
            destination = egress.destination;
        } else if (egress.reason === 'transfer' && egress.transferDestination) {
            destination = egress.transferDestination;
        } else if (egress.reason === 'sale') {
            destination = 'Venta';
        } else if (egress.reason === 'adjustment') {
            destination = 'Ajuste de inventario';
        } else if (egress.reason === 'loss') {
            destination = 'Merma / Pérdida';
        } else if (egress.reason === 'devolution') {
            destination = 'Devolución a proveedor';
        }

        // Determine origin label
        const origin = egress.origin || product.warehouse;

        // Register egress movement
        saveMovement({
            id: `stock-out-${Date.now()}`,
            type: 'out',
            stockType: product.stockType,
            origin,
            destination,
            movementDate: new Date().toISOString().split('T')[0],
            reason: egress.reason,
            notes: egress.notes || null,
            lines: [{
                id: 'line-1',
                productSapCode: product.productSapCode,
                productName: product.productName,
                quantity: egress.quantity,
            }],
            createdAt: new Date().toISOString()
        });

        return updatedProduct;
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
 * Update an existing stock product fields (e.g. unitPrice, name, warehouse)
 * @param {number|string} sapCode - SAP code of product to update
 * @param {Object} updates - Partial object with fields to merge
 * @returns {Object} Updated product
 */
export const updateStockProduct = (sapCode, updates) => {
    try {
        const balances = getStockBalances();
        const productIndex = balances.findIndex(p => String(p.productSapCode) === String(sapCode));

        if (productIndex === -1) {
            throw new Error(`Producto con SAP ${sapCode} no encontrado`);
        }

        // Merge updates into existing product (immutable pattern)
        balances[productIndex] = { ...balances[productIndex], ...updates };
        localStorage.setItem(STOCK_BALANCES_KEY, JSON.stringify(balances));

        return balances[productIndex];
    } catch (error) {
        console.error('Error updating stock product:', error);
        throw error;
    }
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
