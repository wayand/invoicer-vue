<template>
    <div class="modal fade text-left show" tabindex="-1" aria-labelledby="myModalLabel33" style="display: block;" aria-modal="true"  role="dialog">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title" id="myModalLabel33">{{ accountId ? 'Edit' : 'Create' }} Account </h4>
                    <button type="button" class="close" @click="$emit('close')" aria-label="Close">
                        <i class="bi bi-x bi-middle"></i>
                    </button>
                </div>
                <form @submit.prevent="saveAccount">
                    <div class="modal-body">

                        <div class="row mb-4">
                            <div :class="isBankAccount && isAccountGroupBankAndCashBalance ? 'col-6' : 'col-12'">
                                <div class="row">
                                    <div class="form-group">
                                        <BaseSelect
                                            :label="'Account Group'"
                                            :name="'Account Group'"
                                            :options="accountGroups"
                                            :class="{ 'is-invalid': errors.account_group_id }"
                                            v-model.number="accountGroupId"
                                        />
                                        <small class="text-muted">What kind of Account is this?</small>
                                    </div>

                                    <div class="form-group">
                                        <BaseInput
                                            v-model.number="number"
                                            label="Account number"
                                            type="text"
                                            :class="{ 'is-invalid': errors.number }"
                                            :error="errors.number"
                                        />
                                        <small class="text-muted">Used by accountants, and for organizing your accounts</small>
                                    </div>

                                    <div class="form-group">
                                        <BaseInput
                                            v-model="name"
                                            label="Account name"
                                            type="text"
                                            :class="{ 'is-invalid': errors.name }"
                                            :error="errors.name"
                                        />
                                    </div>

                                    <template v-if="isAccountGroupBankAndCashBalance">
                                        <div class="form-group">
                                            <div class="form-check">
                                                <BaseCheckbox
                                                    label="Bank account"
                                                    v-model="isBankAccount"
                                                />
                                            </div>
                                        </div>

                                        <div class="form-group">
                                            <div class="form-check">
                                                <BaseCheckbox
                                                    label="Enable payments to this account"
                                                    v-model="isPaymentEnabled"
                                                />
                                            </div>
                                        </div>
                                    </template>

                                    <div class="form-group">
                                        <BaseInput
                                            v-model="description"
                                            label="Description"
                                            type="text"
                                            :class="{ 'is-invalid': errors.description }"
                                            :error="errors.description"
                                        />
                                        <small class="text-muted">Optional account description</small>
                                    </div>

                                    <div class="form-group">
                                        <BaseSelect
                                            :disabled="isTaxRateDisabled"
                                            :label="'VAT rate'"
                                            :name="'VAT rate'"
                                            :options="taxRates"
                                            :class="{ 'is-invalid': errors.tax_rate_id }"
                                            v-model.number="taxRateId"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div v-if="isBankAccount && isAccountGroupBankAndCashBalance" class="col-6">
                                <div class="row">
                                    <h6> Bank Information</h6>
                                    <div class="form-group">
                                        <BaseInput
                                            v-model="currencyId"
                                            label="Currency"
                                            type="text"
                                            :class="{ 'is-invalid': errors.currencyId }"
                                            :error="errors.currencyId"
                                        />
                                    </div>
                                    <div class="form-group">
                                        <BaseSelect
                                            :label="'Bank'"
                                            :name="'Bank'"
                                            :options="banks"
                                            :class="{ 'is-invalid': errors.bank_id }"
                                            v-model.number="bankId"
                                            :error="errors.bank_id"
                                        />
                                    </div>
                                    <div class="form-group">
                                        <BaseInput
                                            v-model.number="bankRegistrationNumber"
                                            label="Registration number"
                                            type="text"
                                            :class="{ 'is-invalid': errors.bank_registration_number }"
                                            :error="errors.bank_registration_number"
                                        />
                                    </div>
                                    <div class="form-group">
                                        <BaseInput
                                            v-model.number="bankAccountNumber"
                                            label="Registration number"
                                            type="text"
                                            :class="{ 'is-invalid': errors.bank_account_number }"
                                            :error="errors.bank_account_number"
                                        />
                                    </div>
                                    <div class="form-group">
                                        <BaseInput
                                            v-model="bankSwiftNumber"
                                            label="Swift"
                                            type="text"
                                            :class="{ 'is-invalid': errors.bank_swift_number }"
                                            :error="errors.bank_swift_number"
                                        />
                                    </div>
                                    <div class="form-group">
                                        <BaseInput
                                            v-model="bankIbanNumber"
                                            label="Iban"
                                            type="text"
                                            :class="{ 'is-invalid': errors.bank_iban_number }"
                                            :error="errors.bank_iban_number"
                                        />
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
import BaseSelect from '@/components/formBaseElements/BaseSelect'
import BaseInput from '@/components/formBaseElements/BaseInput'
import BaseCheckbox from '@/components/formBaseElements/BaseCheckbox'
import { toast } from '@/utilities/toast'
import { required, isName, isNum } from '@/utilities/validators'

