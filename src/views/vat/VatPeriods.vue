<template>
    <div class="page-heading">
        <div class="page-title">
            <h3>VAT periods</h3>
            <p class="text-subtitle text-muted">
                Settle a period when it has ended, then enter the figures in TastSelv Erhverv and mark it as filed.
            </p>
        </div>
    </div>
    <div class="page-content">
        <section class="section">
            <div v-if="!data" class="card">
                <div class="card-body">Loading...</div>
            </div>
            <div v-else-if="!data.vat_period_type" class="not-registered card">
                <div class="card-body">
                    The organization is not VAT-registered. Choose its VAT period in the
                    <router-link :to="{ name: 'Organization', params: { id: user?.organizationId } }"
                        >organization settings</router-link
                    >
                    to use VAT codes and these screens.
                </div>
            </div>
            <template v-else>
                <div class="open-period card">
                    <div class="card-header">The open period</div>
                    <div class="card-body">
                        <template v-if="open">
                            <dl class="row mb-3">
                                <dt class="col-sm-2">Period</dt>
                                <dd class="period col-sm-10">{{ open.start_date }} to {{ open.end_date }}</dd>
                                <dt class="col-sm-2">Due</dt>
                                <dd class="due col-sm-10">
                                    {{ open.due_date }}
                                    <span v-if="overdue(open.due_date)" class="overdue badge bg-danger ms-2"
                                        >Overdue</span
                                    >
                                </dd>
                                <dt class="col-sm-2">Status</dt>
                                <dd class="status col-sm-10">
                                    <span class="badge" :class="open.ended ? 'bg-info' : 'bg-secondary'">{{
                                        open.ended ? 'Ended' : 'Running'
                                    }}</span>
                                </dd>
                            </dl>
                            <p v-if="open.blocked_by" class="blocked text-danger">{{ open.blocked_by }}</p>
                            <router-link class="report-link btn btn-outline-secondary me-1" :to="reportLink(open)"
                                >VAT report</router-link
                            >
                            <button
                                type="button"
                                class="settle btn btn-primary"
                                :disabled="!open.can_settle || busy"
                                @click="settle"
                            >
                                Settle period
                            </button>
                        </template>
                        <p v-else class="no-open mb-0">
                            There is no open period yet: the first one starts when something is posted with a VAT code.
                        </p>
                        <p class="text-muted mt-3 mb-0">
                            The due date is calculated, and moved past a weekend. Holidays and the exceptions of the tax
                            authority are not known here: check the deadline at
                            <a
                                href="https://skat.dk/erhverv/moms/frister-indberet-og-betal-moms"
                                target="_blank"
                                rel="noopener noreferrer"
                                >skat.dk</a
                            >
                            and correct it on a settled period if it differs.
                        </p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        Settled periods
                        <span class="badge bg-secondary">{{ data.periods.length }}</span>
                    </div>
                    <div class="card-body">
                        <table class="periods table">
                            <thead>
                                <tr>
                                    <th>Period</th>
                                    <th>Due</th>
                                    <th>Status</th>
                                    <th>Voucher</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <template v-if="data.periods.length">
                                    <template v-for="period in data.periods" :key="period.id">
                                        <tr class="period-row">
                                            <td>{{ period.start_date }} to {{ period.end_date }}</td>
                                            <td>
                                                {{ period.due_date }}
                                                <span
                                                    v-if="period.status === 'settled' && overdue(period.due_date)"
                                                    class="overdue badge bg-danger ms-1"
                                                    >Overdue</span
                                                >
                                            </td>
                                            <td>
                                                <span
                                                    class="state badge"
                                                    :class="period.status === 'filed' ? 'bg-success' : 'bg-warning'"
                                                    >{{ period.status === 'filed' ? 'Filed' : 'Settled' }}</span
                                                >
                                                <span v-if="period.status === 'filed'" class="filed-on small ms-2">
                                                    {{ period.filed_on
                                                    }}<template v-if="period.reference"
                                                        >, {{ period.reference }}</template
                                                    >
                                                </span>
                                            </td>
                                            <td>
                                                <router-link
                                                    v-if="period.settlement_entry_id"
                                                    class="voucher-link"
                                                    :to="{
                                                        name: 'ShowVoucher',
                                                        params: { entryId: period.settlement_entry_id },
                                                    }"
                                                    >{{ period.settlement_voucher_no }}</router-link
                                                >
                                                <span v-else class="text-muted" title="Nothing had to be moved"
                                                    >none</span
                                                >
                                            </td>
                                            <td class="text-end">
                                                <router-link
                                                    class="report-link btn btn-sm btn-outline-secondary me-1"
                                                    :to="reportLink(period)"
                                                    >Report</router-link
                                                >
                                                <button
                                                    v-if="period.status === 'settled'"
                                                    type="button"
                                                    class="file btn btn-sm btn-outline-primary me-1"
                                                    @click="edit(period, 'file')"
                                                >
                                                    Mark as filed
                                                </button>
                                                <button
                                                    type="button"
                                                    class="due btn btn-sm btn-outline-secondary"
                                                    @click="edit(period, 'due')"
                                                >
                                                    Change due date
                                                </button>
                                            </td>
                                        </tr>
                                        <tr v-if="editing && editing.id === period.id" class="editor">
                                            <td colspan="5">
                                                <form class="row g-2 align-items-end" @submit.prevent="save(period)">
                                                    <template v-if="editing.kind === 'file'">
                                                        <div class="col-auto">
                                                            <label class="form-label" for="filed-on">Filed on</label>
                                                            <input
                                                                id="filed-on"
                                                                v-model="editing.date"
                                                                type="date"
                                                                class="filed-on-input form-control"
                                                                :class="{ 'is-invalid': editing.error }"
                                                            />
                                                        </div>
                                                        <div class="col-auto">
                                                            <label class="form-label" for="reference"
                                                                >Reference (optional)</label
                                                            >
                                                            <input
                                                                id="reference"
                                                                v-model="editing.reference"
                                                                type="text"
                                                                maxlength="100"
                                                                class="reference-input form-control"
                                                            />
                                                        </div>
                                                    </template>
                                                    <div v-else class="col-auto">
                                                        <label class="form-label" for="due-date">Due date</label>
                                                        <input
                                                            id="due-date"
                                                            v-model="editing.date"
                                                            type="date"
                                                            class="due-input form-control"
                                                            :class="{ 'is-invalid': editing.error }"
                                                        />
                                                    </div>
                                                    <div class="col-auto">
                                                        <button
                                                            type="submit"
                                                            class="save btn btn-primary me-1"
                                                            :disabled="busy"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            type="button"
                                                            class="cancel btn btn-outline-secondary"
                                                            @click="editing = null"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                    <div v-if="editing.error" class="editor-error col-12 text-danger">
                                                        {{ editing.error }}
                                                    </div>
                                                </form>
                                            </td>
                                        </tr>
                                    </template>
                                </template>
                                <tr v-else>
                                    <td colspan="5">No period has been settled yet.</td>
                                </tr>
                            </tbody>
                        </table>
                        <p class="text-muted mb-0">
                            A settled period cannot be changed: entries that touch VAT can no longer be dated in it. A
                            mistake is corrected in a later period.
                        </p>
                    </div>
                </div>
            </template>
        </section>
    </div>
    <teleport to="body">
        <PromiseDialog ref="refDialog" />
    </teleport>
