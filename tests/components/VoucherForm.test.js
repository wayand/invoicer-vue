import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createStore } from 'vuex'
import { defineComponent, h, ref } from 'vue'
import VoucherForm from '@/views/voucher/VoucherForm.vue'
import journal from '@/store/modules/journal'
import JournalService from '@/services/JournalService'
import { toast } from '@/utilities/toast'

// Network-bound modules the form imports but this test does not use
vi.mock('@/services/JournalService', () => ({
    default: { getAll: vi.fn(), getOne: vi.fn(), create: vi.fn(), reverse: vi.fn() },
}))
vi.mock('@/utilities/toast', () => ({ toast: vi.fn() }))

const accounts = [
    { id: 7, number: 7680, name: 'Salgsmoms', is_archived: false },
    { id: 2, number: 1010, name: 'Salg af varer og ydelser', is_archived: false },
    { id: 3, number: 2450, name: 'Kontorartikler', is_archived: true },
    { id: 1, number: 6480, name: 'Bankkonto', is_archived: false },
]

// The confirmation dialog the form asks before leaving with an unposted voucher
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

const openForm = async ({ chart = accounts, organization = { id: 1 }, vatCodes = [] } = {}) => {
    const store = createStore({
        modules: { journal: { ...journal, state: () => ({ journalEntries: [], journalEntry: null }) } },
        getters: {
            accounts: () => chart,
            user: () => ({ organizationId: 1 }),
            organization: () => organization,
            supportedVatCodes: () => vatCodes,
        },
        actions: { fetchAccounts: () => {}, fetchOrganization: () => {}, fetchVatCodes: () => {} },
    })
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/vouchers', name: 'Vouchers', component: page() },
            { path: '/vouchers/new', name: 'NewVoucher', component: VoucherForm },
            { path: '/vouchers/:entryId(\\d+)', name: 'ShowVoucher', component: page(), props: true },
        ],
    })
    router.push('/vouchers/new')
    await router.isReady()
    const wrapper = mount(defineComponent({ render: () => h(RouterView) }), {
        global: {
            plugins: [store, router],
            components: { PromiseDialog },
            stubs: { teleport: true },
            mocks: { $filters: { toCurrency: (value) => Number(value).toFixed(2) } },
        },
    })
    await flushPromises()
    return { store, router, wrapper }
}

const lineRows = (wrapper) => wrapper.findAll('tr.line')

// Fill in one line: the account, and either a debit or a credit
const fillLine = async (wrapper, index, { account, debit, credit, text }) => {
    const row = lineRows(wrapper)[index]
    if (account !== undefined) await row.find('select.account').setValue(account)
    if (debit !== undefined) await row.find('input.debit').setValue(debit)
    if (credit !== undefined) await row.find('input.credit').setValue(credit)
    if (text !== undefined) await row.find('input.line-description').setValue(text)
}

const fillBalancedSale = async (wrapper) => {
    await wrapper.find('input.description').setValue('Sale for cash')
    await fillLine(wrapper, 0, { account: 1, debit: '125' })
    await fillLine(wrapper, 1, { account: 2, credit: '125' })
}

const submit = async (wrapper) => {
    await wrapper.find('form').trigger('submit')
    await flushPromises()
}

