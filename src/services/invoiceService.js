/**
 * Invoice Service
 * Handles sending invoice and remito data to n8n webhook for AFIP processing
 */

const WEBHOOK_URL = 'https://n8n.neuracall.net/webhook/FACTURASAILO';

/**
 * Send invoice or remito data to n8n webhook
 * @param {Object} invoiceData - Invoice/Remito data
 * @param {string} invoiceData.tipo_cbte - "FACTURA", "NC" (Nota de Crédito), or "REMITO"
 * @param {string} invoiceData.letra - "A", "B", "C", etc.
 * @param {number} invoiceData.punto_venta - Point of sale number
 * @param {number} invoiceData.numero_cbte - Invoice/Remito number
 * @param {string} invoiceData.fecha_emision - Emission date (DD/MM/YYYY)
 * @param {string} invoiceData.fecha_vencimiento - Due date (DD/MM/YYYY)
 * @param {Object} invoiceData.cliente - Client data
 * @param {Array} invoiceData.items - Invoice items
 * @param {Object} invoiceData.fiscal - Fiscal data (CAE, QR, etc.)
 * @returns {Promise<Object>} Response from webhook
 */
export const sendInvoiceToWebhook = async (invoiceData) => {
    try {
        console.log('📤 Sending invoice data to webhook:', invoiceData);

        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(invoiceData)
        });

        if (!response.ok) {
            throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Webhook response:', result);

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('❌ Error sending to webhook:', error);
        throw error;
    }
};

/**
 * Format date to DD/MM/YYYY
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
 */
const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Create invoice data from order
 * @param {Object} order - Order object
 * @param {Object} options - Invoice options
 * @param {string} options.tipo_cbte - "FACTURA", "NC", or "REMITO"
 * @param {string} options.letra - Invoice letter (A, B, C)
 * @param {string} options.fecha_pago - Payment date (optional, defaults to deliveryDate)
 * @returns {Object} Invoice data ready for webhook
 */
export const createInvoiceFromOrder = (order, options) => {
    const { tipo_cbte, letra, fecha_pago } = options;

    console.log('🔍 Creating invoice from order:', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        clientName: order.clientName,
        clientCuit: order.clientCuit,
        linesCount: (order.lines || order.products || []).length,
        tipo_cbte,
        letra,
        fecha_pago
    });

    // Calculate due date (based on payment condition or default 10 days)
    const emissionDate = new Date();
    const dueDate = new Date(emissionDate);

    // Parse payment condition (e.g., "30d" = 30 days)
    const paymentDays = order.paymentCondition ? parseInt(order.paymentCondition) : 10;
    dueDate.setDate(dueDate.getDate() + paymentDays);

    // Map order lines to invoice items
    // Order.lines structure: { productSapCode, productName, quantity, unitPrice, ... }
    const items = (order.lines || order.products || []).map(line => {
        const item = {
            codigo: line.productSapCode || line.sapCode || 'N/A',
            descripcion: line.productName || line.name || 'Producto',
            cantidad: line.quantity || 0,
            unidad_medida: line.unit || 'Unid.',
            // For REMITO, price is 0. For FACTURA, use unitPrice (already includes IVA)
            precio_unitario: tipo_cbte === 'REMITO' ? 0 : (line.unitPrice || line.estimatedPrice || 0)
        };

        console.log('📦 Product mapped:', item);
        return item;
    });

    // Calculate totals
    const subtotal = order.subtotal || (order.lines || order.products || []).reduce((sum, line) => {
        return sum + ((line.quantity || 0) * (line.unitPrice || line.estimatedPrice || 0));
    }, 0);

    const iva = order.tax || (subtotal * 0.21);
    const total = order.total || order.totalAmount || (subtotal + iva);

    const invoiceData = {
        tipo_cbte,
        letra,
        // NOTE: punto_venta and numero_cbte are assigned by n8n/AFIP
        fecha_emision: formatDate(emissionDate),
        fecha_vencimiento: formatDate(dueDate),
        fecha_pago: fecha_pago || formatDate(order.deliveryDate || dueDate),

        cliente: {
            // Read CUIT from order.clientCuit (already in orders data)
            cuit: order.clientCuit || order.client?.cuit || 'N/A',
            razon_social: order.clientName || order.client?.legalName || 'N/A',
            condicion_iva: order.client?.ivaCondition || 'Responsable Inscripto',
            domicilio: order.destinationAddress || order.client?.address || 'N/A'
        },

        items,

        totales: {
            subtotal: parseFloat(subtotal.toFixed(2)),
            iva: parseFloat(iva.toFixed(2)),
            total: parseFloat(total.toFixed(2))
        },

        // Include order reference for tracking
        order_id: order.id,
        order_number: order.orderNumber
    };

    console.log('📄 Invoice data created:', JSON.stringify(invoiceData, null, 2));

    // NOTE: fiscal data (CAE, vto_cae, qr_url) is returned by n8n after AFIP processing
    // We don't send it, we receive it in the response

    return invoiceData;
};

/**
 * Process invoice for an order
 * @param {Object} order - Order object
 * @param {Object} invoiceOptions - Invoice configuration
 * @returns {Promise<Object>} Result of invoice processing
 */
export const processInvoice = async (order, invoiceOptions) => {
    try {
        // Create invoice data from order
        const invoiceData = createInvoiceFromOrder(order, invoiceOptions);

        // Send to webhook
        const result = await sendInvoiceToWebhook(invoiceData);

        return {
            success: true,
            data: result.data,  // Return webhook response data (with CAE, numero_cbte, etc.)
            invoiceData,        // Keep for reference
            webhookResponse: result
        };
    } catch (error) {
        console.error('Error processing invoice:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Process remito for an order
 * @param {Object} order - Order object
 * @param {Object} remitoOptions - Remito configuration
 * @returns {Promise<Object>} Result of remito processing
 */
export const processRemito = async (order, remitoOptions) => {
    try {
        // Create remito data (tipo_cbte = "REMITO", no fiscal data needed)
        const remitoData = createInvoiceFromOrder(order, {
            ...remitoOptions,
            tipo_cbte: 'REMITO'
        });

        // Send to webhook
        const result = await sendInvoiceToWebhook(remitoData);

        // TODO: Implement stock discount logic here
        // This should be called after successful webhook response
        // await discountStockForOrder(order);

        return {
            success: true,
            data: result.data,  // Return webhook response data (with CAE, numero_cbte, etc.)
            remitoData,         // Keep for reference
            webhookResponse: result,
            stockDiscounted: false // Will be true when stock logic is implemented
        };
    } catch (error) {
        console.error('Error processing remito:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Discount stock for order products
 * @param {Object} order - Order object with products
 * @returns {Promise<Object>} Result of stock discount
 */
export const discountStockForOrder = async (order) => {
    // TODO: Implement stock discount logic
    // This should update the stock in Supabase or local state
    console.log('📦 Discounting stock for order:', order.id);
    console.log('Products to discount:', order.products);

    // For now, just return success
    // In production, this should:
    // 1. Get current stock for each product
    // 2. Subtract order quantity
    // 3. Update stock in database
    // 4. Log the stock movement

    return {
        success: true,
        message: 'Stock discount not yet implemented'
    };
};
