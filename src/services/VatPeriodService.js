import { HTTP } from './http'

export default {
    // The settled periods, and the open one with what stops it from being settled
    getAll() {
        return HTTP.get('/vat-periods')
    },
    // Settle the open period
    settle() {
        return HTTP.post('/vat-periods/settle')
    },
    // Mark a settled period as filed: { filed_on, reference }
    file(periodId, body = {}) {
        return HTTP.post(`/vat-periods/${periodId}/file`, body)
    },
    changeDueDate(periodId, dueDate) {
        return HTTP.patch(`/vat-periods/${periodId}`, { due_date: dueDate })
    },
}
