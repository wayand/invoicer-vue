<template>
    <div class="page-heading">
        <div class="page-title">
            <div class="row">
                <div class="col-12 col-md-6 order-md-1 order-last">
                    <h3>Accounts</h3>
                </div>
                <div class="col-12 col-md-6 order-md-2 order-first">
                    <button @click.prevent="openAccountFormModal" type="button" class="btn btn-primary me-1 mb-1 float-end">
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
                    All Accounts <span class="badge bg-secondary">{{ accounts.length }}</span>
                    <div class="form-check form-switch d-inline-block ms-2">
                        <input v-model="showArchived" class="form-check-input" type="checkbox" id="flexSwitchCheckArchived">
                        <label class="form-check-label" for="flexSwitchCheckArchived">Show archived</label>
                    </div>
                </div>
                <div class="card-body">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Kontonr.</th>
                                <th>Kontonavn</th>
                                <th>Type</th>
                                <th>Momstype</th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-if="Object.keys(filteredAccounts).length">
                                <template v-for="(group, groupName) in filteredAccounts">
                                    <tr v-for="account in group" :key="account.id" @click.prevent="openAccountFormModal(account.id)">
                                        <td>{{ account.number }}</td>
                                        <td>{{ account.name }}</td>
                                        <td>{{ groupName }}</td>
                                        <td>{{ account.tax_rate?.name }}</td>
                                    </tr>
                                </template>
                            </template>
                            <tr v-else>
                                <td colspan="5">No Accounts yet, please create new.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    </div>
    <teleport to="body">
        <AccountFormModal :accountId="selectedAccountId" v-if="showAccountFormModal" @close="closeAccountFormModal" />
    </teleport>
</template>
<script>

import { computed, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { toast } from '@/utilities/toast'
import SettingsNavigation from '@/components/common/SettingsNavigation'
import AccountFormModal from '@/components/account/AccountFormModal'

export default {
    components: {
        SettingsNavigation,
        AccountFormModal
    },
    setup() {
        const store = useStore()
        const showAccountFormModal = ref(false)
        const selectedAccountId = ref(null)
        const showArchived = ref(false)
        const accounts = computed(() => store.getters.accounts.filter(a => {
            return showArchived.value ? true : a.is_archived === false
        }))
        const filteredAccounts = computed(() => store.getters.filteredAccounts)

        const fetchAccounts = async () => {
            await store.dispatch('fetchAccounts')
                .catch(e => toast('Accounts ' + e, 'error'))
        }

        onMounted( () => fetchAccounts() )

        const openAccountFormModal = (accountId = null) => {
            if (accountId) {
                selectedAccountId.value = accounts.value.filter(a => a.id === accountId)[0]?.id
            } else {
                selectedAccountId.value = null
            }
            document.body.classList.add("modal-open")
            showAccountFormModal.value = true
        }

        const closeAccountFormModal = () => {
            document.body.classList.remove("modal-open")
            showAccountFormModal.value = false
            //fetchAccounts()
        }

        return {
            showAccountFormModal,
            closeAccountFormModal,
            openAccountFormModal,
            selectedAccountId,
            showArchived,
            accounts,
            filteredAccounts
        }
    },
}
</script>