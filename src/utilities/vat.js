// The VAT engine of app/vat_engine.py in the invoicer-api repo, in whole numbers: from the lines of
// a voucher that carry a VAT code to the VAT lines the server adds when it posts them. It lets the
// voucher form show those lines, and balance with them, before anything is posted. The server
// calculates what is saved. The cases in tests/utilities/vat_cases.json are shared with the server:
// change both together. docs/vat-design.md, section 4, has the rules.
//
// For the lines of one voucher that carry the same code:
//   base = the sum of their net amounts, each already rounded
//   VAT  = round(base x rate)           one rounding per code and voucher
//   deductible = round(VAT x deduction) for a purchase
//   non-deductible = VAT - deductible, shared over the lines of the code in proportion to their amounts
// The net amount of a sales line is its credit minus its debit, and of a purchase line its debit
// minus its credit, so a credit note has a negative base and its VAT lands on the opposite side.

import { SCALES, divideRounded, scaled, toNumber } from '@/utilities/money'

export const BASE = 'base'
export const VAT = 'vat'
export const NONDEDUCTIBLE = 'nondeductible'

// The accounts that hold VAT, by role. The server finds them by their role, never by number.
export const OUTPUT_VAT = 'output_vat'
export const INPUT_VAT = 'input_vat'
export const VAT_EU_GOODS = 'vat_eu_goods'
export const VAT_EU_SERVICES = 'vat_eu_services'
export const VAT_ACCOUNT_ROLES = [OUTPUT_VAT, INPUT_VAT, VAT_EU_GOODS, VAT_EU_SERVICES, 'vat_payable', 'vat_receivable']

const SALES = 'sales'
const DIRECTION_ROLE = {
    output: OUTPUT_VAT,
    acquisition_goods: VAT_EU_GOODS,
    acquisition_services: VAT_EU_SERVICES,
}

// Integer division rounded toward minus infinity (BigInt division rounds toward zero)
const floorDivide = (numerator, divisor) => {
    const quotient = numerator / divisor
    return numerator % divisor !== 0n && numerator < 0n ? quotient - 1n : quotient
}

// Share an amount over the weights in proportion, to the cent, so that the shares add up to the
// amount exactly. What is left after rounding down goes to the largest remainders, the first of
// them when they are equal. The shares of a negative amount are those of its positive twin, negated,
// so a credit note divides like the invoice it corrects. All of it in ore (BigInt).
export const allocateOre = (total, weights) => {
    const base = weights.reduce((sum, weight) => sum + weight, 0n)
    if (base === 0n) return weights.map(() => 0n)
    const size = total < 0n ? -total : total
    const divisor = base < 0n ? -base : base
    const numerators = weights.map((weight) => (base < 0n ? -weight : weight) * size)
    const floors = numerators.map((numerator) => floorDivide(numerator, divisor))
    const remainders = numerators.map((numerator, index) => numerator - floors[index] * divisor)
    const left = size - floors.reduce((sum, floor) => sum + floor, 0n)
    const byRemainder = weights
        .map((_weight, index) => index)
        .sort((a, b) => (remainders[a] === remainders[b] ? a - b : remainders[a] > remainders[b] ? -1 : 1))
    for (const index of byRemainder.slice(0, Number(left))) floors[index] += 1n
    return floors.map((floor) => (total < 0n ? -floor : floor))
}

// The same on numbers with 2 decimals: allocate(0.04, [0.1, 0.1, 0.1]) is [0.02, 0.01, 0.01]
export const allocate = (total, weights) =>
    allocateOre(
        scaled(total, SCALES.amount),
        weights.map((weight) => scaled(weight, SCALES.amount)),
    ).map(toNumber)

// [debit, credit] of a signed amount whose positive side is `positive` ('debit' or 'credit')
const side = (amount, positive) => {
    const size = amount < 0n ? -amount : amount
    return amount > 0n === (positive === 'debit') ? [size, 0n] : [0n, size]
}

// The VAT lines of an entry, for the lines that carry a code, grouped by code in the order the codes
// first appear. `lines` are { account_id, debit, credit, rule } with rule = { code, applies_to,
// rate, deduction, direction } as in the list of VAT codes (rates are fractions: 0.25 is 25%).
// Each result is { part, code, role, account_id, debit, credit }: the VAT goes to the account with
// `role`, and the non-deductible part, which has no role, to the `account_id` of its line.
export const vatLines = (lines = []) => {
    const groups = new Map()
    for (const line of lines) {
        if (!groups.has(line.rule.code)) groups.set(line.rule.code, [])
        groups.get(line.rule.code).push(line)
    }

    const posted = []
    const add = (part, code, [debit, credit], role, accountId = null) =>
        posted.push({
            part,
            code,
            role,
            account_id: accountId,
            debit: toNumber(debit),
            credit: toNumber(credit),
        })

    for (const [code, group] of groups) {
        const { rule } = group[0]
        if (rule.direction === 'none' || rule.rate === null || rule.rate === undefined) continue
        const nets = group.map((line) => {
            const debit = scaled(line.debit, SCALES.amount)
            const credit = scaled(line.credit, SCALES.amount)
            return rule.applies_to === SALES ? credit - debit : debit - credit
        })
        const base = nets.reduce((sum, net) => sum + net, 0n)
        const vat = divideRounded(base * scaled(rule.rate, SCALES.rate), 10000n)
        if (vat === 0n) continue

        if (rule.direction === 'output') {
            add(VAT, code, side(vat, 'credit'), OUTPUT_VAT)
            continue
        }

        // A purchase: part of the VAT can be deducted
        const deductible = divideRounded(vat * scaled(rule.deduction ?? 0, SCALES.rate), 10000n)
        if (rule.direction in DIRECTION_ROLE) {
            add(VAT, code, side(vat, 'credit'), DIRECTION_ROLE[rule.direction])
        }
        if (deductible !== 0n) add(VAT, code, side(deductible, 'debit'), INPUT_VAT)
        const nondeductible = vat - deductible
        if (nondeductible !== 0n) {
            const shares = allocateOre(nondeductible, nets)
            group.forEach((line, index) => {
                if (shares[index] !== 0n) add(NONDEDUCTIBLE, code, side(shares[index], 'debit'), null, line.account_id)
            })
        }
    }
    return posted
}
