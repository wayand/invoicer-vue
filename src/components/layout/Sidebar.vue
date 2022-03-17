<template>    
    <div id="sidebar" class="active">
        <div class="sidebar-wrapper active">
            <div class="sidebar-header">
                <div class="d-flex justify-content-between">
                    <div class="logo">
                        <router-link :to="{ name: 'Dashboard' }">
                            <img src="/assets/images/logo/logo.png" alt="Logo" srcset="">
                        </router-link>
                    </div>
                    <div class="toggler">
                        <a href="#" class="sidebar-hide d-xl-none d-block"><i class="bi bi-x bi-middle"></i></a>
                    </div>
                </div>
            </div>
            <div class="sidebar-menu">
                <ul class="menu">
                    <li class="sidebar-title">Menu</li>

                    <li :class="{ active: isActive('/') }" class="sidebar-item">
                        <router-link :to="{ name: 'Dashboard' }" class='sidebar-link'>
                            <i class="bi bi-grid-fill"></i>
                            <span>Dashboard</span>
                        </router-link>
                    </li>
                    
                    <li :class="{ active: isActive('/invoices') }" class="sidebar-item has-sub">
                        <a href="#" class='sidebar-link'>
                            <i class="bi bi-stack"></i>
                            <span>Invoices</span>
                        </a>
                        <ul class="submenu" :class="{ active: isActive('/invoices') }">
                            <li class="submenu-item" :class="{ active: isActive('/invoices') }">
                                <router-link :to="{ name: 'Invoices' }">All</router-link>
                            </li>
                            <li class="submenu-item" :class="{ active: isActive('/invoices/new') }">
                                <router-link :to="{ name: 'NewInvoice' }">Create new</router-link>
                            </li>
                        </ul>
                    </li>

                    <li :class="{ active: isActive('/reports') }" class="sidebar-item has-sub">
                        <a href="#" class='sidebar-link'>
                            <i class="bi bi-clipboard-data"></i>
                            <span>Reports</span>
                        </a>
                        <ul class="submenu" :class="{ active: isActive('/reports') }">
                            <li class="submenu-item" :class="{ active: isActive('/reports/annual-report') }">
                                <router-link :to="{ name: 'AnnualReport' }">Annual report</router-link>
                            </li>
                        </ul>
                    </li>

                    <li :class="{ active: isActive('/settings') }" class="sidebar-item has-sub">
                        <a href="#" class='sidebar-link'>
                            <i class="bi bi-gear-fill"></i>
                            <span>Settings</span>
                        </a>
                        <ul class="submenu" :class="{ active: isActive('/settings') }">
                            <li class="submenu-item" :class="{ active: isActive('/settings/organization') }">
                                <router-link :to="{ name: 'Organization', params: { id: user?.organizationId } }">Organization</router-link>
                            </li>
                            <li class="submenu-item" :class="{ active: isActive('/settings/clients') }">
                                <router-link :to="{ name: 'Clients' }">Clients</router-link>
                            </li>
                            <li class="submenu-item" :class="{ active: isActive('/settings/products') }">
                                <router-link :to="{ name: 'Products' }">Products</router-link>
                            </li>
                            <li class="submenu-item" :class="{ active: isActive('/settings/authentication') }">
                                <router-link :to="{ name: 'Authentication' }">Authentication</router-link>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
            <button class="sidebar-toggler btn x"><i data-feather="x"></i></button>
        </div>
    </div>
</template>
<script>
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { computed } from 'vue'
export default {
    setup() {
        const store = useStore()
        const router = useRouter()
        const activeRoute = computed(() => router.currentRoute.value.path)
        return {
            user: computed(() => store.getters.user),
            isActive: to => {
                if (to == '/') return to === activeRoute.value
                return activeRoute.value.startsWith(to)
            }
        }
    },
}
</script>
<style scoped>

</style>