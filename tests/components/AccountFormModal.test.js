import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import AccountFormModal from '@/components/account/AccountFormModal.vue'
import account from '@/store/modules/account'
import vatcode from '@/store/modules/vatcode'
import AccountService from '@/services/AccountService'

// Network-bound modules the form imports but this test does not use
vi.mock('@/services/AccountService', () => ({
    default: { getAccountGroups: vi.fn(), getOne: vi.fn(), update: vi.fn(), create: vi.fn(), getAll: vi.fn() },
}))
vi.mock('@/services/VatCodeService', () => ({ default: { getAll: vi.fn() } }))
vi.mock('@/utilities/toast', () => ({ toast: vi.fn() }))

const vatCodes = [
    { id: 1, code: 'S01', title: 'Momspligtige salg (DK), 25% moms', applies_to: 'sales', is_supported: true },
    {
        id: 24,
        code: 'K010',
        title: 'Indgående moms (DK), fuld fradrag (100%)',
        applies_to: 'purchases',
        is_supported: true,
    },
    { id: 30, code: 'K050', title: 'Delvist fradrag', applies_to: 'purchases', is_supported: false },
]
const saved = {
    id: 15,
    organization_id: 1,
    account_type_id: 2,
    account_group_id: 4,
    default_vat_code_id: 24,
    name: 'Annoncering og reklame',
    description: 'Advertising costs',
    number: 1850,
    currency_id: 'DKK',
    is_bank_account: false,
    is_payment_enabled: false,
    is_archived: false,
}

const openForm = async () => {
    const store = createStore({
        modules: {
            account: { ...account, state: () => ({ accounts: [], account: {}, accountGroups: [] }) },
            vatcode: { ...vatcode, state: () => ({ vatCodes: [] }) },
        },
        getters: { user: () => ({ organizationId: 1 }) },
    })
    const wrapper = mount(AccountFormModal, { props: { accountId: 15 }, global: { plugins: [store] } })
    await flushPromises()
    return { store, wrapper }
}

describe('account form, default VAT code', () => {
    beforeEach(async () => {
        vi.clearAllMocks()
        AccountService.getAccountGroups.mockResolvedValue({
            data: [{ id: 4, name: 'Salgsomkostninger', account_type_id: 2 }],
        })
        AccountService.getOne.mockResolvedValue({ data: structuredClone(saved) })
        AccountService.update.mockResolvedValue({ data: structuredClone(saved) })
        const VatCodeService = (await import('@/services/VatCodeService')).default
        VatCodeService.getAll.mockResolvedValue({ data: vatCodes })
    })

    const vatSelect = (wrapper) => wrapper.findAll('select').find((select) => select.text().includes('K010'))

    it('offers the supported VAT codes, sales and purchases, and not the ones that cannot be used yet', async () => {
        const { wrapper } = await openForm()

        const options = vatSelect(wrapper)
            .findAll('option')
            .map((option) => option.text())
        expect(options).toEqual([
            'Select Default VAT code',
            'S01 Momspligtige salg (DK), 25% moms',
            'K010 Indgående moms (DK), fuld fradrag (100%)',
        ])
    })

    it('shows the default code the account has', async () => {
        const { wrapper } = await openForm()

        expect(vatSelect(wrapper).element.value).toBe('24')
    })

    it('saves the code that was chosen', async () => {
        const { wrapper } = await openForm()

        await vatSelect(wrapper).setValue('1')
        await wrapper.find('form').trigger('submit')
        await flushPromises()

        expect(AccountService.update.mock.calls[0][0]).toMatchObject({ id: 15, default_vat_code_id: 1 })
    })

    it('saves no code as null, which the API takes', async () => {
        const { wrapper } = await openForm()

        await vatSelect(wrapper).setValue('0')
        await wrapper.find('form').trigger('submit')
        await flushPromises()

        expect(AccountService.update.mock.calls[0][0].default_vat_code_id).toBeNull()
    })
})
