<template>
    <input
        type="checkbox"
        :checked="modelValue"
        @change="$emit('update:modelValue', $event.target.checked)"
        class="form-check-input"
        :id="uuid"
    />
    <label :for="uuid" v-if="label">{{ label }}</label>
</template>
<script>
import UniqueID from '@/composables/UniqueID'
export default {
    props: {
        label: {
            type: String,
            default: ''
        },
        modelValue: {
            type: Boolean,
            default: false
        }
    },
    setup() {
        const uuid = UniqueID().getID()
        return {
            uuid
        }
    },
}
</script>