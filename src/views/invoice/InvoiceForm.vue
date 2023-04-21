<template>
    <div class="page-heading">        
        <div class="page-title">
            <div class="row justify-content-between">
                <div class="col-12 col-md-6 order-md-1 order-last">
                    <h3>{{ invoiceId ? 'Edit' : 'Create' }} Invoice</h3>
                </div>
                <div class="col-12 col-md-6 order-md-2 order-first" style="text-align: right;">
                    <button @click="saveInvoice" type="submit" name="save-as-approved" v-if="state==='draft'&&invoiceId" class="btn btn-primary me-1 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16">
                            <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                        </svg>
                        Approve
                    </button>
                    <button @click="saveInvoice" type="submit" name="save-as-draft" class="btn btn-outline-primary me-1 mb-1">Save{{ !invoiceId || state==='draft' ? ' as draft' : '' }}</button>
                    <div class="btn-group mb-1">
                        <div class="dropdown">
                            <button class="btn btn-secondary dropdown-toggle me-1" type="button" id="dropdownMenuButtonSec" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                More
                            </button>
                            <div class="dropdown-menu" aria-labelledby="dropdownMenuButtonSec" style="margin: 0px;">
                                <router-link v-if="invoiceId" :to="{ name: 'ShowInvoice', params: { invoiceId: invoiceId } }" class='dropdown-item'>Preview</router-link>
                                <a class="dropdown-item" href="#" v-if="invoiceId" @click="createInvoicePDF()">Save as PDF</a>
                                <a class="dropdown-item" href="#" v-if="invoiceId" @click="duplicateInvoice()">Duplicate</a>
                                <a class="dropdown-item" href="#" v-if="invoiceId" @click="deleteInvoice()">Delete</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="page-content">
        <section id="multiple-column-form">
            <div class="row match-height">
                <div class="col-12">
                    <div class="card">
                        <div class="card-content">
                            <div class="card-body">
                                <form class="form" @submit.prevent="saveInvoice">
                                    <div class="row mb-4 justify-content-between">
                                        <div class="col-md-3 col-3">
                                            <fieldset class="form-group">
                                                <select v-model="clientID" class="form-select" :class="{ 'is-invalid': error.clientID }" @change="clientHandler">
                                                    <optgroup label="Select Client">
                                                        <option value="-1">Select client</option>
                                                        <option v-for="client in clients" :key="client.id" :value="client.id">{{ client.name }}</option>
                                                    </optgroup>
                                                    <optgroup label="">
                                                        <option value="new">+ Create new</option>
                                                    </optgroup>
                                                </select>
                                            </fieldset>
                                            <fieldset class="form-group" v-if="selectedClient">
                                                <div>
                                                    {{ selectedClient.name }}<br>
                                                    {{ selectedClient.street }}<br>
                                                    {{ selectedClient.zipcode }} {{ selectedClient.city }}
                                                </div>
                                            </fieldset>
                                            <div v-if="error.clientID" class="invalid-feedback">
                                                <i class="bx bx-radio-circle"></i>
                                                {{ error.clientID }}
                                            </div>
                                        </div>
                                        <div class="col-md-5 col-5">
                                            <div class="row">
                                                <div class="col-md-5">
                                                    <label>Invoice Number</label>
                                                </div>
                                                <div class="col-md-7 form-group">
                                                    <div class="input-group flex-nowrap">
                                                        <span class="input-group-text" id="addon-wrapping">#inv</span>
                                                        <input type="text" v-model="invoiceNo" class="form-control" :class="{ 'is-invalid': error.invoiceNo }" placeholder="Invoice number" disabled>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-5">
                                                    <label>Date</label>
                                                </div>
                                                <div class="col-md-7 form-group">
                                                    <Datepicker :typeable="true" inputFormat="yyyy-MM-dd" v-model="invoiceDate" class="form-control" :class="{ 'is-invalid': error.invoiceDate }" />
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-5">
                                                    <label>Due date</label>
                                                </div>                                               
                                                <div class="col-md-7 form-group">
                                                    <Datepicker :typeable="true" inputFormat="yyyy-MM-dd" v-model="invoiceDueDate" class="form-control" :class="{ 'is-invalid': error.invoiceDueDate }" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="table-responsive">
                                            <table class="table">
                                                <thead>
                                                    <tr>
                                                        <th>Product</th>
                                                        <th>Description</th>
                                                        <th>Quantity</th>
                                                        <th>Unit price</th>
                                                        <th colspan="2">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <Line 
                                                        :error="error.lines ? error.lines[index] : {}"
                                                        :products="products"
                                                        v-for="(line, index) in lines" :key="index" 
                                                        :line-index="index"
                                                        :the-line="line"
                                                        :count="count"
                                                        @validate="validate"
                                                        @updateInvoice="updateInvoice"
                                                        @deleteLine="deleteLine"
                                                    />
                                                </tbody>
                                            </table>
                                            <div class="col-12 float-start">
                                                <button type="button" class="btn btn-outline" @click="addNewLine">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16" id="plus-lg"><path d="M8 0a1 1 0 011 1v6h6a1 1 0 110 2H9v6a1 1 0 11-2 0V9H1a1 1 0 010-2h6V1a1 1 0 011-1z"></path></svg> Add line
                                                </button>
                                            </div>
                                            <table class="table float-end text-end" style="width:30%">
                                                <tr>
                                                    <td>Total excluding VAT</td>
                                                    <td>{{ $filters.toCurrency(total_ex_vat) }}</td>
                                                </tr>
                                                <tr>
                                                    <td>Sale VAT (25%)</td>
                                                    <td>{{ $filters.toCurrency(vatAmount) }}</td>
                                                </tr>
                                                <tr class="fw-bold border-bottom border-top">
                                                    <td>Total including VAT</td>
                                                    <td>{{ $filters.toCurrency(total_inc_vat) }}</td>
                                                </tr>
                                            </table>
                                        </div>
                                        <div class="col-12 d-flex justify-content-start">
                                            <div>
                                                <div>
                                                    Betalingsbetingelser: Netto 8 dage - Forfaldsdato: {{ luxon(invoiceDueDate).toFormat('dd-MM-yyyy') }}
                                                    <p>
                                                        Beløbet indbetales på bankkonto:<br>
                                                        Bank / Reg.nr. <strong>{{ settingDefaultDepositAccount?.bank_registration_number }}</strong> / Kontonr. <strong>{{ settingDefaultDepositAccount?.bank_account_number }}</strong><br>
                                                        Fakturanr. <strong>{{ invoiceNo }}</strong> bedes angivet ved bankoverførsel
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <hr>
                                    <div class="text-center">
                                        <strong>{{ organization.name }}</strong> / {{ organization.street }} / {{ organization.zipcode+' '+organization.city }}<br>
                                        CVR-nr. {{ organization.registration_no }} / Tlf. {{ organization.phone }} / Mail: {{ organization.email }}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
    <teleport to="body">
        <ClientFormModal v-if="showClientFormModal" @close="closeClientFormModal" />
        <PromiseDialog ref="refDialog" />
    </teleport>
