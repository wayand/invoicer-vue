import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HTTP } from '@/services/http'
import OrganizationService from '@/services/OrganizationService'

// The real client reads its address from the hostname and builds the router and the store
vi.mock('@/services/http', () => ({ HTTP: { put: vi.fn() } }))

const organization = {
    id: 1,
    name: 'Demo ApS',
    slug: 'demo-aps',
    vat_period_type: 'quarter',
    country: { id: 1 },
    users: [],
    invoice_setting: {},
    created_at: 'x',
    updated_at: 'y',
}

describe('OrganizationService.update', () => {
    beforeEach(() => vi.clearAllMocks())

    it('does not send what the API only returns', () => {
        OrganizationService.update(structuredClone(organization))

        const [url, body] = HTTP.put.mock.calls[0]
        expect(url).toBe('/organizations/1')
        for (const field of ['id', 'country', 'users', 'invoice_setting', 'created_at', 'updated_at']) {
            expect(body).not.toHaveProperty(field)
        }
    })

    it.each(['month', 'quarter', 'half_year'])('sends the VAT period %s as it is', (period) => {
        OrganizationService.update({ ...organization, vat_period_type: period })

        expect(HTTP.put.mock.calls[0][1].vat_period_type).toBe(period)
    })

    it('sends null for an organization that is not VAT-registered, which the form keeps as empty text', () => {
        OrganizationService.update({ ...organization, vat_period_type: '' })

        expect(HTTP.put.mock.calls[0][1].vat_period_type).toBeNull()
    })

    it('leaves an organization that never had a VAT period alone', () => {
        const { vat_period_type, ...without } = organization // eslint-disable-line no-unused-vars

        OrganizationService.update(without)

        expect(HTTP.put.mock.calls[0][1]).not.toHaveProperty('vat_period_type')
    })
})
