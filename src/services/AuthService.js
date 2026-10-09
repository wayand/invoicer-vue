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
    logout(refreshToken) {
        return HTTP.post('/auth/logout', { refresh_token: refreshToken })
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
    },
    resendConfirmationEmail() {
        return HTTP.post('/auth/resend-confirmation-email')
    },
    resendTOTPEmail() {
        return HTTP.post('/auth/resend-totp-email')
    },
    confirmEmail(token) {
        return HTTP.post('/auth/confirm-email/'+token)
    },
    backupCodesStatus() {
        return HTTP.get('/auth/backup-codes')
    },
    regenerateBackupCodes(payload) {
        return HTTP.post('/auth/backup-codes', payload)
    }

}