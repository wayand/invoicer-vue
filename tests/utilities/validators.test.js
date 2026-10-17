import { describe, expect, it } from 'vitest'
import {
    isEmail,
    isName,
    isNum,
    isPassword,
    isPhone,
    maxLength,
    minLength,
    required,
    validateEmail
} from '@/utilities/validators'

const REQUIRED = 'This field is required'

describe('required', () => {
    it.each([undefined, null, 0, ''])('rejects %j', value => {
        expect(required(value)).toBe(REQUIRED)
    })

    it.each(['a', ' ', 7, false])('accepts %j', value => {
        expect(required(value)).toBe(true)
    })
})

describe('minLength and maxLength', () => {
    it('minLength states the limit', () => {
        expect(minLength('abc', 4)).toBe('The field must be atleast 4 characters long')
        expect(minLength('abcd', 4)).toBe(true)
    })

    it('maxLength states the limit', () => {
        expect(maxLength('abcde', 4)).toBe('The field must be max 4 characters long')
        expect(maxLength('abcd', 4)).toBe(true)
    })
})

describe('email', () => {
    it.each(['a@b.dk', 'first.last@sub.example.com', 'x+tag@example.org'])('accepts %j', email => {
        expect(isEmail(email)).toBe(true)
        expect(validateEmail(email)).toBe(true)
    })

    it.each(['', 'plain', '@example.com', 'a@', 'a@b', 'a b@example.com'])('rejects %j', email => {
        expect(isEmail(email)).toBe(false)
        expect(validateEmail(email)).toBe('Enter Valid Email address')
    })
})

describe('isNum', () => {
    it('accepts digits, also typed as text', () => {
        expect(isNum('12')).toBe(true)
        expect(isNum(3.5)).toBe(true)
    })

    it('rejects text', () => {
        expect(isNum('12a')).toBe('The field must only have numbers')
    })
})

describe('isPhone', () => {
    it('asks for a number when it is empty', () => {
        expect(isPhone('')).toBe(REQUIRED)
        expect(isPhone(undefined)).toBe(REQUIRED)
    })

    it('then only checks that it is numeric', () => {
        expect(isPhone('12345678')).toBe(true)
        expect(isPhone('12-34')).toBe('The field must only have numbers')
    })
})

describe('isName and isPassword', () => {
    it.each([isName, isPassword])('require a value', check => {
        expect(check('')).toBe(REQUIRED)
        expect(check(undefined)).toBe(REQUIRED)
    })

    it.each([isName, isPassword])('apply the minimum and the maximum when given', check => {
        expect(check('ab', 3)).toBe('The field must be atleast 3 characters long')
        expect(check('abcd', 1, 3)).toBe('The field must be max 3 characters long')
        expect(check('abc', 3, 3)).toBe(true)
    })

    it.each([isName, isPassword])('accept a value when no limits are given', check => {
        expect(check('a')).toBe(true)
    })
})
