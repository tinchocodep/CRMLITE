# Estructura de Respuesta del Webhook N8N

## 📤 Datos que ENVIAMOS al Webhook

```json
{
  "tipo_cbte": "FACTURA",
  "letra": "A",
  "fecha_emision": "08/02/2026",
  "fecha_vencimiento": "18/02/2026",
  "fecha_pago": "15/02/2026",
  
  "cliente": {
    "cuit": "30716831325",
    "razon_social": "AGRO BC S.R.L.",
    "condicion_iva": "Responsable Inscripto",
    "domicilio": "Campo La Esperanza - Ruta 34 Km 850, Chaco"
  },
  
  "items": [
    {
      "codigo": "80-63TRE",
      "descripcion": "MAIZ HIBRIDO 80-63TRE",
      "cantidad": 30,
      "unidad_medida": "Unid.",
      "precio_unitario": 1550.00
    }
  ],
  
  "totales": {
    "subtotal": 46500.00,
    "iva": 9765.00,
    "total": 56265.00
  },
  
  "order_id": "ord-001",
  "order_number": "PED-2026-001"
}
```

---

## 📥 Datos que DEBE DEVOLVER el Webhook

### Estructura JSON de Respuesta:

```json
{
  "success": true,
  "message": "Factura generada exitosamente",
  
  "data": {
    // ===== DATOS FISCALES DE AFIP =====
    "punto_venta": 5,
    "numero_cbte": 1234,
    "cae": "74050000000000",
    "vto_cae": "20/02/2026",
    "qr_url": "https://www.afip.gob.ar/fe/qr/?p=eyJ2ZXIiOjEsImZlY2hhIjoiMjAyNi0wMi0wOCIsImN1aXQiOjMwNzE2ODMxMzI1LCJwdG9WdGEiOjUsInRpcG9DYnRlIjo2LCJudW1lcm9DYnRlIjoxMjM0LCJpbXBvcnRlIjo1NjI2NS4wMCwibW9uZWRhIjoiUEVTIiwiY3R6IjoxLCJ0aXBvRG9jUmVjIjo4MCwibnJvRG9jUmVjIjozMDcxNjgzMTMyNSwidGlwb0NvZENvZCI6IkUiLCJjb2RBdXQiOjc0MDUwMDAwMDAwMDAwfQ==",
    
    // ===== PDF DEL COMPROBANTE =====
    "pdf_url": "https://n8n.neuracall.net/files/facturas/FACTURA_A_0005-00001234.pdf",
    // O también puede ser un base64:
    "pdf_base64": "JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBlL...",
    
    // ===== DATOS ADICIONALES (OPCIONALES) =====
    "fecha_proceso": "2026-02-08T21:30:00Z",
    "tipo_cbte_codigo": 6,  // Código numérico de AFIP para el tipo de comprobante
    "letra_codigo": "A",
    
    // ===== DATOS DEL COMPROBANTE (CONFIRMACIÓN) =====
    "comprobante": {
      "tipo": "FACTURA",
      "letra": "A",
      "numero_completo": "0005-00001234",
      "fecha_emision": "08/02/2026",
      "total": 56265.00
    }
  }
}
```

---

## 📋 Campos OBLIGATORIOS en la Respuesta

### ✅ Mínimo Requerido:

```json
{
  "success": true,
  "data": {
    "punto_venta": 5,           // OBLIGATORIO
    "numero_cbte": 1234,        // OBLIGATORIO
    "cae": "74050000000000",    // OBLIGATORIO
    "vto_cae": "20/02/2026",    // OBLIGATORIO
    "pdf_url": "https://..."    // OBLIGATORIO (o pdf_base64)
  }
}
```

### ⚠️ Campos Opcionales pero Recomendados:

- `qr_url`: URL del código QR de AFIP
- `message`: Mensaje descriptivo del resultado
- `fecha_proceso`: Timestamp del procesamiento
- `comprobante`: Objeto con datos de confirmación

---

## 🔴 Respuesta en Caso de ERROR:

```json
{
  "success": false,
  "error": "Descripción del error",
  "error_code": "AFIP_ERROR_001",
  "details": {
    "afip_message": "CUIT inválido",
    "field": "cliente.cuit"
  }
}
```

---

## 📦 Formatos Aceptados para el PDF:

### Opción 1: URL Pública (RECOMENDADO)
```json
{
  "pdf_url": "https://n8n.neuracall.net/files/facturas/FACTURA_A_0005-00001234.pdf"
}
```

