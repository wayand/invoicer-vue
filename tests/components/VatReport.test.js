import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { defineComponent, h } from 'vue'
import VatReport from '@/views/reports/VatReport.vue'
import ReportService from '@/services/ReportService'
import { toast } from '@/utilities/toast'
import { previousQuarterRange, quarterRange } from '@/utilities/mydate'

vi.mock('@/services/ReportService', () => ({
    default: { trialBalance: vi.fn(), accountLedger: vi.fn(), vatReport: vi.fn() },
}))
vi.mock('@/utilities/toast', () => ({ toast: vi.fn() }))

// The first quarter of the worked example of the API: 243.75 to pay
const report = (extra = {}) => ({
    from: '2026-01-01',
    to: '2026-03-31',
    sales_vat: 250,
    input_vat: 406.25,
    eu_goods_vat: 200,
    eu_services_vat: 200,
    total_to_pay: 243.75,
    boxes: { a_goods: 800, a_services: 800, b_goods: 0, b_services: 400, c: 0 },
    codes: [
        {
            code: 'K070',
            title: 'Repræsentationsmoms',
            rate: 0.25,
            base: 100,
            output_vat: 0,
            input_vat: 6.25,
            acquisition_vat: 0,
            nondeductible_vat: 18.75,
        },
        {
            code: 'S01',
            title: 'Momspligtige salg (DK), 25% moms',
            rate: 0.25,
            base: 1000,
            output_vat: 250,
            input_vat: 0,
            acquisition_vat: 0,
            nondeductible_vat: 0,
        },
        {
            code: 'S23',
            title: 'Ydelsessalg B2B (EU), 0% moms',
            rate: 0,
            base: 400,
            output_vat: 0,
            input_vat: 0,
            acquisition_vat: 0,
            nondeductible_vat: 0,
        },
    ],
    ledger_check: {
        accounts: [
            {
                role: 'output_vat',
                account: { id: 1, number: 7680, name: 'Salgsmoms' },
                ledger_balance: 250,
                reported: 250,
                difference: 0,
            },
            {
                role: 'input_vat',
                account: { id: 2, number: 7740, name: 'Købsmoms' },
                ledger_balance: 406.25,
                reported: 406.25,
                difference: 0,
            },
            {
                role: 'vat_eu_goods',
                account: { id: 3, number: 7700, name: 'Moms af varekøb i udlandet' },
                ledger_balance: 200,
                reported: 200,
                difference: 0,
            },
            { role: 'vat_eu_services', account: null, ledger_balance: 0, reported: 200, difference: -200 },
        ],
        uncoded_lines: [],
        ties: true,
    },
    ...extra,
})

const page = () => defineComponent({ render: () => h('div') })

const open = async (url = '/reports/vat') => {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/reports/vat', name: 'VatReport', component: VatReport },
            { path: '/vouchers/:entryId(\\d+)', name: 'ShowVoucher', component: page(), props: true },
        ],
    })
    router.push(url)
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

const rows = (wrapper, selector) => wrapper.findAll(selector).map((row) => row.findAll('td').map((cell) => cell.text()))

