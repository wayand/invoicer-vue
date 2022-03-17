<template>
    <div class="page-heading">        
        <div class="page-title">
            <div class="row justify-content-between">
                <div class="col-12 col-md-6 order-md-1 order-last">
                    <h3>Invoice #{{ invoiceNo }} for {{ clientName }}</h3>
                </div>
                <div class="col-12 col-md-6 order-md-2 order-first" style="text-align: right;">
                    <div class="btn-group mb-1">
                        <div class="dropdown">
                            <button class="btn btn-secondary dropdown-toggle me-1" type="button" id="dropdownMenuButtonSec" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                More
                            </button>
                            <div class="dropdown-menu" aria-labelledby="dropdownMenuButtonSec" style="margin: 0px;">
                                <router-link :to="{ name: 'EditInvoice' }" class='dropdown-item'>Edit</router-link>
                                <a v-if="!invoice.is_sent&&isApproved" class="dropdown-item" href="#" @click="markInvoiceAsSent">Mark as sent</a>
                                <a class="dropdown-item" href="#" @click="generatePdf()">Save as PDF</a>
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
                    <InvoicePreview :organization="organization" :invoice="invoice" />
                </div>
            </div>
        </section>
    </div>
    <teleport to="body">
        <PromiseDialog ref="refDialog" />
    </teleport>
</template>
<script>
import html2pdf from "html2pdf.js";
import { ref, toRefs, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import InvoicePreview from '@/components/invoice/InvoicePreview'
import { toast } from '@/utilities/toast'
export default {
    props: {
        invoiceId: {
            type: [Number, String],
            required: true
        }
    },
    components: {
        InvoicePreview
    },
    methods: {
        generatePdf() {
            const invoice = document.querySelector('#invoice-preview');
            var opt = {
                margin: 0,
                filename: 'invoiceAsPdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { useCORS: true, scale: 2, imageTimeout: 1500, logging: true },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait' 
                },
                pagebreak: { mode: ['avoid-all'] }
            }
            html2pdf().from(invoice).set(opt).save();
        },
    },
    setup(props) {
        const { invoiceId } = toRefs(props)
        const store = useStore()
        const organization = computed(() => store.getters.organization)
        const invoice = computed(() => store.getters.invoice)
        const invoiceNo = computed(() => store.getters.invoice.invoice_no)
        const clientName = computed(() => store.getters.invoice.client?.name)
        const isApproved = computed(() => store.getters.invoice.state === 'approved')
        const refDialog = ref()

        const markInvoiceAsSent = async () => {
            console.log('Mark invoice as sent.')
            refDialog.value.data = {
                type: 'warning',
                title: "Confirm",
                content: "Mark the invoice as sent? You should only do this if you have sent the invoice to the customer.",
                accept: "Yes, mark as sent",
                reject: "Cancel"
            }

            const confirmation = await refDialog.value.showModal()
            if (confirmation === true) {
                store.dispatch('markInvoiceAsSent', { invoiceId: invoiceId.value, is_sent: true })
                    .then(() => {
                        toast('the invoice marked as sent', 'success')
                    })
                    .catch(e => {
                        console.log(e.message)
                        toast(e.response.data.error || e.message, 'error')
                    })
            }
        }

        onMounted( async () => {
            await store.dispatch('fetchOrganization', store.getters.user.organizationId)
            await store.dispatch('fetchInvoice', {
                organizationId: store.getters.user.organizationId,
                invoiceId: invoiceId.value
            }).catch(e => console.log('fetchInvoice ' + e))
        })

        return {
            refDialog,
            organization,
            invoice,
            isApproved,
            invoiceNo,
            clientName,
            markInvoiceAsSent
        }
    }
}
</script>