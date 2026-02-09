# 🔧 Cómo Arreglar el Workflow de N8N

## ❌ Problema Detectado

El webhook de n8n está devolviendo **variables sin evaluar**:

```json
{
  "cae": "{{ $json.cae }}",                    // ❌ MAL
  "numero_cbte": "{{ $json.numero_cbte }}",    // ❌ MAL
  "punto_venta": "{{ $json.punto_de_venta }}", // ❌ MAL
  "pdf_url": "{{ $('CloudConvert').item.json.url }}" // ❌ MAL
}
```

Debería devolver:

```json
{
  "cae": "74050000000000",           // ✅ BIEN
  "numero_cbte": 1234,               // ✅ BIEN
  "punto_venta": 5,                  // ✅ BIEN
  "pdf_url": "https://storage...."   // ✅ BIEN
}
```

---

## 🔍 Causa del Problema

El nodo **"Respond to Webhook"** (o similar) en n8n está configurado para devolver **texto plano** en lugar de **evaluar las expresiones**.

---

## ✅ Solución: Configurar el Nodo de Respuesta

### Opción 1: Usar "Respond to Webhook" con JSON

1. **Abre el workflow en n8n**
2. **Busca el nodo final** que devuelve la respuesta (probablemente se llama "Respond to Webhook" o "Webhook Response")
3. **Configura el nodo:**
   - **Response Mode**: `Using Fields Below`
   - **Response Body**: Selecciona `JSON`
   - **JSON Object**: Usa el editor de expresiones

4. **En el campo JSON, usa esto:**

```json
{
  "success": true,
  "data": {
    "punto_venta": {{ $json.punto_de_venta }},
    "numero_cbte": {{ $json.numero_cbte }},
    "cae": "{{ $json.cae }}",
    "vto_cae": "{{ $json.vto_cae }}",
    "qr_url": "{{ $json.qr_url }}",
    "pdf_url": "{{ $('CloudConvert').item.json.url }}",
    "nombre_archivo": "FC-A-{{ $json.punto_de_venta }}-{{ $json.numero_cbte }}"
  }
}
```

**IMPORTANTE:** 
- Los **números** NO llevan comillas: `{{ $json.numero_cbte }}`
- Los **strings** SÍ llevan comillas: `"{{ $json.cae }}"`

---

### Opción 2: Usar Nodo "Set" antes de Responder

Si el método anterior no funciona:

1. **Agrega un nodo "Set"** antes del nodo de respuesta
2. **Configura el nodo Set:**
   - **Mode**: `Manual Mapping`
   - **Fields to Set**:

```
punto_venta = {{ $json.punto_de_venta }}
numero_cbte = {{ $json.numero_cbte }}
cae = {{ $json.cae }}
vto_cae = {{ $json.vto_cae }}
qr_url = {{ $json.qr_url }}
pdf_url = {{ $('CloudConvert').item.json.url }}
nombre_archivo = FC-A-{{ $json.punto_de_venta }}-{{ $json.numero_cbte }}
```

3. **En el nodo "Respond to Webhook":**
   - **Response Body**: `JSON`
   - **JSON Object**: 
   ```json
   {
     "success": true,
     "data": {{ $json }}
   }
   ```

---

## 🧪 Cómo Probar

### 1. Desde n8n (Test Workflow)

1. Haz click en **"Execute Workflow"** o **"Test Workflow"**
2. Envía datos de prueba
3. Verifica que la respuesta NO contenga `{{` ni `}}`

### 2. Desde el CRM

1. Ve a **Pedidos**
2. Click en **PROCESAR** en cualquier pedido
3. Selecciona **FACTURA**
4. Click en **Confirmar**
5. **Revisa la consola del navegador (F12)**

Si ves este error:
```
⚠️ N8N returned unprocessed template variables
```

Significa que el problema persiste. Vuelve a revisar la configuración del nodo.

---

## 📋 Checklist de Verificación

- [ ] El nodo de respuesta está en modo **JSON**
- [ ] Las expresiones `{{ }}` están **dentro del editor de n8n**, no como texto
- [ ] Los números NO tienen comillas
- [ ] Los strings SÍ tienen comillas
- [ ] El workflow está **guardado y activado**
- [ ] Probaste con el botón **"Execute Workflow"**
- [ ] La respuesta NO contiene `{{` ni `}}`

---

## 🎯 Estructura Esperada de la Respuesta

```json
{
  "success": true,
  "data": {
    "punto_venta": 5,                          // Number
    "numero_cbte": 1234,                       // Number
    "cae": "74050000000000",                   // String
    "vto_cae": "20/02/2026",                   // String (DD/MM/YYYY)
    "qr_url": "https://...",                   // String (URL)
    "pdf_url": "https://storage.../file.pdf",  // String (URL)
    "nombre_archivo": "FC-A-0005-00001234"     // String (opcional)
  }
}
```

---

## 🆘 Si Sigue Sin Funcionar

1. **Exporta el workflow** de n8n (JSON)
2. **Comparte el JSON** para revisarlo
3. **Verifica los logs** de n8n en el servidor
4. **Prueba con Postman** o `curl` directamente al webhook

### Ejemplo con curl:

```bash
curl -X POST https://n8n.neuracall.net/webhook-test/FACTURASAILO \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_cbte": "FACTURA",
    "letra": "A",
    "cliente": {
      "cuit": "33716799099",
      "razon_social": "TEST SA"
    },
    "items": [],
    "totales": {
      "total": 1000
    }
  }'
```

Deberías recibir una respuesta **sin** `{{` ni `}}`.

---

## 📚 Referencias

- [N8N Expression Editor](https://docs.n8n.io/code-examples/expressions/)
- [N8N Webhook Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Estructura de Respuesta Esperada](./WEBHOOK_RESPONSE_STRUCTURE.md)
