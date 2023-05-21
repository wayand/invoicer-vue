import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url';
const path = require('path')

export default defineConfig({
    plugins: [vue()],
    resolve: {
        extensions: ['.js', '.vue'],
        alias: {
            "@": fileURLToPath(new URL('./src', import.meta.url)),
            '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
            '~bootstrap-icons': path.resolve(__dirname, 'node_modules/bootstrap-icons'),
            '~perfect-scrollbar': path.resolve(__dirname, 'node_modules/perfect-scrollbar'),
        }
    },
    server: {
        port: 8080,
        host: 'invoicer.local',
        hot: true
    },
    // build: {
    //     outDir: 'dist'
    // }
})