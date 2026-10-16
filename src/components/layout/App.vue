<template>
    <AppSidebar />

    <div id="main" class="layout-navbar">
        <AppHeader />
        <div id="main-content">
            <router-view />
            <AppFooter />
        </div>
    </div>
</template>
<script>
import AppSidebar from './Sidebar'
import AppHeader from './Header'
import AppFooter from './Footer'

export default {
    components: {
        AppSidebar,
        AppHeader,
        AppFooter
    },
}
</script>
<style lang="scss">
@import "@/assets/scss/app.scss";
@import "@/assets/scss/themes/dark/app-dark.scss";
@import "@/assets/scss/iconly.scss";

    .page-content {
        min-width: 1024px;
    }
    .sidebar-backdrop {
        background-color: rgba(0,0,0,.5);
        height: 100%;
        left: 0;
        position: fixed;
        top: 0;
        width: 100%;
        z-index: 9;
    }
</style>