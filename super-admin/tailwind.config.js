/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Semantic names
                primary: {
                    DEFAULT: '#16A34A', // green-600
                    foreground: '#ffffff',
                },
                accent: {
                    DEFAULT: '#22C55E', // green-500
                    foreground: '#ffffff',
                },
                page: {
                    bg: '#DCFCE7', // green-100
                },
                dark: {
                    DEFAULT: '#1F2937', // gray-800
                },
            },
        },
    },
    plugins: [],
}
