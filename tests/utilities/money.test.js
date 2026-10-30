import { describe, expect, it } from 'vitest'
import { invoiceTotals, lineAmount, ratePercent, roundAmount, voucherTotals } from '@/utilities/money'
import cases from './money_cases.json'

const money = (value) => value.toFixed(2)

describe('invoiceTotals, on the cases shared with the server', () => {
    it.each(cases.cases)('$name', ({ lines, rate, line_amounts, amount, vat_amount, gross_amount }) => {
        const totals = invoiceTotals(
            lines.map(([quantity, unit_price]) => ({ quantity: Number(quantity), unit_price: Number(unit_price) })),
            Number(rate),
        )

        expect(totals.lines.map(money)).toEqual(line_amounts)
        expect(money(totals.amount)).toBe(amount)
        expect(money(totals.vat_amount)).toBe(vat_amount)
        expect(money(totals.gross_amount)).toBe(gross_amount)
    })
})

describe('lineAmount', () => {
    it('rounds half up where a float multiplication rounds down', () => {
        expect(1.005 * 100).not.toBe(100.5) // the trap: 100.49999999999999
        expect(lineAmount(1, 1.005)).toBe(1.01)
        expect(lineAmount(100, 1.005)).toBe(100.5)
    })

    it('rounds half away from zero for negative amounts', () => {
        expect(lineAmount(1, -2.675)).toBe(-2.68)
    })

    it('does not turn a tiny negative amount into negative zero', () => {
        expect(Object.is(lineAmount(1, -0.001), 0)).toBe(true)
    })

    it('reads very small numbers that JavaScript writes with an exponent', () => {
        expect(lineAmount(1, 1e-7)).toBe(0)
        expect(lineAmount(1e21, 1)).toBeGreaterThan(1e20) // far over what the server accepts, but no crash
    })

    it('counts an emptied input, which a number field gives as an empty string, as 0', () => {
        expect(lineAmount('', 100)).toBe(0)
        expect(lineAmount(2, undefined)).toBe(0)
        expect(lineAmount(NaN, 100)).toBe(0)
    })
})

describe('invoiceTotals', () => {
    it('has no VAT when there is no rate yet', () => {
        const totals = invoiceTotals([{ quantity: 2, unit_price: 50 }], null)

        expect(totals).toEqual({ lines: [100], amount: 100, vat_amount: 0, gross_amount: 100 })
    })
})

describe('ratePercent', () => {
    it.each([
        [0.25, 25],
        [0.0625, 6.25],
        [0, 0],
        [1, 100],
    ])('%s is %s percent', (rate, percent) => {
        expect(ratePercent(rate)).toBe(percent)
    })
})

describe('roundAmount', () => {
    it('rounds half up to 2 decimals, as the server does', () => {
        expect(roundAmount(1.005)).toBe(1.01)
        expect(roundAmount(10.004)).toBe(10)
        expect(roundAmount(125)).toBe(125)
    })

    it('counts an empty field as 0', () => {
        expect(roundAmount('')).toBe(0)
        expect(roundAmount(undefined)).toBe(0)
    })
})

describe('voucherTotals', () => {
    it('adds up the debits and the credits and gives the difference', () => {
        const totals = voucherTotals([
            { debit: 125, credit: '' },
            { debit: '', credit: 100 },
            { debit: '', credit: 25 },
        ])

        expect(totals).toEqual({ debit: 125, credit: 125, difference: 0 })
    })

    it('has no rounding error where floats would: 0.1 + 0.2 against 0.3', () => {
        expect(0.1 + 0.2 - 0.3).not.toBe(0)

        const totals = voucherTotals([{ debit: 0.1 }, { debit: 0.2 }, { credit: 0.3 }])

        expect(totals.difference).toBe(0)
    })

    it('rounds each amount before adding, as the server does', () => {
        // 0.005 + 0.005 is 0.01 + 0.01 for the server, not 0.01
        const totals = voucherTotals([{ debit: 0.005 }, { debit: 0.005 }, { credit: 0.01 }])

        expect(totals).toEqual({ debit: 0.02, credit: 0.01, difference: 0.01 })
    })

    it('shows the difference of an unbalanced voucher, in either direction', () => {
        expect(voucherTotals([{ debit: 100 }, { credit: 99.99 }]).difference).toBe(0.01)
        expect(voucherTotals([{ debit: 99.99 }, { credit: 100 }]).difference).toBe(-0.01)
    })

    it('is all zero without lines', () => {
        expect(voucherTotals()).toEqual({ debit: 0, credit: 0, difference: 0 })
        expect(voucherTotals([])).toEqual({ debit: 0, credit: 0, difference: 0 })
    })
})
