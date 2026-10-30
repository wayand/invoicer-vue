import { describe, expect, it } from 'vitest'
import { todayIso } from '@/utilities/mydate'

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
