<template>
    <tr>
        <td class="w-50">{{ theLine.description }}</td>
        <td class="w-12 text-end">{{ $filters.toFloat(theLine.quantity) }}</td>
        <td class="w-12 text-end">{{ $filters.toCurrency(theLine.unit_price) }}</td>
        <td class="w-10 total text-end">{{ $filters.toCurrency(theLine.amount) }}</td>
    </tr>
</template>
<script>
export default {
    props: {
        theLine: {
            type: Object,
            required: true,
        },
    },
}
</script>
<style scoped>
.table > :not(caption) > * > * {
    padding: 0 0.5rem;
}
</style>
