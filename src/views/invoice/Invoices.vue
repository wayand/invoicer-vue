<template>
    <div class="page-heading">
        <div class="page-title">
            <div class="row">
                <div class="col-12 col-md-6 order-md-1 order-last">
                    <h3>Invoices</h3>
                    <p class="text-subtitle text-muted">For user to check they list</p>
                </div>
                <div class="col-12 col-md-6 order-md-2 order-first">
                    <nav aria-label="breadcrumb" class="breadcrumb-header float-start float-lg-end">
                        <ol class="breadcrumb">
                            <li class="breadcrumb-item"><a href="/">Dashboard</a></li>
                            <li class="breadcrumb-item active" aria-current="page">Invoices</li>
                        </ol>
                    </nav>
                </div>
            </div>
        </div>
    </div>
    <div class="page-content">
        <section class="section">
            <div class="card">
                <div class="card-header">
                    All invoices <span class="badge bg-secondary">{{ invoices.length }}</span>
                </div>
                <div class="card-body">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Number</th>
                                <th>Date</th>
                                <th>Due</th>
                                <th>Client</th>
                                <th>Total Exc.Vat</th>
                                <th>Total inc.Vat</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-if="invoices.length">
                                <tr v-for="invoice in invoices" :key="invoice.id" @click.prevent="clickHandler($event, invoice.id)">
                                    <td>
                                        <span :class="`badge bg-${invoice.state === 'draft'?'danger':'primary'}`">
                                            {{ invoice.state }}
                                        </span>&nbsp;
                                        <template v-if="invoice.is_sent">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-envelope-check" viewBox="0 0 16 16">
                                                <path d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l7-4.2V8.5a.5.5 0 0 0 1 0V4a2 2 0 0 0-2-2H2Zm3.708 6.208L1 11.105V5.383l4.708 2.825ZM1 4.217V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.217l-7 4.2-7-4.2Z"/>
                                                <path d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-1.993-1.679a.5.5 0 0 0-.686.172l-1.17 1.95-.547-.547a.5.5 0 0 0-.708.708l.774.773a.75.75 0 0 0 1.174-.144l1.335-2.226a.5.5 0 0 0-.172-.686Z"/>
                                            </svg>
                                        </template>
                                    </td>
                                    <td>#inv{{ invoice.invoice_no }}</td>
                                    <td>{{ invoice.invoice_date }}</td>
                                    <td>{{ invoice.duedate }}</td>
                                    <td>{{ invoice.client.name }}</td>
                                    <td>{{ $filters.toCurrency(invoice.amount) }}</td>
                                    <td>{{ $filters.toCurrency(invoice.gross_amount) }}</td>
                                    <td>
                                        <button type="button" class="edit__invoice btn btn-primary me-1 mb-1 float-end">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                                                <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                                                <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            </template>
                            <tr v-else>
                                <td colspan="5">No Invoices yet, please create new.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    </div>
</template>
<script>
import { computed, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { toast } from '@/utilities/toast'
import { useRouter } from 'vue-router'

export default {
    setup() {
        const error = ref('')
        const router = useRouter()
        const store = useStore()
        
        const invoices = computed(() => store.getters.invoices)
        const preview = invoiceId => router.push({ name: "ShowInvoice", params: { invoiceId: invoiceId } })
        const edit = invoiceId => router.push({ name: "EditInvoice", params: { invoiceId: invoiceId } })

        const clickHandler = (e, invoiceId) => {
            const editInvoice = e.target.closest('td > button.edit__invoice')
            if (editInvoice) return edit(invoiceId)
            return preview(invoiceId)
        }

        onMounted( async () => {
            await store.dispatch('fetchInvoices', store.getters.user.organizationId)
                .catch(e => toast('Invoices ' + e, 'error'))    
        })

        return {
            error,
            invoices,
            clickHandler,
            preview,
            edit
        }
    }
}
</script>
<style scoped>
.table tbody tr {
    cursor: pointer;
}
</style>