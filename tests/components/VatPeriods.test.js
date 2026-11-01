import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createStore } from 'vuex'
import { defineComponent, h, ref } from 'vue'
import VatPeriods from '@/views/vat/VatPeriods.vue'
import VatPeriodService from '@/services/VatPeriodService'
import { toast } from '@/utilities/toast'
import { todayIso } from '@/utilities/mydate'

vi.mock('@/services/VatPeriodService', () => ({
    default: { getAll: vi.fn(), settle: vi.fn(), file: vi.fn(), changeDueDate: vi.fn() },
}))
vi.mock('@/utilities/toast', () => ({ toast: vi.fn() }))

const asked = vi.fn()
let answer = true
const PromiseDialog = defineComponent({
    name: 'PromiseDialog',
    setup() {
        const data = ref({})
        const showModal = async () => {
            asked(data.value)
            return answer
        }
        return { data, showModal }
    },
    render: () => null,
})
const page = () => defineComponent({ render: () => h('div') })

// An open period long past, and one settled: the dates are far from today either way
const open = (extra = {}) => ({
    period_type: 'quarter',
    start_date: '2026-04-01',
    end_date: '2026-06-30',
    due_date: '2026-09-01',
    ended: true,
    can_settle: true,
    blocked_by: null,
    ...extra,
})
const settled = (extra = {}) => ({
    id: 5,
    period_type: 'quarter',
    start_date: '2026-01-01',
    end_date: '2026-03-31',
    due_date: '2026-06-01',
    status: 'settled',
    settlement_entry_id: 41,
    settlement_voucher_no: 9,
    filed_on: null,
    filed_by: null,
    reference: null,
    ...extra,
})
const listing = (extra = {}) => ({
    data: { vat_period_type: 'quarter', periods: [settled()], open_period: open(), ...extra },
})

const mountPage = async () => {
    const store = createStore({ getters: { user: () => ({ organizationId: 3 }) } })
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/vat/periods', name: 'VatPeriods', component: VatPeriods },
            { path: '/reports/vat', name: 'VatReport', component: page() },
            { path: '/vouchers/:entryId(\\d+)', name: 'ShowVoucher', component: page(), props: true },
            { path: '/settings/organizations/:id(\\d+)', name: 'Organization', component: page(), props: true },
        ],
    })
    router.push('/vat/periods')
    await router.isReady()
    const wrapper = mount(defineComponent({ render: () => h(RouterView) }), {
        global: {
            plugins: [store, router],
            components: { PromiseDialog },
            stubs: { teleport: true },
        },
    })
    await flushPromises()
    return { router, wrapper }
}

