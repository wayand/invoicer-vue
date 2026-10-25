import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HTTP } from '@/services/http'
import InvoiceService from '@/services/InvoiceService'

// The real client reads its address from the hostname and builds the router and the store
vi.mock('@/services/http', () => ({ HTTP: { post: vi.fn(), put: vi.fn() } }))

// An invoice as the form holds it: what the API returned, plus edits
const invoice = {
    id: 2,
    organization_id: 1,
    contact_id: 5,
    contact: { id: 5, name: 'Acme ApS' },
    invoice_no: '1001',
    state: 'draft',
    template_id: '1',
    excluding_vat: true,
    amount: 300,
    vat_amount: 75,
    gross_amount: 375,
    created_at: 'x',
    updated_at: 'y',
    lines: [
        {
            id: 11,
            invoice_id: 2,
            product_id: 1,
            description: 'Job',
            quantity: 3,
            unit_price: 100,
            amount: 300,
            created_at: 'x',
            updated_at: 'y',
        },
    ],
}

const sentAmounts = (body) => [
    body.amount,
    body.vat_amount,
    body.gross_amount,
    body.excluding_vat,
    ...body.lines.map((line) => line.amount),
]

describe('InvoiceService, the amounts', () => {
    beforeEach(() => vi.clearAllMocks())

    it('does not send any amount when updating: the server calculates them', () => {
        InvoiceService.update(1, structuredClone(invoice))

        const [url, body] = HTTP.put.mock.calls[0]
        expect(url).toBe('/organizations/1/invoices/2')
        expect(sentAmounts(body)).toEqual([undefined, undefined, undefined, undefined, undefined])
        expect(body.lines).toEqual([
            { id: 11, invoice_id: 2, product_id: 1, description: 'Job', quantity: 3, unit_price: 100 },
        ])
        expect(body).toMatchObject({ contact_id: 5, invoice_no: '1001', template_id: '1' })
        expect(body.contact).toBeUndefined()
        expect(body.created_at).toBeUndefined()
    })

    it('does not send any amount when creating', () => {
        // eslint-disable-next-line no-unused-vars
        const { id, contact, created_at, updated_at, ...fresh } = structuredClone(invoice)
        fresh.lines = [{ product_id: 1, description: 'Job', quantity: 3, unit_price: 100, amount: 300 }]

        InvoiceService.create(1, fresh)

        const [url, body] = HTTP.post.mock.calls[0]
        expect(url).toBe('/organizations/1/invoices')
        expect(sentAmounts(body)).toEqual([undefined, undefined, undefined, undefined, undefined])
        expect(body.lines).toEqual([{ product_id: 1, description: 'Job', quantity: 3, unit_price: 100 }])
    })
})
