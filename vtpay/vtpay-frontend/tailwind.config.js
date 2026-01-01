/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#10B981', // Green-500
                secondary: '#3B82F6', // Blue-500
                accent: '#F59E0B', // Amber-500
                background: '#F3F4F6', // Gray-100
                surface: '#FFFFFF',
                text: '#1F2937', // Gray-800
                muted: '#6B7280', // Gray-500
                border: '#E5E7EB', // Gray-200
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
