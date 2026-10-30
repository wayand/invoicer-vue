<template>
    <div class="page-heading">
        <div class="page-title">
            <h3>Account ledger</h3>
            <p class="text-subtitle text-muted">
                Everything posted to one account, with the balance after each posting
            </p>
        </div>
    </div>
    <div class="page-content">
        <section class="section">
            <div class="card">
                <div class="card-body">
                    <div class="row g-2 align-items-end mb-3">
                        <div class="col-12 col-md-6">
                            <label class="form-label" for="ledger-account">Account</label>
                            <select id="ledger-account" class="form-select" v-model.number="accountId">
                                <option :value="0">Select account</option>
                                <option v-for="account in accounts" :key="account.id" :value="account.id">
                                    {{ account.number }} {{ account.name }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <DateRange v-model:from="from" v-model:to="to" :error="rangeError" />
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <template v-if="report">{{ report.account.number }} {{ report.account.name }}</template>
                    <template v-else>Postings</template>
                    <span v-if="report" class="badge bg-secondary ms-1">{{ report.rows.length }}</span>
                </div>
                <div class="card-body">
                    <p v-if="!accountId" class="mb-0">Choose an account to see its postings.</p>
                    <table v-else class="table table-hover">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Voucher</th>
                                <th>Description</th>
                                <th class="text-end">Debit</th>
                                <th class="text-end">Credit</th>
                                <th class="text-end">Balance</th>
                            </tr>
                        </thead>
                        <tbody v-if="report">
                            <tr class="opening">
                                <td colspan="5"><em>Balance brought forward</em></td>
                                <td class="balance text-end">
                                    {{ $filters.toCurrency(natural(report.opening_balance)) }}
                                </td>
                            </tr>
                            <tr v-for="(row, index) in report.rows" :key="index" class="posting">
                                <td>{{ row.entry_date }}</td>
                                <td>
                                    <router-link :to="{ name: 'ShowVoucher', params: { entryId: row.entry_id } }">{{
                                        row.voucher_no
                                    }}</router-link>
                                </td>
                                <td>
                                    {{ row.description }}
                                    <div v-if="row.line_description" class="small text-muted">
                                        {{ row.line_description }}
                                    </div>
                                </td>
                                <td class="debit text-end">{{ row.debit ? $filters.toCurrency(row.debit) : '' }}</td>
                                <td class="credit text-end">{{ row.credit ? $filters.toCurrency(row.credit) : '' }}</td>
                                <td class="balance text-end">{{ $filters.toCurrency(natural(row.balance)) }}</td>
                            </tr>
                        </tbody>
                        <tbody v-else>
                            <tr>
                                <td colspan="6">Loading...</td>
                            </tr>
                        </tbody>
                        <tfoot v-if="report">
                            <tr class="totals fw-bold">
                                <td colspan="3">Total and closing balance</td>
                                <td class="total-debit text-end">{{ $filters.toCurrency(report.total_debit) }}</td>
                                <td class="total-credit text-end">{{ $filters.toCurrency(report.total_credit) }}</td>
                                <td class="closing text-end">
                                    {{ $filters.toCurrency(natural(report.closing_balance)) }}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                    <p v-if="accountId" class="text-muted mb-0">
                        The balance is shown on the account's own side. A negative number is on the other side.
                    </p>
                </div>
            </div>
        </section>
    </div>
</template>
<script>
import { computed, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import DateRange from '@/components/reports/DateRange.vue'
import ReportService from '@/services/ReportService'
import { toast } from '@/utilities/toast'
import { apiErrorMessage } from '@/utilities/apiErrors'
import { normalBalanceAmount } from '@/utilities/money'
import { yearRange } from '@/utilities/mydate'

export default {
    name: 'AccountLedger',
    components: { DateRange },
    setup() {
        const store = useStore()
        const route = useRoute()
        const thisYear = yearRange(new Date().getFullYear())
        // A link can bring an account and a range, an empty one meaning all time
        const given = route.query
        const accountId = ref(Number(given.account) || 0)
        const from = ref('from' in given ? String(given.from) : thisYear.from)
        const to = ref('to' in given ? String(given.to) : thisYear.to)
        const report = ref(null)
        const accounts = computed(() => [...store.getters.accounts].sort((a, b) => a.number - b.number))
        const rangeError = computed(() =>
            from.value && to.value && from.value > to.value ? 'The from date is after the to date' : '',
        )

        let latest = 0
        const load = async () => {
            const ticket = ++latest
            report.value = null
            if (!accountId.value || rangeError.value) return
            try {
                const response = await ReportService.accountLedger({
                    accountId: accountId.value,
                    from: from.value,
                    to: to.value,
                })
                if (ticket === latest) report.value = response.data
            } catch (e) {
                if (ticket === latest) toast(apiErrorMessage(e), 'error')
            }
        }
        onMounted(() => {
            store.dispatch('fetchAccounts').catch((e) => toast(apiErrorMessage(e), 'error'))
            load()
        })
        watch([accountId, from, to], load)

        const normalBalance = () => report.value.account.normal_balance
        return {
            accountId,
            from,
            to,
            report,
            accounts,
            rangeError,
            natural: (balance) => normalBalanceAmount(balance, normalBalance()),
        }
    },
}
</script>
