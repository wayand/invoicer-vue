import { createApp } from 'vue'
import router from './router'
import App from './App.vue'
import Store from './store'

import "bootstrap/dist/js/bootstrap.bundle"

import "toastify-js/src/toastify.css"

import { tokenAlive } from "@/services/jwtHelper"
import PromiseDialog from '@/components/common/promiseDialog'

const app = createApp(App)

const accessToken = localStorage.getItem('accessToken') || null
if (accessToken) {
    Store.commit('SET_USER_DATA', accessToken)
    if (tokenAlive(Store.getters.user.tokenExp)) {
        console.log('Token is Alive')
    } else {
        console.log('Token is expired, will be refreshed in next call')
    }
}

// Global Promise based Dialog
app.component('PromiseDialog', PromiseDialog)

app.config.globalProperties.$filters = {
    toFloat(value) {
        if (typeof value !== 'number') {
            return value
        }
        var formatter = new Intl.NumberFormat('da-DK', {})
        return formatter.format(value)
    },
    toCurrency(value) {
        if (typeof value !== 'number') {
            return value
        }
        var formatter = new Intl.NumberFormat('da-DK', {
            style: 'currency',
            currency: 'DKK',
            minimumFractionDigits: 2
        })
        return formatter.format(value)
    }
}

app.config.devtools = true
app.use(Store)
app.use(router)
app.mount('#app')
