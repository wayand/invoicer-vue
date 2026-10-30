import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createStore } from 'vuex'
import { defineComponent, h } from 'vue'
import AccountLedger from '@/views/reports/AccountLedger.vue'
import account from '@/store/modules/account'
import AccountService from '@/services/AccountService'
import ReportService from '@/services/ReportService'
import { toast } from '@/utilities/toast'

vi.mock('@/services/AccountService', () => ({ default: { getAll: vi.fn() } }))
vi.mock('@/services/ReportService', () => ({ default: { trialBalance: vi.fn(), accountLedger: vi.fn() } }))
vi.mock('@/utilities/toast', () => ({ toast: vi.fn() }))

const accounts = [
    { id: 2, number: 6480, name: 'Bankkonto' },
    { id: 1, number: 1010, name: 'Salg af varer og ydelser' },
]
const row = (entry_id, voucher_no, debit, credit, balance, extra = {}) => ({
    entry_id,
    voucher_no,
    entry_date: '2026-03-01',
    description: `Voucher ${voucher_no}`,
    line_description: null,
    debit,
    credit,
    balance,
    ...extra,
})
// Sales: normal side credit, so a credit of 100 is a balance of -100 as debit minus credit
const sales = (extra = {}) => ({
    account: { id: 1, number: 1010, name: 'Salg af varer og ydelser', normal_balance: 'credit' },
    opening_balance: -10,
    total_debit: 100,
    total_credit: 100,
    closing_balance: -10,
    rows: [row(1, 1, 0, 100, -110, { line_description: 'March' }), row(2, 2, 100, 0, -10)],
    ...extra,
})

const year = new Date().getFullYear()
const page = () => defineComponent({ render: () => h('div') })

const open = async (query = '') => {
    const store = createStore({
        modules: { account: { ...account, state: () => ({ accounts: [], account: {}, accountGroups: [] }) } },
    })
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/reports/account-ledger', name: 'AccountLedger', component: AccountLedger },
            { path: '/vouchers/:entryId(\\d+)', name: 'ShowVoucher', component: page(), props: true },
        ],
    })
    router.push(`/reports/account-ledger${query}`)
    await router.isReady()
    const wrapper = mount(defineComponent({ render: () => h(RouterView) }), {
        global: {
            plugins: [store, router],
            mocks: { $filters: { toCurrency: (value) => Number(value).toFixed(2) } },
        },
    })
    await flushPromises()
    return { router, wrapper }
}

const texts = (wrapper, selector) => wrapper.findAll(selector).map((cell) => cell.text())

describe('account ledger', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        AccountService.getAll.mockResolvedValue({ data: accounts })
        ReportService.accountLedger.mockResolvedValue({ data: sales() })
    })

    it('asks for an account first, and shows no report without one', async () => {
        const { wrapper } = await open()

        expect(wrapper.text()).toContain('Choose an account to see its postings.')
        expect(ReportService.accountLedger).not.toHaveBeenCalled()
    })

    it('offers the accounts in number order', async () => {
        const { wrapper } = await open()

        expect(texts(wrapper, '#ledger-account option')).toEqual([
            'Select account',
            '1010 Salg af varer og ydelser',
            '6480 Bankkonto',
        ])
    })

    it('loads the account that is chosen, for this year', async () => {
        const { wrapper } = await open()

        await wrapper.find('#ledger-account').setValue(1)
        await flushPromises()

        expect(ReportService.accountLedger).toHaveBeenCalledWith({
            accountId: 1,
            from: `${year}-01-01`,
            to: `${year}-12-31`,
        })
    })

    it('takes the account and the range from a link', async () => {
        const { wrapper } = await open('?account=1&from=2026-02-01&to=2026-02-28')

        expect(ReportService.accountLedger).toHaveBeenCalledWith({ accountId: 1, from: '2026-02-01', to: '2026-02-28' })
        expect(wrapper.find('#ledger-account').element.value).toBe('1')
        expect(wrapper.find('#report-from').element.value).toBe('2026-02-01')
    })

    it('reads an empty range in a link as all time, not as this year', async () => {
        await open('?account=1&from=&to=')

        expect(ReportService.accountLedger).toHaveBeenCalledWith({ accountId: 1, from: '', to: '' })
    })

    it('shows the postings with the balance brought forward and the totals', async () => {
        const { wrapper } = await open('?account=1')

        expect(wrapper.find('.card-header').text()).toContain('1010 Salg af varer og ydelser')
        expect(wrapper.find('tr.opening').text()).toContain('Balance brought forward')
        expect(texts(wrapper, 'tr.posting td.debit')).toEqual(['', '100.00'])
        expect(texts(wrapper, 'tr.posting td.credit')).toEqual(['100.00', ''])
        expect(wrapper.find('.total-debit').text()).toBe('100.00')
        expect(wrapper.find('.total-credit').text()).toBe('100.00')
    })

    it('shows the balance on the account’s own side', async () => {
        const { wrapper } = await open('?account=1')

        expect(wrapper.find('tr.opening td.balance').text()).toBe('10.00')
        expect(texts(wrapper, 'tr.posting td.balance')).toEqual(['110.00', '10.00'])
        expect(wrapper.find('td.closing').text()).toBe('10.00')
    })

    it('shows the line text under the description of the voucher', async () => {
        const { wrapper } = await open('?account=1')

        const [first, second] = wrapper.findAll('tr.posting')
        expect(first.text()).toContain('Voucher 1')
        expect(first.text()).toContain('March')
        expect(second.find('.small').exists()).toBe(false)
    })

    it('links a posting to its voucher', async () => {
        const { router, wrapper } = await open('?account=1')

        await wrapper.findAll('tr.posting a')[1].trigger('click')
        await flushPromises()

        expect(router.currentRoute.value.name).toBe('ShowVoucher')
        expect(router.currentRoute.value.params.entryId).toBe('2')
    })

    it('asks again when the range changes, and not at all when it is the wrong way round', async () => {
        const { wrapper } = await open('?account=1')

        await wrapper.find('.range-all').trigger('click')
        await flushPromises()
        expect(ReportService.accountLedger).toHaveBeenLastCalledWith({ accountId: 1, from: '', to: '' })

        ReportService.accountLedger.mockClear()
        await wrapper.find('#report-from').setValue('2026-05-01')
        await wrapper.find('#report-to').setValue('2026-04-01')
        await flushPromises()

        expect(ReportService.accountLedger).toHaveBeenCalledTimes(1)
        expect(wrapper.find('.range-error').exists()).toBe(true)
        expect(wrapper.find('tr.posting').exists()).toBe(false)
    })

    it('shows the reason when the server refuses', async () => {
        ReportService.accountLedger.mockRejectedValue({
            response: { data: { error: 'There is no account with id 9' } },
        })

        await open('?account=9')

        expect(toast).toHaveBeenCalledWith('There is no account with id 9', 'error')
    })

    it('has no postings in the period, but still the balance brought forward', async () => {
        ReportService.accountLedger.mockResolvedValue({
            data: sales({ rows: [], total_debit: 0, total_credit: 0 }),
        })

        const { wrapper } = await open('?account=1')

        expect(wrapper.findAll('tr.posting')).toHaveLength(0)
        expect(wrapper.find('tr.opening td.balance').text()).toBe('10.00')
    })
})
