#!/bin/bash

# Script para construir y preparar el proyecto para Netlify

echo "🚀 Iniciando build para Netlify..."

# Limpiar build anterior
echo "🧹 Limpiando build anterior..."
rm -rf dist

# Construir el proyecto
echo "📦 Construyendo proyecto..."
npm run build

# Verificar que el build fue exitoso
if [ -d "dist" ]; then
    echo "✅ Build completado exitosamente!"
    echo ""
    echo "📁 Archivos generados en: dist/"
    echo ""
    echo "🌐 Opciones de despliegue:"
    echo "  1. Drag & Drop: Arrastra la carpeta 'dist' a https://app.netlify.com/drop"
    echo "  2. Netlify CLI: netlify deploy --prod"
    echo "  3. Git: Conecta tu repositorio en https://app.netlify.com"
    echo ""
    ls -lh dist/
else
    echo "❌ Error: El build falló"
    exit 1
fi
