<template>
    <tr>
        <td class="w-50"> {{ theLine.description }} </td>
        <td class="w-12 text-end"> {{ $filters.toFloat(theLine.quantity) }} </td>
        <td class="w-12 text-end"> {{ $filters.toCurrency(theLine.unit_price) }} </td>
        <td class="w-10 total text-end">{{ $filters.toCurrency(total) }}</td>
    </tr>
</template>
<script>
import { computed } from 'vue'
export default {
    props: {
        theLine: {
            type: Object,
            required: true
        },
    },
    setup(props) {
        
        return {
            total: computed(() => parseFloat(props.theLine.quantity * props.theLine.unit_price))
        }
    },
}
</script>
<style scoped>
.table > :not(caption) > * > * {
    padding: 0 0.5rem;
}
</style>