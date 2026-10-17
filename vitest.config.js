import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

// Reuses vite.config.js (the "@" alias and the Vue plugin), so tests import
// code the way the app does.
export default mergeConfig(viteConfig, defineConfig({
    test: {
        environment: 'jsdom',
        include: ['tests/**/*.test.js'],
        setupFiles: ['tests/setup.js']
    }
}))
