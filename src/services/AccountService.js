import { HTTP } from './http'

export default {
    getDepositAccounts() {
        return HTTP.get('/deposit-accounts')
    },
    getAccountGroups() {
        return HTTP.get('/account-groups')
    },
    getAll() {
        return HTTP.get(`/accounts`)
    },
    getOne(accountId) {
        return HTTP.get(`/accounts/${accountId}`)
    },
    update(account) {
        // eslint-disable-next-line no-unused-vars
        const { id: accountId, account_type, account_group, tax_rate, created_at, updated_at, ...requiredFields } = account
        return HTTP.put(`/accounts/${accountId}`, requiredFields)
    },
    create(account) {
        return HTTP.post(`/accounts`, account)
    },
    delete(accountId) {
        return HTTP.delete(`/accounts/${accountId}`)
    }
}