describe('voucher form', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        answer = false
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(new Date(2026, 9, 28, 10, 0))
    })
    afterEach(() => vi.useRealTimers())

    describe('what it shows', () => {
        it("starts with today's date, no description and two empty lines", async () => {
            const { wrapper } = await openForm()

            expect(wrapper.find('input.date').element.value).toBe('2026-10-28')
            expect(wrapper.find('input.description').element.value).toBe('')
            expect(lineRows(wrapper)).toHaveLength(2)
        })

        it('offers the accounts by number, without the archived ones', async () => {
            const { wrapper } = await openForm()

            const options = lineRows(wrapper)[0].findAll('select.account option')
            expect(options.map((option) => option.text())).toEqual([
                'Select account',
                '1010 Salg af varer og ydelser',
                '6480 Bankkonto',
                '7680 Salgsmoms',
            ])
        })

        it('shows no errors before a voucher has been posted', async () => {
            const { wrapper } = await openForm()

            expect(wrapper.findAll('.is-invalid')).toHaveLength(0)
            expect(wrapper.text()).not.toContain('is required')
            expect(wrapper.find('.balance-error').exists()).toBe(false)
        })
    })

    describe('the difference', () => {
        it('shows the totals and the difference as the lines are filled in', async () => {
            const { wrapper } = await openForm()

            await fillLine(wrapper, 0, { debit: '125' })
            await fillLine(wrapper, 1, { credit: '100' })

            expect(wrapper.find('.total-debit').text()).toBe('125.00')
            expect(wrapper.find('.total-credit').text()).toBe('100.00')
            expect(wrapper.find('.difference').text()).toBe('25.00')
            expect(wrapper.find('.difference .badge').exists()).toBe(false)
        })

        it('says balanced when the difference is 0', async () => {
            const { wrapper } = await openForm()

            await fillBalancedSale(wrapper)

            expect(wrapper.find('.difference').text()).toContain('0.00')
            expect(wrapper.find('.difference .badge').text()).toBe('Balanced')
        })

        it('does not call an empty voucher balanced, nor an error', async () => {
            const { wrapper } = await openForm()

            expect(wrapper.find('.difference .badge').exists()).toBe(false)
            expect(wrapper.find('.difference .text-danger').exists()).toBe(false)
        })

        it('is red while there is a difference and green when it is gone', async () => {
            const { wrapper } = await openForm()

            await fillLine(wrapper, 0, { debit: '10' })
            expect(wrapper.find('.difference .text-danger').exists()).toBe(true)

            await fillLine(wrapper, 1, { credit: '10' })
            expect(wrapper.find('.difference .text-danger').exists()).toBe(false)
            expect(wrapper.find('.difference .text-success').exists()).toBe(true)
        })

        it('has no rounding error where floats would: 0.1 + 0.2 against 0.3', async () => {
            const { wrapper } = await openForm()
            await wrapper.find('button.add-line').trigger('click')

            await fillLine(wrapper, 0, { debit: '0.1' })
            await fillLine(wrapper, 1, { debit: '0.2' })
            await fillLine(wrapper, 2, { credit: '0.3' })

            expect(wrapper.find('.difference .badge').text()).toBe('Balanced')
        })

        it('is negative when more is credited than debited', async () => {
            const { wrapper } = await openForm()

            await fillLine(wrapper, 0, { debit: '10' })
            await fillLine(wrapper, 1, { credit: '12.5' })

            expect(wrapper.find('.difference').text()).toBe('-2.50')
        })
    })

    describe('the lines', () => {
        it('adds a line', async () => {
            const { wrapper } = await openForm()

            await wrapper.find('button.add-line').trigger('click')

            expect(lineRows(wrapper)).toHaveLength(3)
        })

        it('removes a line, but never goes below two', async () => {
            const { wrapper } = await openForm()
            await wrapper.find('button.add-line').trigger('click')
            await fillLine(wrapper, 1, { text: 'second' })

            await lineRows(wrapper)[0].find('button.remove-line').trigger('click')

            expect(lineRows(wrapper)).toHaveLength(2)
            expect(lineRows(wrapper)[0].find('input.line-description').element.value).toBe('second')
            expect(lineRows(wrapper)[0].find('button.remove-line').attributes('disabled')).toBeDefined()
        })

        it('keeps what was typed in the lines that stay when one is removed', async () => {
            const { wrapper } = await openForm()
            await wrapper.find('button.add-line').trigger('click')
            await fillLine(wrapper, 0, { debit: '1' })
            await fillLine(wrapper, 1, { debit: '2' })
            await fillLine(wrapper, 2, { credit: '3' })

            await lineRows(wrapper)[1].find('button.remove-line').trigger('click')

            expect(lineRows(wrapper)[0].find('input.debit').element.value).toBe('1')
            expect(lineRows(wrapper)[1].find('input.credit').element.value).toBe('3')
        })
    })

    describe('posting', () => {
        it('shows what is missing, and posts nothing, for a blank voucher', async () => {
            const { wrapper } = await openForm()

            await submit(wrapper)

            expect(JournalService.create).not.toHaveBeenCalled()
            expect(wrapper.find('input.description').classes()).toContain('is-invalid')
            expect(wrapper.text()).toContain('The description is required')
            expect(wrapper.text()).toContain('Line 1: Select an account')
            expect(wrapper.text()).toContain('Line 2: Select an account')
        })

        it('refuses an unbalanced voucher and says by how much', async () => {
            const { wrapper } = await openForm()
            await wrapper.find('input.description').setValue('Off by a cent')
            await fillLine(wrapper, 0, { account: 1, debit: '100' })
            await fillLine(wrapper, 1, { account: 2, credit: '99.99' })

            await submit(wrapper)

            expect(JournalService.create).not.toHaveBeenCalled()
            expect(wrapper.find('.balance-error').text()).toBe('The voucher does not balance: the difference is 0.01')
        })

        it.each([
            ['both a debit and a credit', { account: 1, debit: '10', credit: '10' }, 'Use either debit or credit'],
            ['neither', { account: 1 }, 'Enter a debit or a credit above 0'],
            ['an amount that rounds to nothing', { account: 1, debit: '0.004' }, 'Enter a debit or a credit above 0'],
            ['a negative amount', { account: 1, debit: '-5' }, 'An amount cannot be negative'],
        ])('refuses a line with %s', async (_name, line, message) => {
            const { wrapper } = await openForm()
            await wrapper.find('input.description').setValue('x')
            await fillLine(wrapper, 0, line)
            await fillLine(wrapper, 1, { account: 2, credit: '10' })

            await submit(wrapper)

            expect(JournalService.create).not.toHaveBeenCalled()
            expect(wrapper.find('tr.line-error').text()).toContain(message)
        })

        it('refuses a description that is only spaces, and one that is too long', async () => {
            const { wrapper } = await openForm()
            await fillLine(wrapper, 0, { account: 1, debit: '1' })
            await fillLine(wrapper, 1, { account: 2, credit: '1' })
            await wrapper.find('input.description').setValue('   ')

            await submit(wrapper)

            expect(wrapper.text()).toContain('The description is required')
            await wrapper.find('input.description').setValue('x'.repeat(256))
            expect(wrapper.text()).toContain('At most 255 characters')
            expect(JournalService.create).not.toHaveBeenCalled()
        })

        it('refuses a voucher without a date', async () => {
            const { wrapper } = await openForm()
            await fillBalancedSale(wrapper)
            await wrapper.find('input.date').setValue('')

            await submit(wrapper)

            expect(wrapper.text()).toContain('The date is required')
            expect(JournalService.create).not.toHaveBeenCalled()
        })

        it('updates the errors as they are fixed, once a post has been tried', async () => {
            const { wrapper } = await openForm()
            await submit(wrapper)
            expect(wrapper.text()).toContain('The description is required')

            await wrapper.find('input.description').setValue('Fixed')

            expect(wrapper.text()).not.toContain('The description is required')
        })

        it('posts a balanced voucher with exactly what was entered and goes to it', async () => {
            JournalService.create.mockResolvedValue({ data: { id: 41, voucher_no: 9, lines: [] } })
            const { wrapper, router } = await openForm()
            await wrapper.find('input.description').setValue('  Sale for cash  ')
            await wrapper.find('button.add-line').trigger('click')
            await fillLine(wrapper, 0, { account: 1, debit: '125', text: 'Cash' })
            await fillLine(wrapper, 1, { account: 2, credit: '100' })
            await fillLine(wrapper, 2, { account: 7, credit: '25.00' })

            await submit(wrapper)

            expect(JournalService.create).toHaveBeenCalledTimes(1)
            expect(JournalService.create).toHaveBeenCalledWith({
                entry_date: '2026-10-28',
                description: 'Sale for cash',
                lines: [
                    { account_id: 1, debit: 125, credit: 0, description: 'Cash' },
                    { account_id: 2, debit: 0, credit: 100, description: null },
                    { account_id: 7, debit: 0, credit: 25, description: null },
                ],
            })
            expect(toast).toHaveBeenCalledWith('Voucher 9 posted', 'success')
            expect(router.currentRoute.value.name).toBe('ShowVoucher')
            expect(router.currentRoute.value.params.entryId).toBe('41')
        })

        it('sends the amounts as the server will round them', async () => {
            JournalService.create.mockResolvedValue({ data: { id: 1, voucher_no: 1, lines: [] } })
            const { wrapper } = await openForm()
            await wrapper.find('input.description').setValue('Rounding')
            await fillLine(wrapper, 0, { account: 1, debit: '10.005' })
            await fillLine(wrapper, 1, { account: 2, credit: '10.01' })

            await submit(wrapper)

            const [{ lines }] = JournalService.create.mock.calls[0]
            expect(lines.map((line) => [line.debit, line.credit])).toEqual([
                [10.01, 0],
                [0, 10.01],
            ])
        })

        it('says why when the server refuses it, and stays on the form', async () => {
            JournalService.create.mockRejectedValue({
                response: { data: { error: 'The fiscal year 2026-01-01 to 2026-12-31 is closed' } },
            })
            const { wrapper, router } = await openForm()
            await fillBalancedSale(wrapper)

            await submit(wrapper)

            expect(toast).toHaveBeenCalledWith('The fiscal year 2026-01-01 to 2026-12-31 is closed', 'error')
            expect(router.currentRoute.value.name).toBe('NewVoucher')
            expect(wrapper.find('input.description').element.value).toBe('Sale for cash')
        })

        it('can be posted again after the server refused it', async () => {
            JournalService.create
                .mockRejectedValueOnce({ response: { data: { error: 'Try again' } } })
                .mockResolvedValue({ data: { id: 5, voucher_no: 3, lines: [] } })
            const { wrapper, router } = await openForm()
            await fillBalancedSale(wrapper)
            await submit(wrapper)

            await submit(wrapper)

            expect(JournalService.create).toHaveBeenCalledTimes(2)
            expect(router.currentRoute.value.name).toBe('ShowVoucher')
        })

        it('does not post twice when the button is pressed twice', async () => {
            let finish
            JournalService.create.mockReturnValue(
                new Promise((resolve) => {
                    finish = () => resolve({ data: { id: 5, voucher_no: 3, lines: [] } })
                }),
            )
            const { wrapper } = await openForm()
            await fillBalancedSale(wrapper)

            await wrapper.find('form').trigger('submit')
            await wrapper.find('form').trigger('submit')
            finish()
            await flushPromises()

            expect(JournalService.create).toHaveBeenCalledTimes(1)
        })
    })

    describe('leaving the page', () => {
        const leaves = async (router) => {
            confirmations.mockClear()
            await router.push('/vouchers')
            await flushPromises()
            return confirmations.mock.calls.length === 0 && router.currentRoute.value.path === '/vouchers'
        }

        it('lets you leave a blank voucher without asking', async () => {
            const { router } = await openForm()

            expect(await leaves(router)).toBe(true)
        })

        it.each([
            ['a description', (wrapper) => wrapper.find('input.description').setValue('x')],
            ['an amount', (wrapper) => fillLine(wrapper, 0, { debit: '5' })],
            ['an account', (wrapper) => fillLine(wrapper, 0, { account: 1 })],
            ['a new line', (wrapper) => wrapper.find('button.add-line').trigger('click')],
        ])('asks before leaving with %s typed in', async (_name, change) => {
            const { router, wrapper } = await openForm()
            await change(wrapper)

            expect(await leaves(router)).toBe(false)
            expect(confirmations).toHaveBeenCalledWith('Confirm navigation')
            expect(router.currentRoute.value.path).toBe('/vouchers/new')
        })

        it('leaves when you say so', async () => {
            answer = true
            const { router, wrapper } = await openForm()
            await wrapper.find('input.description').setValue('x')

            await router.push('/vouchers')
            await flushPromises()

            expect(router.currentRoute.value.path).toBe('/vouchers')
        })

        it('does not ask again once a change is changed back', async () => {
            const { router, wrapper } = await openForm()
            await wrapper.find('input.description').setValue('x')
            await wrapper.find('input.description').setValue('')

            expect(await leaves(router)).toBe(true)
        })

        it('does not ask on the way to the voucher that was just posted', async () => {
            JournalService.create.mockResolvedValue({ data: { id: 5, voucher_no: 3, lines: [] } })
            const { wrapper } = await openForm()
            await fillBalancedSale(wrapper)

            await submit(wrapper)

            expect(confirmations).not.toHaveBeenCalled()
        })
    })

    describe('VAT codes', () => {
        const chart = [
            { id: 1, number: 6480, name: 'Bankkonto', is_archived: false, system_role: 'bank' },
            { id: 2, number: 1010, name: 'Salg af varer og ydelser', is_archived: false, system_role: 'sales' },
            { id: 7, number: 7680, name: 'Salgsmoms', is_archived: false, system_role: 'output_vat' },
            { id: 8, number: 7740, name: 'Købsmoms', is_archived: false, system_role: 'input_vat' },
            {
                id: 9,
                number: 7720,
                name: 'Moms af ydelseskøb i udlandet',
                is_archived: false,
                system_role: 'vat_eu_services',
            },
            { id: 10, number: 1610, name: 'Vareforbrug', is_archived: false, system_role: null },
            { id: 11, number: 1910, name: 'Repræsentation', is_archived: false, system_role: null },
            { id: 12, number: 7440, name: 'Leverandørgæld', is_archived: false, system_role: 'payables' },
            { id: 13, number: 1710, name: 'Ydelseskøb', is_archived: false, system_role: null },
        ]
        const vatCodes = [
            {
                code: 'S01',
                title: 'Momspligtige salg (DK), 25% moms',
                applies_to: 'sales',
                rate: 0.25,
                deduction: null,
                direction: 'output',
            },
            {
                code: 'S23',
                title: 'Ydelsessalg B2B (EU), 0% moms',
                applies_to: 'sales',
                rate: 0,
                deduction: null,
                direction: 'none',
            },
            {
                code: 'K010',
                title: 'Indgående moms (DK)',
                applies_to: 'purchases',
                rate: 0.25,
                deduction: 1,
                direction: 'input',
            },
            {
                code: 'K070',
                title: 'Repræsentationsmoms',
                applies_to: 'purchases',
                rate: 0.25,
                deduction: 0.25,
                direction: 'input',
            },
            {
                code: 'K260',
                title: 'Ydelseskøb (EU)',
                applies_to: 'purchases',
                rate: 0.25,
                deduction: 1,
                direction: 'acquisition_services',
            },
        ]
        const registered = { id: 1, vat_period_type: 'quarter' }
        const openWithVat = (extra = {}) => openForm({ chart, organization: registered, vatCodes, ...extra })

        const setCode = (wrapper, index, code) => lineRows(wrapper)[index].find('select.vat-code').setValue(code)
        const vatRows = (wrapper) =>
            wrapper.findAll('tr.vat-line').map((row) => row.findAll('td').map((cell) => cell.text()))

        it('has no VAT column while the organization is not VAT-registered', async () => {
            const { wrapper } = await openForm({ chart, organization: { id: 1, vat_period_type: null }, vatCodes })

            expect(wrapper.find('select.vat-code').exists()).toBe(false)
            expect(wrapper.text()).not.toContain('VAT')
        })

        it('offers the supported codes by sales and purchases, with no VAT as the first choice', async () => {
            const { wrapper } = await openWithVat()

            const select = lineRows(wrapper)[0].find('select.vat-code')
            expect(select.findAll('option').map((option) => option.text())).toEqual([
                'No VAT',
                'S01 25%',
                'S23 0%',
                'K010 25%',
                'K070 25%',
                'K260 25%',
            ])
            expect(select.findAll('optgroup').map((group) => group.attributes('label'))).toEqual(['Sales', 'Purchases'])
            expect(select.element.value).toBe('')
        })

        it('shows no VAT lines for a voucher without codes', async () => {
            const { wrapper } = await openWithVat()
            await fillBalancedSale(wrapper)

            expect(wrapper.find('tr.vat-line').exists()).toBe(false)
            expect(wrapper.find('.difference .badge').text()).toBe('Balanced')
        })

        it('shows the output VAT of a sale as it will be posted, and balances with it', async () => {
            const { wrapper } = await openWithVat()
            await fillLine(wrapper, 0, { account: 1, debit: '1250' })
            await fillLine(wrapper, 1, { account: 2, credit: '1000' })
            await setCode(wrapper, 1, 'S01')

            expect(vatRows(wrapper)).toEqual([['7680 Salgsmoms', '', 'VAT S01', '', '250.00', '']])
            expect(wrapper.find('.total-debit').text()).toBe('1250.00')
            expect(wrapper.find('.total-credit').text()).toBe('1250.00')
            expect(wrapper.find('.difference .badge').text()).toBe('Balanced')
        })

        it('does not balance without the VAT, and says it is with the VAT lines', async () => {
            const { wrapper } = await openWithVat()
            await wrapper.find('input.description').setValue('Sale')
            await fillLine(wrapper, 0, { account: 1, debit: '1000' })
            await fillLine(wrapper, 1, { account: 2, credit: '1000' })
            await setCode(wrapper, 1, 'S01')

            await submit(wrapper)

            expect(wrapper.find('.difference').text()).toContain('-250.00')
            expect(wrapper.find('.balance-error').text()).toBe(
                'The voucher does not balance (with the VAT lines): the difference is -250.00',
            )
            expect(JournalService.create).not.toHaveBeenCalled()
        })

        it('splits the VAT of a purchase with a share that cannot be deducted', async () => {
            const { wrapper } = await openWithVat()
            await fillLine(wrapper, 0, { account: 11, debit: '100' })
            await fillLine(wrapper, 1, { account: 12, credit: '125' })
            await setCode(wrapper, 0, 'K070')

            expect(vatRows(wrapper)).toEqual([
                ['7740 Købsmoms', '', 'VAT K070', '6.25', '', ''],
                ['1910 Repræsentation', '', 'Non-deductible VAT K070', '18.75', '', ''],
            ])
            expect(wrapper.find('.difference .badge').text()).toBe('Balanced')
        })

        it('shows the acquisition VAT of services from abroad on both sides', async () => {
            const { wrapper } = await openWithVat()
            await fillLine(wrapper, 0, { account: 13, debit: '800' })
            await fillLine(wrapper, 1, { account: 12, credit: '800' })
            await setCode(wrapper, 0, 'K260')

            expect(vatRows(wrapper)).toEqual([
                ['7720 Moms af ydelseskøb i udlandet', '', 'VAT K260', '', '200.00', ''],
                ['7740 Købsmoms', '', 'VAT K260', '200.00', '', ''],
            ])
            expect(wrapper.find('.difference .badge').text()).toBe('Balanced')
        })

        it('puts the VAT of a credit note on the other side', async () => {
            const { wrapper } = await openWithVat()
            await fillLine(wrapper, 0, { account: 2, debit: '100' })
            await fillLine(wrapper, 1, { account: 1, credit: '125' })
            await setCode(wrapper, 0, 'S01')

            expect(vatRows(wrapper)).toEqual([['7680 Salgsmoms', '', 'VAT S01', '25.00', '', '']])
            expect(wrapper.find('.difference .badge').text()).toBe('Balanced')
        })

        it('adds no VAT line for a code that carries no VAT', async () => {
            const { wrapper } = await openWithVat()
            await fillLine(wrapper, 0, { account: 1, debit: '400' })
            await fillLine(wrapper, 1, { account: 2, credit: '400' })
            await setCode(wrapper, 1, 'S23')

            expect(wrapper.find('tr.vat-line').exists()).toBe(false)
            expect(wrapper.find('.difference .badge').text()).toBe('Balanced')
        })

        it('takes the VAT line away again when the code is taken away', async () => {
            const { wrapper } = await openWithVat()
            await fillLine(wrapper, 0, { account: 1, debit: '1250' })
            await fillLine(wrapper, 1, { account: 2, credit: '1000' })
            await setCode(wrapper, 1, 'S01')

            await setCode(wrapper, 1, '')

            expect(wrapper.find('tr.vat-line').exists()).toBe(false)
            expect(wrapper.find('.difference').text()).toContain('250.00')
        })

        it('posts the code of each line and none of the VAT lines, which the server adds', async () => {
            JournalService.create.mockResolvedValue({ data: { id: 41, voucher_no: 9, lines: [] } })
            const { wrapper } = await openWithVat()
            await wrapper.find('input.description').setValue('Sale')
            await fillLine(wrapper, 0, { account: 1, debit: '1250' })
            await fillLine(wrapper, 1, { account: 2, credit: '1000' })
            await setCode(wrapper, 1, 'S01')

            await submit(wrapper)

            expect(JournalService.create).toHaveBeenCalledWith({
                entry_date: '2026-10-28',
                description: 'Sale',
                lines: [
                    { account_id: 1, debit: 1250, credit: 0, description: null },
                    { account_id: 2, vat_code: 'S01', debit: 0, credit: 1000, description: null },
                ],
            })
        })

        it('refuses a code on a VAT account, which would count the VAT twice', async () => {
            const { wrapper } = await openWithVat()
            await wrapper.find('input.description').setValue('Odd')
            await fillLine(wrapper, 0, { account: 1, debit: '25' })
            await fillLine(wrapper, 1, { account: 7, credit: '25' })
            await setCode(wrapper, 1, 'S01')

            await submit(wrapper)

            expect(wrapper.find('.line-error').text()).toContain('A VAT code cannot be used on a VAT account')
            expect(JournalService.create).not.toHaveBeenCalled()
        })

        it('says what the chart is missing when there is no account for the VAT', async () => {
            const withoutOutputVat = chart.filter((account) => account.system_role !== 'output_vat')
            const { wrapper } = await openWithVat({ chart: withoutOutputVat })
            await wrapper.find('input.description').setValue('Sale')
            await fillLine(wrapper, 0, { account: 1, debit: '1000' })
            await fillLine(wrapper, 1, { account: 2, credit: '1000' })
            await setCode(wrapper, 1, 'S01')

            await submit(wrapper)

            expect(wrapper.find('.vat-error').text()).toBe(
                'The chart of accounts has no output_vat account for the VAT of S01',
            )
            expect(JournalService.create).not.toHaveBeenCalled()
        })

        it('counts a code as something typed in: it asks before leaving', async () => {
            const { router, wrapper } = await openWithVat()
            await setCode(wrapper, 0, 'S01')

            await router.push('/vouchers')
            await flushPromises()

            expect(confirmations).toHaveBeenCalledWith('Confirm navigation')
        })
    })
})
