import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createStore } from 'vuex'
import { defineComponent, h, ref } from 'vue'
import InvoiceForm from '@/views/invoice/InvoiceForm.vue'
import invoice from '@/store/modules/invoice'
import InvoiceService from '@/services/InvoiceService'
import { toast } from '@/utilities/toast'

// Network-bound modules the form imports but this test does not use
vi.mock('@/services/InvoiceService', () => ({
    default: { getOne: vi.fn(), getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), approve: vi.fn() },
}))
vi.mock('@/utilities/toast', () => ({ toast: vi.fn() }))

const saved = {
    id: 2,
    organization_id: 1,
    contact_id: 5,
    invoice_no: '1001',
    state: 'draft',
    is_sent: false,
    journal_entry_id: null,
    voucher_no: null,
    currency_id: 'DKK',
    excluding_vat: true,
    template_id: '1',
    invoice_date: '2026-01-01',
    duedate: '2026-01-15',
    amount: 300,
    vat_amount: 75,
    gross_amount: 375,
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
        },
        {
            id: 12,
            invoice_id: 2,
            product_id: 1,
            description: 'Second job',
            vat_code: 'S01',
            quantity: 2,
            unit_price: 100,
            amount: 200,
        },
    ],
}
const contacts = [{ id: 5, name: 'Acme ApS', street: 'Main St 1', zipcode: '8000', city: 'Aarhus' }]
const products = [{ id: 1, name: 'Consulting', description: 'Consulting', unit_price: 100 }]
const salesVatCodes = [
    {
        id: 1,
        code: 'S01',
        title: 'Momspligtige salg (DK), 25% moms',
        applies_to: 'sales',
        direction: 'output',
        rate: 0.25,
    },
    { id: 2, code: 'S02', title: 'Momspligtige salg (DK) 0% moms', applies_to: 'sales', direction: 'none', rate: 0 },
]
const vatRates = { S01: 0.25, S02: 0 }

// The confirmation dialog the form asks before leaving with unsaved changes.
// It answers "Stay here", so a navigation that asks is cancelled.
const confirmations = vi.fn()
let answer = false
const PromiseDialog = defineComponent({
    name: 'PromiseDialog',
    setup() {
        const data = ref({})
        const showModal = async () => {
            confirmations(data.value.title)
            return answer
        }
        return { data, showModal }
    },
    render: () => null,
})
const page = () => defineComponent({ render: () => h('div') })

const registered = { id: 1, vat_period_type: 'quarter', invoice_setting: {} }
const sequentialSetting = { invoice_no_mode: 'sequential', next_invoice_no: 1003 }

const newStore = (salesRates, organization = registered, setting = sequentialSetting) =>
    createStore({
        modules: { invoice: { ...invoice, state: () => ({ invoices: [], invoice: {} }) } },
        getters: {
            user: () => ({ organizationId: 1 }),
            organization: () => organization,
            contacts: () => contacts,
            products: () => products,
            invoiceSetting: () => setting,
            getAccountById: () => () => ({ name: 'Bank' }),
            salesVatCodes: () => salesVatCodes,
            salesRates: () => salesRates,
        },
        actions: {
            fetchOrganization: () => {},
            fetchContacts: () => {},
            fetchProducts: () => {},
            fetchAccounts: () => {},
            fetchVatCodes: () => {},
        },
    })

