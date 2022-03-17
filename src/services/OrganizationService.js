import { HTTP } from './http'

export default {
    getAll() {
        return HTTP.get('/organizations')
    },
    getOne(organizationId) {
        return HTTP.get('/organizations/' + organizationId)
    },
    update(organization) {
        // eslint-disable-next-line no-unused-vars
        const {id, created_at, updated_at, country, users, invoice_setting, ...requiredOrgFields} = organization
        return HTTP.put('/organizations/' + id, requiredOrgFields)
    },
    uploadLogo(organizationId, logo) {
        return HTTP.post('/organizations/' + organizationId + '/upload-logo', logo, {})
    },

    // Invoice settings
    updateInvoiceSetting(invoiceSetting) {
        // eslint-disable-next-line no-unused-vars
        const {id, created_at, updated_at, ...requiredFields} = invoiceSetting
        return HTTP.put('/invoice-setting', requiredFields)
    }
}