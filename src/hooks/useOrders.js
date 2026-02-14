import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentTenant } from './useCurrentTenant';

export const useOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { currentTenantId } = useCurrentTenant();

    // Fetch all orders with their lines
    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!currentTenantId) {
                setOrders([]);
                setLoading(false);
                return;
            }

            // Fetch orders
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .eq('tenant_id', currentTenantId)
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            // Fetch order lines for all orders
            const orderIds = ordersData.map(o => o.id);
            const { data: linesData, error: linesError } = await supabase
                .from('order_lines')
                .select('*')
                .in('order_id', orderIds)
                .order('line_order', { ascending: true });

            if (linesError) throw linesError;

            // Combine orders with their lines
            const ordersWithLines = ordersData.map(order => ({
                ...order,
                lines: linesData.filter(line => line.order_id === order.id)
            }));

            setOrders(ordersWithLines);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Create a new order
    const createOrder = async (orderData) => {
        try {
            if (!currentTenantId) {
                return { success: false, error: 'No tenant ID available' };
            }

            // Generate order number
            const { data: orderNumberData, error: orderNumberError } = await supabase
                .rpc('generate_order_number');

            if (orderNumberError) throw orderNumberError;

            const orderNumber = orderNumberData;

            // Extract lines from orderData
            const { lines, ...orderFields } = orderData;

            // Insert order
            const { data: newOrder, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    ...orderFields,
                    order_number: orderNumber,
                    tenant_id: currentTenantId
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // Insert order lines
            if (lines && lines.length > 0) {
                const orderLines = lines.map((line, index) => ({
                    order_id: newOrder.id,
                    product_sap_code: line.product_sap_code || line.productSapCode,
                    product_name: line.product_name || line.productName,
                    quantity: line.quantity,
                    volume: line.volume,
                    unit: line.unit || 'Unid.',
                    unit_price: line.unit_price || line.unitPrice,
                    subtotal: line.subtotal,
                    tax_rate: line.tax_rate || line.taxRate || 21.00,
                    total: line.total,
                    line_order: index
                }));

                const { error: linesError } = await supabase
                    .from('order_lines')
                    .insert(orderLines);

                if (linesError) throw linesError;
            }

            // Refresh orders list
            await fetchOrders();

            return { success: true, data: newOrder };
        } catch (err) {
            console.error('Error creating order:', err);
            return { success: false, error: err.message };
        }
    };

    // Update an existing order
    const updateOrder = async (id, updates) => {
        try {
            const { data, error: updateError } = await supabase
                .from('orders')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('tenant_id', currentTenantId)
                .select()
                .single();

            if (updateError) throw updateError;

            // Refresh orders list
            await fetchOrders();

            return { success: true, data };
        } catch (err) {
            console.error('Error updating order:', err);
            return { success: false, error: err.message };
        }
    };

    // Delete an order
    const deleteOrder = async (id) => {
        try {
            const { error: deleteError } = await supabase
                .from('orders')
                .delete()
                .eq('id', id)
                .eq('tenant_id', currentTenantId);

            if (deleteError) throw deleteError;

            // Refresh orders list
            await fetchOrders();

            return { success: true };
        } catch (err) {
            console.error('Error deleting order:', err);
            return { success: false, error: err.message };
        }
    };

    // Get order by quotation ID
    const getOrderByQuotation = async (quotationId) => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_lines(*)')
                .eq('quotation_id', quotationId)
                .eq('tenant_id', currentTenantId)
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (err) {
            console.error('Error fetching order by quotation:', err);
            return { success: false, error: err.message };
        }
    };

    // Fetch orders on mount and when tenant changes
    useEffect(() => {
        fetchOrders();
    }, [currentTenantId]);

    return {
        orders,
        loading,
        error,
        createOrder,
        updateOrder,
        deleteOrder,
        getOrderByQuotation,
        refreshOrders: fetchOrders
    };
};
