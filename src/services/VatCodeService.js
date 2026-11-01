import { HTTP } from './http'

export default {
    // The official VAT codes, the same for every organization
    getAll() {
        return HTTP.get('/vat-codes')
    },
}
