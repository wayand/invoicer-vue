<template>
    <div class="page-heading">
        <div class="page-title">
            <h3>VAT report</h3>
            <p class="text-subtitle text-muted">
                The figures of the VAT return for a period, taken from the books, and checked against the VAT accounts.
            </p>
        </div>
    </div>
    <div class="page-content">
        <section class="section">
            <div class="card">
                <div class="card-body">
                    <DateRange v-model:from="from" v-model:to="to" :error="rangeError" />
                    <div class="btn-group mt-2" role="group" aria-label="Quarters">
                        <button
                            type="button"
                            class="range-this-quarter btn btn-outline-secondary"
                            @click="pick(thisQuarter)"
                        >
                            This quarter
                        </button>
                        <button
                            type="button"
                            class="range-last-quarter btn btn-outline-secondary"
                            @click="pick(lastQuarter)"
                        >
                            Last quarter
                        </button>
                    </div>
                </div>
            </div>

            <template v-if="report">
                <div class="card">
                    <div class="card-header">
                        The return
                        <span class="ties badge ms-2" :class="report.ledger_check.ties ? 'bg-success' : 'bg-danger'">{{
                            report.ledger_check.ties ? 'Agrees with the ledger' : 'Does not agree with the ledger'
                        }}</span>
                    </div>
                    <div class="card-body">
                        <table class="figures table">
                            <tbody>
                                <tr class="sales-vat">
                                    <td>Salgsmoms (VAT on sales)</td>
                                    <td class="text-end">{{ $filters.toCurrency(report.sales_vat) }}</td>
                                </tr>
                                <tr class="eu-goods-vat">
                                    <td>Moms af varekøb i udlandet (VAT on goods bought abroad)</td>
                                    <td class="text-end">{{ $filters.toCurrency(report.eu_goods_vat) }}</td>
                                </tr>
                                <tr class="eu-services-vat">
                                    <td>Moms af ydelseskøb i udlandet (VAT on services bought abroad)</td>
                                    <td class="text-end">{{ $filters.toCurrency(report.eu_services_vat) }}</td>
                                </tr>
                                <tr class="input-vat">
                                    <td>Købsmoms (input VAT, deducted)</td>
                                    <td class="text-end">
                                        {{ $filters.toCurrency(report.input_vat === 0 ? 0 : 0 - report.input_vat) }}
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr class="total fw-bold">
                                    <td>{{ toPay ? 'VAT to pay' : 'VAT to be refunded' }}</td>
                                    <td class="text-end">{{ $filters.toCurrency(Math.abs(report.total_to_pay)) }}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <h6>Net amounts, without VAT</h6>
                        <table class="boxes table">
                            <tbody>
                                <tr v-for="box in boxes" :key="box.key" :class="'box-' + box.key">
                                    <td>{{ box.label }}</td>
                                    <td class="text-end">{{ $filters.toCurrency(report.boxes[box.key]) }}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p class="text-muted mb-0">
                            Check the figures against the return in TastSelv Erhverv before you file. The boxes follow
                            the guidance of the tax authority, and the screen has not been compared with the form
                            itself.
                        </p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        By VAT code
                        <span class="badge bg-secondary">{{ report.codes.length }}</span>
                    </div>
                    <div class="card-body">
                        <table class="codes table table-hover">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th class="text-end">Net amount</th>
                                    <th class="text-end">Rate</th>
                                    <th class="text-end">Sales VAT</th>
                                    <th class="text-end">Input VAT</th>
                                    <th class="text-end">VAT abroad</th>
                                    <th class="text-end">Not deducted</th>
                                </tr>
                            </thead>
                            <tbody>
                                <template v-if="report.codes.length">
                                    <tr v-for="code in report.codes" :key="code.code" class="code">
                                        <td :title="code.title">{{ code.code }} {{ code.title }}</td>
                                        <td class="base text-end">{{ $filters.toCurrency(code.base) }}</td>
                                        <td class="rate text-end">{{ percent(code.rate) }}</td>
                                        <td class="output text-end">{{ $filters.toCurrency(code.output_vat) }}</td>
                                        <td class="input text-end">{{ $filters.toCurrency(code.input_vat) }}</td>
                                        <td class="acquisition text-end">
                                            {{ $filters.toCurrency(code.acquisition_vat) }}
                                        </td>
                                        <td class="nondeductible text-end">
                                            {{ $filters.toCurrency(code.nondeductible_vat) }}
                                        </td>
                                    </tr>
                                </template>
                                <tr v-else>
                                    <td colspan="7">Nothing with a VAT code is posted in this period.</td>
                                </tr>
                            </tbody>
                        </table>
                        <p class="text-muted mb-0">
                            "Not deducted" is the part of the VAT of a purchase that cannot be deducted. It is a cost,
                            and is not on the return.
                        </p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">Check against the ledger</div>
                    <div class="card-body">
                        <table class="check table">
                            <thead>
                                <tr>
                                    <th>VAT account</th>
                                    <th class="text-end">In the ledger</th>
                                    <th class="text-end">In the report</th>
                                    <th class="text-end">Difference</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in report.ledger_check.accounts" :key="item.role" class="check-account">
                                    <td>
                                        {{
                                            item.account
                                                ? `${item.account.number} ${item.account.name}`
                                                : 'No account with the role ' + item.role
                                        }}
                                    </td>
                                    <td class="text-end">{{ $filters.toCurrency(item.ledger_balance) }}</td>
                                    <td class="text-end">{{ $filters.toCurrency(item.reported) }}</td>
                                    <td class="difference text-end" :class="{ 'text-danger': item.difference !== 0 }">
                                        {{ $filters.toCurrency(item.difference) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div v-if="report.ledger_check.uncoded_lines.length" class="uncoded">
                            <p class="text-danger">
                                These postings on the VAT accounts have no VAT code, so they are not in the report. A
                                period cannot be settled while they make the report differ from the ledger: reverse
                                them, dated in the period, and post them again with a VAT code.
                            </p>
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Voucher</th>
                                        <th>Date</th>
                                        <th>Account</th>
                                        <th>Text</th>
                                        <th class="text-end">Debit</th>
                                        <th class="text-end">Credit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="(item, index) in report.ledger_check.uncoded_lines"
                                        :key="index"
                                        class="uncoded-line"
                                    >
                                        <td>
                                            <router-link
                                                :to="{ name: 'ShowVoucher', params: { entryId: item.entry_id } }"
                                                >{{ item.voucher_no }}</router-link
                                            >
                                        </td>
                                        <td>{{ item.entry_date }}</td>
                                        <td>{{ item.account.number }} {{ item.account.name }}</td>
                                        <td>{{ item.line_description || item.description }}</td>
                                        <td class="text-end">
                                            {{ item.debit ? $filters.toCurrency(item.debit) : '' }}
                                        </td>
                                        <td class="text-end">
                                            {{ item.credit ? $filters.toCurrency(item.credit) : '' }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p v-else class="text-muted mb-0">Every posting on the VAT accounts has a VAT code.</p>
                    </div>
                </div>
            </template>
            <div v-else class="card">
                <div class="card-body">Loading...</div>
            </div>
        </section>
    </div>
</template>
<script>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DateRange from '@/components/reports/DateRange.vue'
import ReportService from '@/services/ReportService'
import { toast } from '@/utilities/toast'
import { apiErrorMessage } from '@/utilities/apiErrors'
import { ratePercent } from '@/utilities/money'
import { previousQuarterRange, quarterRange } from '@/utilities/mydate'

// The net amounts of the boxes of the return (rubrik A, B and C)
const BOXES = [
    { key: 'a_goods', label: 'Rubrik A, varer (goods bought in other EU countries)' },
    { key: 'a_services', label: 'Rubrik A, ydelser (services bought in other EU countries)' },
    { key: 'b_goods', label: 'Rubrik B, varer (goods sold without VAT to other EU countries)' },
    { key: 'b_services', label: 'Rubrik B, ydelser (services sold without VAT to other EU countries)' },
    { key: 'c', label: 'Rubrik C (other sales without VAT)' },
]

export default {
    name: 'VatReport',
    components: { DateRange },
    setup() {
        const route = useRoute()
        const thisQuarter = quarterRange()
        // A link can bring a range, an empty one meaning all time
        const given = route.query
        const from = ref('from' in given ? String(given.from) : thisQuarter.from)
        const to = ref('to' in given ? String(given.to) : thisQuarter.to)
        const report = ref(null)
        const rangeError = computed(() =>
            from.value && to.value && from.value > to.value ? 'The from date is after the to date' : '',
        )

        // Only the answer to the latest question is shown, whatever order the answers arrive in
        let latest = 0
        const load = async () => {
            if (rangeError.value) return
            const ticket = ++latest
            try {
                const response = await ReportService.vatReport({ from: from.value, to: to.value })
                if (ticket === latest) report.value = response.data
            } catch (e) {
                if (ticket === latest) toast(apiErrorMessage(e), 'error')
            }
        }
        onMounted(load)
        watch([from, to], load)

        const pick = (range) => {
            from.value = range.from
            to.value = range.to
        }

        return {
            from,
            to,
            report,
            rangeError,
            boxes: BOXES,
            thisQuarter,
            lastQuarter: previousQuarterRange(),
            pick,
            toPay: computed(() => (report.value ? report.value.total_to_pay >= 0 : true)),
            percent: (rate) => (rate === null || rate === undefined ? '' : `${ratePercent(rate)}%`),
        }
    },
}
</script>