### Opción 2: Base64
```json
{
  "pdf_base64": "JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L0ZvbnQ8PC9GMSAxIDAgUj4+Pj4vTWVkaWFCb3ggWzAgMCA2MTIgNzkyXS9Db250ZW50cyA0IDAgUj4+CmVuZG9iago0IDAgb2JqCjw8L0xlbmd0aCAzMz4+CnN0cmVhbQpCVAovRjEgMTIgVGYKMTAwIDcwMCBUZAooSGVsbG8gV29ybGQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKMSAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkcyBbMyAwIFJdPj4KZW5kb2JqCjUgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDIgMCBSPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDE3OCAwMDAwMCBuIAowMDAwMDAwMjQ1IDAwMDAwIG4gCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA4NyAwMDAwMCBuIAowMDAwMDAwMzAyIDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA2L1Jvb3QgNSAwIFI+PgpzdGFydHhyZWYKMzUxCiUlRU9GCg=="
}
```

---

## 🎯 Ejemplo Completo de Respuesta Exitosa:

```json
{
  "success": true,
  "message": "Factura A 0005-00001234 generada exitosamente",
  
  "data": {
    "punto_venta": 5,
    "numero_cbte": 1234,
    "cae": "74050000000000",
    "vto_cae": "20/02/2026",
    "qr_url": "https://www.afip.gob.ar/fe/qr/?p=eyJ2ZXIiOjEsImZlY2hhIjoiMjAyNi0wMi0wOCIsImN1aXQiOjMwNzE2ODMxMzI1LCJwdG9WdGEiOjUsInRpcG9DYnRlIjo2LCJudW1lcm9DYnRlIjoxMjM0LCJpbXBvcnRlIjo1NjI2NS4wMCwibW9uZWRhIjoiUEVTIiwiY3R6IjoxLCJ0aXBvRG9jUmVjIjo4MCwibnJvRG9jUmVjIjozMDcxNjgzMTMyNSwidGlwb0NvZENvZCI6IkUiLCJjb2RBdXQiOjc0MDUwMDAwMDAwMDAwfQ==",
    "pdf_url": "https://n8n.neuracall.net/files/facturas/2026/02/FACTURA_A_0005-00001234.pdf",
    "fecha_proceso": "2026-02-08T21:30:00Z",
    
    "comprobante": {
      "tipo": "FACTURA",
      "letra": "A",
      "numero_completo": "0005-00001234",
      "fecha_emision": "08/02/2026",
      "cliente": "AGRO BC S.R.L.",
      "cuit": "30716831325",
      "total": 56265.00
    }
  }
}
```

---

## 🔧 Cómo lo Procesamos en el CRM:

```javascript
// En invoiceService.js
const result = await sendInvoiceToWebhook(invoiceData);

if (result.success && result.data) {
  // Guardamos el comprobante
  const comprobante = saveComprobante({
    tipo: 'FACTURA',
    orderId: order.id,
    orderNumber: order.orderNumber,
    punto_venta: result.data.punto_venta,      // ← De AFIP
    numero_cbte: result.data.numero_cbte,      // ← De AFIP
    letra: config.letra,
    cae: result.data.cae,                      // ← De AFIP
    vto_cae: result.data.vto_cae,              // ← De AFIP
    qr_url: result.data.qr_url,                // ← De AFIP
    pdf_url: result.data.pdf_url,              // ← Del PDF generado
    total: order.total,
    clientName: order.clientName,
    fecha_emision: new Date().toISOString().split('T')[0]
  });
}
```

---

## 📝 Notas Importantes:

1. **PDF URL vs Base64**: Preferimos URL pública porque es más eficiente. Si usas base64, lo convertiremos a Blob URL en el navegador.

2. **CAE**: Es el Código de Autorización Electrónico de AFIP. Es OBLIGATORIO para facturas válidas.

3. **Vencimiento CAE**: Fecha hasta la cual el CAE es válido (generalmente 10 días).

4. **QR URL**: Link al código QR de AFIP que permite verificar la factura.

5. **Punto de Venta**: Número de punto de venta asignado por AFIP (ej: 5 → "0005").

6. **Número de Comprobante**: Número secuencial del comprobante (ej: 1234 → "00001234").

7. **Formato Completo**: "0005-00001234" (punto de venta + número).
