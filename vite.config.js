import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'

export default defineConfig({
    plugins: [vue()],
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
        hot: true,
        proxy: {
            // Matcher ruten /confirm-email/ og alt hvad der følger efter (inkl. prikker)
            '^/confirm-email/.*': {
                target: 'http://localhost:8080',
                // Tvinger Vite til internt at servere index.html, så Vue Router kan overtage stien
                rewrite: () => '/index.html',
            }
        }
    },
    // build: {
    //     outDir: 'dist'
    // }
})
