import InvoiceService from '@/services/InvoiceService'
import { toast } from '@/utilities/toast'

export default {
    state: {
        invoices: [],
        invoice: {}
    },
    getters: {
        invoices: state => state.invoices,
        invoice: state => state.invoice
    },
    actions: {
        fetchInvoices({commit}, organizationId) {
            return InvoiceService.getAll(organizationId)
                .then(response => {
                    commit('SET_INVOICES', response.data)
                    return response
                })
        },
        fetchInvoice({commit}, {invoiceId}) {
            return InvoiceService.getOne(invoiceId)
                .then(response => {
                    commit('SET_INVOICE', response.data)
                    return response
                })
        },
        createInvoice({commit}, {organizationId, invoice}) {
            return InvoiceService.create(organizationId, invoice)
                .then(response => {
                    commit('ADD_INVOICE', response.data)
                    return response
                })
        },
        updateInvoice({commit}, {organizationId, invoice}) {
            return InvoiceService.update(organizationId, invoice)
                .then(response => {
                    commit('UPDATE_INVOICES', response.data)
                    return response
                })
        },
        deleteInvoiceLine({state}, {organizationId, invoiceId, lineIndex}) {
            const lineId = state.invoice.lines[lineIndex]?.id
            console.log(`for organization ${organizationId} and invoice ${invoiceId}`)
            
            if (lineId) {
                return InvoiceService.deleteInvoiceLine(organizationId, invoiceId, lineId)
                    .then(() => toast('Successfully removed !', 'success'))
            } else {
                console.log(`No LineId for lineIndex: ${lineIndex}`)
            }
        },
        deleteInvoice({commit}, {organizationId, invoiceId}) {
            return InvoiceService.delete(organizationId, invoiceId)
                .then(() => {
                    commit('REMOVE_INVOICE', invoiceId)
                })
        },
        markInvoiceAsSent({commit}, payload) {
            return InvoiceService.markInvoiceAsSent(payload)
                .then(response => {
                    commit('UPDATE_INVOICES', response.data)
                    return response
                })
        }
    },
    mutations: {
        SET_INVOICES(state, invoices) {
            state.invoices = invoices
        },
        SET_INVOICE(state, invoice) {
            state.invoice = invoice
        },
        UPDATE_INVOICE_LINES_PROPERTY(state, lineProperty) {
            state.invoice.lines[lineProperty.index][lineProperty.key] = lineProperty.value
        },
        ADD_INVOICE_NEW_LINE(state, line) {
            state.invoice.lines.push(line)
        },
        REMOVE_INVOICE_LINE(state, lineIndex) {
            state.invoice.lines.splice(lineIndex, 1)
        },
        ADD_INVOICE(state, invoice) {
            state.invoices.push(invoice)
        },
        UPDATE_INVOICES(state, invoice) {
            const index = state.invoices.findIndex(item => item.id === invoice.id)
            if ( index !==  -1 ) {
                state.invoices[index] = invoice
            } else {
                state.invoices.push(invoice)
            }
        },
        UPDATE_INVOICE_PROPERTY (state, property) {
            state.invoice[property.key] = property.value === null ? '' : property.value
        },
        REMOVE_INVOICE(state, invoiceId) {
            const index = state.invoices.findIndex(item => item.id === invoiceId)
            if ( index !==  -1 ) {
                state.invoices.splice(index, 1)
            } else {
                console.error('mutation -> REMOVE_INVOICE:', invoiceId, index)
            }
        },
    }
}