</template>
<script>
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import VatPeriodService from '@/services/VatPeriodService'
import { toast } from '@/utilities/toast'
import { apiErrorMessage } from '@/utilities/apiErrors'
import { todayIso } from '@/utilities/mydate'

export default {
    name: 'VatPeriods',
    setup() {
        const store = useStore()
        const refDialog = ref()
        const data = ref(null)
        const editing = ref(null)
        const busy = ref(false)

        const load = async () => {
            try {
                data.value = (await VatPeriodService.getAll()).data
            } catch (e) {
                toast(apiErrorMessage(e), 'error')
            }
        }
        onMounted(load)

        // Run one change at a time: the buttons are disabled while it is under way
        const run = async (action, done) => {
            busy.value = true
            try {
                const response = await action()
                toast(done(response.data), 'success')
                editing.value = null
                await load()
                return true
            } catch (e) {
                toast(apiErrorMessage(e), 'error')
                return false
            } finally {
                busy.value = false
            }
        }

        const settle = async () => {
            const period = data.value.open_period
            refDialog.value.data = {
                type: 'warning',
                title: 'Settle the VAT period',
                content:
                    `Settle ${period.start_date} to ${period.end_date}? A voucher moves the VAT of the period to the ` +
                    'account for VAT payable, and entries that touch VAT can no longer be dated in the period. ' +
                    'It cannot be undone.',
                accept: 'Yes, settle',
                reject: 'Cancel',
            }
            if ((await refDialog.value.showModal()) !== true) return
            await run(
                () => VatPeriodService.settle(),
                (settled) =>
                    settled.settlement_voucher_no
                        ? `Period settled with voucher ${settled.settlement_voucher_no}`
                        : 'Period settled: there was no VAT to move',
            )
        }

        const edit = (period, kind) => {
            editing.value = {
                id: period.id,
                kind,
                date: kind === 'file' ? todayIso() : period.due_date,
                reference: '',
                error: '',
            }
        }

        const save = async (period) => {
            const form = editing.value
            if (!form.date) {
                form.error = 'Enter a date'
                return
            }
            if (form.date <= period.end_date) {
                form.error =
                    form.kind === 'file'
                        ? 'The return cannot be filed before the period ends'
                        : 'The due date must be after the period ends'
                return
            }
            if (form.kind === 'file' && form.date > todayIso()) {
                form.error = 'The filing date cannot be in the future'
                return
            }
            form.error = ''
            if (form.kind === 'file') {
                await run(
                    () =>
                        VatPeriodService.file(period.id, {
                            filed_on: form.date,
                            reference: form.reference.trim() || null,
                        }),
                    () => 'Period marked as filed',
                )
            } else {
                await run(
                    () => VatPeriodService.changeDueDate(period.id, form.date),
                    () => 'Due date changed',
                )
            }
        }

        return {
            refDialog,
            data,
            editing,
            busy,
            user: computed(() => store.getters.user),
            open: computed(() => data.value?.open_period || null),
            settle,
            edit,
            save,
            overdue: (dueDate) => dueDate < todayIso(),
            reportLink: (period) => ({
                name: 'VatReport',
                query: { from: period.start_date, to: period.end_date },
            }),
        }
    },
}
</script>
