import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createStore } from 'vuex'
import { defineComponent, h } from 'vue'
import InvoiceForm from '@/views/invoice/InvoiceForm.vue'
import invoice from '@/store/modules/invoice'
import InvoiceService from '@/services/InvoiceService'
import { toast } from '@/utilities/toast'

// Network-bound modules the form imports but this test does not use
vi.mock('@/services/InvoiceService', () => ({
    default: { getOne: vi.fn(), getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}))
vi.mock('@/utilities/toast', () => ({ toast: vi.fn() }))

// An approved and sent invoice with two lines, as the API returns it
const source = {
    id: 2,
    organization_id: 1,
    contact_id: 5,
    invoice_no: '1001',
    state: 'approved',
    is_sent: true,
    journal_entry_id: 41,
    voucher_no: 9,
    approved_at: '2026-01-02T10:00:00',
    approved_by: 1,
    currency_id: 'EUR',
    excluding_vat: false,
    template_id: '2',
    invoice_date: '2026-01-01',
    duedate: '2026-01-15',
    amount: 300,
    vat_amount: 25,
    gross_amount: 325,
    created_at: '2026-01-01T10:00:00',
    updated_at: '2026-01-02T10:00:00',
    lines: [
        {
            id: 11,
            invoice_id: 2,
            product_id: 1,
            description: 'First job',
            vat_code: 'S01',
            quantity: 1,
            unit_price: 100,
            amount: 100,
            created_at: 'x',
            updated_at: 'y',
        },
        {
            id: 12,
            invoice_id: 2,
            product_id: 1,
            description: 'Second job',
            vat_code: 'S02',
            quantity: 2,
            unit_price: 100,
            amount: 200,
            created_at: 'x',
            updated_at: 'y',
        },
    ],
}
const contacts = [
    { id: 4, name: 'Other ApS', street: 'Side St 2', zipcode: '9000', city: 'Aalborg' },
    { id: 5, name: 'Acme ApS', street: 'Main St 1', zipcode: '8000', city: 'Aarhus' },
]

const page = () => defineComponent({ render: () => h('div') })
const stubbed = (name) => defineComponent({ name, render: () => null })

const newStore = (organization) =>
    createStore({
        modules: { invoice: { ...invoice, state: () => ({ invoices: [], invoice: {} }) } },
        getters: {
            user: () => ({ organizationId: 1 }),
            organization: () => organization,
            contacts: () => contacts,
            products: () => [],
            invoiceSetting: () => ({ invoice_no_mode: 'sequential', next_invoice_no: 1003 }),
            getAccountById: () => () => ({ name: 'Bank' }),
            salesVatCodes: () => [],
            salesRates: () => ({ S01: 0.25, S02: 0 }),
        },
        actions: {
            fetchOrganization: () => {},
            fetchContacts: () => {},
            fetchProducts: () => {},
            fetchAccounts: () => {},
            fetchVatCodes: () => {},
        },
    })

const registered = { id: 1, vat_period_type: 'quarter', invoice_setting: {} }
const openNewInvoice = async (url, organization = registered) => {
    const store = newStore(organization)
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/invoices/new', name: 'NewInvoice', component: InvoiceForm },
            { path: '/invoices/:invoiceId(\\d+)/edit', name: 'EditInvoice', component: page(), props: true },
            { path: '/invoices/:invoiceId(\\d+)', name: 'ShowInvoice', component: page(), props: true },
        ],
    })
    router.push(url)
    await router.isReady()
    const wrapper = mount(defineComponent({ render: () => h(RouterView) }), {
        global: {
            plugins: [store, router],
            components: { PromiseDialog: stubbed('PromiseDialog') },
            stubs: { teleport: true, Datepicker: true, InvoiceLine: true, ContactFormModal: true },
            mocks: { $filters: { toCurrency: (value) => String(value), toFloat: (value) => value } },
        },
    })
    await flushPromises()
    return { store, wrapper }
}

