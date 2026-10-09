<template>
    
    <div class="page-heading">
        <div class="page-title">
            <div class="row justify-content-between">
                <div class="col-12 col-md-6 order-md-1 order-last">
                    <h3>AuthManagement</h3>
                    <router-link :to="{ name: 'Authentication'}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-left-short" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5z"/>
                        </svg>
                        <span>back</span>
                    </router-link>
                </div>
                <div class="col-12 col-md-6 order-md-2 order-first">
                </div>
            </div>
        </div>
    </div>
    <div class="page-content">
        <section id="multiple-column-form">
            <div class="row match-height">

                    <div v-if="user.isTwoFactorAuth" class="alert alert-success color-success">
                        <i class="bi bi-check-circle"></i> Two-Factor Authentication is Enabled.
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h4>Authentication</h4>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-8">
                                    <h6>Mobile App Authentication <span :class="`badge bg-light-${user.twoFactorAuthType == '2fa_mobile_app' ? 'success' : 'danger'}`">{{ user.twoFactorAuthType == '2fa_mobile_app' ? 'Enabled' : 'Disabled' }}</span></h6>
                                    <p v-if="user.twoFactorAuthType == '2fa_mobile_app'" class="text-muted">A TOTP method has been added for your account. <a @click="deleteMethod" href="#">Delete method</a></p>
                                    <p v-else class="text-muted">Secure your account with TOTP two-factor authentication..</p>
                                </div>
                                <div class="col-4">
                                    <div class="buttons">
                                        <router-link :to="{ name: 'AuthTwoFactorSetup'}" class="btn btn-primary">{{ user.isTwoFactorAuth ? 'Reconfigure' : 'Add' }}</router-link>
                                    </div>
                                </div>
                            </div>
                            <hr>

                            <div class="row">
                                <div class="col-8">
                                    <h6>Email Authentication <span :class="`badge bg-light-${user.twoFactorAuthType == '2fa_otp_email' ? 'success' : 'danger'}`">{{ user.twoFactorAuthType == '2fa_otp_email' ? 'Enabled' : 'Disabled' }}</span></h6>
                                    <p>Secure your account with TOTP via Email</p>
                                </div>
                                <div class="col-4">
                                    <div class="buttons">
                                        <button class="btn btn-outline-secondary disabled">Default method</button>
                                    </div>
                                </div>
                            </div>
                            
                            <template v-if="user.isTwoFactorAuth">
                                <hr>

                                <div class="row">
                                    <div class="col-8">
                                        <h6>Backup codes <span v-if="remaining !== null" :class="`badge bg-light-${remaining > 3 ? 'success' : remaining > 0 ? 'warning' : 'danger'}`">{{ remaining }} left</span></h6>
                                        <p v-if="remaining === 0">You have no backup codes. Generate some to use if you lose your phone or can't get the email.</p>
                                        <p v-else>Single-use codes to sign in if you lose your phone or can't get the email.</p>
                                    </div>
                                    <div class="col-4">
                                        <div class="buttons">
                                            <a @click.prevent="startBackupCodes" href="#" class="btn btn-primary">{{ remaining ? 'Regenerate' : 'Generate' }}</a>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>

            </div>
        </section>
    </div>

    <teleport to="body">
        <EnterPasswordModal :error="deleteError" @accept="response" @cancel="cancel" ref="refDialog" />
        <EnterPasswordModal
            :error="backupError"
            title="Generate backup codes"
            content="This replaces any backup codes you already have, so the old ones stop working."
            accept-label="Generate codes"
            @accept="generateBackupCodes"
            ref="backupPasswordDialog" />
        <BackupCodesModal ref="backupCodesDialog" @closed="loadRemaining" />
    </teleport>
</template>
<script>
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import EnterPasswordModal from '@/components/authentication/EnterPasswordModal'
import BackupCodesModal from '@/components/authentication/BackupCodesModal'
import { toast } from '@/utilities/toast'
import { fieldErrors } from '@/utilities/apiErrors'

export default {
    components: {
        EnterPasswordModal,
        BackupCodesModal
    },
    setup() {
        const deleteError = ref({})
        const backupError = ref({})
        const refDialog = ref()
        const backupPasswordDialog = ref()
        const backupCodesDialog = ref()
        const remaining = ref(null)
        const store = useStore()

        const loadRemaining = () => {
            store.dispatch('backupCodesStatus')
                .then(response => { remaining.value = response.data.remaining })
                .catch(() => { remaining.value = null })
        }
        onMounted(loadRemaining)

        const startBackupCodes = () => {
            backupError.value = {}
            backupPasswordDialog.value.showModal()
        }

        const generateBackupCodes = password => {
            backupError.value = {}
            store.dispatch('regenerateBackupCodes', password)
                .then(response => {
                    backupPasswordDialog.value.close()
                    backupCodesDialog.value.showModal(response.data.codes)
                })
                .catch(e => { backupError.value = fieldErrors(e) })
        }
        const deleteMethod = async () => {
            refDialog.value.showModal()
        }

        async function getAuthUser() {
            await store.dispatch('getAuthUser').catch(e => {
                toast(e.response.data.error || e.response.data.msg, 'error')
            })
        }

        const response = password => {
            if(!password) {
                deleteError.value = {password: 'Required'}
            } else {
                deleteError.value = {}
                store.dispatch('totpDelete', {password: password})
                    .then(() => {
                        getAuthUser()
                        refDialog.value.close()
                    })
                    .catch(e => {
                        deleteError.value = fieldErrors(e)
                    })
            }
        }
        const cancel = () => console.log('you canceled')

        return {
            remaining,
            backupError,
            backupPasswordDialog,
            backupCodesDialog,
            startBackupCodes,
            generateBackupCodes,
            loadRemaining,
            deleteMethod,
            reconfigure: () => console.log('reconfigure clicked...'),
            user: computed(() => store.getters.user),
            refDialog,
            deleteError,
            cancel,
            response
        }
    },
}
</script>