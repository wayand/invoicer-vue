import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createStore } from 'vuex'
import { defineComponent, h, ref } from 'vue'
import InvoiceForm from '@/views/invoice/InvoiceForm.vue'
import invoice from '@/store/modules/invoice'
import InvoiceService from '@/services/InvoiceService'

// Network-bound modules the form imports but this test does not use
vi.mock('@/services/InvoiceService', () => ({
    default: { getOne: vi.fn(), getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}))
vi.mock('@/utilities/toast', () => ({ toast: vi.fn() }))

const saved = {
    id: 2,
    organization_id: 1,
    contact_id: 5,
    invoice_no: '1001',
    state: 'draft',
    is_sent: false,
    is_paid: false,
    currency_id: 'DKK',
    excluding_vat: true,
    template_id: '1',
    invoice_date: '2026-01-01',
    duedate: '2026-01-15',
    amount: 300,
    vat_amount: 75,
    gross_amount: 375,
    lines: [
        { id: 11, invoice_id: 2, product_id: 1, description: 'First job', quantity: 1, unit_price: 100, amount: 100 },
        { id: 12, invoice_id: 2, product_id: 1, description: 'Second job', quantity: 2, unit_price: 100, amount: 200 },
    ],
}
const contacts = [{ id: 5, name: 'Acme ApS', street: 'Main St 1', zipcode: '8000', city: 'Aarhus' }]
const products = [{ id: 1, name: 'Consulting', description: 'Consulting', unit_price: 100 }]

// The confirmation dialog the form asks before leaving with unsaved changes.
// It answers "Stay here", so a navigation that asks is cancelled.
const confirmations = vi.fn()
const PromiseDialog = defineComponent({
    name: 'PromiseDialog',
    setup() {
        const data = ref({})
        const showModal = async () => {
            confirmations(data.value.title)
            return false
        }
        return { data, showModal }
    },
    render: () => null,
})
const page = () => defineComponent({ render: () => h('div') })

const newStore = () =>
    createStore({
        modules: { invoice: { ...invoice, state: () => ({ invoices: [], invoice: {} }) } },
        getters: {
            user: () => ({ organizationId: 1 }),
            organization: () => ({ id: 1, invoice_setting: {} }),
            contacts: () => contacts,
            products: () => products,
            invoiceSetting: () => ({ invoice_no_mode: 'sequential', next_invoice_no: 1003 }),
            getAccountById: () => () => ({ name: 'Bank' }),
        },
        actions: {
            fetchOrganization: () => {},
            fetchContacts: () => {},
            fetchProducts: () => {},
            fetchAccounts: () => {},
        },
    })

const openForm = async (url) => {
    const store = newStore()
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/invoices', name: 'Invoices', component: page() },
            { path: '/invoices/new', name: 'NewInvoice', component: InvoiceForm },
            { path: '/invoices/:invoiceId(\\d+)', name: 'ShowInvoice', component: page(), props: true },
            { path: '/invoices/:invoiceId(\\d+)/edit', name: 'EditInvoice', component: InvoiceForm, props: true },
        ],
    })
    router.push(url)
    await router.isReady()
    const wrapper = mount(defineComponent({ render: () => h(RouterView) }), {
        global: {
            plugins: [store, router],
            components: { PromiseDialog },
            stubs: { teleport: true, Datepicker: true, ContactFormModal: true },
            mocks: { $filters: { toCurrency: (value) => String(value), toFloat: (value) => value } },
        },
    })
    await flushPromises()
    return { store, router, wrapper }
}

// Navigates away, as the sidebar links do, and says whether the form asked first
const leavesWithoutAsking = async (router) => {
    confirmations.mockClear()
    await router.push('/invoices')
    await flushPromises()
    return confirmations.mock.calls.length === 0 && router.currentRoute.value.path === '/invoices'
}

const fillInvoice = async (wrapper) => {
    await wrapper.find('select.form-select').setValue(5)
    await wrapper.find('input.description').setValue('Consulting, first week')
    await wrapper.find('tbody select').setValue(1)
    await flushPromises()
}

describe('invoice form validation', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(new Date('2026-10-17T10:00:00Z'))
    })
    afterEach(() => vi.useRealTimers())

    it('shows no errors on a new blank invoice', async () => {
        const { wrapper } = await openForm('/invoices/new')
        await new Promise((resolve) => setTimeout(resolve, 20)) // the line validates a moment after it changes

        expect(wrapper.findAll('.is-invalid')).toHaveLength(0)
        expect(wrapper.text()).not.toContain('This field is required')
    })

    it('shows the errors when a blank invoice is saved, and does not send it', async () => {
        const { wrapper } = await openForm('/invoices/new')

        await wrapper.find('form').trigger('submit')
        await flushPromises()

        expect(wrapper.find('select.form-select').classes()).toContain('is-invalid')
        expect(wrapper.find('input.description').classes()).toContain('is-invalid')
        expect(wrapper.text()).toContain('This field is required')
        expect(InvoiceService.create).not.toHaveBeenCalled()
    })

    it('updates the errors as they are fixed, once a save has been tried', async () => {
        const { wrapper } = await openForm('/invoices/new')
        await wrapper.find('form').trigger('submit')
        await flushPromises()

        await wrapper.find('select.form-select').setValue(5)
        await flushPromises()

        expect(wrapper.find('select.form-select').classes()).not.toContain('is-invalid')
        expect(wrapper.find('input.description').classes()).toContain('is-invalid')
    })

    it('shows no errors on an invoice that is opened for editing', async () => {
        InvoiceService.getOne.mockResolvedValue({ data: structuredClone(saved) })

        const { wrapper } = await openForm('/invoices/2/edit')
        await new Promise((resolve) => setTimeout(resolve, 20))

        expect(wrapper.findAll('.is-invalid')).toHaveLength(0)
    })
})

