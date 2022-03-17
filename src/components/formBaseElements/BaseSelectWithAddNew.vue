<template>
    <label :for="uuid" v-if="label">{{ label }}</label>
    <select
        :id="uuid"
        class="form-select"
        :value="modelValue"
        v-bind="{
            ...$attrs,
            onChange: ($event) => { $emit('update:modelValue', $event.target.value) }
        }"
    >
        <optgroup label="">
            <option value="-1">Select {{ name }}</option>
            <option
                v-for="option in options"
                :value="option.id"
                :key="option.id"
                :selected="option.id == modelValue"
                >{{ option.name }}</option>
        </optgroup>
        <optgroup label="">
            <option value="new">+ Create {{ name }}</option>
        </optgroup>
    </select>
</template>
<script>
import UniqueID from '@/composables/UniqueID'
export default {
    props: {
        name: {
            type: String,
            default: 'new'
        },
        label: {
            type: String,
            default: ''
        },
        modelValue: {
            type: [String, Number],
            default: ''
        },
        options: {
            type: Array,
            required: true
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