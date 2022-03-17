<template>
    <div class="page-heading">
        <div class="page-title">
            <div class="row justify-content-between">
                <div class="col-12 col-md-6 order-md-1 order-last">
                    <h3>Organization</h3>
                </div>
                <div class="col-12 col-md-6 order-md-2 order-first">
                    <button @click="saveOrganization" type="submit" class="btn btn-primary me-1 mb-1 float-end">Save</button>
                </div>
            </div>
        </div>
        <section class="section">
            <SettingsNavigation />
        </section>
    </div>
    <div class="page-content">
        <section id="multiple-column-form">
            <div class="row match-height">
                <div class="col-12">
                    <div class="card">
                        <div class="card-content">
                            <div class="card-body">
                                <form class="form" @submit.prevent="saveOrganization">
                                    <div class="row mb-4">
                                        <div class="col-md-7 col-7">
                                            <div class="row">
                                                <div class="form-group">
                                                    <label for="name-vertical">Name</label>
                                                    <input v-model="name" :class="{ 'is-invalid': errors.name }" type="text" class="form-control" name="name" id="name-vertical">
                                                    <div v-if="errors.name" class="invalid-feedback">
                                                        <span v-for="(err, index) in errors.name" :key="index">{{ err }}</span>
                                                    </div>
                                                </div>
                                                <div class="form-group">
                                                    <label for="name-vertical">Slug</label>
                                                    <input :value="slug" type="text" class="form-control" disabled>
                                                </div>
                                                <div class="form-group">
                                                    <label for="email-id-vertical">Email</label>
                                                    <input v-model="email" :class="{ 'is-invalid': errors.email }" type="email" class="form-control" id="email-id-vertical" name="email">
                                                    <div v-if="errors.email" class="invalid-feedback">
                                                        <span v-for="(err, index) in errors.email" :key="index">{{ err }}</span>
                                                    </div>
                                                </div>

                                                <div class="form-group">
                                                    <label>Address</label>
                                                    <input v-model="street" type="text" class="form-control" name="street" placeholder="Street">
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

                                                <div class="form-group">
                                                    <label>Tax ID</label>
                                                    <input v-model="registrationNo" type="text" class="form-control" name="registration_no" placeholder="registration number">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-5 col-5">
                                            <div class="row">

                                                <div class="form-group">
                                                    <BaseSelect
                                                        label="Country"
                                                        :options="countries"
                                                        :class="{ 'is-invalid': error.countryId }"
                                                        v-model.number="countryId"
                                                    />
                                                </div>

                                                <div class="form-group">
                                                    <label for="phone-vertical">Phone</label>
                                                    <input v-model="phone" :class="{ 'is-invalid': errors.phone }" type="text" class="form-control" name="phone" id="phone-vertical">
                                                    <div v-if="errors.phone" class="invalid-feedback">
                                                        <span v-for="(err, index) in errors.phone" :key="index">{{ err }}</span>
                                                    </div>
                                                </div>

                                                <div class="form-group">
                                                    <label>Logo</label>
                                                    <input class="form-control" :class="{ 'is-invalid': uploadError }" ref="fileInput" type="file" @input="handleFileUpload">
                                                    <div v-if="uploadError" class="invalid-feedback">
                                                        <span>{{ uploadError }}</span>
                                                    </div>
                                                    <div v-if="previewLogo || (organizationLogo && slug)" class="imagePreviewWrapper" @click="selectImage">
                                                        <img class="img" :src="previewLogo || organizationLogo">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
