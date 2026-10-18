import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import invoice from '@/store/modules/invoice'
import InvoiceService from '@/services/InvoiceService'

// The services talk to the API through axios, the router and the store: the
// store module is tested alone, so they are replaced.
vi.mock('@/services/InvoiceService', () => ({
    default: {
        getAll: vi.fn(),
        getOne: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        markInvoiceAsSent: vi.fn(),
        deleteInvoiceLine: vi.fn(),
    },
}))
vi.mock('@/utilities/toast', () => ({ toast: vi.fn() }))

const newStore = () =>
    createStore({ modules: { invoice: { ...invoice, state: () => ({ invoices: [], invoice: {} }) } } })

describe('invoice store: mutations', () => {
    let store
    beforeEach(() => {
        store = newStore()
    })

    it('replaces the list', () => {
        store.commit('SET_INVOICES', [{ id: 1 }, { id: 2 }])

        expect(store.getters.invoices).toEqual([{ id: 1 }, { id: 2 }])
    })

    it('adds an invoice to the list', () => {
        store.commit('ADD_INVOICE', { id: 1 })
        store.commit('ADD_INVOICE', { id: 2 })

        expect(store.getters.invoices.map((i) => i.id)).toEqual([1, 2])
    })

    it('replaces an invoice in the list, or adds it when it is not there', () => {
        store.commit('SET_INVOICES', [{ id: 1, state: 'draft' }])

        store.commit('UPDATE_INVOICES', { id: 1, state: 'approved' })
        store.commit('UPDATE_INVOICES', { id: 2, state: 'draft' })

        expect(store.getters.invoices).toEqual([
            { id: 1, state: 'approved' },
            { id: 2, state: 'draft' },
        ])
    })

    it('removes an invoice from the list', () => {
        store.commit('SET_INVOICES', [{ id: 1 }, { id: 2 }])

        store.commit('REMOVE_INVOICE', 1)

        expect(store.getters.invoices).toEqual([{ id: 2 }])
    })

    it('does nothing, and logs no error, when the removed invoice is not in the list', () => {
        // The list is only loaded on the invoices page, so an invoice opened
        // directly and then deleted is not in it
        const error = vi.spyOn(console, 'error').mockImplementation(() => {})
        store.commit('SET_INVOICES', [{ id: 2 }])

        store.commit('REMOVE_INVOICE', 99)

        expect(store.getters.invoices).toEqual([{ id: 2 }])
        expect(error).not.toHaveBeenCalled()
        error.mockRestore()
    })

    it('stores a property of the open invoice, turning null into an empty string', () => {
        store.commit('SET_INVOICE', { invoice_no: '1' })

        store.commit('UPDATE_INVOICE_PROPERTY', { key: 'invoice_no', value: '2' })
        store.commit('UPDATE_INVOICE_PROPERTY', { key: 'contact_id', value: null })

        expect(store.getters.invoice).toEqual({ invoice_no: '2', contact_id: '' })
    })

    it('adds, edits and removes lines of the open invoice', () => {
        store.commit('SET_INVOICE', { lines: [{ description: 'First', quantity: 1 }] })

        store.commit('ADD_INVOICE_NEW_LINE', { description: 'Second', quantity: 1 })
        store.commit('UPDATE_INVOICE_LINES_PROPERTY', { index: 1, key: 'quantity', value: 3 })
        expect(store.getters.invoice.lines.map((l) => [l.description, l.quantity])).toEqual([
            ['First', 1],
            ['Second', 3],
        ])

        store.commit('REMOVE_INVOICE_LINE', 0)
        expect(store.getters.invoice.lines.map((l) => l.description)).toEqual(['Second'])
    })
})

describe('invoice store: actions', () => {
    let store
    beforeEach(() => {
        vi.clearAllMocks()
        store = newStore()
    })

    it('fetches the list', async () => {
        InvoiceService.getAll.mockResolvedValue({ data: [{ id: 1 }] })

        await store.dispatch('fetchInvoices', 5)

        expect(InvoiceService.getAll).toHaveBeenCalledWith(5)
        expect(store.getters.invoices).toEqual([{ id: 1 }])
    })

    it('fetches one invoice into the open invoice', async () => {
        InvoiceService.getOne.mockResolvedValue({ data: { id: 7, invoice_no: '1007' } })

        await store.dispatch('fetchInvoice', { invoiceId: 7 })

        expect(InvoiceService.getOne).toHaveBeenCalledWith(7)
        expect(store.getters.invoice.invoice_no).toBe('1007')
    })

    it('creates an invoice and adds it to the list', async () => {
        InvoiceService.create.mockResolvedValue({ data: { id: 3 } })

        const response = await store.dispatch('createInvoice', { organizationId: 1, invoice: { invoice_no: '1' } })

        expect(InvoiceService.create).toHaveBeenCalledWith(1, { invoice_no: '1' })
        expect(response.data.id).toBe(3)
        expect(store.getters.invoices).toEqual([{ id: 3 }])
    })

    it('deletes an invoice through the API and drops it from the list', async () => {
        InvoiceService.delete.mockResolvedValue({})
        store.commit('SET_INVOICES', [{ id: 1 }, { id: 2 }])

        await store.dispatch('deleteInvoice', { organizationId: 1, invoiceId: 2 })

        expect(InvoiceService.delete).toHaveBeenCalledWith(1, 2)
        expect(store.getters.invoices).toEqual([{ id: 1 }])
    })

    it('keeps the invoice in the list when the API refuses to delete it', async () => {
        InvoiceService.delete.mockRejectedValue({ response: { status: 409 } })
        store.commit('SET_INVOICES', [{ id: 2 }])

        await expect(store.dispatch('deleteInvoice', { organizationId: 1, invoiceId: 2 })).rejects.toBeTruthy()

        expect(store.getters.invoices).toEqual([{ id: 2 }])
    })
})
