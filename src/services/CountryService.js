import { HTTP } from './http'

export default {
    getAll() {
        return HTTP.get('/countries')
    },
    getOne(countryId) {
        return HTTP.get('/countries/' + countryId)
    }
}