describe('new invoice form, copying an existing invoice', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Only the date is faked, so promises and timers keep working
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(new Date('2026-10-17T10:00:00Z'))
        InvoiceService.getOne.mockResolvedValue({ data: structuredClone(source) })
    })
    afterEach(() => vi.useRealTimers())

    it('loads the invoice to copy', async () => {
        await openNewInvoice('/invoices/new?copyFrom=2')

        expect(InvoiceService.getOne).toHaveBeenCalledWith('2')
    })

    it('starts a new draft: no number yet, today, nothing sent or approved, no id, no voucher', async () => {
        const { store } = await openNewInvoice('/invoices/new?copyFrom=2')
        const copy = store.getters.invoice

        expect(copy.id).toBeUndefined()
        expect(copy.created_at).toBeUndefined()
        expect(copy.invoice_no).toBeNull() // the number comes when it is approved
        expect(copy.state).toBe('draft')
        expect(copy.is_sent).toBe(false)
        expect(copy.is_paid).toBeUndefined()
        expect(copy.journal_entry_id).toBeUndefined()
        expect(copy.voucher_no).toBeUndefined()
        expect(copy.approved_at).toBeUndefined()
        expect(copy.invoice_date).toBe('2026-10-17')
        expect(copy.duedate).toBe('2026-10-17')
    })

    it('keeps the contact, currency and template of the original', async () => {
        const { store } = await openNewInvoice('/invoices/new?copyFrom=2')
        const copy = store.getters.invoice

        expect(copy.contact_id).toBe(5)
        expect(copy.currency_id).toBe('EUR')
        expect(copy.template_id).toBe('2')
    })

    it('copies the lines, with their VAT codes, without their ids, timestamps and amounts', async () => {
        const { store } = await openNewInvoice('/invoices/new?copyFrom=2')

        expect(store.getters.invoice.lines).toEqual([
            { product_id: 1, description: 'First job', vat_code: 'S01', quantity: 1, unit_price: 100 },
            { product_id: 1, description: 'Second job', vat_code: 'S02', quantity: 2, unit_price: 100 },
        ])
    })

    it('gives every line the code without VAT when the organization shows no VAT', async () => {
        const { store, wrapper } = await openNewInvoice('/invoices/new?copyFrom=2', { id: 1, invoice_setting: {} })

        expect(store.getters.invoice.lines.map((line) => line.vat_code)).toEqual(['S81', 'S81'])
        expect(wrapper.text()).not.toContain('Total excluding VAT')
    })

    it('has no amounts of its own: the totals shown are calculated from the lines', async () => {
        const { store, wrapper } = await openNewInvoice('/invoices/new?copyFrom=2')
        const copy = store.getters.invoice

        expect(copy.amount).toBeUndefined()
        expect(copy.vat_amount).toBeUndefined()
        expect(copy.gross_amount).toBeUndefined()
        expect(copy.excluding_vat).toBeUndefined()
        expect(wrapper.text()).toContain('Total excluding VAT300')
        expect(wrapper.text()).toContain('Sale VAT S01 (25%)25')
        expect(wrapper.text()).toContain('Sale VAT S02 (0%)0')
        expect(wrapper.text()).toContain('Total including VAT325')
    })

    it('shows the contact of the original as the selected one', async () => {
        const { wrapper } = await openNewInvoice('/invoices/new?copyFrom=2')

        expect(wrapper.text()).toContain('Acme ApS')
        expect(wrapper.text()).toContain('8000 Aarhus')
        expect(wrapper.text()).not.toContain('9000 Aalborg') // only the selected contact's address is shown
    })

    it('starts a blank invoice and says why when the original cannot be loaded', async () => {
        InvoiceService.getOne.mockRejectedValue({ response: { data: { error: 'Invoice with id 2 not found!' } } })

        const { store } = await openNewInvoice('/invoices/new?copyFrom=2')

        expect(toast).toHaveBeenCalledWith('Invoice with id 2 not found!', 'error')
        expect(store.getters.invoice.contact_id).toBeNull()
        expect(store.getters.invoice.invoice_no).toBeNull()
        expect(store.getters.invoice.lines).toHaveLength(1)
        expect(store.getters.invoice.lines[0].description).toBe('')
    })
})

describe('new invoice form, without copying', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(new Date('2026-10-17T10:00:00Z'))
    })
    afterEach(() => vi.useRealTimers())

    it('is dated today on the wall late in the evening, not tomorrow: the server refuses a date in the future', async () => {
        const zone = process.env.TZ
        process.env.TZ = 'Europe/Copenhagen'
        try {
            vi.setSystemTime(new Date('2026-10-17T21:30:00Z')) // 23:30 on the 17th in Denmark

            const { store } = await openNewInvoice('/invoices/new')

            expect(store.getters.invoice.invoice_date).toBe('2026-10-17')
            expect(store.getters.invoice.duedate).toBe('2026-10-17')
        } finally {
            if (zone === undefined) delete process.env.TZ
            else process.env.TZ = zone
        }
    })

    it('is a blank draft with one empty line and does not fetch any invoice', async () => {
        const { store } = await openNewInvoice('/invoices/new')
        const blank = store.getters.invoice

        expect(InvoiceService.getOne).not.toHaveBeenCalled()
        expect(blank.state).toBe('draft')
        expect(blank.contact_id).toBeNull()
        expect(blank.invoice_no).toBeNull()
        expect(blank.invoice_date).toBe('2026-10-17')
        expect(blank.lines).toEqual([{ product_id: -1, description: '', quantity: 1, unit_price: 0, vat_code: 'S01' }])
    })
})
