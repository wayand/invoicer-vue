<template>
    <div id="error">
        <div class="error-page container">
            <div class="col-md-8 col-12 offset-md-2">
                <div class="text-center">
                    <h1 class="error-title">Welcome!</h1>
                    <p class='fs-5 text-gray-600'>You have not confirmed your account. Please check your inbox (and your spam folder) - you should have received an email with a confirmation link.</p>
                    <p>
                        Didn't get the email? <button @click="resend" class="btn btn-sm btn-outline-primary">Resend</button>
                    </p>
                    <p v-if="emailSent">The Confirmation email is sent!</p>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { useStore } from 'vuex'
import { ref} from 'vue'
export default {
    setup() {
        const emailSent = ref(false)
        const store = useStore()
        async function resend() {
            console.log('Try now to reSend the email')
            const result = await store.dispatch('resendConfirmationEmail')
            console.log('result: ', result.data)
            emailSent.value = true
        }
        return {
            resend,
            emailSent
        }
    },
}
</script>
<style>
/* @import "/assets/css/pages/error.css"; */
</style>