import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { defineComponent, h } from 'vue'
import TrialBalance from '@/views/reports/TrialBalance.vue'
import ReportService from '@/services/ReportService'
import { toast } from '@/utilities/toast'

vi.mock('@/services/ReportService', () => ({ default: { trialBalance: vi.fn(), accountLedger: vi.fn() } }))
vi.mock('@/utilities/toast', () => ({ toast: vi.fn() }))

const account = (id, number, name, normal, opening, debit, credit) => ({
    account_id: id,
    number,
    name,
    normal_balance: normal,
    opening_balance: opening,
    debit,
    credit,
    closing_balance: opening + debit - credit,
})
// A sale of 125 with 25 VAT, the bank holding 125 and 20 brought forward from earlier
const report = (extra = {}) => ({
    accounts: [
        account(1, 1010, 'Salg af varer og ydelser', 'credit', 0, 0, 100),
        account(2, 6480, 'Bankkonto', 'debit', 20, 125, 0),
        account(3, 7680, 'Salgsmoms', 'credit', -20, 0, 25),
    ],
    total_debit: 125,
    total_credit: 125,
    balanced: true,
    ...extra,
})

const year = new Date().getFullYear()
const page = () => defineComponent({ render: () => h('div') })

const open = async () => {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/reports/trial-balance', name: 'TrialBalance', component: TrialBalance },
            { path: '/reports/account-ledger', name: 'AccountLedger', component: page() },
        ],
    })
    router.push('/reports/trial-balance')
    await router.isReady()
    const wrapper = mount(defineComponent({ render: () => h(RouterView) }), {
        global: {
            plugins: [router],
            mocks: { $filters: { toCurrency: (value) => Number(value).toFixed(2) } },
        },
    })
    await flushPromises()
    return { router, wrapper }
}

const cells = (wrapper, selector) => wrapper.findAll(`tr.account ${selector}`).map((cell) => cell.text())

describe('trial balance', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        ReportService.trialBalance.mockResolvedValue({ data: report() })
    })

    it('starts with this calendar year', async () => {
        const { wrapper } = await open()

        expect(ReportService.trialBalance).toHaveBeenCalledWith({ from: `${year}-01-01`, to: `${year}-12-31` })
        expect(wrapper.find('#report-from').element.value).toBe(`${year}-01-01`)
        expect(wrapper.find('#report-to').element.value).toBe(`${year}-12-31`)
    })

    it('lists the accounts with the movements and the totals', async () => {
        const { wrapper } = await open()

        expect(wrapper.findAll('tr.account')).toHaveLength(3)
        expect(wrapper.find('tr.account').text()).toContain('1010 Salg af varer og ydelser')
        expect(cells(wrapper, 'td.debit')).toEqual(['0.00', '125.00', '0.00'])
        expect(cells(wrapper, 'td.credit')).toEqual(['100.00', '0.00', '25.00'])
        expect(wrapper.find('.total-debit').text()).toBe('125.00')
        expect(wrapper.find('.total-credit').text()).toBe('125.00')
    })

    it('shows a credit account as a positive number, on its own side', async () => {
        const { wrapper } = await open()

        // Sales: credit 100 is -100 as debit minus credit. VAT: 20 owed before, 45 now.
        expect(cells(wrapper, 'td.closing')).toEqual(['100.00', '145.00', '45.00'])
        expect(cells(wrapper, 'td.opening')).toEqual(['0.00', '20.00', '20.00'])
    })

    it('says whether the books balance', async () => {
        const { wrapper } = await open()
        expect(wrapper.find('.balance-status').text()).toBe('Balanced')
        expect(wrapper.find('.balance-status').classes()).toContain('bg-success')

        ReportService.trialBalance.mockResolvedValue({ data: report({ balanced: false }) })
        await wrapper.find('.range-all').trigger('click')
        await flushPromises()

        expect(wrapper.find('.balance-status').text()).toBe('Does not balance')
        expect(wrapper.find('.balance-status').classes()).toContain('bg-danger')
    })

    it('asks again when a date is changed', async () => {
        const { wrapper } = await open()

        await wrapper.find('#report-from').setValue('2026-03-01')
        await flushPromises()

        expect(ReportService.trialBalance).toHaveBeenLastCalledWith({ from: '2026-03-01', to: `${year}-12-31` })
    })

    it('has quick ranges: last year and all time', async () => {
        const { wrapper } = await open()

        await wrapper.find('.range-last-year').trigger('click')
        await flushPromises()
        expect(ReportService.trialBalance).toHaveBeenLastCalledWith({
            from: `${year - 1}-01-01`,
            to: `${year - 1}-12-31`,
        })

        await wrapper.find('.range-all').trigger('click')
        await flushPromises()
        expect(ReportService.trialBalance).toHaveBeenLastCalledWith({ from: '', to: '' })
    })

    it('does not ask when the from date is after the to date, and says so', async () => {
        const { wrapper } = await open()
        await wrapper.find('#report-to').setValue(`${year}-01-01`)
        await flushPromises()
        ReportService.trialBalance.mockClear()

        await wrapper.find('#report-from').setValue(`${year}-12-31`)
        await flushPromises()

        expect(ReportService.trialBalance).not.toHaveBeenCalled()
        expect(wrapper.find('.range-error').text()).toBe('The from date is after the to date')
    })

    it('says when nothing is posted', async () => {
        ReportService.trialBalance.mockResolvedValue({
            data: report({ accounts: [], total_debit: 0, total_credit: 0 }),
        })

        const { wrapper } = await open()

        expect(wrapper.text()).toContain('Nothing is posted in this period.')
        expect(wrapper.find('tfoot').exists()).toBe(false)
    })

    it('shows the reason when the server refuses', async () => {
        ReportService.trialBalance.mockRejectedValue({
            response: { data: { error: 'The from date is after the to date' } },
        })

        await open()

        expect(toast).toHaveBeenCalledWith('The from date is after the to date', 'error')
    })

    it('shows only the answer to the last question, whatever order they arrive in', async () => {
        let answerFirst
        ReportService.trialBalance
            .mockReturnValueOnce(new Promise((resolve) => (answerFirst = resolve)))
            .mockResolvedValueOnce({ data: report({ accounts: [account(2, 6480, 'Bankkonto', 'debit', 0, 5, 0)] }) })
        const { wrapper } = await open()

        await wrapper.find('.range-all').trigger('click')
        await flushPromises()
        answerFirst({ data: report() })
        await flushPromises()

        expect(wrapper.findAll('tr.account')).toHaveLength(1)
    })

    it('links an account to its ledger, with the range', async () => {
        const { router, wrapper } = await open()

        await wrapper.find('tr.account a').trigger('click')
        await flushPromises()

        expect(router.currentRoute.value.name).toBe('AccountLedger')
        expect(router.currentRoute.value.query).toEqual({
            account: '1',
            from: `${year}-01-01`,
            to: `${year}-12-31`,
        })
    })

    it('keeps an empty range empty in the link, so the ledger is not narrowed to this year', async () => {
        const { router, wrapper } = await open()
        await wrapper.find('.range-all').trigger('click')
        await flushPromises()

        await wrapper.find('tr.account a').trigger('click')
        await flushPromises()

        expect(router.currentRoute.value.query).toEqual({ account: '1', from: '', to: '' })
    })
})
