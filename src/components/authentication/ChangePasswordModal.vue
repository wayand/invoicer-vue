<template>
    <div v-if="show" class="modal fade text-left show" id="inlineForm" tabindex="-1" aria-labelledby="myChangepasswordModal" style="display: block;" aria-modal="true" role="dialog">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title" id="myChangepasswordModal">Change Password </h4>
                    <button @click="close" type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                        <i data-feather="x"></i>
                    </button>
                </div>

                <div v-if="error" class="alert alert-danger" role="alert">
                    <span v-for="(e, index) in error" :key="index">
                        <span v-if="e.constructor.name === 'Array'">
                            <span v-for="(er, index) in e" :key="index">{{ er }}</span>
                        </span>
                        <span v-else>{{ e }}</span>
                    </span>
                </div>

                <form @submit.prevent="changePassword" autocomplete="off">
                    <div class="modal-body">
                        <label>Old password: </label>
                        <div @click="toggleOldPassword" class="float-end">
                            <i :class="`bi bi-eye-${old_password_show ? 'slash-' : ''}fill`"></i>
                        </div>
                        <div class="form-group position-relative has-icon-right">
                            <input v-model="old_password" :class="{ 'is-invalid': errors.old_password }" :type="oldPasswordType" class="form-control">                            
                            <div v-if="errors.old_password" class="invalid-feedback">
                                <i class="bx bx-radio-circle"></i>
                                {{ errors.old_password }}
                            </div>
                        </div>
                        <label>New password: </label>
                        <div @click="toggleNewPassword" class="float-end">
                            <i :class="`bi bi-eye-${new_password_show ? 'slash-' : ''}fill`"></i>
                        </div>
                        <div class="form-group position-relative has-icon-right">
                            <input v-model="new_password" :class="{ 'is-invalid': errors.new_password }" :type="newPasswordType" class="form-control">
                            <div v-if="errors.new_password" class="invalid-feedback">
                                <i class="bx bx-radio-circle"></i>
                                {{ errors.new_password }}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="close" type="button" class="btn btn-light-secondary" data-bs-dismiss="modal">
                            <i class="bx bx-x d-block d-sm-none"></i>
                            <span class="d-none d-sm-block">Close</span>
                        </button>
                        <button type="submit" class="btn btn-primary ml-1" data-bs-dismiss="modal">
                            <i class="bx bx-check d-block d-sm-none"></i>
                            <span class="d-none d-sm-block">Save</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
<script>
import { watch, ref } from 'vue'
import { useStore } from 'vuex'
import { toast } from '@/utilities/toast'
import { isPassword } from '@/utilities/validators'

export default {
    setup() {
        const store = useStore()
        const show = ref(false)
        const old_password = ref('')
        const new_password = ref('')

        const oldPasswordType = ref('password')
        const newPasswordType = ref('password')

        const old_password_show = ref(false)
        const new_password_show = ref(false)

        const error = ref('')
        const errors = ref({})
        const validate = () => {
            errors.value = []
            let errs = {}
            let res

            res = isPassword(old_password.value, 8)
            if (res !== true) errs.old_password = res

            res = isPassword(new_password.value, 8)
            if (res !== true) errs.new_password = res

            errors.value = errs
        }

        watch([
            () => old_password.value,
            () => new_password.value
        ], () => validate())

        const changePassword = () => {
            validate()
            if (!Object.keys(errors.value).length > 0) {
                store.dispatch('changePassword', { password: old_password.value, new_password: new_password.value })
                    .then(response => {
                        console.log('response: ', response)
                        toast('Successfully saved !', 'success')
                        close()
                    })
                    .catch(e => {
                        console.log('server error', e)
                        if (e.response) {
                            error.value = e.response.data.error
                        } else {
                            error.value = [e.message]
                        }
                    })
            }
        }

        const toggleOldPassword = () => {
            if (oldPasswordType.value === 'password') {
                old_password_show.value = true
                oldPasswordType.value = 'text'
            } else {
                old_password_show.value = false
                oldPasswordType.value = 'password'
            }
        }
        const toggleNewPassword = () => {
            if (newPasswordType.value === 'password') {
                new_password_show.value = true
                newPasswordType.value = 'text'
            } else {
                new_password_show.value = false
                newPasswordType.value = 'password'
            }
        }

        const showModal = () => {show.value = true; document.body.classList.add("modal-open")}
        const close = () => {show.value = false; document.body.classList.remove("modal-open")}

        return {
            error,
            errors,
            show,
            showModal,
            close,
            changePassword,
            old_password,
            new_password,
            oldPasswordType,
            newPasswordType,
            old_password_show,
            new_password_show,
            toggleOldPassword,
            toggleNewPassword
        }
    },
}
</script>
<style scoped>
.modal-dialog {
    max-width: 680px;
    min-width: 560px;
    overflow: scroll;
}
.modal.show {
    background: #00000050;
    height: 100vh;
    left: 0;
    position: fixed;
    top: 0;
    width: 100vw;
    z-index: 1040;
}
.bi.bi-eye-fill, .bi.bi-eye-slash-fill {
    cursor: pointer;
}
</style>