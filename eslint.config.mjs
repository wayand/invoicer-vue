import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
    { ignores: ['dist/'] },
    ...pluginVue.configs['flat/essential'],
    js.configs.recommended,
    {
        languageOptions: {
            globals: globals.browser
        },
        rules: {
            'vue/no-deprecated-slot-attribute': 'off'
        }
    }
]
