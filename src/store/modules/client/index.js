import ClientService from '@/services/ClientService'

export default {
    state: {
        clients: [],
        client: {}
    },
    getters: {
        clients: state => state.clients,
        client: state => state.client
    },
    actions: {
        fetchClients({commit}, organizationId) {
            return ClientService.getAll(organizationId)
                .then(response => {
                    commit('SET_CLIENTS', response.data)
                    return response
                })
        },
        fetchClient({commit}, {organizationId, clientId}) {
            return ClientService.getOne(organizationId, clientId)
                .then(response => {
                    commit('SET_CLIENT', response.data)
                    return response
                })
        },
        updateClient({commit}, {organizationId, client}) {
            return ClientService.update(organizationId, client)
                .then(response => {
                    commit('UPDATE_CLIENTS', response.data)
                    return response
                })
        },
        createClient({commit}, {organizationId, client}) {
            return ClientService.create(organizationId, client)
                .then(response => {
                    commit('ADD_CLIENT', response.data)
                    return response
                })
        }
    },
    mutations: {
        SET_CLIENTS(state, clients) {
            state.clients = clients
        },
        SET_CLIENT(state, client) {
            state.client = client
        },
        ADD_CLIENT(state, client) {
            state.clients.push(client)
        },
        UPDATE_CLIENTS(state, client) {
            const index = state.clients.findIndex(item => item.id === client.id)
            if ( index !==  -1 ) {
                state.clients[index] = client
            } else {
                state.clients.push(client)
            }
        },
        UPDATE_CLIENT_PROPERTY (state, property) {
            state.client[property.key] = property.value === null ? '' : property.value
        },
        REMOVE_CLIENT(state, clientId) {
            const index = state.clients.findIndex(item => item.id === clientId)
            if ( index !==  -1 ) {
                state.clients.splice(index, 1)
            } else {
                console.error('mutation -> REMOVE_CLIENT:', clientId)
            }
        },
    }
}