/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            // Nota: los colores de marca (advanta-green, brand) están definidos
            // en src/index.css via @theme para poder usar CSS variables dinámicas.
            // Solo mantenemos aquí los tokens que NO son de marca principal.
            colors: {
                'advanta': {
                    'bronze-dark': '#9c6615',
                    'orange': '#eb5e28',
                    'orange-light': '#f9a03f',
                    'yellow': '#f3c053',
                    // advanta-green, advanta-green-light, advanta-green-dark
                    // están en index.css y usan CSS vars dinámicas del tenant
                },
                'status': {
                    'urgente': '#eb5e28',
                    'tibio': '#f3c053',
                    'frio': '#87a330',
                },
            },
        },
    },
    plugins: [],
}

