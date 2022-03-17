<template>
    <div class="page-heading">
        <div class="page-title">
            <div class="row justify-content-between">
                <div class="col-12 col-md-6 order-md-1 order-last">
                    <h3>Authentication</h3>
                </div>
                <div class="col-12 col-md-6 order-md-2 order-first">
                </div>
            </div>
        </div>
    </div>
    <div class="page-content">
        <section id="multiple-column-form">
            <div class="row match-height">

                    <div class="card">
                        <div class="card-header">
                            <h4>Authentication</h4>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-8">
                                    <h6>Password</h6>
                                    <p class="text-muted">Change your password any time. This does not affect your two-factor authentication configuration.</p>
                                </div>
                                <div class="col-4">
                                    <div class="buttons">
                                        <a @click="$refs.refDialog.showModal()" href="#" class="btn btn-primary">Change</a>
                                    </div>
                                </div>
                            </div>

                            <hr>

                            <div class="row">
                                <div class="col-8">
                                    <h6>Two-Factor Authentication <span :class="`badge bg-light-${user.isTwoFactorAuth ? 'success' : 'danger'}`">{{ user.isTwoFactorAuth ? 'Enabled' : 'Disabled' }}</span></h6>
                                    <p v-if="!user.isTwoFactorAuth">Secure your account by enabling two-factor authentication. After setup, there will be generated recovery codes to use if you get locked out of your account.</p>
                                    <p v-if="user.isTwoFactorAuth">Mobile two-factor authentication is active.</p>
                                </div>
                                <div class="col-4">
                                    <div class="buttons">
                                        <router-link v-if="user.isTwoFactorAuth" :to="{ name: 'AuthManagement' }" class="btn btn-primary">Manage</router-link>
                                        <router-link v-else-if="!user.isTwoFactorAuth" :to="{ name: 'AuthManagement' }" class="btn btn-primary">Set up</router-link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

            </div>
        </section>
    </div>

    <teleport to="body">
        <ChangePasswordModal ref="refDialog" />
    </teleport>
</template>
<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import ChangePasswordModal from '@/components/authentication/ChangePasswordModal'

export default {
    components: {
        ChangePasswordModal
    },
    setup() {
        
        const store = useStore()
        const change = () => {
            console.log('fn, called')
            ChangePasswordModal.showModal()
        }
        return {
            user: computed(() => store.getters.user),
            change
        }
    },
}
</script>