describe('invoice form unsaved changes', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(new Date('2026-10-17T10:00:00Z'))
        InvoiceService.getOne.mockResolvedValue({ data: structuredClone(saved) })
    })
    afterEach(() => vi.useRealTimers())

    it('lets you leave a new blank invoice without asking', async () => {
        const { router } = await openForm('/invoices/new')

        expect(await leavesWithoutAsking(router)).toBe(true)
    })

    it('lets you leave an invoice that was opened and not touched without asking', async () => {
        const { router } = await openForm('/invoices/2/edit')

        expect(await leavesWithoutAsking(router)).toBe(true)
    })

    it.each([
        [
            'the invoice date',
            (wrapper) =>
                wrapper
                    .findAllComponents({ name: 'Datepicker' })[0]
                    .vm.$emit('update:modelValue', new Date('2026-02-03T12:00:00')),
        ],
        [
            'the due date',
            (wrapper) =>
                wrapper
                    .findAllComponents({ name: 'Datepicker' })[1]
                    .vm.$emit('update:modelValue', new Date('2026-02-20T12:00:00')),
        ],
        ['a line description', (wrapper) => wrapper.find('input.description').setValue('Changed')],
        ['a quantity', (wrapper) => wrapper.find('input.quantity').setValue(7)],
        ['the contact', (wrapper) => wrapper.find('select.form-select').setValue('-1')],
    ])('asks before leaving when %s was changed', async (_name, change) => {
        const { router, wrapper } = await openForm('/invoices/2/edit')

        await change(wrapper)
        await flushPromises()

        expect(await leavesWithoutAsking(router)).toBe(false)
        expect(confirmations).toHaveBeenCalledWith('Confirm navigation')
    })

    it('does not ask again once a change is changed back', async () => {
        const { router, wrapper } = await openForm('/invoices/2/edit')

        await wrapper.find('input.description').setValue('Changed')
        await wrapper.find('input.description').setValue('First job')
        await flushPromises()

        expect(await leavesWithoutAsking(router)).toBe(true)
    })

    it('lets you leave after a changed invoice was saved', async () => {
        InvoiceService.update.mockResolvedValue({ data: structuredClone(saved) })
        const { router, wrapper } = await openForm('/invoices/2/edit')
        await wrapper.find('input.description').setValue('Changed')

        await wrapper.find('form').trigger('submit')
        await flushPromises()

        expect(InvoiceService.update).toHaveBeenCalled()
        expect(await leavesWithoutAsking(router)).toBe(true)
    })

    it('lets you leave the edit page you land on after saving a new invoice, without asking', async () => {
        InvoiceService.create.mockResolvedValue({ data: { id: 2 } })
        const { router, wrapper } = await openForm('/invoices/new')
        await fillInvoice(wrapper)

        await wrapper.find('form').trigger('submit')
        await flushPromises()

        expect(InvoiceService.create).toHaveBeenCalled()
        expect(router.currentRoute.value.path).toBe('/invoices/2/edit')
        expect(await leavesWithoutAsking(router)).toBe(true)
    })
})

describe('invoice form More menu', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        InvoiceService.getOne.mockResolvedValue({ data: structuredClone(saved) })
    })

    const menuItem = (wrapper, text) => wrapper.findAll('a.dropdown-item').find((link) => link.text() === text)

    // The links have href="#". If the click is not cancelled, the browser also
    // navigates to "#", and that navigation cancels the router's own.
    const click = (link) => {
        const event = new MouseEvent('click', { bubbles: true, cancelable: true })
        link.element.dispatchEvent(event)
        return event
    }

    it('has no More menu on a new invoice, where every item in it needs a saved invoice', async () => {
        const { wrapper } = await openForm('/invoices/new')

        expect(wrapper.find('.dropdown-toggle').exists()).toBe(false)
        expect(wrapper.findAll('a.dropdown-item')).toHaveLength(0)
    })

    it('has the More menu on a saved invoice', async () => {
        const { wrapper } = await openForm('/invoices/2/edit')

        expect(wrapper.find('.dropdown-toggle').text()).toBe('More')
        expect(wrapper.findAll('a.dropdown-item').map((link) => link.text())).toEqual([
            'Preview',
            'Save as PDF',
            'Duplicate',
            'Delete',
        ])
    })

    it.each(['Save as PDF', 'Duplicate', 'Delete'])('does not let the browser follow the "%s" link', async (text) => {
        const { wrapper } = await openForm('/invoices/2/edit')

        expect(click(menuItem(wrapper, text)).defaultPrevented).toBe(true)
    })

    it('opens a copy of the invoice when Duplicate is clicked', async () => {
        const { router, wrapper } = await openForm('/invoices/2/edit')

        click(menuItem(wrapper, 'Duplicate'))
        await flushPromises()

        expect(router.currentRoute.value.name).toBe('NewInvoice')
        expect(router.currentRoute.value.query.copyFrom).toBe('2')
    })
})
