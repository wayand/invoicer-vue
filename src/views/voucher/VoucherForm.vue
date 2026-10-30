<template>
    <div class="page-heading">
        <div class="page-title">
            <div class="row justify-content-between">
                <div class="col-12 col-md-6 order-md-1 order-last">
                    <h3>New voucher</h3>
                    <p class="text-subtitle text-muted">A manual entry: what is debited must equal what is credited</p>
                </div>
                <div class="col-12 col-md-6 order-md-2 order-first" style="text-align: right">
                    <router-link :to="{ name: 'Vouchers' }" class="btn btn-outline-secondary me-1 mb-1"
                        >Cancel</router-link
                    >
                    <button type="submit" form="voucher-form" class="btn btn-primary me-1 mb-1" :disabled="saving">
                        Post voucher
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div class="page-content">
        <section class="section">
            <div class="card">
                <div class="card-body">
                    <form id="voucher-form" @submit.prevent="save" novalidate>
                        <div class="row mb-4">
                            <div class="col-md-3">
                                <label class="form-label" for="voucher-date">Date</label>
                                <input
                                    id="voucher-date"
                                    type="date"
                                    class="date form-control"
                                    :class="{ 'is-invalid': showErrors && errors.date }"
                                    v-model="voucher.entry_date"
                                />
                                <div v-if="showErrors && errors.date" class="invalid-feedback">{{ errors.date }}</div>
                            </div>
                            <div class="col-md-9">
                                <label class="form-label" for="voucher-description">Description</label>
                                <input
                                    id="voucher-description"
                                    type="text"
                                    class="description form-control"
                                    maxlength="255"
                                    :class="{ 'is-invalid': showErrors && errors.description }"
                                    v-model="voucher.description"
                                />
                                <div v-if="showErrors && errors.description" class="invalid-feedback">
                                    {{ errors.description }}
                                </div>
                            </div>
                        </div>

                        <table class="table">
                            <thead>
                                <tr>
                                    <th style="width: 32%">Account</th>
                                    <th>Text</th>
                                    <th style="width: 14%" class="text-end">Debit</th>
                                    <th style="width: 14%" class="text-end">Credit</th>
                                    <th style="width: 4%"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <template v-for="(line, index) in voucher.lines" :key="line.key">
                                    <tr class="line">
                                        <td>
                                            <select
                                                class="account form-select"
                                                :class="{ 'is-invalid': showErrors && errors.lines[index] }"
                                                v-model.number="line.account_id"
                                            >
                                                <option :value="-1">Select account</option>
                                                <option
                                                    v-for="account in accounts"
                                                    :key="account.id"
                                                    :value="account.id"
                                                >
                                                    {{ account.number }} {{ account.name }}
                                                </option>
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                class="line-description form-control"
                                                maxlength="255"
                                                v-model="line.description"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                class="debit form-control text-end"
                                                :class="{ 'is-invalid': showErrors && errors.lines[index] }"
                                                v-model.number="line.debit"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                class="credit form-control text-end"
                                                :class="{ 'is-invalid': showErrors && errors.lines[index] }"
                                                v-model.number="line.credit"
                                            />
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                class="remove-line btn btn-sm btn-outline-secondary"
                                                :disabled="voucher.lines.length <= MIN_LINES"
                                                title="Remove line"
                                                @click="removeLine(index)"
                                            >
                                                &times;
                                            </button>
                                        </td>
                                    </tr>
                                    <tr v-if="showErrors && errors.lines[index]" class="line-error">
                                        <td colspan="5" class="text-danger small">
                                            Line {{ index + 1 }}: {{ errors.lines[index] }}
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                            <tfoot>
                                <tr class="fw-bold">
                                    <td colspan="2">
                                        <button type="button" class="add-line btn btn-outline-primary" @click="addLine">
                                            Add line
                                        </button>
                                    </td>
                                    <td class="total-debit text-end">{{ $filters.toCurrency(totals.debit) }}</td>
                                    <td class="total-credit text-end">{{ $filters.toCurrency(totals.credit) }}</td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td colspan="2" class="text-end">Difference</td>
                                    <td colspan="2" class="difference text-end">
                                        <span
                                            :class="
                                                balanced ? 'text-success' : totals.difference !== 0 ? 'text-danger' : ''
                                            "
                                        >
                                            {{ $filters.toCurrency(totals.difference) }}
                                        </span>
                                        <span v-if="balanced" class="badge bg-success ms-2">Balanced</span>
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                        <div v-if="showErrors && errors.balance" class="balance-error text-danger mb-3">
                            {{ errors.balance }}
                        </div>
                    </form>
                </div>
            </div>
        </section>
    </div>
    <teleport to="body">
        <PromiseDialog ref="refDialog" />
    </teleport>
