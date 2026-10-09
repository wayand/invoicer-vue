<template>
    <div class="page-heading">
        <div class="page-title">
            <div class="row">
                <div class="col-12 col-md-6 order-md-1 order-last">
                    <h3>Contacts</h3>
                </div>
                <div class="col-12 col-md-6 order-md-2 order-first">
                    <button @click.prevent="openContactFormModal()" type="button" class="btn btn-primary me-1 mb-1 float-end">
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
                    All contacts <span class="badge bg-secondary">{{ contacts.length }}</span>
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
                            <template v-if="contacts.length">
                                <tr v-for="contact in contacts" :key="contact.id" @click.prevent="openContactFormModal(contact.id)">
                                    <td>{{ contact.name }}</td>
                                    <td>{{ contact.email }}</td>
                                    <td>{{ contact.type }}</td>
                                    <td>{{ contact.updated_at || 'Never' }}</td>
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
        <ContactFormModal :contactId="selectedContactId" v-if="showContactFormModal" @close="closeContactFormModal" />
    </teleport>
</template>
<script>
import { computed, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { toast } from '@/utilities/toast'
import ContactFormModal from '@/components/contact/ContactFormModal'
import SettingsNavigation from '@/components/common/SettingsNavigation'

export default {
    components: {
        ContactFormModal,
        SettingsNavigation
    },
    setup() {
        const store = useStore()
        const showContactFormModal = ref(false)
        const selectedContactId = ref(null)
        const showArchived = ref(false)
        const contacts = computed(() => store.getters.contacts.filter(c => {
            return showArchived.value ? true : c.archived === false
        }))

        onMounted( async () => {
            await store.dispatch('fetchContacts', store.getters.user.organizationId)
                .catch(e => toast('Contacts ' + e, 'error'))
        })

        const openContactFormModal = (contactId = null) => {
            if (contactId) {
                selectedContactId.value = contacts.value.filter(c => c.id === contactId)[0].id
            } else {
                selectedContactId.value = null
            }
            document.body.classList.add("modal-open")
            showContactFormModal.value = true
        }

        const closeContactFormModal = () => {
            document.body.classList.remove("modal-open")
            showContactFormModal.value = false
        }

        return {
            selectedContactId,
            showContactFormModal,
            openContactFormModal,
            closeContactFormModal,
            contacts,
            showArchived
        }
    },
}
</script>
