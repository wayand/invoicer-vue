import CountryService from '@/services/CountryService'

export default {
    state: {
        countries: [],
        country: {}
    },
    getters: {
        countries: state => state.countries,
        country: state => state.country
    },
    actions: {
        fetchCountries({ commit }) {
            return CountryService.getAll()
                .then(response => {
                    commit('SET_COUNTRIES', response.data)
                    return response
                })
        },
        fetchCountry({ commit }, countryId) {
            return CountryService.getOne(countryId)
                .then(response => {
                    commit('SET_COUNTRY', response.data)
                    return response
                })
        },

    },
    mutations: {
        SET_COUNTRIES(state, countries) {
            state.countries = countries
        },
        SET_COUNTRY(state, country) {
            state.country = country
        },
    }
}