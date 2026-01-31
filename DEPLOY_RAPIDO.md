# 🚀 Guía Rápida de Despliegue en Netlify

## Opción Más Fácil: Drag & Drop

### Paso 1: Construir el proyecto
Abre una terminal en la carpeta del proyecto y ejecuta:
```bash
npm run build
```

Esto creará una carpeta llamada `dist/` con todos los archivos listos para producción.

### Paso 2: Desplegar en Netlify
1. Ve a: **https://app.netlify.com/drop**
2. Arrastra la carpeta `dist/` completa a la zona de drop
3. ¡Listo! Tu sitio estará en línea en segundos

Netlify te dará una URL como: `https://random-name-123456.netlify.app`

---

## Cambiar el Nombre del Sitio

1. En Netlify, ve a **Site settings** → **General** → **Site details**
2. Click en **Change site name**
3. Elige un nombre como: `sailo-crm-lite`
4. Tu nueva URL será: `https://sailo-crm-lite.netlify.app`

---

## Actualizar el Sitio

Cada vez que hagas cambios:
1. Ejecuta `npm run build` nuevamente
2. Arrastra la nueva carpeta `dist/` a Netlify
3. Netlify actualizará automáticamente tu sitio

---

## ⚡ Usando el Script Automático

También puedes usar el script que creé:
```bash
./build-netlify.sh
```

Este script:
- Limpia builds anteriores
- Construye el proyecto
- Te muestra las opciones de despliegue

---

## 📝 Notas Importantes

- ✅ El archivo `netlify.toml` ya está configurado
- ✅ Las redirecciones para React Router están listas
- ✅ No necesitas configurar variables de entorno
- ✅ El dark mode funcionará automáticamente
- ✅ Todos los módulos (Dashboard, Prospectos, Clientes, Agenda) funcionarán correctamente

---

## 🐛 Si algo falla

1. Verifica que `npm run build` se ejecute sin errores
2. Asegúrate de arrastrar la carpeta `dist/` completa (no solo su contenido)
3. Si ves errores 404, verifica que `netlify.toml` esté en la raíz del proyecto

---

## 🎉 ¡Eso es todo!

Tu CRM estará en línea y accesible desde cualquier dispositivo con internet.
