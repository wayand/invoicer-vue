import { afterEach, describe, expect, it, vi } from 'vitest'
import { jwtDecrypt, tokenAlive } from '@/services/jwtHelper'

// A token has the form header.payload.signature, each part base64url
const base64url = (value) =>
    Buffer.from(value, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const tokenWith = (payload) => `${base64url('{"alg":"HS256"}')}.${base64url(JSON.stringify(payload))}.signature`

describe('jwtDecrypt', () => {
    it('reads the payload of a token', () => {
        const payload = { sub: 'demo@example.com', organizationId: 1, isTwoFactorAuth: true }

        expect(jwtDecrypt(tokenWith(payload))).toEqual(payload)
    })

    it('keeps non-ASCII characters in names intact', () => {
        const payload = { name: 'Søren Ærø Åkesson' }

        expect(jwtDecrypt(tokenWith(payload)).name).toBe('Søren Ærø Åkesson')
    })

    it('handles the URL-safe alphabet (- and _) that base64 would write as + and /', () => {
        const payload = { note: '???>>>~~~' } // encodes with characters that differ between the two alphabets

        expect(base64url(JSON.stringify(payload))).toMatch(/[-_]/)
        expect(jwtDecrypt(tokenWith(payload))).toEqual(payload)
    })
})

describe('tokenAlive', () => {
    afterEach(() => vi.useRealTimers())

    it('is true before the expiry and false from the second it passes', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
        const exp = Date.parse('2026-01-01T12:00:00Z') / 1000

        expect(tokenAlive(exp + 1)).toBe(true)
        expect(tokenAlive(exp)).toBe(false)
        expect(tokenAlive(exp - 1)).toBe(false)
    })
})
