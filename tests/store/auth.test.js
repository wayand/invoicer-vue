import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import auth from '@/store/modules/auth'
import AuthService from '@/services/AuthService'

vi.mock('@/services/AuthService', () => ({
    default: {
        getToken: vi.fn(),
        logout: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn()
    }
}))

// header.payload.signature, with the payload base64url encoded like the API's tokens
const tokenWith = payload =>
    `e30.${Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=+$/, '')}.signature`

const claims = {
    sub: 'demo@example.com',
    name: 'Demo User',
    exp: 4102444800, // the year 2100
    isEmailConfirmed: true,
    isTwoFactorAuth: true,
    twoFactorAuthType: '2fa_otp_email',
    organizationId: 1,
    organizationSlug: 'demo-aps',
    aud: 'wayand.dk'
}

const newStore = () =>
    createStore({
        modules: {
            auth: {
                ...auth,
                state: () => ({ accessToken: null, refreshToken: null, user: null, layout: 'login-layout' })
            }
        }
    })

describe('auth store', () => {
    let store
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
        store = newStore()
    })
    afterEach(() => vi.unstubAllGlobals())

    describe('login', () => {
        it('stores nothing while the second factor is still to come', async () => {
            const response = { status: 206, data: { message: '2fa_otp' } }
            AuthService.getToken.mockResolvedValue(response)

            expect(await store.dispatch('login', { email: 'a@b.dk', password: 'x' })).toBe(response)

            expect(store.getters.loggedIn).toBe(false)
            expect(store.getters.accessToken).toBeNull()
            expect(localStorage.getItem('accessToken')).toBeNull()
        })

        it('keeps both tokens, reads the user from the access token and switches layout', async () => {
            AuthService.getToken.mockResolvedValue({
                status: 200,
                data: { accessToken: tokenWith(claims), refreshToken: 'refresh-1' }
            })

            await store.dispatch('login', { email: 'a@b.dk', password: 'x', otp_2fa: '123456' })

            expect(store.getters.refreshToken).toBe('refresh-1')
            expect(localStorage.getItem('refreshToken')).toBe('refresh-1')
            expect(localStorage.getItem('accessToken')).toBe(store.getters.accessToken)
            expect(store.getters.loggedIn).toBe(true)
            expect(store.getters.user).toMatchObject({
                email: 'demo@example.com',
                name: 'Demo User',
                organizationId: 1,
                organizationSlug: 'demo-aps',
                isEmailConfirmed: true,
                twoFactorAuthType: '2fa_otp_email'
            })
            expect(store.getters.isTokenValid).toBe(true)
            expect(store.getters.layout).toBe('app-layout')
        })

        it('reports an expired token as no longer valid', async () => {
            AuthService.getToken.mockResolvedValue({
                status: 200,
                data: { accessToken: tokenWith({ ...claims, exp: 1000 }), refreshToken: 'r' }
            })

            await store.dispatch('login', {})

            expect(store.getters.isTokenValid).toBe(false)
        })
    })

    describe('changePassword', () => {
        it('keeps the new token pair, because the old session ended on the server', async () => {
            store.commit('SET_ACCESS_TOKEN', 'old-access')
            store.commit('SET_REFRESH_TOKEN', 'old-refresh')
            AuthService.changePassword.mockResolvedValue({
                data: { message: 'ok', accessToken: 'new-access', refreshToken: 'new-refresh' }
            })

            await store.dispatch('changePassword', { password: 'old', new_password: 'new-password-1' })

            expect(AuthService.changePassword).toHaveBeenCalledWith({ password: 'old', new_password: 'new-password-1' })
            expect(store.getters.accessToken).toBe('new-access')
            expect(store.getters.refreshToken).toBe('new-refresh')
            expect(localStorage.getItem('accessToken')).toBe('new-access')
            expect(localStorage.getItem('refreshToken')).toBe('new-refresh')
        })

        it('leaves the tokens alone when the old password was wrong', async () => {
            store.commit('SET_ACCESS_TOKEN', 'old-access')
            AuthService.changePassword.mockRejectedValue({ response: { status: 422 } })

            await expect(store.dispatch('changePassword', {})).rejects.toBeTruthy()

            expect(store.getters.accessToken).toBe('old-access')
        })
    })

    describe('logout', () => {
        beforeEach(() => vi.stubGlobal('location', { reload: vi.fn() }))

        it('sends the refresh token so the server revokes it, then clears everything', async () => {
            store.commit('SET_ACCESS_TOKEN', 'access')
            store.commit('SET_REFRESH_TOKEN', 'refresh')
            AuthService.logout.mockResolvedValue({ data: { message: 'Logged out' } })

            await store.dispatch('logout')

            expect(AuthService.logout).toHaveBeenCalledWith('refresh')
            expect(store.getters.accessToken).toBeNull()
            expect(store.getters.refreshToken).toBeNull()
            expect(localStorage.getItem('accessToken')).toBeNull()
            expect(localStorage.getItem('refreshToken')).toBeNull()
            expect(store.getters.layout).toBe('login-layout')
            expect(location.reload).toHaveBeenCalled()
        })

        it('still logs out locally when the request fails', async () => {
            store.commit('SET_ACCESS_TOKEN', 'access')
            store.commit('SET_REFRESH_TOKEN', 'refresh')
            AuthService.logout.mockRejectedValue(new Error('Network Error'))

            await expect(store.dispatch('logout')).rejects.toThrow('Network Error')

            expect(store.getters.accessToken).toBeNull()
            expect(localStorage.getItem('refreshToken')).toBeNull()
            expect(location.reload).toHaveBeenCalled()
        })
    })

    it('stores a refreshed access token', async () => {
        store.commit('SET_REFRESH_TOKEN', 'refresh')
        AuthService.refreshToken.mockResolvedValue({ data: { accessToken: 'fresh-access' } })

        await store.dispatch('refresh')

        expect(AuthService.refreshToken).toHaveBeenCalledWith('refresh')
        expect(store.getters.accessToken).toBe('fresh-access')
    })
})