describe('VAT report', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        ReportService.vatReport.mockResolvedValue({ data: report() })
    })

    it('starts with this quarter', async () => {
        const { wrapper } = await open()

        const quarter = quarterRange()
        expect(ReportService.vatReport).toHaveBeenCalledWith(quarter)
        expect(wrapper.find('#report-from').element.value).toBe(quarter.from)
        expect(wrapper.find('#report-to').element.value).toBe(quarter.to)
    })

    it('opens on the range a link brings, an empty one meaning all time', async () => {
        await open('/reports/vat?from=2026-01-01&to=2026-03-31')
        await open('/reports/vat?from=&to=')

        expect(ReportService.vatReport).toHaveBeenNthCalledWith(1, { from: '2026-01-01', to: '2026-03-31' })
        expect(ReportService.vatReport).toHaveBeenNthCalledWith(2, { from: '', to: '' })
    })

    it('has buttons for this quarter and the one before', async () => {
        const { wrapper } = await open('/reports/vat?from=2020-01-01&to=2020-03-31')

        await wrapper.find('.range-last-quarter').trigger('click')
        await flushPromises()
        expect(ReportService.vatReport).toHaveBeenLastCalledWith(previousQuarterRange())

        await wrapper.find('.range-this-quarter').trigger('click')
        await flushPromises()
        expect(ReportService.vatReport).toHaveBeenLastCalledWith(quarterRange())
    })

    it('shows the figures of the return, with the input VAT as a deduction', async () => {
        const { wrapper } = await open()

        const text = (selector) => wrapper.find(selector).findAll('td')[1].text()
        expect(text('tr.sales-vat')).toBe('250.00')
        expect(text('tr.eu-goods-vat')).toBe('200.00')
        expect(text('tr.eu-services-vat')).toBe('200.00')
        expect(text('tr.input-vat')).toBe('-406.25')
        expect(wrapper.find('tr.total').text()).toBe('VAT to pay243.75')
    })

    it('says to be refunded, and gives the amount without a sign, when the total is negative', async () => {
        ReportService.vatReport.mockResolvedValue({ data: report({ total_to_pay: -200, sales_vat: 0 }) })
        const { wrapper } = await open()

        expect(wrapper.find('tr.total').text()).toBe('VAT to be refunded200.00')
    })

    it('shows no minus zero for no input VAT', async () => {
        ReportService.vatReport.mockResolvedValue({ data: report({ input_vat: 0 }) })
        const { wrapper } = await open()

        expect(wrapper.find('tr.input-vat').findAll('td')[1].text()).toBe('0.00')
    })

    it('shows the net amounts of the boxes', async () => {
        const { wrapper } = await open()

        expect(rows(wrapper, 'table.boxes tr').map(([label, amount]) => [label.slice(0, 11), amount])).toEqual([
            ['Rubrik A, v', '800.00'],
            ['Rubrik A, y', '800.00'],
            ['Rubrik B, v', '0.00'],
            ['Rubrik B, y', '400.00'],
            ['Rubrik C (o', '0.00'],
        ])
    })

    it('shows every figure by code, with the part that cannot be deducted', async () => {
        const { wrapper } = await open()

        expect(rows(wrapper, 'tr.code').map((cells) => [cells[0].split(' ')[0], ...cells.slice(1)])).toEqual([
            ['K070', '100.00', '25%', '0.00', '6.25', '0.00', '18.75'],
            ['S01', '1000.00', '25%', '250.00', '0.00', '0.00', '0.00'],
            ['S23', '400.00', '0%', '0.00', '0.00', '0.00', '0.00'],
        ])
    })

    it('says so when nothing has a VAT code in the range', async () => {
        ReportService.vatReport.mockResolvedValue({ data: report({ codes: [] }) })
        const { wrapper } = await open()

        expect(wrapper.find('table.codes').text()).toContain('Nothing with a VAT code is posted in this period.')
    })

    it('says that the report agrees with the ledger, and shows each account', async () => {
        const { wrapper } = await open()

        expect(wrapper.find('.ties').text()).toBe('Agrees with the ledger')
        expect(wrapper.find('.ties').classes()).toContain('bg-success')
        expect(rows(wrapper, 'tr.check-account')[0]).toEqual(['7680 Salgsmoms', '250.00', '250.00', '0.00'])
        expect(wrapper.find('.uncoded').exists()).toBe(false)
        expect(wrapper.text()).toContain('Every posting on the VAT accounts has a VAT code.')
    })

    it('names an account the chart does not have, and marks the difference', async () => {
        const { wrapper } = await open()

        const missing = wrapper.findAll('tr.check-account')[3]
        expect(missing.text()).toContain('No account with the role vat_eu_services')
        expect(missing.find('.difference').classes()).toContain('text-danger')
        expect(wrapper.findAll('tr.check-account')[0].find('.difference').classes()).not.toContain('text-danger')
    })

    it('lists the postings without a code, with a link to the voucher, when it does not agree', async () => {
        ReportService.vatReport.mockResolvedValue({
            data: report({
                ledger_check: {
                    accounts: [
                        {
                            role: 'output_vat',
                            account: { id: 1, number: 7680, name: 'Salgsmoms' },
                            ledger_balance: 280,
                            reported: 250,
                            difference: 30,
                        },
                    ],
                    uncoded_lines: [
                        {
                            entry_id: 7,
                            voucher_no: 12,
                            entry_date: '2026-03-15',
                            description: 'VAT by hand',
                            account: { id: 1, number: 7680, name: 'Salgsmoms' },
                            role: 'output_vat',
                            line_description: null,
                            debit: 0,
                            credit: 30,
                        },
                    ],
                    ties: false,
                },
            }),
        })
        const { wrapper, router } = await open()

        expect(wrapper.find('.ties').text()).toBe('Does not agree with the ledger')
        expect(wrapper.find('.ties').classes()).toContain('bg-danger')
        expect(wrapper.find('.uncoded').text()).toContain('have no VAT code')
        expect(rows(wrapper, 'tr.uncoded-line')).toEqual([
            ['12', '2026-03-15', '7680 Salgsmoms', 'VAT by hand', '', '30.00'],
        ])
        await wrapper.find('tr.uncoded-line a').trigger('click')
        await flushPromises()
        expect(router.currentRoute.value.path).toBe('/vouchers/7')
    })

    it('asks again when a date is changed, and shows only the answer to the latest question', async () => {
        const { wrapper } = await open('/reports/vat?from=2026-01-01&to=2026-03-31')
        let slow
        ReportService.vatReport.mockReturnValueOnce(new Promise((resolve) => (slow = resolve)))
        ReportService.vatReport.mockResolvedValueOnce({ data: report({ sales_vat: 5 }) })

        await wrapper.find('#report-from').setValue('2026-02-01')
        await wrapper.find('#report-from').setValue('2026-03-01')
        await flushPromises()
        slow({ data: report({ sales_vat: 999 }) })
        await flushPromises()

        expect(wrapper.find('tr.sales-vat').findAll('td')[1].text()).toBe('5.00')
    })

    it('does not ask for a range that ends before it starts, and says so', async () => {
        const { wrapper } = await open('/reports/vat?from=2026-01-01&to=2026-03-31')
        ReportService.vatReport.mockClear()

        await wrapper.find('#report-from').setValue('2026-05-01')
        await flushPromises()

        expect(wrapper.find('.range-error').text()).toBe('The from date is after the to date')
        expect(ReportService.vatReport).not.toHaveBeenCalled()
    })

    it('says what went wrong when the report cannot be read', async () => {
        ReportService.vatReport.mockRejectedValue({ response: { data: { error: 'No way' } } })
        const { wrapper } = await open()

        expect(toast).toHaveBeenCalledWith('No way', 'error')
        expect(wrapper.text()).toContain('Loading...')
    })
})