describe('VAT periods', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        answer = true
        VatPeriodService.getAll.mockResolvedValue(listing())
    })

    describe('what it shows', () => {
        it('explains, with a link to the settings, that an organization without VAT has no periods', async () => {
            VatPeriodService.getAll.mockResolvedValue(
                listing({ vat_period_type: null, periods: [], open_period: null }),
            )
            const { wrapper, router } = await mountPage()

            expect(wrapper.find('.not-registered').text()).toContain('not VAT-registered')
            expect(wrapper.find('.open-period').exists()).toBe(false)
            await wrapper.find('.not-registered a').trigger('click')
            await flushPromises()
            expect(router.currentRoute.value.path).toBe('/settings/organizations/3')
        })

        it('shows the open period with its due date and that it has ended', async () => {
            const { wrapper } = await mountPage()

            expect(wrapper.find('.open-period .period').text()).toBe('2026-04-01 to 2026-06-30')
            expect(wrapper.find('.open-period .due').text()).toContain('2026-09-01')
            expect(wrapper.find('.open-period .status').text()).toBe('Ended')
            expect(wrapper.find('.open-period .blocked').exists()).toBe(false)
        })

        it('says that a running period is running, and why it cannot be settled', async () => {
            VatPeriodService.getAll.mockResolvedValue(
                listing({
                    open_period: open({
                        ended: false,
                        can_settle: false,
                        blocked_by: 'The VAT period 2099-01-01 to 2099-03-31 has not ended',
                        due_date: '2099-06-01',
                    }),
                }),
            )
            const { wrapper } = await mountPage()

            expect(wrapper.find('.open-period .status').text()).toBe('Running')
            expect(wrapper.find('.blocked').text()).toContain('has not ended')
            expect(wrapper.find('button.settle').attributes('disabled')).toBeDefined()
            expect(wrapper.find('.open-period .overdue').exists()).toBe(false)
        })

        it('marks an open period that is past its due date', async () => {
            const { wrapper } = await mountPage()

            expect(wrapper.find('.open-period .overdue').exists()).toBe(true)
        })

        it('says there is no open period before something is posted with a code', async () => {
            VatPeriodService.getAll.mockResolvedValue(listing({ periods: [], open_period: null }))
            const { wrapper } = await mountPage()

            expect(wrapper.find('.no-open').text()).toContain('There is no open period yet')
            expect(wrapper.find('button.settle').exists()).toBe(false)
            expect(wrapper.find('table.periods').text()).toContain('No period has been settled yet.')
        })

        it('tells you to check the deadline at skat.dk, which is not coded for holidays', async () => {
            const { wrapper } = await mountPage()

            const link = wrapper.find('.open-period a[href*="skat.dk"]')
            expect(link.attributes('target')).toBe('_blank')
            expect(link.attributes('rel')).toContain('noopener')
        })

        it('lists the settled periods with their voucher, and links the report of each', async () => {
            const { wrapper, router } = await mountPage()

            const row = wrapper.find('tr.period-row')
            expect(row.text()).toContain('2026-01-01 to 2026-03-31')
            expect(row.find('.state').text()).toBe('Settled')
            expect(row.find('.voucher-link').text()).toBe('9')
            expect(row.find('.overdue').exists()).toBe(true) // due 2026-06-01, not filed
            await row.find('.report-link').trigger('click')
            await flushPromises()
            expect(router.currentRoute.value.name).toBe('VatReport')
            expect(router.currentRoute.value.query).toEqual({ from: '2026-01-01', to: '2026-03-31' })
        })

        it('shows a filed period with when and the reference, and no overdue mark', async () => {
            VatPeriodService.getAll.mockResolvedValue(
                listing({ periods: [settled({ status: 'filed', filed_on: '2026-05-30', reference: 'TastSelv 1' })] }),
            )
            const { wrapper } = await mountPage()

            const row = wrapper.find('tr.period-row')
            expect(row.find('.state').text()).toBe('Filed')
            expect(row.find('.filed-on').text()).toBe('2026-05-30, TastSelv 1')
            expect(row.find('.overdue').exists()).toBe(false)
            expect(row.find('button.file').exists()).toBe(false)
            expect(row.find('button.due').exists()).toBe(true)
        })

        it('has no voucher link for a period where nothing was moved', async () => {
            VatPeriodService.getAll.mockResolvedValue(
                listing({ periods: [settled({ settlement_entry_id: null, settlement_voucher_no: null })] }),
            )
            const { wrapper } = await mountPage()

            expect(wrapper.find('.voucher-link').exists()).toBe(false)
        })

        it('says what the load error was', async () => {
            VatPeriodService.getAll.mockRejectedValue({ response: { data: { error: 'No way' } } })
            await mountPage()

            expect(toast).toHaveBeenCalledWith('No way', 'error')
        })
    })

    describe('settling', () => {
        it('asks first, and says what it does', async () => {
            const { wrapper } = await mountPage()

            await wrapper.find('button.settle').trigger('click')
            await flushPromises()

            const [dialog] = asked.mock.calls[0]
            expect(dialog.title).toBe('Settle the VAT period')
            expect(dialog.content).toContain('2026-04-01 to 2026-06-30')
            expect(dialog.content).toContain('cannot be undone')
        })

        it('settles, says which voucher, and loads the periods again', async () => {
            VatPeriodService.settle.mockResolvedValue({ data: { settlement_voucher_no: 12 } })
            const { wrapper } = await mountPage()

            await wrapper.find('button.settle').trigger('click')
            await flushPromises()

            expect(VatPeriodService.settle).toHaveBeenCalledTimes(1)
            expect(toast).toHaveBeenCalledWith('Period settled with voucher 12', 'success')
            expect(VatPeriodService.getAll).toHaveBeenCalledTimes(2)
        })

        it('says when there was no VAT to move', async () => {
            VatPeriodService.settle.mockResolvedValue({ data: { settlement_voucher_no: null } })
            const { wrapper } = await mountPage()

            await wrapper.find('button.settle').trigger('click')
            await flushPromises()

            expect(toast).toHaveBeenCalledWith('Period settled: there was no VAT to move', 'success')
        })

        it('does nothing when you say no', async () => {
            answer = false
            const { wrapper } = await mountPage()

            await wrapper.find('button.settle').trigger('click')
            await flushPromises()

            expect(VatPeriodService.settle).not.toHaveBeenCalled()
        })

        it('says why the server refused, and keeps the period open', async () => {
            VatPeriodService.settle.mockRejectedValue({
                response: { data: { error: 'The VAT report does not agree with the VAT accounts' } },
            })
            const { wrapper } = await mountPage()

            await wrapper.find('button.settle').trigger('click')
            await flushPromises()

            expect(toast).toHaveBeenCalledWith('The VAT report does not agree with the VAT accounts', 'error')
            expect(wrapper.find('button.settle').attributes('disabled')).toBeUndefined()
        })
    })

    describe('filing', () => {
        const openEditor = async (wrapper) => {
            await wrapper.find('tr.period-row button.file').trigger('click')
            return wrapper.find('tr.editor')
        }

        it('opens a form with today as the date', async () => {
            const { wrapper } = await mountPage()

            const editor = await openEditor(wrapper)

            expect(editor.find('.filed-on-input').element.value).toBe(todayIso())
            expect(editor.find('.reference-input').element.value).toBe('')
        })

        it('files with the date and the reference, trimmed, and loads the periods again', async () => {
            VatPeriodService.file.mockResolvedValue({ data: {} })
            const { wrapper } = await mountPage()
            const editor = await openEditor(wrapper)

            await editor.find('.filed-on-input').setValue('2026-05-30')
            await editor.find('.reference-input').setValue('  TastSelv 1  ')
            await editor.find('form').trigger('submit')
            await flushPromises()

            expect(VatPeriodService.file).toHaveBeenCalledWith(5, { filed_on: '2026-05-30', reference: 'TastSelv 1' })
            expect(toast).toHaveBeenCalledWith('Period marked as filed', 'success')
            expect(VatPeriodService.getAll).toHaveBeenCalledTimes(2)
            expect(wrapper.find('tr.editor').exists()).toBe(false)
        })

        it('sends no reference when none was given', async () => {
            VatPeriodService.file.mockResolvedValue({ data: {} })
            const { wrapper } = await mountPage()
            const editor = await openEditor(wrapper)
            await editor.find('.filed-on-input').setValue('2026-05-30')

            await editor.find('form').trigger('submit')
            await flushPromises()

            expect(VatPeriodService.file).toHaveBeenCalledWith(5, { filed_on: '2026-05-30', reference: null })
        })

        it.each([
            ['2026-03-31', 'before the period ends'],
            ['2026-01-15', 'before the period ends'],
            ['2999-01-01', 'in the future'],
            ['', 'Enter a date'],
        ])('does not send the date %j, and says why', async (date, message) => {
            const { wrapper } = await mountPage()
            const editor = await openEditor(wrapper)

            await editor.find('.filed-on-input').setValue(date)
            await editor.find('form').trigger('submit')
            await flushPromises()

            expect(wrapper.find('.editor-error').text()).toContain(message)
            expect(VatPeriodService.file).not.toHaveBeenCalled()
        })

        it('can be cancelled', async () => {
            const { wrapper } = await mountPage()
            const editor = await openEditor(wrapper)

            await editor.find('button.cancel').trigger('click')

            expect(wrapper.find('tr.editor').exists()).toBe(false)
        })

        it('keeps the form open and says why when the server refuses', async () => {
            VatPeriodService.file.mockRejectedValue({ response: { data: { error: 'Already filed' } } })
            const { wrapper } = await mountPage()
            const editor = await openEditor(wrapper)
            await editor.find('.filed-on-input').setValue('2026-05-30')

            await editor.find('form').trigger('submit')
            await flushPromises()

            expect(toast).toHaveBeenCalledWith('Already filed', 'error')
            expect(wrapper.find('tr.editor').exists()).toBe(true)
        })
    })

    describe('the due date', () => {
        it('opens with the due date there is, and changes it', async () => {
            VatPeriodService.changeDueDate.mockResolvedValue({ data: {} })
            const { wrapper } = await mountPage()
            await wrapper.find('tr.period-row button.due').trigger('click')
            const editor = wrapper.find('tr.editor')
            expect(editor.find('.due-input').element.value).toBe('2026-06-01')

            await editor.find('.due-input').setValue('2026-06-02')
            await editor.find('form').trigger('submit')
            await flushPromises()

            expect(VatPeriodService.changeDueDate).toHaveBeenCalledWith(5, '2026-06-02')
            expect(toast).toHaveBeenCalledWith('Due date changed', 'success')
        })

        it('does not send a due date that is not after the period', async () => {
            const { wrapper } = await mountPage()
            await wrapper.find('tr.period-row button.due').trigger('click')
            const editor = wrapper.find('tr.editor')

            await editor.find('.due-input').setValue('2026-03-31')
            await editor.find('form').trigger('submit')
            await flushPromises()

            expect(wrapper.find('.editor-error').text()).toBe('The due date must be after the period ends')
            expect(VatPeriodService.changeDueDate).not.toHaveBeenCalled()
        })

        it('has one form open at a time', async () => {
            VatPeriodService.getAll.mockResolvedValue(
                listing({ periods: [settled(), settled({ id: 4, start_date: '2025-10-01', end_date: '2025-12-31' })] }),
            )
            const { wrapper } = await mountPage()

            await wrapper.findAll('tr.period-row')[0].find('button.due').trigger('click')
            await wrapper.findAll('tr.period-row')[1].find('button.file').trigger('click')

            expect(wrapper.findAll('tr.editor')).toHaveLength(1)
        })
    })
})
