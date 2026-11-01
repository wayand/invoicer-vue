import VatCodeService from '@/services/VatCodeService'
import { salesRate } from '@/utilities/money'

export default {
    state: {
        vatCodes: [],
    },
    getters: {
        vatCodes: (state) => state.vatCodes,
        // The codes the server calculates (the others are on the list but cannot be chosen yet)
        supportedVatCodes: (state) => state.vatCodes.filter((vatCode) => vatCode.is_supported),
        // The codes an invoice line can have
        salesVatCodes: (state) =>
            state.vatCodes.filter((vatCode) => vatCode.is_supported && vatCode.applies_to === 'sales'),
        getVatCodeById: (state) => (id) => state.vatCodes.find((vatCode) => vatCode.id === id),
        // The rate an invoice charges for each code: { S01: 0.25, S02: 0, ... }
        salesRates: (state) => Object.fromEntries(state.vatCodes.map((vatCode) => [vatCode.code, salesRate(vatCode)])),
    },
    actions: {
        fetchVatCodes({ commit }) {
            return VatCodeService.getAll().then((response) => {
                commit('SET_VAT_CODES', response.data)
                return response
            })
        },
    },
    mutations: {
        SET_VAT_CODES(state, vatCodes) {
            state.vatCodes = vatCodes
        },
    },
}
