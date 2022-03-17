<template>
    <label v-if="label">{{ label }}</label>
    <select
        class="form-select"
        :value="modelValue"
        v-bind="{
            ...$attrs,
            onChange: ($event) => { $emit('update:modelValue', $event.target.value) }
        }"
    >
        <option value=0>Select {{label}}</option>
        <option
            v-for="option in options"
            :value="option.id"
            :key="option.id"
            :selected="option.id === modelValue"
        >{{ option.name }}</option>
    </select>
    <p
        v-if="error"
        class="invalid-feedback"
        aria-live="assertive"
    >
        {{ error }}
    </p>
</template>

<script>
export default {
    props: {
        label: {
            type: String,
            default: ''
        },
        modelValue: {
            required: true,
            type:  [Number],
            default: 0,
        },
        options: {
            type: Array,
            required: true
        },
        error: {
            type: [String, Array],
            default: ''
        }
    }
}
</script>