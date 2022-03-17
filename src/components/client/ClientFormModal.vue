<template>
    <div class="modal fade text-left show" tabindex="-1" aria-labelledby="myModalLabel33" style="display: block;" aria-modal="true"  role="dialog">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title" id="myModalLabel33">{{ clientId ? 'Edit' : 'Create' }} Client </h4>
                    <button type="button" class="close" @click="$emit('close')" aria-label="Close">
                        <i class="bi bi-x bi-middle"></i>
                    </button>
                </div>
                <form @submit.prevent="saveClient">
                    <input type="hidden" v-model="logo" name="logo">
                    <div class="modal-body">

                        <div class="row mb-4">
                            <div class="col-md-7 col-7">
                                <div class="row">
                                    <div class="form-group">
                                        <label for="name-vertical">{{ type === 'company' ? 'Company name' : 'Name' }}</label>
                                        <input v-model="name" :class="{ 'is-invalid': errors.name }" type="text" class="form-control" name="name" id="name-vertical">
                                        <div v-if="errors.name" class="invalid-feedback">
                                            <i class="bx bx-radio-circle"></i>
                                            {{ errors.name }}
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="email-id-vertical">Email</label>
                                        <input v-model="email"  :class="{ 'is-invalid': errors.email }" type="email" class="form-control" id="email-id-vertical" name="email">
                                        <div v-if="errors.email" class="invalid-feedback">
                                            <i class="bx bx-radio-circle"></i>
                                            {{ errors.email }}
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label>Address</label>
                                        <input v-model="street"  type="text" class="form-control" name="street" placeholder="Street">
                                    </div>

                                    <div class="form-group">
                                        <div class="row">
                                            <div class="col-6">
                                                <input v-model="zipcode" type="text" class="form-control" name="zipcode" placeholder="Zipcode">
                                            </div>
                                            <div class="col-6">
                                                <input v-model="city" type="text" class="form-control" name="city" placeholder="City">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-5 col-5">
                                <div class="row">
                                    <div class="form-group">
                                        <label for="registrationNo-vertical">Tax ID</label>
                                        <input v-model="registration_no" :class="{ 'is-invalid': errors.registration_no }" type="text" class="form-control" name="registrationNo" id="registrationNo-vertical">
                                        <div v-if="errors.registration_no" class="invalid-feedback">
                                            <i class="bx bx-radio-circle"></i>
                                            {{ errors.registration_no }}
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="phone-vertical">Phone</label>
                                        <input v-model="phone" :class="{ 'is-invalid': errors.phone }" type="text" class="form-control" name="phone" id="phone-vertical">
                                        <div v-if="errors.phone" class="invalid-feedback">
                                            <i class="bx bx-radio-circle"></i>
                                            {{ errors.phone }}
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="type-id-vertical">Type</label>
                                        <div class="row" :class="{ 'is-invalid': errors.type }">
                                            <div class="col-6">
                                                <div class="form-check">
                                                    <div class="checkbox mt-2">
                                                        <input v-model="type" :class="{ 'is-invalid': errors.type }" type="radio" class="form-check-input" name="type" id="type-company" value="company">
                                                        <label for="type-company">Company</label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-6">
                                                <div class="form-check">
                                                    <div class="checkbox mt-2">
                                                        <input v-model="type" :class="{ 'is-invalid': errors.type }" type="radio" class="form-check-input" name="type" id="type-person" value="person">
                                                        <label for="type-person">Person</label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="errors.type" class="invalid-feedback">
                                            <i class="bx bx-radio-circle"></i>
                                            {{ errors.type }}
                                        </div>
                                    </div>
                                    <div class="form-group" v-if="type == 'company'">
                                        <label for="email-id-vertical">Contact person</label>
                                        <input v-model="contactperson_name" type="text" class="form-control mb-3" name="contactperson_name" placeholder="Name">                                    
                                        <input v-model="contactperson_email" :class="{ 'is-invalid': errors.contactperson_email }" type="email" class="form-control" name="contactperson_email" placeholder="Email">
                                        <div v-if="errors.contactperson_email" class="invalid-feedback">
                                            <i class="bx bx-radio-circle"></i>
                                            {{ errors.contactperson_email }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-light-secondary">
                            <i class="bx bx-x d-block d-sm-none"></i>
                            <span class="d-none d-sm-block" @click="$emit('close')">Close</span>
                        </button>
                        <button type="submit" class="btn btn-primary ml-1">
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
import { watch, computed, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { toast } from '@/utilities/toast'
//import validators from '@/utilities/validators'

export default {
    name: 'clientFormModal',
    props: {
        clientId: {
            type: [Number, String, Boolean],
            required: false,
            default: false
        }
    },
    emits: ['close'],
    setup(props, {emit}) {

        const store = useStore()
        const errors = ref('')

        const type = computed({
            get: () => store.getters.client.type,
            set: val => store.commit('UPDATE_CLIENT_PROPERTY', {key: 'type', value: val})
        })
        const name = computed({
            get: () => store.getters.client.name,
            set: val => store.commit('UPDATE_CLIENT_PROPERTY', {key: 'name', value: val})
        })
        const logo = computed({
            get: () => store.getters.client.logo || '',
            set: val => store.commit('UPDATE_CLIENT_PROPERTY', {key: 'logo', value: val})
        })
        const email = computed({
            get: () => store.getters.client.email,
            set: val => store.commit('UPDATE_CLIENT_PROPERTY', {key: 'email', value: val})
        })
        const phone = computed({
            get: () => store.getters.client.phone,
            set: val => store.commit('UPDATE_CLIENT_PROPERTY', {key: 'phone', value: val})
        })        
        const registration_no = computed({
            get: () => store.getters.client.registration_no,
            set: val => store.commit('UPDATE_CLIENT_PROPERTY', {key: 'registration_no', value: val})
        })
        const street = computed({
            get: () => store.getters.client.street,
            set: val => store.commit('UPDATE_CLIENT_PROPERTY', {key: 'street', value: val})
        })
        const zipcode = computed({
            get: () => store.getters.client.zipcode,
            set: val => store.commit('UPDATE_CLIENT_PROPERTY', {key: 'zipcode', value: val})
        })
        const city = computed({
            get: () => store.getters.client.city,
            set: val => store.commit('UPDATE_CLIENT_PROPERTY', {key: 'city', value: val})
        })
        const countryId = computed({
            get: () => store.getters.client.country_id,
            set: val => store.commit('UPDATE_CLIENT_PROPERTY', {key: 'country_id', value: val})
        })
        const contactperson_email = computed({
            get: () => store.getters.client.contactperson_email,
            set: val => store.commit('UPDATE_CLIENT_PROPERTY', {key: 'contactperson_email', value: val})
        })
        const contactperson_name = computed({
            get: () => store.getters.client.contactperson_name,
            set: val => store.commit('UPDATE_CLIENT_PROPERTY', {key: 'contactperson_name', value: val})
        })

        onMounted(async () => {
            if (props.clientId) {
                await store.dispatch('fetchClient', {
                    organizationId: store.getters.user.organizationId,
                    clientId: props.clientId
                })
            } else {
                store.commit('SET_CLIENT', {
                    organization_id: store.getters.user.organizationId,
                    type: 'company',
                    logo: '',
                    name: '',
                    email: '',
                    phone: '',
                    registration_no: '',
                    street: '',
                    zipcode: '',
                    city: '',
                    country_id: 1,
                    contactperson_email: '',
                    contactperson_name: ''
                })
            }
        })

        const validateEmail = email => {
            const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email)
        }
        const required = value => {
            const requiredMessage = 'This field is required'
            if (value === undefined || value === null) return requiredMessage
            if (!String(value).length) return requiredMessage
            return true
        }
        const typeValidate = val => {
            if (!['person', 'company'].includes(val))  return "Either 'person' or 'company'"
            return true
        }
        const nameValidate = val => {
            const req = required(val)
            if (req !== true) return req
            return true
        }
        const emailValidate = val => {
            if (validateEmail(val) !== true) return "Enter Valid Email address"
            return true;
        }
        const contactEmailValidate = val => {
            if (validateEmail(val) !== true) return "Enter Valid Email address"
            return true;
        }

        const validate = () => {
            errors.value = []
            let errs = {}
            let res

            res = typeValidate(type.value)
            if (res !== true) errs.type = res

            res = nameValidate(name.value)
            if (res !== true) errs.name = res

            res = emailValidate(email.value)
            if (res !== true) errs.email = res

            if (['company'].includes(type.value)) {
                res = contactEmailValidate(contactperson_email.value)
                if (res !== true) errs.contactperson_email = res
            }

            errors.value = errs
        }

        watch([
            () => name.value,
            () => email.value,
            () => phone.value,
            () => type.value,
            () => contactperson_email.value
        ], () => {
            validate()
        })
        const saveClient = () => {
            validate()
            if (!Object.keys(errors.value).length > 0) {
                const actionName = props.clientId ? 'updateClient' : 'createClient'
                store.dispatch(actionName, {
                    organizationId: store.getters.user.organizationId,
                    client: store.getters.client
                }).then(() => {
                    toast('Successfully saved !', 'success')
                    emit('close')
                }).catch(e => {
                    if (e.response) {
                        if (e.response.data.errors) {
                            errors.value = e.response.data.errors
                            toast(JSON.stringify( errors.value ), 'error')
                        } else {
                            toast(e.response.data.error || e.response.data.msg, 'error')
                        }
                    } else {
                        toast(e.message, 'error')
                    }
                })
            }
        }

        return {
            type,
            name,
            logo,
            email,
            phone,
            registration_no,
            street,
            zipcode,
            city,
            countryId,
            contactperson_email,
            contactperson_name,
            errors,
            saveClient
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
</style>