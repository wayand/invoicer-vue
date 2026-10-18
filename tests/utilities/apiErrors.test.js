import { describe, expect, it } from 'vitest'
import { apiErrorMessage, fieldErrors } from '@/utilities/apiErrors'

const failure = (data) => ({ response: { data } })

describe('apiErrorMessage', () => {
    it('shows the API error string (the rate limiter answers like this)', () => {
        expect(apiErrorMessage(failure({ error: 'Too many attempts. Please try again later.' }))).toBe(
            'Too many attempts. Please try again later.',
        )
    })

    it('joins an error list', () => {
        expect(apiErrorMessage(failure({ error: ['No password provided', 'Try again'] }))).toBe(
            'No password provided Try again',
        )
    })

    it('flattens field errors into one sentence', () => {
        const data = { errors: { email: ['Not a valid email address.'], name: ['Missing data.', 'Too short.'] } }

        expect(apiErrorMessage(failure(data))).toBe('Not a valid email address. Missing data. Too short.')
    })

    it('falls back when the API sent nothing readable', () => {
        expect(apiErrorMessage(failure({}))).toBe('Something went wrong. Please try again.')
        expect(apiErrorMessage(failure({ errors: {} }))).toBe('Something went wrong. Please try again.')
        expect(apiErrorMessage(failure(undefined))).toBe('Something went wrong. Please try again.')
    })

    it('uses the error message when there was no response (network down)', () => {
        expect(apiErrorMessage(new Error('Network Error'))).toBe('Network Error')
    })

    it('uses a custom fallback, and copes with nothing at all', () => {
        expect(apiErrorMessage(failure({}), 'Could not save')).toBe('Could not save')
        expect(apiErrorMessage(null)).toBe('Something went wrong. Please try again.')
        expect(apiErrorMessage(undefined, 'Nope')).toBe('Nope')
    })
})

describe('fieldErrors', () => {
    it('hands back the API field errors for the form to show', () => {
        const errors = { password: ['Invalid password entered'] }

        expect(fieldErrors(failure({ errors }))).toBe(errors)
    })

    it('puts the message under the field when the API sent no field errors', () => {
        expect(fieldErrors(failure({ error: 'Wrong credentials' }))).toEqual({ password: 'Wrong credentials' })
        expect(fieldErrors(failure({ error: 'Nope' }), 'email')).toEqual({ email: 'Nope' })
    })

    it('never returns undefined, so a template can always read errors.<field>', () => {
        expect(fieldErrors(undefined)).toEqual({ password: 'Something went wrong. Please try again.' })
        expect(fieldErrors(new Error('Network Error'))).toEqual({ password: 'Network Error' })
    })
})
