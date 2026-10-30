<template>
    <div class="page-heading">
        <div class="page-title">
            <h3>Trial balance</h3>
            <p class="text-subtitle text-muted">
                What every account holds, and what was posted to it in the period. Each side adds up to the same.
            </p>
        </div>
    </div>
    <div class="page-content">
        <section class="section">
            <div class="card">
                <div class="card-body">
                    <DateRange v-model:from="from" v-model:to="to" :error="rangeError" />
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    Accounts
                    <span v-if="report" class="badge bg-secondary">{{ report.accounts.length }}</span>
                    <span
                        v-if="report"
                        class="balance-status badge ms-2"
                        :class="report.balanced ? 'bg-success' : 'bg-danger'"
                        >{{ report.balanced ? 'Balanced' : 'Does not balance' }}</span
                    >
                </div>
                <div class="card-body">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Account</th>
                                <th class="text-end">Opening balance</th>
                                <th class="text-end">Debit</th>
                                <th class="text-end">Credit</th>
                                <th class="text-end">Closing balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-if="report && report.accounts.length">
                                <tr v-for="account in report.accounts" :key="account.account_id" class="account">
                                    <td>
                                        <router-link :to="ledgerLink(account)"
                                            >{{ account.number }} {{ account.name }}</router-link
                                        >
                                    </td>
                                    <td class="opening text-end">
                                        {{ $filters.toCurrency(natural(account, account.opening_balance)) }}
                                    </td>
                                    <td class="debit text-end">{{ $filters.toCurrency(account.debit) }}</td>
                                    <td class="credit text-end">{{ $filters.toCurrency(account.credit) }}</td>
                                    <td class="closing text-end">
                                        {{ $filters.toCurrency(natural(account, account.closing_balance)) }}
                                    </td>
                                </tr>
                            </template>
                            <tr v-else>
                                <td colspan="5">{{ report ? 'Nothing is posted in this period.' : 'Loading...' }}</td>
                            </tr>
                        </tbody>
                        <tfoot v-if="report && report.accounts.length">
                            <tr class="totals fw-bold">
                                <td>Total</td>
                                <td></td>
                                <td class="total-debit text-end">{{ $filters.toCurrency(report.total_debit) }}</td>
                                <td class="total-credit text-end">{{ $filters.toCurrency(report.total_credit) }}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                    <p class="text-muted mb-0">
                        Balances are shown on the account's own side: income and liabilities as positive numbers when
                        they are credit, assets and expenses when they are debit. A negative number is on the other
                        side. Click an account to see its postings.
                    </p>
                </div>
            </div>
        </section>
    </div>
</template>
<script>
import { computed, onMounted, ref, watch } from 'vue'
import DateRange from '@/components/reports/DateRange.vue'
import ReportService from '@/services/ReportService'
import { toast } from '@/utilities/toast'
import { apiErrorMessage } from '@/utilities/apiErrors'
import { normalBalanceAmount } from '@/utilities/money'
import { yearRange } from '@/utilities/mydate'

export default {
    name: 'TrialBalance',
    components: { DateRange },
    setup() {
        const thisYear = yearRange(new Date().getFullYear())
        const from = ref(thisYear.from)
        const to = ref(thisYear.to)
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
                const response = await ReportService.trialBalance({ from: from.value, to: to.value })
                if (ticket === latest) report.value = response.data
            } catch (e) {
                if (ticket === latest) toast(apiErrorMessage(e), 'error')
            }
        }
        onMounted(load)
        watch([from, to], load)

        return {
            from,
            to,
            report,
            rangeError,
            natural: (account, balance) => normalBalanceAmount(balance, account.normal_balance),
            ledgerLink: (account) => ({
                name: 'AccountLedger',
                query: { account: account.account_id, from: from.value, to: to.value },
            }),
        }
    },
}
</script>
