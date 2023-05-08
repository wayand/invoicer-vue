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
                        <span v-if="otpAuthType=='2fa_otp_email'">Enter the OTP sent to your registered email address.</span>
                        <span v-else>Enter an authenticator app code or a recovery code:</span>
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
                            <div class="form-group position-relative has-icon-left has-extra-icon-right mb-4">
                                <div class="form-control-icon">
                                    <i class="bi bi-shield-lock"></i>
                                </div>
                                <input :type="PasswordFieldType" v-model="password" class="form-control form-control-xl" placeholder="Password">
                                <span @click="togglePasswordFieldType" class="left-pan">
                                    <i :class="`bi bi-eye-${PasswordFieldType === 'text' ? 'slash-' : ''}fill`"></i>
                                </span>
                            </div>
                            <div class="d-flex align-items-end">
                                <router-link :to="{ name: 'ForgotPassword' }">Forgot your password?</router-link>
                            </div>
                        </template>
                        <template v-if="otpLogin">
                            <div class="form-group position-relative has-icon-left mb-4">
                                <input v-model="otp_2fa" type="text" class="form-control form-control-xl" :placeholder="otpAuthType=='2fa_otp_email'?'OTP From Email':'2FA Mobile'">
                                <div class="form-control-icon">
                                    <i class="bi bi-shield-lock"></i>
                                </div>
                            </div>
                        </template>
                        <template v-if="otpLogin && !otpAuthType">
                            <span>Error - 2FA Email is the Default 2fa Authentication!!!</span>
                        </template>
                        <button class="btn btn-primary btn-block btn-lg shadow-lg mt-5">Log in</button>
                    </form>
                    <div v-if="otpLogin && otpAuthType=='2fa_otp_email'" class="text-center mt-5 text-lg fs-4">
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
import { ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'

export default {
    setup() {
        const router = useRouter()
        const route = useRoute()
        const store = useStore()

        const otpLogin = ref(false)

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
            console.log('totp email resending..')
            const result = await store.dispatch('resendTOTPEmail')
            console.log('result: ', result.data)
            emailResent.value = true
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
                            if (e.response) {
                                error.value = e.response.data.error
                            } else {
                                error.value = [e.message]
                            }
                        })
                } else {
                    error.value = ['email or pass are invalid']
                }
            } else if (otpLogin.value) {
                if (email.value.length > 1 && password.value.length > 1 && otp_2fa.value.length === 6) {
                    store.dispatch('login', { email: email.value, password: password.value, otp_2fa: otp_2fa.value })
                        .then( () => {
                            if (route.query.redirect) {
                                router.push(route.query.redirect)
                            } else {
                                router.push({ name: "Dashboard" })
                            }
                        })
                        .catch( e => {
                            if (e.response) {
                                error.value = e.response.data.error
                            } else {
                                error.value = [e.message]
                            }
                        })
                } else {
                    error.value = '2FA is needed'
                }
            }
        }

        return {
            otpLogin,
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
body {
    background-color: white;
}

#auth {
    height: 100vh;
    overflow-x: hidden;
}
#auth #auth-right {
    height: 100%;
    background: url(/assets/images/bg/4853433.jpg), linear-gradient(90deg, #2d499d, #3f5491);
}
#auth #auth-left {
    padding: 5rem 8rem;
}
#auth #auth-left .auth-title {
    font-size: 4rem;
    margin-bottom: 1rem;
}
#auth #auth-left .auth-subtitle {
    font-size: 1.7rem;
    line-height: 2.5rem;
    color: #a8aebb;
}
#auth #auth-left .auth-logo {
    margin-bottom: 7rem;
}
#auth #auth-left .auth-logo img {
    height: 2rem;
}
@media screen and (max-width: 767px) {
    #auth #auth-left {
        padding: 5rem;
    }
}

/** password toggle */
.has-extra-icon-right span {
    position: absolute;
    right: 10px;
    top: 15px;
    padding: 2px;
    border-left: 1px solid #d1d5db;
    font-size: 18px;
}

.left-pan {
    cursor: pointer;
    padding-left: 7px
}

.left-pan i {
    padding-left: 10px
}
[class*=" bi-"]::before {
    line-height: inherit;
}
</style>