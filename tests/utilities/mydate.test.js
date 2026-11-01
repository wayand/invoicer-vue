import { describe, expect, it } from 'vitest'
import { previousQuarterRange, quarterRange, todayIso, yearRange } from '@/utilities/mydate'

describe('todayIso', () => {
    it('is the local date as yyyy-mm-dd, with the zeros', () => {
        expect(todayIso(new Date(2026, 0, 5, 10, 0))).toBe('2026-01-05')
        expect(todayIso(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31')
    })

    it('is the date on the wall, not the UTC date, late in the evening', () => {
        // 00:30 local on the 1st is still the 31st in UTC for anyone ahead of UTC
        expect(todayIso(new Date(2026, 2, 1, 0, 30))).toBe('2026-03-01')
    })
})

describe('yearRange', () => {
    it('is the first and the last day of the year', () => {
        expect(yearRange(2026)).toEqual({ from: '2026-01-01', to: '2026-12-31' })
    })
})

describe('quarterRange', () => {
    it.each([
        [new Date(2026, 0, 1), '2026-01-01', '2026-03-31'],
        [new Date(2026, 2, 31), '2026-01-01', '2026-03-31'],
        [new Date(2026, 3, 1), '2026-04-01', '2026-06-30'],
        [new Date(2026, 7, 15), '2026-07-01', '2026-09-30'],
        [new Date(2026, 11, 31), '2026-10-01', '2026-12-31'],
        [new Date(2028, 1, 10), '2028-01-01', '2028-03-31'],
    ])('the quarter of %s is %s to %s', (day, from, to) => {
        expect(quarterRange(day)).toEqual({ from, to })
    })
})

describe('previousQuarterRange', () => {
    it.each([
        [new Date(2026, 4, 5), '2026-01-01', '2026-03-31'],
        [new Date(2026, 9, 1), '2026-07-01', '2026-09-30'],
        // The one before the first quarter is the last quarter of the year before
        [new Date(2026, 1, 20), '2025-10-01', '2025-12-31'],
    ])('the quarter before %s is %s to %s', (day, from, to) => {
        expect(previousQuarterRange(day)).toEqual({ from, to })
    })
})