export default {
    name: 'accountFormModal',
    components: {
        BaseSelect,
        BaseInput,
        BaseCheckbox
    },
    props: {
        accountId: {
            type: [Number, String, Boolean],
            required: false,
            default: false
        }
    },
    emits: ['close'],
    setup(props, {emit}) {

        const store = useStore()
        const errors = ref('')

        const accountTypeId = computed( () => store.getters.account.account_type_id || 0 )

        const accountGroupId = computed({
            get: () => store.getters.account.account_group_id || 0,
            set: val => {
                store.commit('UPDATE_ACCOUNT_PROPERTY', {key: 'account_group_id', value: val})
                store.commit('UPDATE_ACCOUNT_PROPERTY', {key: 'account_type_id', value: getAccountTypeId.value || 0})
            }
        })
        const taxRateId = computed({
            get: () => store.getters.account.tax_rate_id || 0,
            set: val => store.commit('UPDATE_ACCOUNT_PROPERTY', {key: 'tax_rate_id', value: val})
        })
        const name = computed({
            get: () => store.getters.account.name,
            set: val => store.commit('UPDATE_ACCOUNT_PROPERTY', {key: 'name', value: val})
        })
        const description = computed({
            get: () => store.getters.account.description,
            set: val => store.commit('UPDATE_ACCOUNT_PROPERTY', {key: 'description', value: val})
        })        
        const number = computed({
            get: () => store.getters.account.number,
            set: val => store.commit('UPDATE_ACCOUNT_PROPERTY', {key: 'number', value: val})
        })
        const currencyId = computed({
            get: () => store.getters.account.currency_id,
            set: val => store.commit('UPDATE_ACCOUNT_PROPERTY', {key: 'currency_id', value: val})
        })
        const bankId = computed({
            get: () => store.getters.account.bank_id || 0,
            set: val => store.commit('UPDATE_ACCOUNT_PROPERTY', {key: 'bank_id', value: val})
        })
        const bankRegistrationNumber = computed({
            get: () => store.getters.account.bank_registration_number,
            set: val => store.commit('UPDATE_ACCOUNT_PROPERTY', {key: 'bank_registration_number', value: val})
        })
        const bankAccountNumber = computed({
            get: () => store.getters.account.bank_account_number,
            set: val => store.commit('UPDATE_ACCOUNT_PROPERTY', {key: 'bank_account_number', value: val})
        })
        const bankSwiftNumber = computed({
            get: () => store.getters.account.bank_swift_number,
            set: val => store.commit('UPDATE_ACCOUNT_PROPERTY', {key: 'bank_swift_number', value: val})
        })
        const bankIbanNumber = computed({
            get: () => store.getters.account.bank_iban_number,
            set: val => store.commit('UPDATE_ACCOUNT_PROPERTY', {key: 'bank_iban_number', value: val})
        })
        const isBankAccount = computed({
            get: () => store.getters.account.is_bank_account,
            set: val => store.commit('UPDATE_ACCOUNT_PROPERTY', {key: 'is_bank_account', value: val})
        })
        const isPaymentEnabled = computed({
            get: () => store.getters.account.is_payment_enabled,
            set: val => store.commit('UPDATE_ACCOUNT_PROPERTY', {key: 'is_payment_enabled', value: val})
        })
        const isArchived = computed({
            get: () => store.getters.account.is_archived,
            set: val => store.commit('UPDATE_ACCOUNT_PROPERTY', {key: 'is_archived', value: val})
        })
        const accountGroups = computed(() => store.getters.accountGroups)
        const taxRates = computed(() => store.getters.taxRates)

        const isAccountGroupBankAndCashBalance = computed(() => {
            if (accountGroupId.value && 
                accountGroups.value.filter(accGr => accGr.id ===  accountGroupId.value)[0]?.name === 'Bank- og kontantbeholdninger') { // accountGroup is "Bank og kontantbeholdninger" with id 9
                return true
            }
            return false
        })

        const getAccountTypeId = computed( () => {
            if (accountGroupId.value) return accountGroups.value.filter(accGr => accGr.id ===  accountGroupId.value)[0]?.account_type_id
            return null
        })

        watch([() => accountGroupId.value, isBankAccount], ([newAccountGroupId, newIsBank]) => {
            if (newAccountGroupId && !isAccountGroupBankAndCashBalance.value) {
                isBankAccount.value = false
                isPaymentEnabled.value = false
                console.log(`newAccountGroupId: ${newAccountGroupId}`)
            }
            if (!newIsBank) {
                console.log(`newIsBank: ${newIsBank}`)
                bankId.value = 0
                console.log('bankId.value: ',bankId.value)
            }
        })

        const isTaxRateDisabled = computed(() => {
            const list = [
                9, // accountGroup -> Bank- og kontantbeholdninger
            ]
            if (list.includes(accountGroupId.value)) {
                return true
            }
            return false
        })

        const banks = [
            {
                country_id: 1,
                id: 1,
                logo_url: '',
                name: 'Nordea',
            }
        ]

        onMounted(async () => {
            await store.dispatch('fetchTaxRates')
            await store.dispatch('fetchAccountGroups')
            if (props.accountId) {
                await store.dispatch('fetchAccount', props.accountId)
            } else {
                store.commit('SET_ACCOUNT', {
                    organization_id: store.getters.user.organizationId,
                    account_type_id: null,
                    account_group_id: null,
                    tax_rate_id: null,
                    name: '',
                    description: '',
                    number: '',
                    currency_id: 'DKK',
                    bank_id: 0,
                    bank_registration_number: 0,
                    bank_account_number: 0,
                    bank_swift_number: '',
                    bank_iban_number: '',
                    is_bank_account: false,
                    is_payment_enabled: false,
                    is_archived: false
                })
            }
        })

        const validate = () => {
            errors.value = []
            let errs = {}
            let res = ''
            , req = ''
            console.log('validating starts')

            req = required(accountGroupId.value)
            res = isNum(accountGroupId.value)
            if (req !== true) errs.account_group_id = req
            if (res !== true ) errs.account_group_id = res

            if (isBankAccount.value) {
                res = isNum(bankId.value)
                req = required(bankId.value)
                if (req !== true) errs.bank_id = req
                if (res !== true) errs.bank_id = res
            }

            res = isNum(number.value)
            if (res !== true) errs.number = res

            res = isName(name.value, 2, 100)
            if (res !== true) errs.name = res

            res = isName(description.value, 10, 100)
            if (res !== true) errs.description = res

            if (!isTaxRateDisabled.value) {
                //req = required(taxRateId.value)
                res = isNum(taxRateId.value)
                //if (req !== true) errs.tax_rate_id = req
                if (res !== true) errs.tax_rate_id = res
            }

            errors.value = errs
            if (!Object.keys(errors.value).length > 0) {
                return true
            }
            return false
        }

        const saveAccount = () => {
            if (validate()) {
                const actionName = props.accountId ? 'updateAccount' : 'createAccount'
                store.dispatch(actionName, {
                    account: store.getters.account
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
            banks,
            taxRates,
            accountGroups,
            accountTypeId,
            accountGroupId,
            taxRateId,
            name,
            description,
            number,
            currencyId,
            bankId,
            bankRegistrationNumber,
            bankAccountNumber,
            bankSwiftNumber,
            bankIbanNumber,
            isBankAccount,
            isPaymentEnabled,
            isArchived,
            errors,
            saveAccount,
            isAccountGroupBankAndCashBalance,
            isTaxRateDisabled
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