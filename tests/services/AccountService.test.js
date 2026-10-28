import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HTTP } from '@/services/http'
import AccountService from '@/services/AccountService'

// The real client reads its address from the hostname and builds the router and the store
vi.mock('@/services/http', () => ({ HTTP: { put: vi.fn() } }))

// An account as the API returns it
const account = {
    id: 7,
    organization_id: 1,
    account_type_id: 2,
    account_group_id: 9,
    tax_rate_id: null,
    name: 'Bankkonto',
    number: 6480,
    description: '',
    currency_id: 'DKK',
    is_bank_account: true,
    standard_account: 6480,
    system_role: 'bank',
    account_type: { id: 2, name: 'Asset' },
    account_group: { id: 9, name: 'Likvide beholdninger' },
    tax_rate: null,
    created_at: 'x',
    updated_at: 'y',
}

describe('AccountService.update', () => {
    beforeEach(() => vi.clearAllMocks())

    it('does not send what the API only returns, which it would refuse', () => {
        AccountService.update(structuredClone(account))

        const [url, body] = HTTP.put.mock.calls[0]
        expect(url).toBe('/accounts/7')
        for (const field of [
            'id',
            'account_type',
            'account_group',
            'tax_rate',
            'standard_account',
            'system_role',
            'created_at',
            'updated_at',
        ]) {
            expect(body).not.toHaveProperty(field)
        }
    })

    it('sends the fields that can be changed', () => {
        AccountService.update(structuredClone(account))

        expect(HTTP.put.mock.calls[0][1]).toMatchObject({
            name: 'Bankkonto',
            number: 6480,
            account_type_id: 2,
            account_group_id: 9,
            is_bank_account: true,
        })
    })
})
