// The money rules of docs/money-rules.md in the invoicer-api repo, in whole numbers.
// JavaScript floats cannot do this: 1.005 * 100 is 100.49999999999999, so the
// numbers are turned into scaled integers (BigInt) before anything is multiplied.
// The server calculates the saved amounts. This gives the same answer while the
// invoice is being edited. The cases in tests/utilities/money_cases.json are shared
// with the server: change both together.

const SCALES = { amount: 100n, quantity: 1000n, price: 1000n, rate: 10000n }

// Integer division, half up, away from zero (the server's ROUND_HALF_UP)
const divideRounded = (numerator, divisor) => {
    const negative = numerator < 0n
    const size = negative ? -numerator : numerator
    const rounded = (2n * size + divisor) / (2n * divisor)
    return negative ? -rounded : rounded
}

// A number as an integer count of 1/scale units (3 decimals: 1.005 -> 1005n), rounded half up.
// Anything that is not a finite number (an emptied input gives '') counts as 0.
const scaled = (value, scale) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 0n
    if (Number.isInteger(value)) return BigInt(value) * scale
    // String() is the shortest text that gives the same number back: 0.335 -> '0.335'.
    // Very small numbers come back as '1e-7', which toFixed writes out.
    const text = String(value).includes('e') ? value.toFixed(20) : String(value)
    const negative = text.startsWith('-')
    const [whole, fraction = ''] = (negative ? text.slice(1) : text).split('.')
    const digits = scale.toString().length - 1
    const kept = BigInt(whole + fraction.slice(0, digits).padEnd(digits, '0'))
    const rest = fraction.slice(digits)
    const up = rest !== '' && rest[0] >= '5' ? 1n : 0n
    return negative ? -(kept + up) : kept + up
}

const toNumber = (ore) => Number(ore) / 100

// quantity x unit price, rounded to 2 decimals
export const lineAmount = (quantity, unitPrice) =>
    toNumber(divideRounded(scaled(quantity, SCALES.quantity) * scaled(unitPrice, SCALES.price), 10000n))

// The totals of an invoice: every line is rounded, the net total is the sum of the lines,
// and VAT is calculated once on the net total. `vatRate` is a fraction (0.25 is 25%).
// Without lines (the invoice is still loading) or a rate (none known yet) the amounts are 0.
export const invoiceTotals = (lines = [], vatRate = null) => {
    const lineOre = lines.map((line) =>
        divideRounded(scaled(line.quantity, SCALES.quantity) * scaled(line.unit_price, SCALES.price), 10000n),
    )
    const net = lineOre.reduce((sum, ore) => sum + ore, 0n)
    const vat = divideRounded(net * scaled(vatRate, SCALES.rate), 10000n)
    return {
        lines: lineOre.map(toNumber),
        amount: toNumber(net),
        vat_amount: toNumber(vat),
        gross_amount: toNumber(net + vat),
    }
}

// A VAT rate as a percentage for a label: 0.25 -> 25, 0.0625 -> 6.25
export const ratePercent = (rate) => Number(scaled(rate, SCALES.rate)) / 100

// An amount of a voucher line, rounded to 2 decimals half up as the server does
export const roundAmount = (value) => toNumber(scaled(value, SCALES.amount))

// The debit and credit of the lines of a voucher, and the difference between them. Each
// amount is rounded to 2 decimals as the server does before they are added, and the sums are
// whole numbers, so 0.10 + 0.20 against 0.30 is a difference of exactly 0.
export const voucherTotals = (lines = []) => {
    const sum = (key) => lines.reduce((total, line) => total + scaled(line[key], SCALES.amount), 0n)
    const debit = sum('debit')
    const credit = sum('credit')
    return { debit: toNumber(debit), credit: toNumber(credit), difference: toNumber(debit - credit) }
}

// A balance from the reports is debit minus credit: debit positive, credit negative. On an
// account whose normal side is credit (sales, VAT owed, equity) that reads backwards, so it is
// turned round: income shows as a positive number, and a negative one is on the other side.
export const normalBalanceAmount = (balance, normalBalance) => (normalBalance === 'credit' ? 0 - balance : balance)
