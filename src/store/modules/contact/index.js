import ContactService from '@/services/ContactService'

export default {
    state: {
        contacts: [],
        contact: {}
    },
    getters: {
        contacts: state => state.contacts,
        contact: state => state.contact
    },
    actions: {
        fetchContacts({commit}, organizationId) {
            return ContactService.getAll(organizationId)
                .then(response => {
                    commit('SET_CONTACTS', response.data)
                    return response
                })
        },
        fetchContact({commit}, {organizationId, contactId}) {
            return ContactService.getOne(organizationId, contactId)
                .then(response => {
                    commit('SET_CONTACT', response.data)
                    return response
                })
        },
        updateContact({commit}, {organizationId, contact}) {
            return ContactService.update(organizationId, contact)
                .then(response => {
                    commit('UPDATE_CONTACTS', response.data)
                    return response
                })
        },
        createContact({commit}, {organizationId, contact}) {
            return ContactService.create(organizationId, contact)
                .then(response => {
                    commit('ADD_CONTACT', response.data)
                    return response
                })
        }
    },
    mutations: {
        SET_CONTACTS(state, contacts) {
            state.contacts = contacts
        },
        SET_CONTACT(state, contact) {
            state.contact = contact
        },
        ADD_CONTACT(state, contact) {
            state.contacts.push(contact)
        },
        UPDATE_CONTACTS(state, contact) {
            const index = state.contacts.findIndex(item => item.id === contact.id)
            if ( index !==  -1 ) {
                state.contacts[index] = contact
            } else {
                state.contacts.push(contact)
            }
        },
        UPDATE_CONTACT_PROPERTY (state, property) {
            state.contact[property.key] = property.value === null ? '' : property.value
        },
        REMOVE_CONTACT(state, contactId) {
            const index = state.contacts.findIndex(item => item.id === contactId)
            if ( index !==  -1 ) {
                state.contacts.splice(index, 1)
            } else {
                console.error('mutation -> REMOVE_CONTACT:', contactId)
            }
        },
    }
}
