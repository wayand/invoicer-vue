import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import InvoiceSetting from '@/views/settings/InvoiceSetting.vue'
import organization from '@/store/modules/organization'
import OrganizationService from '@/services/OrganizationService'

// Network-bound modules the page imports but this test does not use
vi.mock('@/services/OrganizationService', () => ({
    default: { getOne: vi.fn(), getAll: vi.fn(), update: vi.fn(), updateInvoiceSetting: vi.fn() },
}))
vi.mock('@/utilities/toast', () => ({ toast: vi.fn() }))

// The settings as the API returns them
const settings = {
    id: 1,
    default_account_id: 3,
    default_deposit_account_id: 1,
    invoice_no_mode: 'manual',
    next_invoice_no: 5,
    default_reminder_fee: 0,
    lines_incl_vat: false,
    hide_product_numbers: false,
}
const accounts = [
    { id: 1, name: 'Bank' },
    { id: 3, name: 'Sales' },
]

const openPage = async (overrides = {}) => {
    const org = { id: 1, invoice_setting: { ...settings, ...overrides } }
    OrganizationService.getOne.mockResolvedValue({ data: org })
    OrganizationService.updateInvoiceSetting.mockImplementation(async (sent) => ({ data: sent }))
    const store = createStore({
        modules: { organization: { ...organization, state: () => ({ organizations: [], organization: org }) } },
        getters: {
            user: () => ({ organizationId: 1 }),
            accounts: () => accounts,
            depositAccounts: () => [accounts[0]],
        },
        actions: { fetchAccounts: () => {} },
    })
    const wrapper = mount(InvoiceSetting, {
        global: { plugins: [store], stubs: { SettingsNavigation: true } },
    })
    await flushPromises()
    return wrapper
}

const feeInput = (wrapper) => wrapper.find('input[placeholder="Reminder fee"]')
const save = async (wrapper) => {
    await wrapper.find('form').trigger('submit')
    await flushPromises()
}

describe('invoice setting, reminder fee', () => {
    beforeEach(() => vi.clearAllMocks())

    it('shows a stored fee of 0 without an error', async () => {
        const wrapper = await openPage({ default_reminder_fee: 0 })

        expect(feeInput(wrapper).element.value).toBe('0')
        expect(wrapper.findAll('.is-invalid')).toHaveLength(0)
    })

    it('saves a stored fee of 0', async () => {
        const wrapper = await openPage({ default_reminder_fee: 0 })

        await save(wrapper)

        expect(wrapper.findAll('.is-invalid')).toHaveLength(0)
        expect(OrganizationService.updateInvoiceSetting).toHaveBeenCalledTimes(1)
        expect(OrganizationService.updateInvoiceSetting.mock.calls[0][0].default_reminder_fee).toBe(0)
    })

    it('saves a fee of 0 that is typed in', async () => {
        const wrapper = await openPage({ default_reminder_fee: 50 })

        await feeInput(wrapper).setValue('0')
        await save(wrapper)

        expect(OrganizationService.updateInvoiceSetting).toHaveBeenCalledTimes(1)
        expect(OrganizationService.updateInvoiceSetting.mock.calls[0][0].default_reminder_fee).toBe(0)
    })

    it('saves any other fee', async () => {
        const wrapper = await openPage({ default_reminder_fee: 0 })

        await feeInput(wrapper).setValue('50')
        await save(wrapper)

        expect(OrganizationService.updateInvoiceSetting.mock.calls[0][0].default_reminder_fee).toBe(50)
    })

    it('still needs a fee: an empty one is refused', async () => {
        const wrapper = await openPage({ default_reminder_fee: 50 })

        await feeInput(wrapper).setValue('')
        await save(wrapper)

        expect(wrapper.text()).toContain('This field is required')
        expect(OrganizationService.updateInvoiceSetting).not.toHaveBeenCalled()
    })

    it('still needs a number: text is refused', async () => {
        const wrapper = await openPage({ default_reminder_fee: 50 })

        await feeInput(wrapper).setValue('abc')
        await save(wrapper)

        expect(wrapper.text()).toContain('The field must only have numbers')
        expect(OrganizationService.updateInvoiceSetting).not.toHaveBeenCalled()
    })
})

describe('invoice setting, account selection', () => {
    beforeEach(() => vi.clearAllMocks())

    // 0 means "Select Payment account" in the dropdown, so it must stay refused
    it('refuses to save while no payment account is selected', async () => {
        const wrapper = await openPage({ default_deposit_account_id: 0, default_reminder_fee: 50 })

        await save(wrapper)

        expect(wrapper.findAll('.is-invalid')).toHaveLength(1)
        expect(OrganizationService.updateInvoiceSetting).not.toHaveBeenCalled()
    })

    it('refuses to save while no sales account is selected', async () => {
        const wrapper = await openPage({ default_account_id: 0, default_reminder_fee: 50 })

        await save(wrapper)

        expect(wrapper.findAll('.is-invalid')).toHaveLength(1)
        expect(OrganizationService.updateInvoiceSetting).not.toHaveBeenCalled()
    })
})
