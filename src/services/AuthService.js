import { HTTP } from './http'

export default {
    getAuthUser() {
        return HTTP.get('/auth/user')
    },
    changePassword(credentials) {
        return HTTP.post('/auth/change-password', credentials)
    },
    getToken(credentials) {
        return HTTP.post('/auth/token', credentials)
    },
    revokeToken() {
        return HTTP.post('/auth/revoke-access-token')
    },
    revokeRefreshToken() {
        return HTTP.post('/auth/revoke-refresh-token')
    },
    refreshToken(token) {
        return HTTP.post('/auth/refresh-token', {}, { headers: { 'Authorization': `Bearer ${token}` } })
    },
    isAuthorized() {
        return HTTP.get('/is-authorized')
    },
    qrCode() {
        return HTTP.get('/auth/qrcode')
    },
    totpSetup(payload) {
        return HTTP.post('/auth/totp-setup', payload)
    },
    totpDelete(payload) {
        return HTTP.delete('/auth/totp-setup', {data: payload})
    },
    sendResetMail(payload) {
        return HTTP.post('/auth/send-reset-mail', payload)
    },
    resetPassword(payload) {
        return HTTP.post('/auth/reset-password', payload)
    }

}