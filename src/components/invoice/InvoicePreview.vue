<template>    
    <div class="card invoice-preview" id="invoice-preview">
        <div class="card-content">
            <div class="card-body">
                <div class="row">
                    <div class="text-center">
                        <img width="100" height="120" class="rounded float-end" style="max-height: 120px; width: auto;" :src="organizationLogo">
                    </div>
                </div>

                <div class="row mb-4 justify-content-between">
                    <div class="col-md-3 col-3">
                        <span class="fw-bold">{{ invoice.client?.name }}</span><br>
                        {{ invoice.client?.street }}<br>
                        {{ invoice.client?.zipcode }} {{ invoice.client?.city }}<br> 
                    </div>
                    <div class="col-md-5 col-5 text-end">
                        <span class="fw-bold">{{ organization.name }}</span><br>
                        {{ organization.street }}<br>
                        {{ organization.zipcode }} {{ organization.city }}<br>
                        {{ organization.country?.name }}
                        
                        <p><br></p>
                        CVR-nr.: {{ organization.registration_no }}<br>
                        Tlf.: {{ organization.phone }}<br>
                        {{ organization.email }}
                    </div>
                </div>

                <div class="row">
                    <div class="table-responsive">
                        <table class="table table-light">
                            <tbody>
                                <tr>
                                    <td class="title">Faktura</td>
                                    <td class="text-end">Fakturanr.: <span class="fw-bold">{{ invoice.invoice_no }}</span></td>
                                    <td class="text-end">Fakturadato: <span class="fw-bold">{{ invoice.invoice_date }}</span></td>
                                    <td class="text-end">Forfaldsdato: <span class="fw-bold">{{ invoice.duedate }}</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="row">
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th class="text-end">Quantity</th>
                                    <th class="text-end">Unit price</th>
                                    <th class="text-end">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <LineShow :theLine="line" v-for="(line, index) in invoice.lines" :key="index" />
                            </tbody>
                        </table>

                        <table class="table float-end text-end" style="width:50%">
                            <tr>
                                <td>I alt ekskl. moms</td>
                                <td>{{ $filters.toCurrency(total_ex_vat) }}</td>
                            </tr>
                            <tr>
                                <td>Moms (25%)</td>
                                <td>{{ $filters.toCurrency(vatAmount) }}</td>
                            </tr>
                            <tr class="fw-bold border-bottom border-top">
                                <td>I alt inkl. moms</td>
                                <td>{{ $filters.toCurrency(total_inc_vat) }}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-12 d-flex justify-content-start mt-5">
                        <div>
                            <div>
                                Betalingsbetingelser: Netto 8 dage - Forfaldsdato: {{ invoice.duedate }}
                                <p>
                                    Beløbet indbetales på bankkonto:<br>
                                    Bank / Reg.nr. <strong>{{ settingDefaultDepositAccount?.bank_registration_number }}</strong> / Kontonr. <strong>{{ settingDefaultDepositAccount?.bank_account_number }}</strong><br>
                                    Fakturanr. <strong>{{ invoice.invoice_no }}</strong> bedes angivet ved bankoverførsel
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
            </div>
        </div>
    </div>
</template>
<script>
import { computed, toRefs, onMounted } from 'vue'
import { useStore } from 'vuex'
import LineShow from '@/components/invoice/LineShow'
export default {
    props: {
        organization: {
            type: Object,
            required: true
        },
        invoice: {
            type: Object,
            required: true
        }
    },
    components: {
        LineShow
    },
    setup(props) {

        const store = useStore()
        const { invoice, organization } = toRefs(props)

        onMounted(async () => await store.dispatch('fetchAccounts'))

        const settingDefaultAccount = computed(() => store.getters.getAccountById(organization.value.invoice_setting?.default_account_id))
        const settingDefaultDepositAccount = computed(() => store.getters.getAccountById(organization.value.invoice_setting?.default_deposit_account_id))

        const organizationLogo = computed(() => {
            let URL = 'https://invoicer-api.wayand.dk'
            if (location.hostname === 'localhost' || location.hostname === '192.168.0.173') {
                URL = 'http://localhost:5000'
            }
            return URL + '/organizations/' + organization.value.slug + '/logo/' + organization.value.logo
        })
        const total_ex_vat = computed(() => {
            return invoice.value.lines?.reduce(
                (total, val) => total + val.quantity * val.unit_price
            , 0)
        })
        const vatAmount = computed(() => (invoice.value.amount) * .25)
        const total_inc_vat = computed(() => (invoice.value.amount) + vatAmount.value)
        
        return {
            organizationLogo,
            total_ex_vat,
            vatAmount,
            total_inc_vat,
            settingDefaultAccount,
            settingDefaultDepositAccount
        }
    },
}
</script>
<style scoped>
.invoice-preview {
    padding: 0 20px;
    width: 800px;
    color: #000;
    font-size: 12px;
    font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
}
.invoice-preview .title {
    font-size: 35px;
}
.invoice-preview .table {
    color: #000;
}
.invoice-preview .table td {
    vertical-align: bottom;
    border-color: #000;
}
</style>