<template>
    <div class="page-heading">
        <h3>Profile Statistics</h3>
    </div>
    <div class="page-content">
        {{ Dashboard }}
        <ResultsBarChart />
    </div>
</template>
<script>
import { ref } from 'vue'
import ResultsBarChart from '@/components/dashboard/ResultsBarChart'

export default {
    components: {
        ResultsBarChart
    },
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
