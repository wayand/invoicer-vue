import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createStore } from 'vuex'
import { defineComponent, h, ref } from 'vue'
import ShowVoucher from '@/views/voucher/ShowVoucher.vue'
import journal from '@/store/modules/journal'
import JournalService from '@/services/JournalService'
import { toast } from '@/utilities/toast'

vi.mock('@/services/JournalService', () => ({
    default: { getAll: vi.fn(), getOne: vi.fn(), create: vi.fn(), reverse: vi.fn() },
}))
vi.mock('@/utilities/toast', () => ({ toast: vi.fn() }))

const sale = {
    id: 1,
    voucher_no: 1,
    entry_date: '2026-03-01',
    description: 'Sale for cash',
    reverses_entry_id: null,
    reversed_by_entry_id: null,
    lines: [
        {
            id: 11,
            line_no: 1,
            account_number: 6480,
            account_name: 'Bankkonto',
            debit: 125,
            credit: 0,
            description: 'Cash',
        },
        { id: 12, line_no: 2, account_number: 1010, account_name: 'Salg', debit: 0, credit: 100, description: null },
        {
            id: 13,
            line_no: 3,
            account_number: 7680,
            account_name: 'Salgsmoms',
            debit: 0,
            credit: 25,
            description: null,
        },
    ],
}
const reversedSale = { ...sale, reversed_by_entry_id: 2 }
const reversal = {
    ...sale,
    id: 2,
    voucher_no: 2,
    description: 'Reversal of voucher 1: Sale for cash',
    reverses_entry_id: 1,
    lines: sale.lines.map((line) => ({ ...line, debit: line.credit, credit: line.debit })),
}

const asked = vi.fn()
let answer = true
const PromiseDialog = defineComponent({
    name: 'PromiseDialog',
    setup() {
        const data = ref({})
        const showModal = async () => {
            asked(data.value.title)
            return answer
        }
        return { data, showModal }
    },
    render: () => null,
})
const page = () => defineComponent({ render: () => h('div') })

const openVoucher = async (entryId, known) => {
    JournalService.getOne.mockImplementation(async (id) => {
        const found = known[id]
        if (!found) throw { response: { data: { error: `There is no entry with id ${id}` } } }
        return { data: structuredClone(found) }
    })
    const store = createStore({
        modules: { journal: { ...journal, state: () => ({ journalEntries: [], journalEntry: null }) } },
    })
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/vouchers', name: 'Vouchers', component: page() },
            { path: '/vouchers/:entryId(\\d+)', name: 'ShowVoucher', component: ShowVoucher, props: true },
        ],
    })
    router.push(`/vouchers/${entryId}`)
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

describe('voucher page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        answer = true
    })

    it('shows the voucher: number, date, description and the lines', async () => {
        const { wrapper } = await openVoucher(1, { 1: sale })

        expect(wrapper.find('h3').text()).toBe('Voucher 1')
        expect(wrapper.text()).toContain('2026-03-01')
        expect(wrapper.text()).toContain('Sale for cash')
        expect(wrapper.findAll('tr.line').map((row) => row.findAll('td').map((cell) => cell.text()))).toEqual([
            ['6480 Bankkonto', 'Cash', '125.00', ''],
            ['1010 Salg', '', '', '100.00'],
            ['7680 Salgsmoms', '', '', '25.00'],
        ])
    })

    it('shows the totals, which are equal', async () => {
        const { wrapper } = await openVoucher(1, { 1: sale })

        const cells = wrapper.findAll('tfoot td').map((cell) => cell.text())
        expect(cells).toEqual(['Total', '125.00', '125.00'])
    })

    it('has no status and offers to reverse a voucher that is neither reversed nor a reversal', async () => {
        const { wrapper } = await openVoucher(1, { 1: sale })

        expect(wrapper.find('.reversed-by').exists()).toBe(false)
        expect(wrapper.find('.reverses').exists()).toBe(false)
        expect(wrapper.find('button.reverse').exists()).toBe(true)
    })

    it('says by which voucher a reversed one was reversed, with a link, and cannot be reversed again', async () => {
        const { wrapper } = await openVoucher(1, { 1: reversedSale, 2: reversal })

        const status = wrapper.find('.reversed-by')
        expect(status.text()).toContain('Reversed by voucher 2')
        expect(status.find('a').attributes('href')).toBe('/vouchers/2')
        expect(wrapper.find('button.reverse').exists()).toBe(false)
    })

    it('says which voucher a reversal reverses, and cannot be reversed', async () => {
        const { wrapper } = await openVoucher(2, { 1: reversedSale, 2: reversal })

        const status = wrapper.find('.reverses')
        expect(status.text()).toContain('Reversal of voucher 1')
        expect(status.find('a').attributes('href')).toBe('/vouchers/1')
        expect(wrapper.find('button.reverse').exists()).toBe(false)
    })

    it('reverses the voucher and goes to the reversal', async () => {
        const { wrapper, router } = await openVoucher(1, { 1: sale })
        JournalService.reverse.mockResolvedValue({ data: structuredClone(reversal) })
        JournalService.getOne.mockImplementation(async (id) => ({
            data: structuredClone(Number(id) === 2 ? reversal : reversedSale),
        }))

        await wrapper.find('button.reverse').trigger('click')
        await flushPromises()

        expect(asked).toHaveBeenCalledWith('Reverse voucher 1?')
        expect(JournalService.reverse).toHaveBeenCalledWith(1, {})
        expect(router.currentRoute.value.params.entryId).toBe('2')
        expect(wrapper.find('h3').text()).toBe('Voucher 2')
        expect(wrapper.find('.reverses').text()).toContain('Reversal of voucher 1')
    })

    it('stays on the voucher and posts nothing when you say no', async () => {
        answer = false
        const { wrapper, router } = await openVoucher(1, { 1: sale })

        await wrapper.find('button.reverse').trigger('click')
        await flushPromises()

        expect(JournalService.reverse).not.toHaveBeenCalled()
        expect(router.currentRoute.value.params.entryId).toBe('1')
    })

    it('says why when the server refuses the reversal, and stays', async () => {
        JournalService.reverse.mockRejectedValue({
            response: { data: { error: 'The fiscal year 2026-01-01 to 2026-12-31 is closed' } },
        })
        const { wrapper, router } = await openVoucher(1, { 1: sale })

        await wrapper.find('button.reverse').trigger('click')
        await flushPromises()

        expect(toast).toHaveBeenCalledWith('The fiscal year 2026-01-01 to 2026-12-31 is closed', 'error')
        expect(router.currentRoute.value.params.entryId).toBe('1')
    })

    it('says so and goes back to the list when the voucher does not exist', async () => {
        const { router } = await openVoucher(9, { 1: sale })

        expect(toast).toHaveBeenCalledWith('There is no entry with id 9', 'error')
        expect(router.currentRoute.value.name).toBe('Vouchers')
    })

    it('shows the other voucher when you move to it, not the one before', async () => {
        const { wrapper, router } = await openVoucher(1, { 1: reversedSale, 2: reversal })

        await router.push('/vouchers/2')
        await flushPromises()

        expect(wrapper.find('h3').text()).toBe('Voucher 2')
        expect(wrapper.find('.reversed-by').exists()).toBe(false)
        expect(wrapper.find('.reverses').exists()).toBe(true)
    })
})
