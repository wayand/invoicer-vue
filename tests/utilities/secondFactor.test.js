import { describe, expect, it } from 'vitest'
import { isAuthenticatorCode, isBackupCode, isSecondFactorCode } from '@/utilities/secondFactor'

describe('isAuthenticatorCode', () => {
    it.each(['123456', ' 123456 ', '000000'])('accepts %j', (code) => {
        expect(isAuthenticatorCode(code)).toBe(true)
    })

    it.each(['12345', '1234567', 'abcdef', '12 3456', '', '12345a'])('rejects %j', (code) => {
        expect(isAuthenticatorCode(code)).toBe(false)
    })

    it('accepts a number typed into a number field', () => {
        expect(isAuthenticatorCode(123456)).toBe(true)
    })
})

describe('isBackupCode', () => {
    it.each(['ABCDE-FGHIJ', 'abcde-fghij', 'ABCDEFGHIJ', 'ABCDE FGHIJ', ' ABCDE-FGHIJ ', 'AB2DE-FG7IJ'])(
        'accepts %j (the hyphen and spaces are optional)',
        (code) => {
            expect(isBackupCode(code)).toBe(true)
        },
    )

    it.each(['ABCD-EFGHI', 'ABCDE-FGHIJK', 'ABCDE-FGHI!', '', '123456'])('rejects %j', (code) => {
        expect(isBackupCode(code)).toBe(false)
    })
})

describe('isSecondFactorCode', () => {
    it('accepts either kind of code', () => {
        expect(isSecondFactorCode('123456')).toBe(true)
        expect(isSecondFactorCode('ABCDE-FGHIJ')).toBe(true)
    })

    it('rejects anything else', () => {
        expect(isSecondFactorCode('12345')).toBe(false)
        expect(isSecondFactorCode('not a code')).toBe(false)
    })
})
