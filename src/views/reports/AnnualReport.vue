<template>
    <div class="page-heading">
        <h3>Annual Report</h3>
    </div>
    <div class="page-content">
        {{ AnnualReport }}
    </div>
</template>
<script>
export default {
    setup() {
        return {
            AnnualReport: "This is Annual Report"
        }
    },
}
</script>