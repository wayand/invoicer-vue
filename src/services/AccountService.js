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
        /* eslint-disable no-unused-vars */
        const {
            id: accountId,
            account_type,
            account_group,
            tax_rate,
            standard_account,
            system_role,
            created_at,
            updated_at,
            ...requiredFields
        } = account
        /* eslint-enable no-unused-vars */
        return HTTP.put(`/accounts/${accountId}`, requiredFields)
    },
    create(account) {
        return HTTP.post(`/accounts`, account)
    },
    delete(accountId) {
        return HTTP.delete(`/accounts/${accountId}`)
    },
}
