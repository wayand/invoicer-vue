<template>
    <div id="auth">
        
        <div class="row h-100">
            <div class="col-lg-5 col-12">
                <div id="auth-left">
                    <div class="auth-logo">
                        <a href="/"><img src="/assets/static/images/logo/logo.png" alt="Logo"></a>
                    </div>
                    <h1 class="auth-title">{{ otpLogin ? 'Two-Factor Authentication' : 'Log in' }}</h1>
                    <p v-if="!otpLogin" class="auth-subtitle mb-5">Log in with your data that you entered during registration.</p>
                    <p v-if="otpLogin" class="auth-subtitle mb-5">
                        <span v-if="useBackupCode">Enter one of your backup codes. Each code works only once.</span>
                        <span v-else-if="otpAuthType=='2fa_otp_email'">Enter the OTP sent to your registered email address.</span>
                        <span v-else>Enter the code from your authenticator app:</span>
                    </p>
                    
                    <div v-if="error" class="alert alert-danger" role="alert">
                        <span v-for="(e, index) in error" :key="index">
                            <span v-if="e.constructor.name === 'Array'">
                                <span v-for="(er, index) in e" :key="index">{{ er }}</span>
                            </span>
                            <span v-else>{{ e }}</span>
                        </span>
                    </div>

                    <form @submit.prevent="login">
                        <template v-if="!otpLogin">
                            <div class="form-group position-relative has-icon-left mb-4">
                                <input v-model="email" type="email" class="form-control form-control-xl" placeholder="Username">
                                <div class="form-control-icon">
                                    <i class="bi bi-person"></i>
                                </div>
                            </div>
                            <div class="form-group position-relative has-icon-left mb-4">                                
                                <input :type="PasswordFieldType" v-model="password" class="form-control form-control-xl" placeholder="Password">
                                <div class="form-control-icon">
                                    <i class="bi bi-shield-lock"></i>
                                </div>
                                <div @click="togglePasswordFieldType" class="left-pan">
                                    <i :class="`bi bi-eye-${PasswordFieldType === 'text' ? 'slash-' : ''}fill`"></i>
                                </div>
                            </div>
                            <div class="d-flex align-items-end">
                                <router-link :to="{ name: 'ForgotPassword' }">Forgot your password?</router-link>
                            </div>
                        </template>
                        <template v-if="otpLogin">
                            <div class="form-group position-relative has-icon-left mb-4">
                                <input v-model="otp_2fa" type="text" autocomplete="one-time-code" autocapitalize="off" spellcheck="false" maxlength="16" class="form-control form-control-xl" :placeholder="useBackupCode ? 'Backup code (ABCDE-FGHIJ)' : otpAuthType=='2fa_otp_email' ? 'OTP From Email' : '2FA Mobile'">
                                <div class="form-control-icon">
                                    <i class="bi bi-shield-lock"></i>
                                </div>
                            </div>
                            <p v-if="otpAuthType=='2fa_otp_email' && !useBackupCode" class="text-muted">The code is valid for 10 minutes and works once. Use "Resend email" to get a new one.</p>
                        </template>
                        <template v-if="otpLogin && !otpAuthType">
                            <span>Error - 2FA Email is the Default 2fa Authentication!!!</span>
                        </template>
                        <button class="btn btn-primary btn-block btn-lg shadow-lg mt-5">Log in</button>
                    </form>
                    <div v-if="otpLogin" class="text-center mt-4">
                        <a @click.prevent="toggleBackupCode" href="#">{{ useBackupCode ? 'Use the regular code instead' : 'Use a backup code instead' }}</a>
                    </div>
                    <div v-if="otpLogin && otpAuthType=='2fa_otp_email' && !useBackupCode" class="text-center mt-5 text-lg fs-4">
                        <p class="text-gray-600">Didn't get the email or totp expired? <button class="btn btn-outline btn-lg" @click="resend">Resend email</button>.</p>
                        <p v-if="emailResent">The TOTP email is resent!</p>
                    </div>
                    <div v-if="false" class="text-center mt-5 text-lg fs-4">
                        <p class="text-gray-600">Don't have an account? <a href="auth-register.html" class="font-bold">Sign up</a>.</p>
                        <p><a class="font-bold" href="auth-forgot-password.html">Forgot password?</a>.</p>
                    </div>
                </div>
            </div>
            <div class="col-lg-7 d-none d-lg-block">
                <div id="auth-right">

                </div>
            </div>
        </div>

    </div>
