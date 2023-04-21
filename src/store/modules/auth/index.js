//import { HTTP } from '@/services/http'
import AuthService from '@/services/AuthService'
import { jwtDecrypt, tokenAlive } from "@/services/jwtHelper"

export default {
    state: {
        accessToken: localStorage.getItem('accessToken') || null,
        refreshToken: localStorage.getItem('refreshToken') || null,
        user: null,
        layout: localStorage.getItem('layout') || 'login-layout'
    },
    getters: {
        accessToken: state => state.accessToken,
        refreshToken: state => state.refreshToken,
        user: state => state.user,
        layout: state => state.layout,
        loggedIn: state => !!state.user,
        isTokenValid: state => !state.user.tokenExp ? false : tokenAlive(state.user.tokenExp),
        isEmailConfirmed: state => state.user ? state.user.isEmailConfirmed : false
    },
    mutations: {
        UPDATE_IS_EMAIL_CONFIRMED(state, bool) {
            state.user.isEmailConfirmed = bool
        },
        UPDATE_USER_DATA(state, user) {
            state.user.email = user.email
            state.user.name = user.name
            state.user.isTwoFactorAuth = user.is_two_factor_auth
            state.user.twoFactorAuthType = user.two_factor_auth_type
        },
        SET_ACCESS_TOKEN(state, accessToken) {
            state.accessToken = accessToken
            localStorage.setItem('accessToken', accessToken)
        },
        SET_REFRESH_TOKEN(state, refreshToken) {
            state.refreshToken = refreshToken
            localStorage.setItem('refreshToken', refreshToken)
        },
        SET_USER_DATA(state, accessToken) {
            const decodedJwt = jwtDecrypt(accessToken)
            state.user = {
                tokenExp: decodedJwt.exp,
                email: decodedJwt.sub,
                name: decodedJwt.name,
                isEmailConfirmed: decodedJwt.isEmailConfirmed,
                isTwoFactorAuth: decodedJwt.isTwoFactorAuth,
                twoFactorAuthType:decodedJwt.twoFactorAuthType,
                organizationId: decodedJwt.organizationId,
                organizationSlug: decodedJwt.organizationSlug,
                aud: decodedJwt.aud
            }
        },
        SET_LAYOUT(state, layout) {
            state.layout = layout
            localStorage.setItem('layout', layout)
        },
        CLEAR_USER_DATA(state) {
            state.user = null
            state.accessToken = null
            state.refreshToken = null
            state.isLoggedIn = false
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
        }
    },
    actions: {
        refresh({state, commit}) {
            return AuthService.refreshToken(state.refreshToken)
                .then(response => {
                    commit('SET_ACCESS_TOKEN', response.data.accessToken)
                    return response
                })
        },
        login({commit}, credentials) {
            return AuthService.getToken(credentials)
                .then(response => {
                    if (response.status === 206 && response.data.message === '2fa_otp') {
                        return response
                    } else {
                        commit('SET_USER_DATA', response.data.accessToken)
                        commit('SET_ACCESS_TOKEN', response.data.accessToken)
                        commit('SET_REFRESH_TOKEN', response.data.refreshToken)
                        commit('SET_LAYOUT', 'app-layout')
                        return response
                    }
                })
        },
        logout({ commit }) {
            return AuthService.revokeToken()
                .then(response => {
                    console.log('Successfully Logout')
                    return response
                })
                .finally(() => {
                    commit('CLEAR_USER_DATA')
                    commit('SET_LAYOUT', 'login-layout')
                    location.reload()
                })
        },
        changePassword(_, credentials) {
            return AuthService.changePassword(credentials)
        },
        getAuthUser({ commit, dispatch }) {
            return AuthService.getAuthUser()
                .then(response => {
                    commit('UPDATE_USER_DATA', response.data)
                    dispatch('refresh')
                    return response
                })
        },
        resendTOTPEmail() {
            return AuthService.resendTOTPEmail()
        },
        resendConfirmationEmail() {
            return AuthService.resendConfirmationEmail()
        },
        confirmEmail({ commit, dispatch }, token) {
            return AuthService.confirmEmail(token)
                .then(response => {
                    commit('UPDATE_IS_EMAIL_CONFIRMED', true)
                    dispatch('refresh')
                    return response
                })
        },
        qrCode() {
            return AuthService.qrCode()
        },
        totpSetup(_, payload) {
            return AuthService.totpSetup(payload)
        },
        totpDelete(_, password) {
            return AuthService.totpDelete(password)
        },
        sendResetMail(_, payload) {
            return AuthService.sendResetMail(payload)
        },
        resetPassword(_, payload) {
            return AuthService.resetPassword(payload)
        }
    }
}