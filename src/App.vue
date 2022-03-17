<template>
    <component :is="layout"></component>
</template>

<script>
import AppLayout from './components/layout/App'
import LoginLayout from './components/layout/Login'
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
    setup () {
        const store = useStore()
        return {
            layout: computed(() => store.getters.layout)
        }
    },
    components: {
        AppLayout,
        LoginLayout
    }
}
</script>