import { computed, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import Toastify from 'toastify-js'
import SettingsNavigation from '@/components/common/SettingsNavigation'
import BaseSelect from '@/components/formBaseElements/BaseSelect'

export default {
    components: {
        SettingsNavigation,
        BaseSelect
    },
    props: {
        id: {
            type: [Number, String],
            required: true
        }
    },
    setup(props, {emit}) {
        const errors = ref([])
        const error = ref('')
        const uploadError = ref('')
        const store = useStore()

        const slug = computed(() => store.getters.organization.slug)
        const logo = computed(() => store.getters.organization.logo)
        const name = computed({
            get: () => store.getters.organization.name,
            set: val => store.commit('UPDATE_ORGANIZATION_PROPERTY', { key: 'name', value: val })
        })
        const email = computed({
            get: () => store.getters.organization.email,
            set: val => store.commit('UPDATE_ORGANIZATION_PROPERTY', { key: 'email', value: val })
        })
        const street = computed({
            get: () => store.getters.organization.street,
            set: val => store.commit('UPDATE_ORGANIZATION_PROPERTY', { key: 'street', value: val })
        })
        const zipcode = computed({
            get: () => store.getters.organization.zipcode,
            set: val => store.commit('UPDATE_ORGANIZATION_PROPERTY', { key: 'zipcode', value: val })
        })
        const city = computed({
            get: () => store.getters.organization.city,
            set: val => store.commit('UPDATE_ORGANIZATION_PROPERTY', { key: 'city', value: val })
        })
        const registrationNo = computed({
            get: () => store.getters.organization.registration_no,
            set: val => store.commit('UPDATE_ORGANIZATION_PROPERTY', { key: 'registration_no', value: val })
        })
        const countryId = computed({
            get: () => store.getters.organization.country_id,
            set: val => store.commit('UPDATE_ORGANIZATION_PROPERTY', { key: 'country_id', value: val })
        })
        const phone = computed({
            get: () => store.getters.organization.phone,
            set: val => store.commit('UPDATE_ORGANIZATION_PROPERTY', { key: 'phone', value: val })
        })

        const countries = computed(() => store.getters.countries)

        const toast = (msg, style) => { // error, warn, success
            const styles = {
                error: "#e57777",
                warn: "#efab45",
                success: "#7bb75d"
            }
            Toastify({
                text: msg,
                duration: 30000,
                close:true,
                style: {
                    background: styles[style]
                }
            }).showToast()
        }

        const handleError = (e) => toast('FileUpload' + e, 'error')

        const fileInput = ref(null)
        const file = ref(null)
        const previewLogo = ref(null)

        const organizationLogo = computed(() => {
            return 'http://localhost:5000/organizations/' + slug.value + '/logo/' + logo.value
        })

        const selectImage = () => fileInput.value.click()
        const handleFileUpload = async (e) => {
            console.log("FileUpload started...")
            console.log("uploaded file", e.target.files)

            if (e.target.files && e.target.files[0]) {
                file.value = e.target.files[0]
                let reader = new FileReader
                reader.onload = e => {
                    previewLogo.value = e.target.result
                }
                reader.readAsDataURL(e.target.files[0])
                emit('input', e.target.files[0])
            }
            console.log("FileUpload ended...")
        }
        const saveOrganization = () => {

            if (file.value) {
                const formData = new FormData()
                formData.append('file', file.value)

                store.dispatch('uploadLogo', { organizationId: props.id, logo: formData })
                    .then((response) => {
                        console.log('then->Uploaded: ', response.data.message)
                        toast(response.data.message, 'success')
                    })
                    .catch(e => {
                        if (e.response) {
                            console.log('catch e.response: ', e.response.data.error)
                            uploadError.value = e.response.data.error || e.response.data.msg
                            toast(e.response.data.error || e.response.data.msg, 'error')
                        } else {
                            console.log('catch e.message: ', e.message)
                            toast(e.message, 'error')
                        }
                    })
            }
            
            store.dispatch('updateOrganization', store.getters.organization)
                .then(() => {
                    toast('Successfully saved !', 'success')
                })
                .catch(e => {
                    if (e.response) {
                        if (e.response.data.errors) {
                            errors.value = e.response.data.errors
                            toast('Something went wrong, please check error messages!!', 'error')
                        } else {
                            error.value = e.response.data.error || e.response.data.msg
                            toast(e.response.data.error || e.response.data.msg, 'error')
                        }
                    } else {
                        error.value = [e.message]
                        toast(e.message, 'error')
                    }
                })
        }

        onMounted( async () => {
            await store.dispatch('fetchOrganization', props.id)
                .catch(e => toast('Organization ' + e, 'error'))
            await store.dispatch('fetchCountries')
                .catch(e => toast('Countries ' + e, 'error'))
        })

        return {
            name,
            slug,
            email,
            street,
            zipcode,
            city,
            registrationNo,
            countryId,
            phone,
            countries,
            fileInput,
            file,
            selectImage,
            previewLogo,
            organizationLogo,
            handleError,
            handleFileUpload,
            saveOrganization,
            error,
            errors,
            uploadError
        }
    },
}
</script>
<style scoped>
.img {
    max-width: 250px;
}
.imagePreviewWrapper {
    text-align: center;
    background-repeat: no-repeat;
    width: 100%;
    height: 100%;
    max-height: 250px;
    display: block;
    cursor: pointer;
    margin: 30px auto 30px;
    background-size: contain;
    background-position: center;
}
</style>