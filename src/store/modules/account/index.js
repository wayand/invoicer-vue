import AccountService from '@/services/AccountService'

export default {
    state: {
        accounts: [],
        account: {},
        accountGroups: [],
    },
    getters: {
        accounts: state => state.accounts,
        account: state => state.account,
        getIncomeAccounts: state => state.accounts.filter(a => a.account_type.name === 'Income'),
        getAccountById: state => {
            return id => state.accounts.filter(a => a.id === id)[0]
        },
        depositAccounts: state => state.accounts.filter(a => a.is_deposit),
        accountGroups: state => state.accountGroups,
        filteredAccounts: state => {
            return state.accounts.reduce((group, account) => {
                const { name: groupName } = account.account_group
                group[groupName] = group[groupName] ?? []
                group[groupName].push(account)
                return group
            }, {})
        },
    },
    actions: {
        fetchAccountGroups({commit}) {
            return AccountService.getAccountGroups()
                .then(response => {
                    commit('SET_ACCOUNT_GROUPS', response.data)
                    return response
                })
        },
        fetchAccounts({commit}) {
            return AccountService.getAll()
                .then(response => {
                    commit('SET_ACCOUNTS', response.data)
                    return response
                })
        },
        fetchAccount({commit}, accountId) {
            return AccountService.getOne(accountId)
                .then(response => {
                    commit('SET_ACCOUNT', response.data)
                    return response
                })
        },
        updateAccount({commit}, {account}) {
            return AccountService.update(account)
                .then(response => {
                    commit('UPDATE_ACCOUNTS', response.data)
                    return response
                })
        },
        createAccount({commit}, {account}) {
            return AccountService.create(account)
                .then(response => {
                    commit('ADD_ACCOUNT', response.data)
                    return response
                })
        }
    },
    mutations: {
        SET_ACCOUNT_GROUPS(state, accountGroups) {
            state.accountGroups = accountGroups
        },
        SET_ACCOUNTS(state, accounts) {
            state.accounts = accounts
        },
        SET_ACCOUNT(state, account) {
            state.account = account
        },
        ADD_ACCOUNT(state, account) {
            state.accounts.push(account)
        },
        UPDATE_ACCOUNTS(state, account) {
            const index = state.accounts.findIndex(item => item.id === account.id)
            if ( index !==  -1 ) {
                state.accounts[index] = account
            } else {
                state.accounts.push(account)
            }
        },
        UPDATE_ACCOUNT_PROPERTY (state, property) {
            state.account[property.key] = property.value
        },
        REMOVE_ACCOUNT(state, accountId) {
            const index = state.accounts.findIndex(item => item.id === accountId)
            if ( index !==  -1 ) {
                state.accounts.splice(index, 1)
            } else {
                console.error('mutation -> REMOVE_ACCOUNT:', accountId)
            }
        },
    }
}