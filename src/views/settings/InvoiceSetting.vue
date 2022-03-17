<template>
    <div class="page-heading">
        <div class="page-title">
            <div class="row justify-content-between">
                <div class="col-12 col-md-6 order-md-1 order-last">
                    <h3>Invoice setting</h3>
                </div>
                <div class="col-12 col-md-6 order-md-2 order-first">
                    <button @click="saveInvoiceSetting" type="submit" class="btn btn-primary me-1 mb-1 float-end">Save</button>
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
                    <form class="form" @submit.prevent="saveInvoiceSetting">
                        <div class="card">
                            <h5 class="card-header">Default payment account</h5>
                            <div class="card-content">
                                <div class="card-body">
                                    <div class="row mb-4">
                                        <div class="form-group w-25">
                                            <BaseSelect
                                                label="Payment account"
                                                :options="depositAccounts"
                                                :class="{ 'is-invalid': errors.default_deposit_account_id }"
                                                v-model.number="defaultDepositAccountId"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <h5 class="card-header">Default invoiceline-settings</h5>
                            <div class="card-content">
                                <div class="card-body">
                                    <div class="row mb-4">
                                        <div class="col-md-4 col-12">
                                            <div class="form-group">
                                                <BaseSelect
                                                    label="Default sales account"
                                                    :options="accounts"
                                                    :class="{ 'is-invalid': errors.default_account_id }"
                                                    v-model.number="defaultAccountId"
                                                />
                                            </div>
                                        </div>
                                        <div class="col-md-4 col-12">
                                            <div class="form-group">
                                                <label></label>
                                                <div class="form-check">
                                                    <BaseCheckbox
                                                        label="Lines including vat"
                                                        v-model="linesInclVat"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-4 col-12">
                                            <div class="form-group">
                                                <label></label>
                                                <div class="form-check">
                                                    <BaseCheckbox
                                                        label="Hide Product numbers on invoicelines"
                                                        v-model="hideProductNumbers"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <h5 class="card-header">Next invoicenumber</h5>
                            <div class="card-content">
                                <div class="card-body">
                                    <div class="row mb-4">
                                        <div class="col-md-4 col-12">

                                            <div class="form-group">
                                                <label>Invoice Numbering</label>
                                                <fieldset class="form-group">
                                                    <select v-model="invoiceNoMode" name="invoice_no_mode" class="form-select" :class="{ 'is-invalid': errors.invoice_no_mode }">
                                                        <option value="sequential" :selected="invoiceNoMode === 'sequential'">Sequential</option>
                                                        <option value="manual" :selected="invoiceNoMode === 'manual'">Manual input</option>
                                                    </select>
                                                </fieldset>
                                            </div>

                                            <div v-if="invoiceNoMode === 'sequential'" class="form-group">
                                                <label>Next Invoice Number</label>
                                                <input v-model="nextInvoiceNo" type="text" class="form-control" :class="{ 'is-invalid': errors.next_invoice_no }" name="next_invoice_no" placeholder="Next Invoice number">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <h5 class="card-header">Default reminder setting</h5>
                            <div class="card-content">
                                <div class="card-body">
                                    <div class="row mb-4">
                                        <div class="col-md-4 col-12">
                                            <div class="form-group">
                                                <BaseInput
                                                    v-model.number="defaultReminderFee"
                                                    label="Reminder fee"
                                                    type="text"
                                                    :class="{ 'is-invalid': errors.default_reminder_fee }"
                                                    :error="errors.default_reminder_fee"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </section>
    </div>    
