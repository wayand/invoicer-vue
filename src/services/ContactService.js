import { HTTP } from './http'

export default {
    getAll(organizationId) {
        return HTTP.get(`/organizations/${organizationId}/contacts`)
    },
    getOne(organizationId, contactId) {
        return HTTP.get(`/organizations/${organizationId}/contacts/${contactId}`)
    },
    update(organizationId, contact) {
        if (!contact.is_company) {
            // eslint-disable-next-line no-unused-vars
            const {contactperson_email, contactperson_name, ...requiredFields} = contact
            contact = requiredFields
        }
        // eslint-disable-next-line no-unused-vars
        const { id: contactId, created_at, updated_at, ...requiredFields } = contact
        return HTTP.put(`/organizations/${organizationId}/contacts/${contactId}`, requiredFields)
    },
    create(organizationId, contact) {
        if (!contact.is_company) {
            // eslint-disable-next-line no-unused-vars
            const {contactperson_email, contactperson_name, ...requiredFields} = contact
            contact = requiredFields
        }
        return HTTP.post(`/organizations/${organizationId}/contacts`, contact)
    },
    delete(organizationId, contactId) {
        return HTTP.delete(`/organizations/${organizationId}/contacts/${contactId}`)
    }
}
