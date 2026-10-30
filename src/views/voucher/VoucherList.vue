<template>
    <div class="page-heading">
        <div class="page-title">
            <div class="row">
                <div class="col-12 col-md-6 order-md-1 order-last">
                    <h3>Vouchers</h3>
                    <p class="text-subtitle text-muted">Everything posted to the books, newest first</p>
                </div>
                <div class="col-12 col-md-6 order-md-2 order-first" style="text-align: right">
                    <router-link :to="{ name: 'NewVoucher' }" class="btn btn-primary me-1 mb-1"
                        >New voucher</router-link
                    >
                </div>
            </div>
        </div>
    </div>
    <div class="page-content">
        <section class="section">
            <div class="card">
                <div class="card-header">
                    All vouchers <span class="badge bg-secondary">{{ entries.length }}</span>
                </div>
                <div class="card-body">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Date</th>
                                <th>Description</th>
                                <th class="text-end">Amount</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-if="entries.length">
                                <tr
                                    v-for="entry in entries"
                                    :key="entry.id"
                                    class="voucher"
                                    @click="show(entry.id)"
                                    style="cursor: pointer"
                                >
                                    <td>{{ entry.voucher_no }}</td>
                                    <td>{{ entry.entry_date }}</td>
                                    <td>{{ entry.description }}</td>
                                    <td class="text-end">{{ $filters.toCurrency(total(entry)) }}</td>
                                    <td>
                                        <span v-if="entry.reversed_by_entry_id" class="badge bg-secondary"
                                            >Reversed</span
                                        >
                                        <span v-else-if="entry.reverses_entry_id" class="badge bg-info">Reversal</span>
                                    </td>
                                    <td class="text-end">
                                        <button
                                            v-if="canReverse(entry)"
                                            type="button"
                                            class="reverse btn btn-sm btn-outline-secondary"
                                            @click.stop="reverse(entry)"
                                        >
                                            Reverse
                                        </button>
                                    </td>
                                </tr>
                            </template>
                            <tr v-else>
                                <td colspan="6">No vouchers yet, please post one.</td>
                            </tr>
                        </tbody>
                    </table>
                    <button
                        v-if="mayHaveMore"
                        type="button"
                        class="show-more btn btn-outline-primary"
                        :disabled="loading"
                        @click="loadMore"
                    >
                        Show more
                    </button>
                </div>
            </div>
        </section>
    </div>
    <teleport to="body">
        <PromiseDialog ref="refDialog" />
    </teleport>
</template>
<script>
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { toast } from '@/utilities/toast'
import { apiErrorMessage } from '@/utilities/apiErrors'
import { voucherTotals } from '@/utilities/money'
import { useVoucherReversal } from '@/composables/useVoucherReversal'

const PAGE = 50

export default {
    name: 'VoucherList',
    setup() {
        const store = useStore()
        const router = useRouter()
        const refDialog = ref()
        const loading = ref(false)
        const lastPage = ref(0)
        const entries = computed(() => store.getters.journalEntries)
        // A full page means there may be another
        const mayHaveMore = computed(() => lastPage.value === PAGE)

        const load = async (offset = 0) => {
            loading.value = true
            try {
                const response = await store.dispatch('fetchJournalEntries', { limit: PAGE, offset })
                lastPage.value = response.data.length
            } catch (e) {
                toast(apiErrorMessage(e), 'error')
            } finally {
                loading.value = false
            }
        }
        onMounted(() => load())

        const askAndReverse = useVoucherReversal(store, refDialog)
        const reverse = (entry) => askAndReverse(entry)

        return {
            refDialog,
            entries,
            loading,
            mayHaveMore,
            loadMore: () => load(entries.value.length),
            // A reversal is not reversed, and an entry only once
            canReverse: (entry) => !entry.reversed_by_entry_id && !entry.reverses_entry_id,
            total: (entry) => voucherTotals(entry.lines).debit,
            show: (entryId) => router.push({ name: 'ShowVoucher', params: { entryId } }),
            reverse,
        }
    },
}
</script>
