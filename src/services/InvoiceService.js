import { HTTP } from './http'

// The server calculates every amount from the lines (docs/money-rules.md in invoicer-api)
// and ignores what it is sent, so none are sent.
/* eslint-disable no-unused-vars */
const withoutAmounts = ({ amount, vat_amount, gross_amount, excluding_vat, lines = [], ...invoice }) => ({
    ...invoice,
    lines: lines.map(({ amount, created_at, updated_at, ...line }) => line),
})
/* eslint-enable no-unused-vars */

export default {
    getAll() {
        return HTTP.get(`/invoices`)
    },
    getOne(invoiceId) {
        return HTTP.get(`/invoices/${invoiceId}`)
    },
    update(organizationId, invoice) {
        // eslint-disable-next-line no-unused-vars
        const { id: invoiceId, contact, created_at, updated_at, ...fields } = invoice
        return HTTP.put(`/organizations/${organizationId}/invoices/${invoiceId}`, withoutAmounts(fields))
    },
    create(organizationId, invoice) {
        return HTTP.post(`/organizations/${organizationId}/invoices`, withoutAmounts(invoice))
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
    },
}
