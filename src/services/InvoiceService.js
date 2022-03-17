import { HTTP } from './http'

export default {
    getAll() {
        return HTTP.get(`/invoices`)
    },
    getOne(invoiceId) {
        return HTTP.get(`/invoices/${invoiceId}`)
    },
    update(organizationId, invoice) {
        // eslint-disable-next-line no-unused-vars
        const { id: invoiceId, client, lines, created_at, updated_at, ...invoiceRequiredFields } = invoice
        
        const requiredLines = lines.map(({
            // eslint-disable-next-line no-unused-vars
            created_at, updated_at, ...requiredFields
        }) => ({
            ...requiredFields
        }))
        return HTTP.put(`/organizations/${organizationId}/invoices/${invoiceId}`, {lines: requiredLines, ...invoiceRequiredFields})
    },
    create(organizationId, invoice) {
        return HTTP.post(`/organizations/${organizationId}/invoices`, invoice)
    },
    delete(organizationId, invoiceId) {
        return HTTP.delete(`/organizations/${organizationId}/invoices/${invoiceId}`)
    },

    // InvoiceLines
    deleteInvoiceLine(organizationId, invoiceId, lineId) {
        return HTTP.delete(`/organizations/${organizationId}/invoices/${invoiceId}/invoice-lines/${lineId}`)
    },
    markInvoiceAsSent(payload) {
        const { invoiceId, ...data } = payload
        return HTTP.patch(`/invoices/${invoiceId}/mark-as-sent`, data)
    }
}