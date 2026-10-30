import { HTTP } from './http'

export default {
    getAll(params = {}) {
        return HTTP.get('/journal-entries', { params })
    },
    getOne(entryId) {
        return HTTP.get(`/journal-entries/${entryId}`)
    },
    create(entry) {
        return HTTP.post('/journal-entries', entry)
    },
    reverse(entryId, body = {}) {
        return HTTP.post(`/journal-entries/${entryId}/reverse`, body)
    },
}
