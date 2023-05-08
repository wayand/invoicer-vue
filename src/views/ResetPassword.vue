<template>
    <div id="auth">
        
        <div class="row h-100">
            <div class="col-lg-5 col-12">
                <div id="auth-left">
                    <div class="auth-logo">
                        <a href="index.html"><img src="assets/static/images/logo/logo.png" alt="Logo"></a>
                    </div>
                    <h1 class="auth-title">Reset your password</h1>
                    <p class="auth-subtitle mb-5">Copy the reset code from your email and paste it below..</p>

                    <form @submit.prevent="resetPassword">
                        <div class="form-group mb-4" :class="{ 'is-invalid': errors.resetCode }">
                            <input v-model="resetCode" type="text" :class="{ 'is-invalid': errors.resetCode }" class="form-control form-control-xl" placeholder="Reset code">
                            <div v-if="errors.resetCode" class="invalid-feedback">
                                <i class="bx bx-radio-circle"></i>
                                {{ errors.resetCode }}
                            </div>
                        </div>

                        <div class="form-group position-relative has-icon-right" :class="{ 'is-invalid': errors.newPassword }">
                            <input v-model="newPassword" :type="PasswordFieldType" :class="{ 'is-invalid': errors.newPassword }" class="form-control form-control-xl" placeholder="New password">
                            <div @click="togglePasswordFieldType" class="form-control-icon">
                                <i :class="`bi bi-eye-${PasswordFieldType === 'text' ? 'slash-' : ''}fill`"></i>
                            </div>
                            <div v-if="errors.newPassword" class="invalid-feedback">
                                <i class="bx bx-radio-circle"></i>
                                {{ errors.newPassword }}
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary btn-block btn-lg shadow-lg mt-5">Reset</button>
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
import { onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { required, isPassword } from '@/utilities/validators'
import { toast } from '@/utilities/toast'

export default {
    setup() {
        const router = useRouter()
        const route = useRoute()
        const store = useStore()
        
        const errors = ref([])
        const resetCode = ref('')
        const newPassword = ref('')
        const PasswordFieldType = ref('password')

        const validate = () => {
            errors.value = ''
            let errs = {}
            let res

            res = required(resetCode.value, 8)
            if (res !== true) errs.resetCode = res

            res = isPassword(newPassword.value, 8)
            if (res !== true) errs.newPassword = res

            errors.value = errs
            if (!Object.keys(errors.value).length > 0) {
                errors.value = ''
                return true
            }
            return false
        }


        const togglePasswordFieldType = () => {
            PasswordFieldType.value === 'password' ? PasswordFieldType.value = 'text' : PasswordFieldType.value = 'password'
        }

        const resetPassword = () => {
            if (validate()) {
                store.dispatch('resetPassword', { new_password: newPassword.value, reset_code: resetCode.value })
                    .then(response => {
                        toast(response.data.message, 'success')
                        router.push({ name: "Login" })
                    })
                    .catch(e => {
                        if (e.response) {
                            errors.value = e.response.data.errors
                        } else {
                            //errors.value = [e.message]
                            toast(e.message, 'error')
                        }
                    })
            }
        }
        onMounted(async () => {
            if (route.query.token) {
                resetCode.value = route.query.token
            }
        })

        return {
            errors,
            resetCode,
            newPassword,
            resetPassword,
            PasswordFieldType,
            togglePasswordFieldType
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
.form-control-icon {
    cursor: pointer;
}
.form-group[class*=has-icon-] .form-control.form-control-xl {
    padding-left: 1rem;
}
</style>