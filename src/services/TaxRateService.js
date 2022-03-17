import { HTTP } from './http'

export default {
    getAll() {
        return HTTP.get(`/tax-rates`)
    },
    getOne(taxRateId) {
        return HTTP.get(`/tax-rates/${taxRateId}`)
    },
    update(taxRate) {
        // eslint-disable-next-line no-unused-vars
        const { id: taxRateId, created_at, updated_at, ...requiredFields } = taxRate
        return HTTP.put(`/tax-rates/${taxRateId}`, requiredFields)
    },
    create(taxRate) {
        return HTTP.post(`/tax-rates`, taxRate)
    },
    delete(taxRateId) {
        return HTTP.delete(`/tax-rates/${taxRateId}`)
    }
}