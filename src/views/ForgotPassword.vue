<template>
    <div id="auth">
        
        <div class="row h-100">
            <div class="col-lg-5 col-12">
                <div id="auth-left">
                    <div class="auth-logo">
                        <a href="/"><img src="/assets/static/images/logo/logo.png" alt="Logo"></a>
                    </div>
                    <h1 class="auth-title">Forgot Password</h1>
                    <p class="auth-subtitle mb-5">Input your email and we will send you reset password link.</p>

                    <form @submit.prevent="sendResetMail">
                        <div class="form-group position-relative has-icon-left mb-4" :class="{ 'is-invalid': error.email }">
                            <input v-model="email" type="email" :class="{ 'is-invalid': error.email }" class="form-control form-control-xl" placeholder="Email">
                            <div class="form-control-icon">
                                <i class="bi bi-envelope"></i>
                            </div>
                        </div>

                        <div v-if="error.email" class="invalid-feedback">
                            <i class="bx bx-radio-circle"></i>
                            {{ error.email }}
                        </div>
                        <button type="submit" class="btn btn-primary btn-block btn-lg shadow-lg mt-5">Send</button>
                    </form>
                    <div class="text-center mt-5 text-lg fs-4">
                        <p class="text-gray-600">
                            <router-link :to="{ name: 'Login' }" class="font-bold">Back to log-in</router-link>.
                        </p>
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
import { useRouter } from 'vue-router'
import { validateEmail } from '@/utilities/validators'
import { toast } from '@/utilities/toast'

export default {
    setup() {
        const router = useRouter()
        const store = useStore()

        const error = ref('')
        const email = ref('')    

        const validate = () => {
            error.value = ''
            let errs = {}
            let res

            res = validateEmail(email.value)
            if (res !== true) errs.email = res

            error.value = errs
            if (!Object.keys(error.value).length > 0) {
                error.value = ''
                return true
            }
            return false
        }

        const sendResetMail = () => {
            if (validate()) {
                console.log('Validated email address.....')
                store.dispatch('sendResetMail', {email: email.value})
                    .then(response => {
                        console.log('reset email sent: ', response.data)
                        router.push({ name: "ResetPassword" })
                    })
                    .catch(e => {
                        if (e.response) {
                            error.value = e.response.data.errors
                        } else {
                            error.value = [e.message]
                            toast(e.message, 'error')
                        }
                    })
            }
        }

        return {
            error,
            email,
            sendResetMail
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
    background: url(/assets/static/images/bg/4853433.png), linear-gradient(90deg, #2d499d, #3f5491);
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
</style>