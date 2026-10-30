import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createStore } from 'vuex'
import { defineComponent, h, ref } from 'vue'
import VoucherList from '@/views/voucher/VoucherList.vue'
import journal from '@/store/modules/journal'
import JournalService from '@/services/JournalService'
import { toast } from '@/utilities/toast'

vi.mock('@/services/JournalService', () => ({
    default: { getAll: vi.fn(), getOne: vi.fn(), create: vi.fn(), reverse: vi.fn() },
}))
vi.mock('@/utilities/toast', () => ({ toast: vi.fn() }))

const lines = (amount) => [
    { id: 1, debit: amount, credit: 0 },
    { id: 2, debit: 0, credit: amount },
]
const entry = (id, extra = {}) => ({
    id,
    voucher_no: id,
    entry_date: '2026-03-01',
    description: `Voucher ${id}`,
    reverses_entry_id: null,
    reversed_by_entry_id: null,
    lines: lines(100),
    ...extra,
})
const threeVouchers = () => [
    entry(3, { description: 'Reversal of voucher 1: Voucher 1', reverses_entry_id: 1, lines: lines(125) }),
    entry(2, { lines: lines(40.5) }),
    entry(1, { reversed_by_entry_id: 3, lines: lines(125) }),
]

// The dialog asked before a reversal; the test decides the answer
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

const openList = async () => {
    const store = createStore({
        modules: { journal: { ...journal, state: () => ({ journalEntries: [], journalEntry: null }) } },
    })
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/vouchers', name: 'Vouchers', component: VoucherList },
            { path: '/vouchers/new', name: 'NewVoucher', component: page() },
            { path: '/vouchers/:entryId(\\d+)', name: 'ShowVoucher', component: page(), props: true },
        ],
    })
    router.push('/vouchers')
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

const rows = (wrapper) => wrapper.findAll('tr.voucher')

describe('voucher list', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        answer = true
        JournalService.getAll.mockResolvedValue({ data: threeVouchers() })
    })

    it('loads the first page', async () => {
        await openList()

        expect(JournalService.getAll).toHaveBeenCalledWith({ limit: 50, offset: 0 })
    })

    it('lists the vouchers as the API gave them, newest first, with the amount', async () => {
        const { wrapper } = await openList()

        expect(wrapper.find('.card-header .badge').text()).toBe('3')
        expect(
            rows(wrapper).map((row) =>
                row
                    .findAll('td')
                    .slice(0, 4)
                    .map((cell) => cell.text()),
            ),
        ).toEqual([
            ['3', '2026-03-01', 'Reversal of voucher 1: Voucher 1', '125.00'],
            ['2', '2026-03-01', 'Voucher 2', '40.50'],
            ['1', '2026-03-01', 'Voucher 1', '125.00'],
        ])
    })

    it('marks a reversed voucher and a reversal', async () => {
        const { wrapper } = await openList()

        expect(rows(wrapper)[0].find('.badge').text()).toBe('Reversal')
        expect(rows(wrapper)[1].find('.badge').exists()).toBe(false)
        expect(rows(wrapper)[2].find('.badge').text()).toBe('Reversed')
    })

    it('offers to reverse only a voucher that is neither reversed nor a reversal', async () => {
        const { wrapper } = await openList()

        expect(rows(wrapper).map((row) => row.find('button.reverse').exists())).toEqual([false, true, false])
    })

    it('says so when there are no vouchers', async () => {
        JournalService.getAll.mockResolvedValue({ data: [] })

        const { wrapper } = await openList()

        expect(wrapper.text()).toContain('No vouchers yet')
        expect(wrapper.find('button.show-more').exists()).toBe(false)
    })

    it('says why when the list cannot be loaded', async () => {
        JournalService.getAll.mockRejectedValue({ response: { data: { error: 'Something broke' } } })

        await openList()

        expect(toast).toHaveBeenCalledWith('Something broke', 'error')
    })

    it('opens a voucher when its row is clicked', async () => {
        const { wrapper, router } = await openList()

        await rows(wrapper)[1].trigger('click')
        await flushPromises()

        expect(router.currentRoute.value.name).toBe('ShowVoucher')
        expect(router.currentRoute.value.params.entryId).toBe('2')
    })

    describe('reversing', () => {
        it('asks, posts the reversal and shows it first, with the original marked', async () => {
            JournalService.reverse.mockResolvedValue({
                data: entry(4, { reverses_entry_id: 2, lines: lines(40.5) }),
            })
            const { wrapper, router } = await openList()

            await rows(wrapper)[1].find('button.reverse').trigger('click')
            await flushPromises()

            expect(asked).toHaveBeenCalledWith('Reverse voucher 2?')
            expect(JournalService.reverse).toHaveBeenCalledWith(2, {})
            expect(rows(wrapper).map((row) => row.findAll('td')[0].text())).toEqual(['4', '3', '2', '1'])
            expect(rows(wrapper)[2].find('.badge').text()).toBe('Reversed')
            expect(rows(wrapper)[0].find('.badge').text()).toBe('Reversal')
            expect(toast).toHaveBeenCalledWith('Voucher 2 reversed by voucher 4', 'success')
            // the click on the button is not a click on the row
            expect(router.currentRoute.value.name).toBe('Vouchers')
        })

        it('posts nothing when you say no', async () => {
            answer = false
            const { wrapper } = await openList()

            await rows(wrapper)[1].find('button.reverse').trigger('click')
            await flushPromises()

            expect(asked).toHaveBeenCalled()
            expect(JournalService.reverse).not.toHaveBeenCalled()
            expect(rows(wrapper)).toHaveLength(3)
        })

        it('says why when the server refuses, and leaves the list as it was', async () => {
            JournalService.reverse.mockRejectedValue({
                response: { data: { error: 'Voucher 2 is already reversed by voucher 5' } },
            })
            const { wrapper } = await openList()

            await rows(wrapper)[1].find('button.reverse').trigger('click')
            await flushPromises()

            expect(toast).toHaveBeenCalledWith('Voucher 2 is already reversed by voucher 5', 'error')
            expect(rows(wrapper)).toHaveLength(3)
            expect(rows(wrapper)[1].find('button.reverse').exists()).toBe(true)
        })
    })

    describe('more pages', () => {
        const page50 = (from) => Array.from({ length: 50 }, (_, i) => entry(from - i))

        it('has no button when a page is not full', async () => {
            const { wrapper } = await openList()

            expect(wrapper.find('button.show-more').exists()).toBe(false)
        })

        it('shows more, after the ones already there, until a page is not full', async () => {
            JournalService.getAll
                .mockResolvedValueOnce({ data: page50(120) })
                .mockResolvedValueOnce({ data: [entry(70), entry(69)] })
            const { wrapper } = await openList()
            expect(rows(wrapper)).toHaveLength(50)

            await wrapper.find('button.show-more').trigger('click')
            await flushPromises()

            expect(JournalService.getAll).toHaveBeenLastCalledWith({ limit: 50, offset: 50 })
            expect(rows(wrapper)).toHaveLength(52)
            expect(rows(wrapper)[51].findAll('td')[0].text()).toBe('69')
            expect(wrapper.find('button.show-more').exists()).toBe(false)
        })
    })
})