</template>
<script>
import { computed, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import SettingsNavigation from '@/components/common/SettingsNavigation'
import BaseSelect from '@/components/formBaseElements/BaseSelect'
import BaseCheckbox from '@/components/formBaseElements/BaseCheckbox'
import BaseInput from '@/components/formBaseElements/BaseInput'
import { toast } from '@/utilities/toast'
import { required, isNum } from '@/utilities/validators'

export default {
    components: {
        SettingsNavigation,
        BaseSelect,
        BaseCheckbox,
        BaseInput
    },
    setup() {
        const errors = ref([])
        const store = useStore()

        const accounts = computed(() => store.getters.accounts)
        const depositAccounts = computed(() => store.getters.depositAccounts)

        const defaultDepositAccountId = computed({
            get: () => store.getters.invoiceSetting?.default_deposit_account_id,
            set: val => store.commit('UPDATE_INVOICE_SETTING_PROPERTY', {key: 'default_deposit_account_id', value: val})
        })

        const defaultAccountId = computed({
            get: () => store.getters.invoiceSetting?.default_account_id,
            set: val => store.commit('UPDATE_INVOICE_SETTING_PROPERTY', {key: 'default_account_id', value: val})
        })

        const linesInclVat = computed({
            get: () => store.getters.invoiceSetting?.lines_incl_vat,
            set: val => store.commit('UPDATE_INVOICE_SETTING_PROPERTY', {key: 'lines_incl_vat', value: val})
        })
        const hideProductNumbers = computed({
            get: () => store.getters.invoiceSetting?.hide_product_numbers,
            set: val => store.commit('UPDATE_INVOICE_SETTING_PROPERTY', {key: 'hide_product_numbers', value: val})
        })
        const invoiceNoMode = computed({
            get: () => store.getters.invoiceSetting?.invoice_no_mode,
            set: val => store.commit('UPDATE_INVOICE_SETTING_PROPERTY', { key: 'invoice_no_mode', value: val })
        })
        const nextInvoiceNo = computed({
            get: () => store.getters.invoiceSetting?.next_invoice_no,
            set: val => store.commit('UPDATE_INVOICE_SETTING_PROPERTY', { key: 'next_invoice_no', value: val })
        })

        const defaultReminderFee = computed({
            get: () => store.getters.invoiceSetting?.default_reminder_fee,
            set: val => store.commit('UPDATE_INVOICE_SETTING_PROPERTY', { key: 'default_reminder_fee', value: val })
        })

        onMounted( async () => {
            await store.dispatch('fetchOrganization', store.getters.user.organizationId)
                .catch(e => toast('Organization ' + e, 'error'))
            await store.dispatch('fetchAccounts')
                .catch(e => toast('Account ' + e, 'error'))
        })
        
        const validate = () => {
            errors.value = []
            let errs = {}
            let res = ''
            , req = ''

            req = required(defaultAccountId.value)
            res = isNum(defaultAccountId.value)
            if (req !== true) errs.default_account_id = req
            if (res !== true ) errs.default_account_id = res

            req = required(defaultDepositAccountId.value)
            res = isNum(defaultDepositAccountId.value)
            if (req !== true) errs.default_deposit_account_id = req
            if (res !== true ) errs.default_deposit_account_id = res

            req = required(invoiceNoMode.value)
            res = (() => ['sequential', 'manual'].includes(invoiceNoMode.value))()
            if (req !== true) errs.invoice_no_mode = req
            if (res !== true ) errs.invoice_no_mode = 'possible values "sequential, manual"'

            if (invoiceNoMode.value === 'sequential') {
                req = required(nextInvoiceNo.value)
                if (req !== true) errs.next_invoice_no = req
            }

            req = required(defaultReminderFee.value)
            res = isNum(defaultReminderFee.value)
            if (req !== true) errs.default_reminder_fee = req
            if (res !== true ) errs.default_reminder_fee = res

            errors.value = errs
            if (!Object.keys(errors.value).length > 0) {
                return true
            }
            return false
        }

        const saveInvoiceSetting = () => {
            if (validate()) {
                store.dispatch('updateInvoiceSetting', store.getters.invoiceSetting)
                .then(() => {
                    toast('Successfully saved invoice settings!', 'success')
                })
                .catch(e => {
                    if (e.response) {
                        if (e.response.data.errors) {
                            errors.value = e.response.data.errors
                            toast(JSON.stringify( errors.value ), 'error')
                        } else {
                            toast(e.response.data.error || e.response.data.msg, 'error')
                        }
                    } else {
                        toast(e.message, 'error')
                        console.log(e.message)
                    }
                })
            }
        }

        return {
            errors,
            defaultDepositAccountId,
            defaultAccountId,
            linesInclVat,
            hideProductNumbers,
            invoiceNoMode,
            nextInvoiceNo,
            defaultReminderFee,
            accounts,
            depositAccounts,
            saveInvoiceSetting
        }
    },
}
</script>