<template>
    <Sidebar />

    <div id="main" class="layout-navbar">
        <Header />
        <div id="main-content">
            <router-view />
            <Footer />
        </div>
    </div>
</template>
<script>
import Sidebar from './Sidebar'
import Header from './Header'
import Footer from './Footer'

export default {
    components: {
        Sidebar,
        Header,
        Footer
    },
}
</script>
<style>
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