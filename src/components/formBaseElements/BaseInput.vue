<template>
    <label :for="uuid" v-if="label">{{ label }}</label>
    <input
        v-bind="$attrs"
        :value="modelValue"
        :placeholder="label"
        @input="$emit('update:modelValue', $event.target.value)"
        class="form-control"
        :id="uuid"
        :aria-describedby="error ? `${uuid}-error` : null"
        :aria-invalid="error ? true : null"
    >
    <p
        v-if="error"
        class="invalid-feedback"
        :id="`${uuid}-error`"
        aria-live="assertive"
    >
        {{ error }}
    </p>
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
            type: [String, Number],
            default: ''
        },
        error: {
            type: [String, Array],
            default: ''
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