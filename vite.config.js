import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'
import pluginRewriteAll from 'vite-plugin-rewrite-all'

export default defineConfig({
    plugins: [vue(), pluginRewriteAll()],
    resolve: {
        extensions: ['.js', '.vue'],
        alias: {
            "@": fileURLToPath(new URL('./src', import.meta.url)),
            '~bootstrap': fileURLToPath(new URL('./node_modules/bootstrap', import.meta.url)),
            '~bootstrap-icons': fileURLToPath(new URL('./node_modules/bootstrap-icons', import.meta.url)),
            '~perfect-scrollbar': fileURLToPath(new URL('./node_modules/perfect-scrollbar', import.meta.url))
        }
    },
    server: {
        port: 8080,
        host: 'localhost',
        hot: true
    },
    // build: {
    //     outDir: 'dist'
    // }
})