const openForm = async (url, salesRates = vatRates, { organization, setting } = {}) => {
    const store = newStore(salesRates, organization, setting)
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

describe('invoice form totals', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        InvoiceService.getOne.mockResolvedValue({ data: structuredClone(saved) })
    })

    const totalsText = (wrapper) => wrapper.find('table.float-end').text()

    it('shows the totals of the lines and the VAT of the code of the lines', async () => {
        const { wrapper } = await openForm('/invoices/2/edit')

        expect(totalsText(wrapper)).toContain('Total excluding VAT300')
        expect(totalsText(wrapper)).toContain('Sale VAT S01 (25%)75')
        expect(totalsText(wrapper)).toContain('Total including VAT375')
    })

    it('rounds as the server does when a line changes, where floats would not', async () => {
        const { wrapper } = await openForm('/invoices/new')

        await wrapper.find('input.quantity').setValue(3)
        await wrapper.find('input.unit-price').setValue(0.335)
        await flushPromises()

        expect(wrapper.find('td.total').text()).toBe('1.01')
        expect(totalsText(wrapper)).toContain('Total excluding VAT1.01')
        expect(totalsText(wrapper)).toContain('Sale VAT S01 (25%)0.25')
        expect(totalsText(wrapper)).toContain('Total including VAT1.26')
    })

    it('uses the rate from the store, not 25%', async () => {
        const { wrapper } = await openForm('/invoices/2/edit', { S01: 0.0625 })

        expect(totalsText(wrapper)).toContain('Sale VAT S01 (6.25%)18.75') // 6.25% of 300
        expect(totalsText(wrapper)).toContain('Total including VAT318.75')
    })

    it('shows no VAT while the rates are not known', async () => {
        const { wrapper } = await openForm('/invoices/2/edit', {})

        expect(totalsText(wrapper)).toContain('Sale VAT S01 (0%)0')
        expect(totalsText(wrapper)).toContain('Total including VAT300')
    })

    it('shows the VAT of each code on its own row', async () => {
        const { wrapper } = await openForm('/invoices/2/edit')

        await wrapper.findAll('select.vat-code')[1].setValue('S02')
        await flushPromises()

        expect(totalsText(wrapper)).toContain('Total excluding VAT300')
        expect(totalsText(wrapper)).toContain('Sale VAT S01 (25%)25') // 25% of the first line, 100
        expect(totalsText(wrapper)).toContain('Sale VAT S02 (0%)0')
        expect(totalsText(wrapper)).toContain('Total including VAT325')
    })

    it('rounds the VAT once per code, not once per line', async () => {
        const { wrapper } = await openForm('/invoices/new')
        await wrapper.find('input.unit-price').setValue(0.1)
        await wrapper.find('button.btn-outline').trigger('click')
        await wrapper.findAll('input.unit-price')[1].setValue(0.1)
        await wrapper.find('button.btn-outline').trigger('click')
        await wrapper.findAll('input.unit-price')[2].setValue(0.1)
        await flushPromises()

        // 0.075 once is 0.08; 0.025 for each of three lines would be 0.09
        expect(totalsText(wrapper)).toContain('Sale VAT S01 (25%)0.08')
        expect(totalsText(wrapper)).toContain('Total including VAT0.38')
    })

    it('does not count the totals as a change', async () => {
        const { router } = await openForm('/invoices/2/edit')

        expect(await leavesWithoutAsking(router)).toBe(true)
    })
})

