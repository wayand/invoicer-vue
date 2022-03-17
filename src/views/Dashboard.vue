<template>
    <div class="page-heading">
        <h3>Profile Statistics</h3>
    </div>
    <div class="page-content">
        {{ Dashboard }}
    </div>
</template>
<script>
import { ref } from 'vue'
export default {
    setup() {
        const Dashboard =  ref('')

        return {
            Dashboard: Dashboard.value = 'Hejsa DashBoard'
        }
    },
}
</script>
<style>
</style>