</template>
<script>
import Datepicker from 'vue3-datepicker'
import Line from '@/components/invoice/Line'
import ClientFormModal from '@/components/client/ClientFormModal'
import { watch, ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import MyDatetimeObject from '@/utilities/mydate'
import { isNum, required } from '@/utilities/validators'
import { toast } from '@/utilities/toast'

export default {
    props: {
        invoiceId: {
            type: [Number, String, Boolean],
            required: false,
            default: false
        }
    },
    components: {
        Datepicker,
        Line,
        ClientFormModal,
    },
    setup(props) {
        onBeforeRouteLeave(async (to, from, next) => {
            if (isInvoiceFormSaved.value) {
                next()
            } else {
                refDialog.value.data = {
                    type: 'warning',
                    title: "Confirm navigation",
                    content: "Your changes have not been saved yet. Do you really want to leave this page?",
                    accept: "Yes leave",
                    reject: "Stay here"
                }

                const confirmation = await refDialog.value.showModal()
                confirmation === true ? next() : next(false)
            }
        })

        onMounted(async () => {
            await store.dispatch('fetchOrganization', store.getters.user.organizationId)
            await store.dispatch('fetchClients', store.getters.user.organizationId)
            await store.dispatch('fetchProducts', store.getters.user.organizationId)
            await store.dispatch('fetchAccounts')

            if (props.invoiceId) {
                await loadEditingInvoice()
            } else {
                initNewInvoice()
            }
            isInvoiceFormSaved.value = true
        })

        const { luxon } = MyDatetimeObject()

        const refDialog = ref()
        const router = useRouter()
        const store = useStore()
        const isInvoiceFormSaved = ref(true)
        const showClientFormModal = ref(false)
        const oldClientID = ref(-1)
        const selectedClient = ref(null)

        const organization = computed(() => store.getters.organization)
        const settingDefaultAccount = computed(() => store.getters.getAccountById(organization.value.invoice_setting?.default_account_id))
        const settingDefaultDepositAccount = computed(() => store.getters.getAccountById(organization.value.invoice_setting?.default_deposit_account_id))

        const invoiceNumber = computed(() => {
            if (store.getters.invoiceSetting?.invoice_no_mode === 'sequential' && props.invoiceId === false) {
                return String(store.getters.invoiceSetting.next_invoice_no)
            } else {
                return store.getters.invoice.invoice_no
            }
        })

        const vatAmount = computed({
            get: () => store.getters.invoice.vat_amount,
            set: val => store.commit('UPDATE_INVOICE_PROPERTY', { key: 'vat_amount', value: val })
        })
        const clientID = computed({
            get: () => store.getters.invoice.client_id || -1,
            set: val => store.commit('UPDATE_INVOICE_PROPERTY', { key: 'client_id', value: val })
        })
        const invoiceNo = computed({ 
            get: () => invoiceNumber.value,
            set: val => store.commit('UPDATE_INVOICE_PROPERTY', { key: 'invoice_no', value: val })
        })
        const invoiceDate = computed({
            get: () => new Date(store.getters.invoice.invoice_date),
            set: val => store.commit('UPDATE_INVOICE_PROPERTY', { key: 'invoice_date', value: luxon(val).toFormat('yyyy-MM-dd') })
        })
        const invoiceDueDate = computed({
            get: () => new Date(store.getters.invoice.duedate),
            set: val => store.commit('UPDATE_INVOICE_PROPERTY', { key: 'duedate', value: luxon(val).toFormat('yyyy-MM-dd') })
        })
        const total_ex_vat = computed({
            get: () => store.getters.invoice.amount,
            set: val => store.commit('UPDATE_INVOICE_PROPERTY', { key: 'amount', value: val })
        })
        const total_inc_vat = computed({
            get: () => store.getters.invoice.gross_amount,
            set: val => store.commit('UPDATE_INVOICE_PROPERTY', { key: 'gross_amount', value: val })
        })
        const state = computed({
            get: () => store.getters.invoice.state,
            set: val => store.commit('UPDATE_INVOICE_PROPERTY', { key: 'state', value: val })
        })

        const clients = computed( () => store.getters.clients )
        const products = computed( () => store.getters.products )

        const lines = computed(() => store.getters.invoice.lines)

        async function loadEditingInvoice() {
            if (props.invoiceId !== false) {
                await store.dispatch('fetchInvoice', {
                    organizationId: store.getters.user.organizationId,
                    invoiceId: props.invoiceId
                }).catch(e => console.log('fetchInvoice ' + e))
                selectedClient.value = clients.value.filter( c => c.id === clientID.value)[0]
                updateInvoice()
            }
        }

        function initNewInvoice() {
            store.commit('SET_INVOICE', {
                organization_id: store.getters.user.organizationId,
                client_id: null,
                currency_id: 'DKK',
                excluding_vat: true,
                invoice_no: invoiceNumber.value,
                is_paid: false,
                is_sent: false,
                invoice_date: luxon().toFormat('yyyy-MM-dd'),
                duedate: luxon().toFormat('yyyy-MM-dd'),
                amount: 0.00,
                gross_amount: 0.00,
                template_id: '1',
                vat_amount: 0.00,
                state: 'draft',
                lines: [{    
                    product_id: -1,
                    description: '',
                    quantity: 1,
                    unit_price: 0,
                    amount: 0.00
                }]
            })
        }

        watch(() => props.invoiceId, async () => {
            if (props.invoiceId) {
                await loadEditingInvoice()
            } else {
                initNewInvoice()
            }
        })

        const addNewLine = () => {
            store.commit('ADD_INVOICE_NEW_LINE', {
                product_id: -1,
                description: '',
                quantity: 1,
                unit_price: 0,
                amount: 0.00
            })
        }
        const deleteLine = lineIndex => {
            store.commit('REMOVE_INVOICE_LINE', lineIndex)
            updateInvoice()
        }

        const updateInvoice = () => {
            total_ex_vat.value = lines.value.reduce(
                (total, val) => total + val.quantity * val.unit_price
            , 0)
            vatAmount.value = (total_ex_vat.value) * .25
            total_inc_vat.value = (total_ex_vat.value) + vatAmount.value

            isInvoiceFormSaved.value = false
            console.log('updateInvoice ...')
        }

        const openClientFormModal = () => {
            document.body.classList.add("modal-open")
            showClientFormModal.value = true
        }

        const closeClientFormModal = () => {
            document.body.classList.remove("modal-open")
            showClientFormModal.value = false
        }

        const clientHandler = e => {
            if (e.target.value === 'new') {
                clientID.value = oldClientID.value
                openClientFormModal()
                return
            } else {
                selectedClient.value = clients.value.filter( c => c.id === clientID.value)[0]
                oldClientID.value = e.target.value
            }
        }

        watch([()=>clientID.value, ()=>invoiceDate.value, ()=>invoiceDueDate.value], () => {
            validate()
        })

        const error = ref('')
        const errors = ref([])
        const validate = () => {
            let errs = {}
            let err = ''
            console.log('validate starts')
            err = isNum(clientID.value)
            if ( err !== true ) errs.clientID = err
            if ( clientID.value == -1 ) errs.clientID = 'This field is required'

            err = isNum(invoiceNo.value)
            if ( err !== true) errs.invoiceNo = err
            if ( invoiceNo.value == 0 ) errs.invoiceNo = 'This field is required'

            let linesError = lines.value.map(line => {
                let lineErrs = {}
                
                err = isNum(line.product_id)
                if ( err !== true ) lineErrs.product_id = err
                if ( line.product_id == -1 ) lineErrs.product_id = 'This field is required'
                
                err = required(line.description)
                if ( err !== true) lineErrs.description = err
                
                err = isNum(line.unit_price)
                if ( err !== true ) lineErrs.unit_price = err

                return lineErrs
            })
            
            if (linesError.filter(lineErrs => JSON.stringify(lineErrs) !== '{}').length) {
                errs['lines'] = linesError
            }
            console.log('Validate ends, err No', Object.keys(error.value).length)
            error.value = errs
            if (!Object.keys(error.value).length > 0) {
                return true
            }
            return false
        }

        const saveInvoice = (e) => {    

            if (validate()) {
                const actionName = props.invoiceId ? 'updateInvoice' : 'createInvoice'

                if (e.target.name === 'save-as-approved') { state.value = 'approved' }

                store.dispatch(actionName, {organizationId: store.getters.user.organizationId, invoice: store.getters.invoice})
                    .then(response => {
                        isInvoiceFormSaved.value = true
                        toast('Successfully saved !', 'success')
                        router.push({ name: "EditInvoice", params: { invoiceId: response.data.id } })
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
        }

        function createInvoicePDF() {console.log('craete PDF')}
        function duplicateInvoice() {console.log('Duplicating invoice')}
        async function deleteInvoice() {
            refDialog.value.data = {
                type: 'warning',
                title: 'Confirm delete invoice',
                content: 'Are you sure, you want to delete this draft invoice?',
                accept: 'yes, delete invoice',
                reject: 'No, Cancel'
            }

            const confirmation = await refDialog.value.showModal()
            if (confirmation === true) {
                
                store.dispatch('deleteInvoice', {
                    organizationId: store.getters.user.organizationId, 
                    invoiceId: parseInt(props.invoiceId)
                })
                    .then(() => {
                        toast('Draft Invoice Deleted !!!!', 'success')
                        router.push({ name: "Invoices" })
                    })
                    .catch(e => {
                        if (e.response) {
                            toast(e.response.data.error || e.response.data.msg, 'error')
                        } else {
                            toast(e.message, 'error')
                        }
                    })
            }
        }

        return {
            count: computed(()=> lines.value.length),
            lines,
            addNewLine,
            deleteLine,
            showClientFormModal,
            openClientFormModal,
            closeClientFormModal,
            clients,
            clientHandler,
            updateInvoice,
            validate,
            selectedClient,
            clientID,
            invoiceNo,
            oldClientID,
            invoiceDate,
            invoiceDueDate,
            saveInvoice,
            products,
            total_ex_vat,
            total_inc_vat,
            state,
            vatAmount,
            error,
            createInvoicePDF,
            duplicateInvoice,
            deleteInvoice,
            isInvoiceFormSaved,
            refDialog,
            settingDefaultAccount,
            settingDefaultDepositAccount,
            luxon,
            organization
        }
    }
}
</script>
<style scoped>
.bi {
    vertical-align: -0.1em;
    margin-bottom: calc(-0.125em / 2);
}
select optgroup {
    background-color: rgb(187, 99, 12);
    color:rgb(155, 46, 46);
    font-style:normal;
    font-weight:normal;
}
</style>