describe('invoice form VAT codes', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        InvoiceService.getOne.mockResolvedValue({ data: structuredClone(saved) })
    })

    it('offers the sales codes on every line, and shows the code the line has', async () => {
        const { wrapper } = await openForm('/invoices/2/edit')

        const selects = wrapper.findAll('select.vat-code')
        expect(selects).toHaveLength(2)
        expect(selects[0].findAll('option').map((option) => option.text())).toEqual(['S01 25%', 'S02 0%'])
        expect(selects[0].element.value).toBe('S01')
    })

    it('starts a new invoice with the domestic sales code', async () => {
        const { store, wrapper } = await openForm('/invoices/new')

        expect(store.getters.invoice.lines[0].vat_code).toBe('S01')
        expect(wrapper.find('select.vat-code').element.value).toBe('S01')
    })

    it('starts an added line with the code of the line before it', async () => {
        const { store, wrapper } = await openForm('/invoices/new')
        await wrapper.find('select.vat-code').setValue('S02')

        await wrapper.find('button.btn-outline').trigger('click')

        expect(store.getters.invoice.lines.map((line) => line.vat_code)).toEqual(['S02', 'S02'])
    })

    it('sends the code of every line when the invoice is saved', async () => {
        InvoiceService.create.mockResolvedValue({ data: { id: 2 } })
        const { wrapper } = await openForm('/invoices/new')
        await fillInvoice(wrapper)
        await wrapper.find('select.vat-code').setValue('S02')

        await wrapper.find('form').trigger('submit')
        await flushPromises()

        const [, invoice] = InvoiceService.create.mock.calls[0]
        expect(invoice.lines.map((line) => line.vat_code)).toEqual(['S02'])
    })

    it('does not send an invoice with a line that has no code, and marks the line', async () => {
        const { store, wrapper } = await openForm('/invoices/new')
        await fillInvoice(wrapper)
        store.commit('UPDATE_INVOICE_LINES_PROPERTY', { index: 0, key: 'vat_code', value: '' })

        await wrapper.find('form').trigger('submit')
        await flushPromises()

        expect(wrapper.find('select.vat-code').classes()).toContain('is-invalid')
        expect(InvoiceService.create).not.toHaveBeenCalled()
    })

    it('counts a change of code as a change to save', async () => {
        const { router, wrapper } = await openForm('/invoices/2/edit')

        await wrapper.find('select.vat-code').setValue('S02')
        await flushPromises()

        expect(await leavesWithoutAsking(router)).toBe(false)
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

describe('invoice form, approving', () => {
    const manual = { invoice_no_mode: 'manual', next_invoice_no: 1003 }
    const approved = { ...saved, state: 'approved', invoice_no: '1001', journal_entry_id: 41, voucher_no: 9 }
    const buttons = (wrapper) => wrapper.findAll('button[name]').map((button) => button.attributes('name'))
    const approveButton = (wrapper) => wrapper.find('button[name="approve"]')
    const approveResponse = { data: { ...approved, id: 2 } }

    beforeEach(() => {
        vi.clearAllMocks()
        answer = true
        InvoiceService.getOne.mockResolvedValue({ data: structuredClone(saved) })
        InvoiceService.approve.mockResolvedValue(structuredClone(approveResponse))
        InvoiceService.update.mockResolvedValue({ data: structuredClone(saved) })
    })
    afterEach(() => {
        answer = false
    })

    it('offers Approve for a saved draft, and not for a new invoice', async () => {
        const saved_ = await openForm('/invoices/2/edit')
        const fresh = await openForm('/invoices/new')

        expect(buttons(saved_.wrapper)).toEqual(['approve', 'save-as-draft'])
        expect(buttons(fresh.wrapper)).toEqual(['save-as-draft'])
    })

    it('asks first, and says what approving does', async () => {
        answer = false
        const { wrapper } = await openForm('/invoices/2/edit')

        await approveButton(wrapper).trigger('click')
        await flushPromises()

        expect(confirmations).toHaveBeenCalledWith('Approve the invoice')
        expect(InvoiceService.approve).not.toHaveBeenCalled()
    })

    it('approves the invoice, says its number and voucher, and shows it', async () => {
        const { wrapper, router } = await openForm('/invoices/2/edit')

        await approveButton(wrapper).trigger('click')
        await flushPromises()

        expect(InvoiceService.approve).toHaveBeenCalledWith(1, '2', null)
        expect(toast).toHaveBeenCalledWith('Invoice 1001 approved, voucher 9', 'success')
        expect(router.currentRoute.value.name).toBe('ShowInvoice')
        expect(router.currentRoute.value.params.invoiceId).toBe('2')
    })

    it('does not save again when nothing was changed', async () => {
        const { wrapper } = await openForm('/invoices/2/edit')

        await approveButton(wrapper).trigger('click')
        await flushPromises()

        expect(InvoiceService.update).not.toHaveBeenCalled()
    })

    it('saves what was changed first, so that what is approved is what is on the screen', async () => {
        const { wrapper } = await openForm('/invoices/2/edit')
        await wrapper.find('input.description').setValue('Changed')

        await approveButton(wrapper).trigger('click')
        await flushPromises()

        expect(InvoiceService.update).toHaveBeenCalledTimes(1)
        expect(InvoiceService.update.mock.invocationCallOrder[0]).toBeLessThan(
            InvoiceService.approve.mock.invocationCallOrder[0],
        )
    })

    it('does not approve an invoice that is not valid, and shows what is wrong', async () => {
        const { wrapper } = await openForm('/invoices/2/edit')
        await wrapper.find('input.description').setValue('')

        await approveButton(wrapper).trigger('click')
        await flushPromises()

        expect(confirmations).not.toHaveBeenCalled()
        expect(InvoiceService.approve).not.toHaveBeenCalled()
        expect(wrapper.find('input.description').classes()).toContain('is-invalid')
    })

    it('says why the server refused, and stays on the draft', async () => {
        InvoiceService.approve.mockRejectedValue({
            response: { data: { error: 'The VAT period 2026-01-01 to 2026-03-31 is settled' } },
        })
        const { wrapper, router } = await openForm('/invoices/2/edit')

        await approveButton(wrapper).trigger('click')
        await flushPromises()

        expect(toast).toHaveBeenCalledWith('The VAT period 2026-01-01 to 2026-03-31 is settled', 'error')
        expect(router.currentRoute.value.name).toBe('EditInvoice')
        expect(approveButton(wrapper).attributes('disabled')).toBeUndefined()
    })

    it('does not ask about unsaved changes on the way to the approved invoice', async () => {
        const { wrapper, router } = await openForm('/invoices/2/edit')
        await wrapper.find('input.description').setValue('Changed')

        await approveButton(wrapper).trigger('click')
        await flushPromises()

        expect(router.currentRoute.value.name).toBe('ShowInvoice')
        expect(confirmations).not.toHaveBeenCalledWith('Confirm navigation')
    })

    describe('the invoice number', () => {
        it('is given when approved: a draft in sequential numbering shows no number', async () => {
            const { wrapper } = await openForm('/invoices/new')

            const input = wrapper.find('input.invoice-no')
            expect(input.element.value).toBe('')
            expect(input.attributes('placeholder')).toBe('Given when approved')
            expect(input.attributes('disabled')).toBeDefined()
        })

        it('is typed by the user when the organization numbers its invoices by hand', async () => {
            InvoiceService.getOne.mockResolvedValue({ data: { ...structuredClone(saved), invoice_no: null } })
            const { wrapper } = await openForm('/invoices/2/edit', vatRates, { setting: manual })

            const input = wrapper.find('input.invoice-no')
            expect(input.attributes('disabled')).toBeUndefined()
            expect(input.attributes('placeholder')).toBe('Invoice number')
        })

        it('is needed to approve, when typed by hand', async () => {
            InvoiceService.getOne.mockResolvedValue({ data: { ...structuredClone(saved), invoice_no: null } })
            const { wrapper } = await openForm('/invoices/2/edit', vatRates, { setting: manual })

            await approveButton(wrapper).trigger('click')
            await flushPromises()

            expect(wrapper.find('input.invoice-no').classes()).toContain('is-invalid')
            expect(InvoiceService.approve).not.toHaveBeenCalled()
        })

        it('is sent with the approval, when typed by hand', async () => {
            InvoiceService.getOne.mockResolvedValue({ data: { ...structuredClone(saved), invoice_no: null } })
            const { wrapper } = await openForm('/invoices/2/edit', vatRates, { setting: manual })
            await wrapper.find('input.invoice-no').setValue('  INV-7 ')

            await approveButton(wrapper).trigger('click')
            await flushPromises()

            expect(InvoiceService.approve).toHaveBeenCalledWith(1, '2', 'INV-7')
        })
    })

    describe('an invoice that is approved', () => {
        it('is not edited: it is shown, and the user is told why', async () => {
            InvoiceService.getOne.mockResolvedValue({ data: structuredClone(approved) })

            const { router } = await openForm('/invoices/2/edit')

            expect(router.currentRoute.value.name).toBe('ShowInvoice')
            expect(toast).toHaveBeenCalledWith('An approved invoice cannot be changed', 'warn')
        })

        it('is shown without asking about unsaved changes', async () => {
            InvoiceService.getOne.mockResolvedValue({ data: structuredClone(approved) })

            await openForm('/invoices/2/edit')

            expect(confirmations).not.toHaveBeenCalled()
        })
    })

    describe('an organization that is not VAT-registered', () => {
        const unregistered = { id: 1, invoice_setting: {} }

        it('has no VAT column, and starts every line on the code without VAT', async () => {
            const { store, wrapper } = await openForm('/invoices/new', vatRates, { organization: unregistered })

            expect(wrapper.find('select.vat-code').exists()).toBe(false)
            expect(wrapper.findAll('th').map((cell) => cell.text())).not.toContain('VAT')
            expect(store.getters.invoice.lines[0].vat_code).toBe('S81')
        })

        it('adds lines on the same code', async () => {
            const { store, wrapper } = await openForm('/invoices/new', vatRates, { organization: unregistered })

            await wrapper.find('button.btn-outline').trigger('click')

            expect(store.getters.invoice.lines.map((line) => line.vat_code)).toEqual(['S81', 'S81'])
        })

        it('shows one total, and no VAT', async () => {
            InvoiceService.getOne.mockResolvedValue({
                data: {
                    ...structuredClone(saved),
                    lines: saved.lines.map((line) => ({ ...line, vat_code: 'S81' })),
                },
            })
            const { wrapper } = await openForm('/invoices/2/edit', { S81: 0 }, { organization: unregistered })

            const text = wrapper.find('table.float-end').text()
            expect(text).toBe('Total300')
        })
    })
})

describe('invoice form, credit notes', () => {
    // A draft credit note of 500 + VAT, for an invoice of 1,250 of which 500 is credited already
    const note = {
        ...saved,
        id: 3,
        invoice_no: null,
        kind: 'credit_note',
        credits_invoice_id: 2,
        credits_invoice_no: '10',
        lines: [{ ...saved.lines[0], id: 21, invoice_id: 3, quantity: 4, unit_price: 100 }],
    }
    const original = { ...saved, id: 2, invoice_no: '10', state: 'approved', gross_amount: 1250, credited_amount: 500 }

    const open = async (invoice = note, source = original) => {
        InvoiceService.getOne.mockImplementation(async (id) => ({
            data: structuredClone(String(id) === String(invoice.id) ? invoice : source),
        }))
        return openForm(`/invoices/${invoice.id}/edit`)
    }

    beforeEach(() => {
        vi.clearAllMocks()
        answer = true
        InvoiceService.approve.mockResolvedValue({
            data: { ...note, state: 'approved', invoice_no: '11', voucher_no: 2, journal_entry_id: 42 },
        })
    })
    afterEach(() => {
        answer = false
    })

    it('is a credit note: the title, and the invoice it corrects, which is linked', async () => {
        const { wrapper, router } = await open()

        expect(wrapper.find('h3').text()).toBe('Edit credit note')
        expect(wrapper.find('.credits').text()).toContain('Corrects invoice #10')
        await wrapper.find('.credits a').trigger('click')
        await flushPromises()
        expect(router.currentRoute.value.path).toBe('/invoices/2')
    })

    it('has the customer of the invoice, which cannot be changed', async () => {
        const { wrapper } = await open()

        expect(wrapper.find('select.form-select').attributes('disabled')).toBeDefined()
        expect(wrapper.find('select.form-select').element.value).toBe('5')
    })

    it('has its own number, and is not duplicated', async () => {
        const { wrapper } = await open()

        expect(wrapper.text()).toContain('Credit note number')
        expect(wrapper.findAll('a.dropdown-item').map((link) => link.text())).toEqual([
            'Preview',
            'Save as PDF',
            'Delete',
        ])
    })

    it('says how much of the invoice can still be credited', async () => {
        const { wrapper } = await open()

        // 1,250 less the 500 that is credited already
        expect(wrapper.find('.creditable').text()).toBe('– up to 750 can be credited')
        expect(wrapper.find('.creditable').classes()).not.toContain('text-danger')
        expect(InvoiceService.getOne).toHaveBeenCalledWith(2)
    })

    it('warns in red when the credit note credits more than that', async () => {
        const { wrapper } = await open({
            ...note,
            lines: [{ ...note.lines[0], quantity: 7 }], // 700 + 175 VAT is more than 750
        })

        expect(wrapper.find('.creditable').text()).toBe('– more than the 750 that can be credited')
        expect(wrapper.find('.creditable').classes()).toContain('text-danger')
    })

    it('follows the lines as they are changed', async () => {
        const { wrapper } = await open({ ...note, lines: [{ ...note.lines[0], quantity: 7 }] })

        await wrapper.find('input.quantity').setValue(4)
        await flushPromises()

        expect(wrapper.find('.creditable').classes()).not.toContain('text-danger')
    })

    it('asks first, and says which invoice it credits', async () => {
        answer = false
        const { wrapper } = await open()

        await wrapper.find('button[name="approve"]').trigger('click')
        await flushPromises()

        expect(confirmations).toHaveBeenCalledWith('Approve the credit note')
        expect(InvoiceService.approve).not.toHaveBeenCalled()
    })

    it('is approved like an invoice, and the message says it is a credit note', async () => {
        const { wrapper, router } = await open()

        await wrapper.find('button[name="approve"]').trigger('click')
        await flushPromises()

        expect(InvoiceService.approve).toHaveBeenCalledWith(1, '3', null)
        expect(toast).toHaveBeenCalledWith('Credit note 11 approved, voucher 2', 'success')
        expect(router.currentRoute.value.name).toBe('ShowInvoice')
    })

    it('shows the reason when the server refuses it', async () => {
        InvoiceService.approve.mockRejectedValue({
            response: { data: { error: 'Invoice 10 is 1250.00, and 500.00 is credited already' } },
        })
        const { wrapper, router } = await open()

        await wrapper.find('button[name="approve"]').trigger('click')
        await flushPromises()

        expect(toast).toHaveBeenCalledWith('Invoice 10 is 1250.00, and 500.00 is credited already', 'error')
        expect(router.currentRoute.value.name).toBe('EditInvoice')
    })

    it('can be deleted as a draft, and asks about the credit note', async () => {
        InvoiceService.delete.mockResolvedValue({})
        const { wrapper } = await open()
        const del = wrapper.findAll('a.dropdown-item').find((link) => link.text() === 'Delete')

        del.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
        await flushPromises()

        expect(confirmations).toHaveBeenCalledWith('Confirm delete invoice')
        expect(InvoiceService.delete).toHaveBeenCalledWith(1, 3)
    })

    it('is not edited once approved: it is shown, and the user is told it is a credit note', async () => {
        const { router } = await open({ ...note, state: 'approved', invoice_no: '11', journal_entry_id: 42 })

        expect(router.currentRoute.value.name).toBe('ShowInvoice')
        expect(toast).toHaveBeenCalledWith('An approved credit note cannot be changed', 'warn')
    })

    it('says so when the invoice it corrects cannot be read', async () => {
        InvoiceService.getOne.mockImplementation(async (id) => {
            if (String(id) === '3') return { data: structuredClone(note) }
            throw { response: { data: { error: 'Invoice with id 2 not found!' } } }
        })

        const { wrapper } = await openForm('/invoices/3/edit')

        expect(toast).toHaveBeenCalledWith('Invoice with id 2 not found!', 'error')
        expect(wrapper.find('.creditable').exists()).toBe(false)
    })

    it('has no payment terms: a credit note is not paid', async () => {
        const { wrapper } = await open()

        expect(wrapper.find('.payment-terms').exists()).toBe(false)
    })

    it('is an invoice again when it is not a credit note: the title, the customer, the menu', async () => {
        InvoiceService.getOne.mockResolvedValue({ data: structuredClone(saved) })

        const { wrapper } = await openForm('/invoices/2/edit')

        expect(wrapper.find('h3').text()).toBe('Edit Invoice')
        expect(wrapper.find('.credits').exists()).toBe(false)
        expect(wrapper.find('.payment-terms').exists()).toBe(true)
        expect(wrapper.find('select.form-select').attributes('disabled')).toBeUndefined()
        expect(wrapper.findAll('a.dropdown-item').map((link) => link.text())).toContain('Duplicate')
    })
})
