<template>
    <div class="page-heading">
        <div class="page-title">
            <div class="row">
                <div class="col-12 col-md-6 order-md-1 order-last">
                    <h3>Clients</h3>
                </div>
                <div class="col-12 col-md-6 order-md-2 order-first">
                    <button @click.prevent="openClientFormModal()" type="button" class="btn btn-primary me-1 mb-1 float-end">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
                        </svg>
                        Create
                    </button>
                </div>
            </div>
        </div>
        <section class="section">
            <SettingsNavigation />
        </section>
    </div>
    <div class="page-content">
        <section class="section">
            <div class="card">
                <div class="card-header">
                    All clients <span class="badge bg-secondary">{{ clients.length }}</span>
                    <div class="form-check form-switch d-inline-block ms-2">
                        <input v-model="showArchived" class="form-check-input" type="checkbox" id="flexSwitchCheckArchived">
                        <label class="form-check-label" for="flexSwitchCheckArchived">Show archived</label>
                    </div>
                </div>
                <div class="card-body">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Type</th>
                                <th>Last Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-if="clients.length">
                                <tr v-for="client in clients" :key="client.id" @click.prevent="openClientFormModal(client.id)">
                                    <td>{{ client.name }}</td>
                                    <td>{{ client.email }}</td>
                                    <td>{{ client.type }}</td>
                                    <td>{{ client.updated_at || 'Never' }}</td>
                                </tr>
                            </template>
                            <tr v-else>
                                <td colspan="5">No Invoices yet, please create new.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    </div>
    <teleport to="body">
        <ClientFormModal :clientId="selectedClientId" v-if="showClientFormModal" @close="closeClientFormModal" />
    </teleport>
</template>
<script>
import { computed, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { toast } from '@/utilities/toast'
import ClientFormModal from '@/components/client/ClientFormModal'
import SettingsNavigation from '@/components/common/SettingsNavigation'

export default {
    components: {
        ClientFormModal,
        SettingsNavigation
    },
    setup() {
        const store = useStore()
        const showClientFormModal = ref(false)
        const selectedClientId = ref(null)
        const showArchived = ref(false)
        const clients = computed(() => store.getters.clients.filter(c => {    
            return showArchived.value ? true : c.archived === false
        }))

        onMounted( async () => {
            await store.dispatch('fetchClients', store.getters.user.organizationId)
                .catch(e => toast('Clients ' + e, 'error'))    
        })

        const openClientFormModal = (clientId = null) => {
            if (clientId) {
                selectedClientId.value = clients.value.filter(c => c.id === clientId)[0].id
            } else {
                selectedClientId.value = null
            }
            document.body.classList.add("modal-open")
            showClientFormModal.value = true
        }

        const closeClientFormModal = () => {
            document.body.classList.remove("modal-open")
            showClientFormModal.value = false
        }
        
        return {
            selectedClientId,
            showClientFormModal,
            openClientFormModal,
            closeClientFormModal,
            clients,
            showArchived
        }
    },
}
</script>