</template>
<script>
import { onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { UseInitTheme } from '@/composables/useDarkTheme'
import { apiErrorMessage } from '@/utilities/apiErrors'
import { isSecondFactorCode } from '@/utilities/secondFactor'

export default {
    setup() {
        const router = useRouter()
        const route = useRoute()
        const store = useStore()

        const otpLogin = ref(false)
        const useBackupCode = ref(false)

        const otpAuthType = ref('')
        
        const emailResent = ref(false)
        const email = ref('')
        const password = ref('')
        const otp_2fa = ref('')
        const PasswordFieldType = ref('password')
        const error = ref('')

        const togglePasswordFieldType = () => {
            PasswordFieldType.value === 'password' ? PasswordFieldType.value = 'text' : PasswordFieldType.value = 'password'
        }

        async function resend() {
            error.value = ''
            try {
                await store.dispatch('resendTOTPEmail')
                emailResent.value = true
                otp_2fa.value = ''
            } catch (e) {
                emailResent.value = false
                error.value = [apiErrorMessage(e)]
            }
        }

        function toggleBackupCode() {
            useBackupCode.value = !useBackupCode.value
            otp_2fa.value = ''
            error.value = ''
        }

        function login() {
            if (!otpLogin.value) {
                if (email.value.length > 1 && password.value.length > 1) {
                    store.dispatch('login', { email: email.value, password: password.value })
                        .then( (response) => {
                            if (response.status === 206 && response.data.message === '2fa_otp') {
                                otpAuthType.value = response.data.twoFactorType
                                otpLogin.value = true
                                error.value = ''
                            }
                        })
                        .catch( e => {
                            error.value = [apiErrorMessage(e)]
                        })
                } else {
                    error.value = ['email or pass are invalid']
                }
            } else if (otpLogin.value) {
                if (email.value.length > 1 && password.value.length > 1 && isSecondFactorCode(otp_2fa.value)) {
                    store.dispatch('login', { email: email.value, password: password.value, otp_2fa: otp_2fa.value.trim() })
                        .then( () => {
                            if (route.query.redirect) {
                                router.push(route.query.redirect)
                            } else {
                                router.push({ name: "Dashboard" })
                            }
                        })
                        .catch( e => {
                            error.value = [apiErrorMessage(e)]
                        })
                } else {
                    error.value = [useBackupCode.value ? 'Enter one of your backup codes (like ABCDE-FGHIJ).' : 'Enter the 6-digit code.']
                }
            }
        }
        onMounted(() => UseInitTheme())

        return {
            otpLogin,
            useBackupCode,
            toggleBackupCode,
            otpAuthType,
            email,
            password,
            otp_2fa,
            emailResent,
            resend,
            login,
            PasswordFieldType,
            togglePasswordFieldType,
            switchVisibility: () => PasswordFieldType.value = PasswordFieldType.value === 'password' ? 'text' : 'password',
            error
        }
    },
}
</script>
<style scoped>
body{background-color:var(--bs-body-bg)}
#auth{height:100vh;overflow-x:hidden}
#auth #auth-right{height:100%;background:url(/assets/static/images/bg/4853433.png),linear-gradient(90deg,#2d499d,#3f5491)}
#auth #auth-left{padding:5rem 8rem}
#auth #auth-left .auth-title{font-size:4rem;margin-bottom:1rem}
#auth #auth-left .auth-subtitle{font-size:1.7rem;line-height:2.5rem;color:#a8aebb}
#auth #auth-left .auth-logo{margin-bottom:7rem}
#auth #auth-left .auth-logo img{height:2rem}
@media screen and (max-width: 1399.9px){#auth #auth-left{padding:3rem}}
@media screen and (max-width: 767px){#auth #auth-left{padding:5rem}}
@media screen and (max-width: 576px){#auth #auth-left{padding:5rem 3rem}}
html[data-bs-theme=dark] #auth-right{background:url(/assets/static/images/bg/4853433.png),linear-gradient(90deg,#2d499d,#3f5491)}

/** custom password toggle */
.left-pan {
    cursor: pointer;
    position: absolute;
    padding: 0 0.6rem;
    border-left: 1px solid #d1d5db;
    right: 0;
    top: 1rem;
    font-size: 1.1rem;
}
</style>