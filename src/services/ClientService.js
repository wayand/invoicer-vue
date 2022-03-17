import { HTTP } from './http'

export default {
    getAll(organizationId) {
        return HTTP.get(`/organizations/${organizationId}/clients`)
    },
    getOne(organizationId, clientId) {
        return HTTP.get(`/organizations/${organizationId}/clients/${clientId}`)
    },
    update(organizationId, client) {
        if (client.type !== 'company') {
            // eslint-disable-next-line no-unused-vars
            const {contactperson_email, contactperson_name, ...requiredFields} = client
            client = requiredFields
        }
        // eslint-disable-next-line no-unused-vars
        const { id: clientId, created_at, updated_at, ...requiredFields } = client
        return HTTP.put(`/organizations/${organizationId}/clients/${clientId}`, requiredFields)
    },
    create(organizationId, client) {
        if (client.type !== 'company') {
            // eslint-disable-next-line no-unused-vars
            const {contactperson_email, contactperson_name, ...requiredFields} = client
            client = requiredFields
        }
        return HTTP.post(`/organizations/${organizationId}/clients`, client)
    },
    delete(organizationId, clientId) {
        return HTTP.delete(`/organizations/${organizationId}/clients/${clientId}`)
    }
}