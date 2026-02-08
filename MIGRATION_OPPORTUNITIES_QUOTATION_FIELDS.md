# Migración: Agregar Campos de Cotización a Oportunidades

## Descripción
Esta migración agrega campos necesarios para generar cotizaciones directamente desde oportunidades.

## Campos a Agregar

1. **sale_type** - Tipo de venta (propia/socio)
2. **payment_condition** - Condición de pago (contado/30d/60d/90d/custom)
3. **delivery_date** - Fecha de entrega
4. **origin_address** - Dirección de origen
5. **destination_address** - Dirección de destino
6. **products** - Array JSON de productos con cantidades y precios

## SQL a Ejecutar en Supabase

```sql
-- Add quotation-related fields to opportunities table
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS sale_type TEXT CHECK (sale_type IN ('own', 'partner')),
ADD COLUMN IF NOT EXISTS payment_condition TEXT CHECK (payment_condition IN ('cash', '30d', '60d', '90d', 'custom')),
ADD COLUMN IF NOT EXISTS delivery_date DATE,
ADD COLUMN IF NOT EXISTS origin_address TEXT,
ADD COLUMN IF NOT EXISTS destination_address TEXT,
ADD COLUMN IF NOT EXISTS products JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN opportunities.sale_type IS 'Type of sale: own (propia) or partner (socio)';
COMMENT ON COLUMN opportunities.payment_condition IS 'Payment terms: cash, 30d, 60d, 90d, or custom';
COMMENT ON COLUMN opportunities.delivery_date IS 'Expected delivery date';
COMMENT ON COLUMN opportunities.origin_address IS 'Origin address for delivery';
COMMENT ON COLUMN opportunities.destination_address IS 'Destination address for delivery';
COMMENT ON COLUMN opportunities.products IS 'Array of products with quantities and prices: [{productSapCode, productName, quantity, unitPrice}]';
```

## Cómo Ejecutar

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/qfgxvzpfqpbhbxvdqpxu
2. Ve a **SQL Editor**
3. Crea una nueva query
4. Copia y pega el SQL de arriba
5. Ejecuta la query
6. Verifica que los campos se hayan agregado correctamente

## Estructura del Campo `products`

El campo `products` es un array JSON con la siguiente estructura:

```json
[
  {
    "productSapCode": 198000053,
    "productName": "80-63TRE Band 3",
    "quantity": 40,
    "unitPrice": 1550
  },
  {
    "productSapCode": 189001354,
    "productName": "MAIZ HIBRIDO 80-63TRE C4 (C3L) PS",
    "quantity": 30,
    "unitPrice": 1550
  }
]
```

## Después de Ejecutar

Una vez ejecutada la migración, los modales de oportunidades mostrarán los nuevos campos para:
- Seleccionar productos
- Definir cantidades y precios
- Configurar condiciones de pago
- Establecer fechas de entrega
- Definir direcciones de origen/destino

Estos datos luego se usarán automáticamente al generar cotizaciones desde las oportunidades.
