/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'advanta': {
                    'bronze-dark': '#9c6615',
                    'orange': '#eb5e28',
                    'orange-light': '#f9a03f',
                    'yellow': '#f3c053',
                    'green-light': '#a1c349',
                    'green': '#87a330',
                    'green-dark': '#6a8532',
                },
                // Status-specific semantic tokens
                'status': {
                    'urgente': '#eb5e28',  // Orange
                    'tibio': '#f3c053',     // Yellow
                    'frio': '#87a330',      // Green
                },
            },
        },
    },
    plugins: [],
}
