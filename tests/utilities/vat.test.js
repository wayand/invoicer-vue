import { describe, expect, it } from 'vitest'
import { allocate, vatLines } from '@/utilities/vat'
import cases from './vat_cases.json'

const rules = Object.fromEntries(
    Object.entries(cases.rules).map(([code, rule]) => [
        code,
        {
            code,
            applies_to: rule.applies_to,
            rate: rule.rate === null ? null : Number(rule.rate),
            deduction: rule.deduction === null ? null : Number(rule.deduction),
            direction: rule.direction,
        },
    ]),
)

const netLines = (lines) =>
    lines.map((line) => ({
        account_id: line.account,
        debit: Number(line.debit),
        credit: Number(line.credit),
        rule: rules[line.code],
    }))

const asJson = (posted) =>
    posted.map((item) => ({
        part: item.part,
        code: item.code,
        role: item.role,
        account: item.account_id,
        debit: item.debit.toFixed(2),
        credit: item.credit.toFixed(2),
    }))

describe('vatLines, on the cases shared with the server', () => {
    it.each(cases.cases)('$name', ({ lines, vat_lines }) => {
        expect(asJson(vatLines(netLines(lines)))).toEqual(vat_lines)
    })

    it('covers every direction and a credit note of each', () => {
        const directions = new Set(Object.values(cases.rules).map((rule) => rule.direction))
        expect(directions).toEqual(new Set(['output', 'input', 'acquisition_goods', 'acquisition_services', 'none']))
        expect(cases.cases.filter((item) => item.name.includes('credit note')).length).toBeGreaterThanOrEqual(4)
    })
})

describe('vatLines', () => {
    it('has no VAT without lines', () => {
        expect(vatLines([])).toEqual([])
        expect(vatLines()).toEqual([])
    })

    it('adds nothing for a code that carries no VAT, and nothing for a code without a rate', () => {
        const lines = (code) => [{ account_id: 1, debit: 0, credit: 100, rule: rules[code] }]

        expect(vatLines(lines('S23'))).toEqual([])
        expect(vatLines(lines('S81'))).toEqual([])
    })

    it('reads amounts the way a form gives them: empty fields count as 0', () => {
        const posted = vatLines([{ account_id: 1, debit: '', credit: 1000, rule: rules.S01 }])

        expect(posted.map((item) => [item.role, item.debit, item.credit])).toEqual([['output_vat', 0, 250]])
    })

    it('has no rounding error where floats would: VAT of 0.10 + 0.20', () => {
        // 0.1 + 0.2 is 0.30000000000000004 in floating point, and 25% of it is 0.075 to be rounded half up
        const posted = vatLines([
            { account_id: 1, debit: 0, credit: 0.1, rule: rules.S01 },
            { account_id: 1, debit: 0, credit: 0.2, rule: rules.S01 },
        ])

        expect(posted.map((item) => item.credit)).toEqual([0.08])
    })
})

describe('allocate', () => {
    it.each([
        [0.04, [0.1, 0.1, 0.1], [0.02, 0.01, 0.01]],
        [56.25, [100, 200], [18.75, 37.5]],
        [0.01, [1, 1], [0.01, 0]],
        [10, [3, 3, 3], [3.34, 3.33, 3.33]],
        // The share of a negative amount is the positive one, negated
        [-0.04, [0.1, 0.1, 0.1], [-0.02, -0.01, -0.01]],
        [-0.04, [-0.1, -0.1, -0.1], [-0.02, -0.01, -0.01]],
        [5, [0, 0], [0, 0]],
        [0, [1, 2], [0, 0]],
    ])('shares %s over %j in proportion, to the cent: %j', (total, weights, expected) => {
        expect(allocate(total, weights)).toEqual(expected)
    })

    // A small seeded generator, so a failure can be repeated
    const generator = (seed) => () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296
        return seed / 4294967296
    }

    it.each(Array.from({ length: 100 }, (_, seed) => seed))(
        'always adds the shares up to the amount, within a cent of the exact share (seed %i)',
        (seed) => {
            const random = generator(seed + 1)
            const count = 1 + Math.floor(random() * 7)
            const weights = Array.from({ length: count }, () => (1 + Math.floor(random() * 100000)) / 100)
            const total = (Math.floor(random() * 200001) - 100000) / 100

            const shares = allocate(total, weights)

            const sum = shares.reduce((acc, share) => acc + Math.round(share * 100), 0)
            expect(sum).toBe(Math.round(total * 100))
            const weightSum = weights.reduce((acc, weight) => acc + weight, 0)
            shares.forEach((share, index) => {
                expect(Math.abs(share - (total * weights[index]) / weightSum)).toBeLessThan(0.0101)
            })
        },
    )
})
