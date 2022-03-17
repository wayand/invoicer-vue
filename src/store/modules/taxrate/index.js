import TaxRateService from '@/services/TaxRateService'

export default {
    state: {
        taxRates: [],
        taxRate: {},
    },
    getters: {
        taxRates: state => state.taxRates,
        taxRate: state => state.taxRate,
    },
    actions: {
        fetchTaxRates({commit}) {
            return TaxRateService.getAll()
                .then(response => {
                    commit('SET_TAXRATES', response.data)
                    return response
                })
        },
        fetchTaxRate({commit}, {taxRateId}) {
            return TaxRateService.getOne(taxRateId)
                .then(response => {
                    commit('SET_TAXRATE', response.data)
                    return response
                })
        },
        updateTaxRate({commit}, {taxRate}) {
            return TaxRateService.update(taxRate)
                .then(response => {
                    commit('UPDATE_TAXRATES', response.data)
                    return response
                })
        },
        createTaxRate({commit}, {taxRate}) {
            return TaxRateService.create(taxRate)
                .then(response => {
                    commit('ADD_TAXRATE', response.data)
                    return response
                })
        },
    },
    mutations: {
        SET_TAXRATES(state, taxRates) {
            state.taxRates = taxRates
        },
        SET_TAXRATE(state, taxRate) {
            state.taxRate = taxRate
        },
        ADD_TAXRATE(state, taxRate) {
            state.taxRates.push(taxRate)
        },
        UPDATE_TAXRATES(state, taxRate) {
            const index = state.taxRates.findIndex(item => item.id === taxRate.id)
            if ( index !==  -1 ) {
                state.taxRates[index] = taxRate
            } else {
                state.taxRates.push(taxRate)
            }
        },
        UPDATE_TAXRATE_PROPERTY (state, property) {
            state.taxRate[property.key] = property.value === null ? '' : property.value
        },
        REMOVE_TAXRATE(state, taxRateId) {
            const index = state.taxRates.findIndex(item => item.id === taxRateId)
            if ( index !==  -1 ) {
                state.taxRates.splice(index, 1)
            } else {
                console.error('mutation -> REMOVE_TAXRATE:', taxRateId)
            }
        },
    }
}