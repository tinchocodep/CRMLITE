/**
 * Orders Service
 * Manages orders in localStorage with persistence across pages
 */

const ORDERS_STORAGE_KEY = 'crm_orders';

/**
 * Get all orders from localStorage
 */
export const getAllOrders = () => {
    try {
        const ordersJson = localStorage.getItem(ORDERS_STORAGE_KEY);
        return ordersJson ? JSON.parse(ordersJson) : [];
    } catch (error) {
        console.error('Error loading orders:', error);
        return [];
    }
};

/**
 * Save a new order
 */
export const saveOrder = (orderData) => {
    try {
        const orders = getAllOrders();

        // Generate order number if not provided
        if (!orderData.orderNumber) {
            const year = new Date().getFullYear();
            const nextNumber = orders.length + 1;
            orderData.orderNumber = `PED-${year}-${String(nextNumber).padStart(3, '0')}`;
        }

        // Generate ID if not provided
        if (!orderData.id) {
            orderData.id = `ord-${Date.now()}`;
        }

        // Add timestamp
        if (!orderData.createdAt) {
            orderData.createdAt = new Date().toISOString();
        }

        // Default status
        if (!orderData.status) {
            orderData.status = 'pending';
        }

        const newOrder = {
            ...orderData,
            updatedAt: new Date().toISOString()
        };

        orders.push(newOrder);
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));

        console.log('✅ Order saved:', newOrder);
        return newOrder;
    } catch (error) {
        console.error('Error saving order:', error);
        throw error;
    }
};

/**
 * Update an existing order
 */
export const updateOrder = (orderId, updates) => {
    try {
        const orders = getAllOrders();
        const index = orders.findIndex(o => o.id === orderId);

        if (index === -1) {
            throw new Error(`Order ${orderId} not found`);
        }

        orders[index] = {
            ...orders[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));

        console.log('✅ Order updated:', orders[index]);
        return orders[index];
    } catch (error) {
        console.error('Error updating order:', error);
        throw error;
    }
};

/**
 * Get orders by quotation ID
 */
export const getOrdersByQuotation = (quotationId) => {
    const orders = getAllOrders();
    return orders.filter(o => o.quotationId === quotationId);
};

/**
 * Get order by ID
 */
export const getOrderById = (orderId) => {
    const orders = getAllOrders();
    return orders.find(o => o.id === orderId);
};

/**
 * Delete an order
 */
export const deleteOrder = (orderId) => {
    try {
        const orders = getAllOrders();
        const filtered = orders.filter(o => o.id !== orderId);
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(filtered));

        console.log('✅ Order deleted:', orderId);
        return true;
    } catch (error) {
        console.error('Error deleting order:', error);
        throw error;
    }
};
