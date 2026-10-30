import { HTTP } from './http'

// An empty date means no limit, and is left out of the request
const range = ({ from, to }) => ({ ...(from && { from }), ...(to && { to }) })

export default {
    trialBalance({ from, to } = {}) {
        return HTTP.get('/reports/trial-balance', { params: range({ from, to }) })
    },
    accountLedger({ accountId, from, to }) {
        return HTTP.get('/reports/account-ledger', { params: { account_id: accountId, ...range({ from, to }) } })
    },
}
