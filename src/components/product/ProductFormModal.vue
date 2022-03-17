<template>
    <div class="modal fade text-left show" tabindex="-1" aria-labelledby="createProductModalID" style="display: block;" aria-modal="true"  role="dialog">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title" id="createProductModalID">{{ productId ? 'Edit' : 'Create' }} Product </h4>
                    <button type="button" class="close" @click="$emit('close')" aria-label="Close">
                        <i class="bi bi-x bi-middle"></i>
                    </button>
                </div>
                <form @submit.prevent="saveProduct">
                    <div class="modal-body">
                        <div class="col-12">
                            <div class="row">
                                <div class="form-group">
                                    <label for="name-vertical">Name</label>
                                    <input v-model="name"  :class="{ 'is-invalid': errors.name }" type="text" class="form-control" name="name" id="name-vertical">
                                    <div v-if="errors.name" class="invalid-feedback">
                                        <i class="bx bx-radio-circle"></i>
                                        {{ errors.name }}
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="description-id-vertical">Description</label>
                                    <textarea 
                                        v-model="description" 
                                        :class="{ 'is-invalid': errors.description }" 
                                        class="form-control" 
                                        id="description-id-vertical"
                                        rows="3"
                                        placeholder="Description">
                                    </textarea>
                                    <div v-if="errors.description" class="invalid-feedback">
                                        <i class="bx bx-radio-circle"></i>
                                        {{ errors.description }}
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="unitPrice-id">Unit price</label>
                                    <input v-model.number="unitPrice" :class="{ 'is-invalid': errors.unit_price }" type="text" class="form-control" id="unitPrice-id" name="unitPrice" placeholder="Unit price">
                                    <div v-if="errors.unit_price" class="invalid-feedback">
                                        <i class="bx bx-radio-circle"></i>
                                        {{ errors.unit_price }}
                                    </div>
                                </div>
                                <div class="form-group">
                                    <BaseSelect
                                        :label="'Account'"
                                        :name="'Account'"
                                        :options="incomeAccounts"
                                        :class="{ 'is-invalid': errors.account_id }"
                                        v-model.number="accountId"
                                        :error="errors.account_id"
                                    />
                                </div>
                                <div class="form-group">
                                    <div class="form-check">
                                        <input v-model="archived" id="product-archived" type="checkbox" class="form-check-input">
                                        <label for="product-archived">Archived (hide from list)</label>
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
import { watch, onMounted, computed, ref } from 'vue'
import { useStore } from 'vuex'
import { toast } from '@/utilities/toast'
import { isName, required } from '@/utilities/validators'
import BaseSelect from '@/components/formBaseElements/BaseSelect'

export default {
    props: {
        productId: {
            type: [Number, String, Boolean],
            required: false,
            default: false
        }
    },
    components: {
        BaseSelect,
    },
    emits: ['close'],
    setup(props, {emit}) {

        const store = useStore()
        const errors = ref('')

        const name = computed({
            get: () => store.getters.product.name,
            set: val => store.commit('UPDATE_PRODUCT_PROPERTY', {key: 'name', value: val})
        })
        const accountId = computed({
            get: () => store.getters.product.account_id || 0,
            set: val => store.commit('UPDATE_PRODUCT_PROPERTY', {key: 'account_id', value: val})
        })
        const description = computed({
            get: () => store.getters.product.description,
            set: val => store.commit('UPDATE_PRODUCT_PROPERTY', {key: 'description', value: val})
        })
        const unitPrice = computed({
            get: () => store.getters.product.unit_price,
            set: val => store.commit('UPDATE_PRODUCT_PROPERTY', {key: 'unit_price', value: val})
        })
        const archived = computed({
            get: () => store.getters.product.archived,
            set: val => store.commit('UPDATE_PRODUCT_PROPERTY', {key: 'archived', value: val})
        })
        const incomeAccounts = computed(() => store.getters.getIncomeAccounts)

        onMounted(async () => {
            await store.dispatch('fetchAccounts')
            if (props.productId) {
                await store.dispatch('fetchProduct', props.productId)
            } else {
                store.commit('SET_PRODUCT', {
                    organization_id: store.getters.user.organizationId,
                    name: '',
                    account_id: null,
                    description: '',
                    unit_price: 0.00,
                    archived: false 
                })
            }
        })

        const validate = () => {
            errors.value = []
            let errs = {}
            let res

            res = incomeAccounts.value.some(a => a.id === accountId.value)
            if (res !== true) errs.account_id = 'This field is required!'

            res = isName(name.value, 1, 50)
            if (res !== true) errs.name = res

            res = isName(description.value, 2, 100)
            if (res !== true) errs.description = res

            res = required(unitPrice.value)
            if (res !== true) errs.unit_price = res

            errors.value = errs
            if (!Object.keys(errors.value).length > 0) {
                return true
            }
            return false
        }
        watch([
            () => name.value,
            () => description.value,
            () => unitPrice.value
        ], () => {    
            validate()
        })

        const saveProduct = () => {
            if (validate()) {
                const actionName = props.productId ? 'updateProduct' : 'createProduct'
                store.dispatch(actionName, store.getters.product)
                .then(() => {
                    toast('Successfully saved !', 'success')
                    emit('close')
                }).catch(e => {
                    if (e.response) {
                        if (e.response.data.errors) {
                            errors.value = e.response.data.errors
                            toast('Please check error messages!!', 'error')
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
            errors,
            name,
            description,
            unitPrice,
            archived,
            accountId,
            incomeAccounts,
            saveProduct
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