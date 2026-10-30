<template>
    <div class="row g-2 align-items-end">
        <div class="col-auto">
            <label class="form-label" for="report-from">From</label>
            <input
                id="report-from"
                type="date"
                class="form-control"
                :class="{ 'is-invalid': error }"
                :value="from"
                @input="$emit('update:from', $event.target.value)"
            />
        </div>
        <div class="col-auto">
            <label class="form-label" for="report-to">To</label>
            <input
                id="report-to"
                type="date"
                class="form-control"
                :class="{ 'is-invalid': error }"
                :value="to"
                @input="$emit('update:to', $event.target.value)"
            />
        </div>
        <div class="col-auto">
            <div class="btn-group" role="group" aria-label="Quick ranges">
                <button type="button" class="range-this-year btn btn-outline-secondary" @click="pick(thisYear)">
                    This year
                </button>
                <button type="button" class="range-last-year btn btn-outline-secondary" @click="pick(lastYear)">
                    Last year
                </button>
                <button type="button" class="range-all btn btn-outline-secondary" @click="pick({ from: '', to: '' })">
                    All time
                </button>
            </div>
        </div>
        <div v-if="error" class="range-error col-12 text-danger">{{ error }}</div>
    </div>
</template>
<script>
import { yearRange } from '@/utilities/mydate'

export default {
    name: 'DateRange',
    props: {
        from: { type: String, default: '' },
        to: { type: String, default: '' },
        error: { type: String, default: '' },
    },
    emits: ['update:from', 'update:to'],
    setup(props, { emit }) {
        const year = new Date().getFullYear()
        const pick = ({ from, to }) => {
            emit('update:from', from)
            emit('update:to', to)
        }
        return { pick, thisYear: yearRange(year), lastYear: yearRange(year - 1) }
    },
}
</script>
