import { toast } from '@/utilities/toast'
import { apiErrorMessage } from '@/utilities/apiErrors'

// Ask, then post the reversal of a voucher. Returns the new voucher, or null when the
// user said no or the API refused (it says why, in a toast).
export const useVoucherReversal = (store, refDialog) => async (entry) => {
    refDialog.value.data = {
        type: 'warning',
        title: 'Reverse voucher ' + entry.voucher_no + '?',
        content:
            'A new voucher is posted with debit and credit swapped, dated today. ' +
            'The original stays in the books, and a voucher can be reversed once.',
        accept: 'Yes, reverse it',
        reject: 'No, cancel',
    }
    if ((await refDialog.value.showModal()) !== true) return null
    try {
        const response = await store.dispatch('reverseJournalEntry', { entryId: entry.id })
        toast('Voucher ' + entry.voucher_no + ' reversed by voucher ' + response.data.voucher_no, 'success')
        return response.data
    } catch (e) {
        toast(apiErrorMessage(e), 'error')
        return null
    }
}
