import { HTTP } from './http'

// The server calculates every amount from the lines (docs/money-rules.md in invoicer-api)
// and ignores what it is sent, so none are sent. The same goes for what the server sets when it
// approves an invoice (docs/invoice-posting-design.md): the state, the number of the voucher, who
// approved it and when, and the VAT by code. It refuses a request that has them.
/* eslint-disable no-unused-vars */
const withoutAmounts = ({
    amount,
    vat_amount,
    gross_amount,
    excluding_vat,
    state,
    is_sent,
    is_paid,
    journal_entry_id,
    voucher_no,
    approved_at,
    approved_by,
    vat_by_code,
    lines = [],
    ...invoice
}) => ({
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
    // Approve a draft: the server gives it its number, posts it and locks it. An organization that
    // numbers its invoices by hand sends the number here.
    approve(organizationId, invoiceId, invoiceNo = null) {
        return HTTP.post(
            `/organizations/${organizationId}/invoices/${invoiceId}/approve`,
            invoiceNo ? { invoice_no: invoiceNo } : {},
        )
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
