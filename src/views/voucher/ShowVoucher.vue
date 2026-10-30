<template>
    <div class="page-heading">
        <div class="page-title">
            <div class="row">
                <div class="col-12 col-md-6 order-md-1 order-last">
                    <h3 v-if="entry">Voucher {{ entry.voucher_no }}</h3>
                    <h3 v-else>Voucher</h3>
                </div>
                <div class="col-12 col-md-6 order-md-2 order-first" style="text-align: right">
                    <router-link :to="{ name: 'Vouchers' }" class="btn btn-outline-secondary me-1 mb-1"
                        >All vouchers</router-link
                    >
                    <button
                        v-if="entry && canReverse"
                        type="button"
                        class="reverse btn btn-outline-primary me-1 mb-1"
                        @click="reverse"
                    >
                        Reverse
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div class="page-content" v-if="entry">
        <section class="section">
            <div class="card">
                <div class="card-body">
                    <dl class="row mb-4">
                        <dt class="col-sm-2">Date</dt>
                        <dd class="col-sm-10">{{ entry.entry_date }}</dd>
                        <dt class="col-sm-2">Description</dt>
                        <dd class="col-sm-10">{{ entry.description }}</dd>
                        <template v-if="reversedBy">
                            <dt class="col-sm-2">Status</dt>
                            <dd class="col-sm-10 reversed-by">
                                <span class="badge bg-secondary">Reversed</span> by
                                <router-link :to="{ name: 'ShowVoucher', params: { entryId: reversedBy.id } }"
                                    >voucher {{ reversedBy.voucher_no }}</router-link
                                >
                            </dd>
                        </template>
                        <template v-if="reverses">
                            <dt class="col-sm-2">Status</dt>
                            <dd class="col-sm-10 reverses">
                                <span class="badge bg-info">Reversal</span> of
                                <router-link :to="{ name: 'ShowVoucher', params: { entryId: reverses.id } }"
                                    >voucher {{ reverses.voucher_no }}</router-link
                                >
                            </dd>
                        </template>
                    </dl>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Account</th>
                                <th>Text</th>
                                <th class="text-end">Debit</th>
                                <th class="text-end">Credit</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="line in entry.lines" :key="line.id" class="line">
                                <td>{{ line.account_number }} {{ line.account_name }}</td>
                                <td>{{ line.description }}</td>
                                <td class="text-end">{{ line.debit ? $filters.toCurrency(line.debit) : '' }}</td>
                                <td class="text-end">{{ line.credit ? $filters.toCurrency(line.credit) : '' }}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr class="fw-bold">
                                <td colspan="2">Total</td>
                                <td class="text-end">{{ $filters.toCurrency(totals.debit) }}</td>
                                <td class="text-end">{{ $filters.toCurrency(totals.credit) }}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </section>
    </div>
    <teleport to="body">
        <PromiseDialog ref="refDialog" />
    </teleport>
</template>
<script>
import { computed, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import JournalService from '@/services/JournalService'
import { toast } from '@/utilities/toast'
import { apiErrorMessage } from '@/utilities/apiErrors'
import { voucherTotals } from '@/utilities/money'
import { useVoucherReversal } from '@/composables/useVoucherReversal'

export default {
    name: 'ShowVoucher',
    props: {
        entryId: {
            type: [Number, String],
            required: true,
        },
    },
    setup(props) {
        const store = useStore()
        const router = useRouter()
        const refDialog = ref()
        const entry = computed(() => store.getters.journalEntry)
        // The vouchers this one reverses, or is reversed by: only their numbers are shown
        const reverses = ref(null)
        const reversedBy = ref(null)

        const loadRelated = async () => {
            const current = entry.value
            reverses.value = reversedBy.value = null
            const fetchOne = async (id) => {
                try {
                    return (await JournalService.getOne(id)).data
                } catch (e) {
                    toast(apiErrorMessage(e), 'error')
                    return null
                }
            }
            if (current.reverses_entry_id) reverses.value = await fetchOne(current.reverses_entry_id)
            if (current.reversed_by_entry_id) reversedBy.value = await fetchOne(current.reversed_by_entry_id)
        }

        const load = async () => {
            // Not the voucher that was open before while this one loads
            store.commit('SET_JOURNAL_ENTRY', null)
            try {
                await store.dispatch('fetchJournalEntry', props.entryId)
            } catch (e) {
                toast(apiErrorMessage(e), 'error')
                return router.push({ name: 'Vouchers' })
            }
            await loadRelated()
        }
        onMounted(load)
        watch(() => props.entryId, load)

        const askAndReverse = useVoucherReversal(store, refDialog)

        return {
            refDialog,
            entry,
            reverses,
            reversedBy,
            totals: computed(() => voucherTotals(entry.value?.lines)),
            canReverse: computed(() => !entry.value.reversed_by_entry_id && !entry.value.reverses_entry_id),
            reverse: async () => {
                const reversal = await askAndReverse(entry.value)
                if (reversal) router.push({ name: 'ShowVoucher', params: { entryId: reversal.id } })
            },
        }
    },
}
</script>
