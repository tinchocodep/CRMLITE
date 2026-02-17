import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentTenant } from './useCurrentTenant';

export const useOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { tenantId } = useCurrentTenant();

    // Fetch all orders with their lines
    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!tenantId) {
                setOrders([]);
                setLoading(false);
                return;
            }

            // Fetch orders
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .eq('tenant_id', tenantId)
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
            if (!tenantId) {
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
                    tenant_id: tenantId
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // Insert order lines
            if (lines && lines.length > 0) {
                const orderLines = lines.map((line, index) => {
                    // Ensure all numeric fields have valid values (not null/undefined)
                    const unitPrice = line.unit_price || line.unitPrice || 0;
                    const quantity = line.quantity || 0;
                    const volume = line.volume || 0;
                    const subtotal = line.subtotal || 0;
                    const taxRate = line.tax_rate || line.taxRate || 21.00;
                    const total = line.total || 0;

                    return {
                        order_id: newOrder.id,
                        product_sap_code: line.product_sap_code || line.productSapCode,
                        product_name: line.product_name || line.productName,
                        quantity: quantity,
                        volume: volume,
                        unit: line.unit || 'Unid.',
                        unit_price: unitPrice,
                        subtotal: subtotal,
                        tax_rate: taxRate,
                        total: total,
                        line_order: index
                    };
                });

                console.log('📦 Inserting order lines:', orderLines);

                const { error: linesError } = await supabase
                    .from('order_lines')
                    .insert(orderLines);

                if (linesError) {
                    console.error('❌ Error inserting order lines:', linesError);
                    console.error('📋 Lines data that failed:', orderLines);
                    throw linesError;
                }
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
                .eq('tenant_id', tenantId)
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
                .eq('tenant_id', tenantId);

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
                .eq('tenant_id', tenantId)
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
    }, [tenantId]);

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