</template>
<script>
import { computed, onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { toast } from '@/utilities/toast'
import { apiErrorMessage } from '@/utilities/apiErrors'
import { roundAmount, voucherTotals } from '@/utilities/money'
import { todayIso } from '@/utilities/mydate'

const MIN_LINES = 2
const MAX_TEXT = 255

export default {
    name: 'VoucherForm',
    setup() {
        const store = useStore()
        const router = useRouter()
        const refDialog = ref()
        const showErrors = ref(false)
        const saving = ref(false)
        const saved = ref(false)

        let nextKey = 0
        const newLine = () => ({ key: nextKey++, account_id: -1, debit: '', credit: '', description: '' })
        const voucher = reactive({
            entry_date: todayIso(),
            description: '',
            lines: [newLine(), newLine()],
        })
        // The key only identifies a line on the screen: it is not part of what changes the voucher
        const content = () => JSON.stringify({ ...voucher, lines: voucher.lines.map(({ key, ...line }) => line) }) // eslint-disable-line no-unused-vars
        const initial = content()
        const isChanged = computed(() => !saved.value && content() !== initial)

        onBeforeRouteLeave(async () => {
            if (!isChanged.value) return true
            refDialog.value.data = {
                type: 'warning',
                title: 'Confirm navigation',
                content: 'This voucher has not been posted yet. Do you really want to leave this page?',
                accept: 'Yes leave',
                reject: 'Stay here',
            }
            return (await refDialog.value.showModal()) === true
        })

        onMounted(() => store.dispatch('fetchAccounts').catch((e) => toast(apiErrorMessage(e), 'error')))

        // Archived accounts cannot be posted to
        const accounts = computed(() =>
            store.getters.accounts.filter((account) => !account.is_archived).sort((a, b) => a.number - b.number),
        )
        const totals = computed(() => voucherTotals(voucher.lines))
        const balanced = computed(() => totals.value.difference === 0 && totals.value.debit > 0)

        const errors = computed(() => {
            const found = { lines: voucher.lines.map(lineError) }
            if (!voucher.entry_date) found.date = 'The date is required'
            const text = voucher.description.trim()
            if (!text) found.description = 'The description is required'
            else if (text.length > MAX_TEXT) found.description = `At most ${MAX_TEXT} characters`
            if (totals.value.difference !== 0) {
                found.balance = `The voucher does not balance: the difference is ${totals.value.difference.toFixed(2)}`
            }
            return found
        })
        const isValid = computed(
            () =>
                !errors.value.date &&
                !errors.value.description &&
                !errors.value.balance &&
                !errors.value.lines.some(Boolean),
        )

        const addLine = () => voucher.lines.push(newLine())
        const removeLine = (index) => {
            if (voucher.lines.length > MIN_LINES) voucher.lines.splice(index, 1)
        }

        const save = async () => {
            // Pressing Enter twice must not post twice: the button is only one way to submit
            if (saving.value || saved.value) return
            showErrors.value = true
            if (!isValid.value) return
            saving.value = true
            try {
                const response = await store.dispatch('createJournalEntry', {
                    entry_date: voucher.entry_date,
                    description: voucher.description.trim(),
                    lines: voucher.lines.map((line) => ({
                        account_id: line.account_id,
                        debit: roundAmount(line.debit),
                        credit: roundAmount(line.credit),
                        description: line.description.trim() || null,
                    })),
                })
                saved.value = true
                toast('Voucher ' + response.data.voucher_no + ' posted', 'success')
                router.push({ name: 'ShowVoucher', params: { entryId: response.data.id } })
            } catch (e) {
                toast(apiErrorMessage(e), 'error')
            } finally {
                saving.value = false
            }
        }

        return {
            MIN_LINES,
            refDialog,
            voucher,
            accounts,
            totals,
            balanced,
            errors,
            showErrors,
            saving,
            addLine,
            removeLine,
            save,
        }
    },
}

// What is wrong with a line, or null. A line is either a debit or a credit: not both, not neither.
function lineError(line) {
    if (line.account_id === -1) return 'Select an account'
    const debit = roundAmount(line.debit)
    const credit = roundAmount(line.credit)
    if (debit < 0 || credit < 0) return 'An amount cannot be negative'
    if (debit > 0 && credit > 0) return 'Use either debit or credit, not both'
    if (debit === 0 && credit === 0) return 'Enter a debit or a credit above 0'
    return null
}
</script>
