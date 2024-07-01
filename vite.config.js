import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    test: {
        includeSource: ['src/**/*.{js,ts}'],
    },
    define: {
        'import.meta.vitest': 'undefined',
    },
})
