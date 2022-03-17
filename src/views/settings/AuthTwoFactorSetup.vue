<template>
    
    <div class="page-heading">
        <div class="page-title">
            <div class="row justify-content-between">
                <div class="col-12 col-md-6 order-md-1 order-last">
                    <h3>Authentication setup</h3>
                    <a @click="$router.back()" href="#">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-left-short" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5z"/>
                        </svg>
                        <span>back</span>
                    </a>
                </div>
                <div class="col-12 col-md-6 order-md-2 order-first">
                </div>
            </div>
        </div>
    </div>
    <div class="page-content">
        <section id="multiple-column-form">
            <div class="row match-height">

                <div class="col-12">
                    <div class="card">
                        <div class="card-content">
                            <div class="card-body">

                                <form class="form" @submit.prevent="totpSetup">
                                    <ol class="list-group list-group-numbered">
                                        <li class="list-group-item d-flex">
                                            <div class="ms-2 me-auto">
                                                Install an authenticator app on your mobile device
                                            </div>
                                        </li>
                                        <li class="list-group-item d-flex">
                                            <div class="ms-2 me-auto">
                                                Scan the following QR code in your authenticator app
                                                <div v-html="qrcode"></div>
                                            </div>
                                        </li>
                                        <li class="list-group-item d-flex">
                                            <div class="ms-2 me-auto">
                                                Enter the code from your authenticator app below
                                                <input v-model="otpCode" type="text" class="form-control" :class="{ 'is-invalid': error.totp_code }">
                                                <div v-if="error.totp_code" class="invalid-feedback">
                                                    <i class="bx bx-radio-circle"></i>
                                                    {{ error.totp_code }}
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item d-flex">
                                            <div class="ms-2 me-auto">
                                                Enter your password
                                                <input v-model="password" type="password" class="form-control" :class="{ 'is-invalid': error.password }">
                                                <div v-if="error.password" class="invalid-feedback">
                                                    <i class="bx bx-radio-circle"></i>
                                                    {{ error.password }}
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item d-flex">
                                            <div class="mx-2">
                                                <button type="submit" class="btn btn-sm btn-outline-primary me-1 mb-1 mt-3">Next</button>
                                            </div>
                                        </li>
                                    </ol>
                                </form>

                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    </div>
</template>
<script>
import { onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { toast } from '@/utilities/toast'

export default {
    setup() {
        const store = useStore()
        const router = useRouter()
        const route = useRoute()
        const qrcode = ref('')
        const password = ref('')
        const otpCode = ref('')
        const error = ref([])

        async function getAuthUser() {
            await store.dispatch('getAuthUser').catch(e => {
                toast(e.response.data.error || e.response.data.msg, 'error')
            })
        }
        const totpSetup = () => {
            if (otpCode.value.length > 1 && password.value.length > 1) {
                store.dispatch('totpSetup', { totp_code: otpCode.value, password: password.value })
                    .then( () => {
                        if (route.query.redirect) {
                            router.push(route.query.redirect)
                        } else {
                            router.push({ name: "AuthManagement" })
                        }
                        toast('Two Factor Auth successfully enabled!', 'success')
                        getAuthUser()
                    })
                    .catch(e => {
                        if (e.response) {
                            error.value = e.response.data.errors
                        } else {
                            error.value = [e.message]
                        }
                    })
            } else {
                error.value['totp_code'] = otpCode.value.length ? null : 'Enter the 6 digits from the authentication app.'
                error.value['password'] = password.value.length ? null : 'Invalid password entered.'
            }
        }

        onMounted(async () => {
            await store.dispatch('qrCode')
                .then(response => qrcode.value = response.data)
                .catch(e => toast('products error ' + e, 'error'))
        })
        
        return {
            error,
            qrcode,
            password,
            otpCode,
            totpSetup
        }
    },
}
</script>
<style scoped>
.list-group-item {
    border: 0;
}
</style>