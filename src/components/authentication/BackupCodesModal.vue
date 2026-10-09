<template>
    <div v-if="show" class="backup-codes-backdrop">
        <div class="backup-codes-dialog" role="dialog" aria-modal="true" aria-labelledby="backup-codes-title">
            <h3 id="backup-codes-title" class="mb-3">Your backup codes</h3>
            <p>
                Each code works <strong>once</strong>, for signing in if you lose your phone or can't get the email.
                They are shown <strong>only now</strong>: store them somewhere safe, like a password manager.
            </p>

            <ul class="backup-codes-list" aria-label="Backup codes">
                <li v-for="code in codes" :key="code"><code>{{ code }}</code></li>
            </ul>

            <div class="d-flex gap-2 mb-3">
                <button @click="copy" type="button" class="btn btn-outline-secondary btn-sm">Copy</button>
                <button @click="download" type="button" class="btn btn-outline-secondary btn-sm">Download</button>
            </div>

            <div class="form-check mb-3">
                <input v-model="saved" class="form-check-input" type="checkbox" id="backup-codes-saved">
                <label class="form-check-label" for="backup-codes-saved">I have saved these codes</label>
            </div>
            <button @click="close" :disabled="!saved" type="button" class="btn btn-primary">Done</button>
        </div>
    </div>
</template>
<script>
import { ref } from 'vue'
import { toast } from '@/utilities/toast'

export default {
    emits: ['closed'],
    setup(props, { emit }) {
        const show = ref(false)
        const codes = ref([])
        const saved = ref(false)

        const showModal = list => {
            codes.value = list
            saved.value = false
            show.value = true
        }

        const copy = async () => {
            try {
                await navigator.clipboard.writeText(codes.value.join('\n'))
                toast('Backup codes copied to the clipboard', 'success')
            } catch {
                toast('Could not copy. Select the codes and copy them by hand.', 'warn')
            }
        }

        const download = () => {
            const text = [
                'Invoicer backup codes',
                `Generated ${new Date().toISOString().slice(0, 10)}`,
                'Each code can be used once.',
                '',
                ...codes.value,
                ''
            ].join('\n')
            const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
            const link = document.createElement('a')
            link.href = url
            link.download = 'invoicer-backup-codes.txt'
            document.body.appendChild(link)
            link.click()
            link.remove()
            setTimeout(() => URL.revokeObjectURL(url), 1000)
        }

        const close = () => {
            show.value = false
            codes.value = []
            emit('closed')
        }

        return { show, codes, saved, showModal, copy, download, close }
    },
}
</script>
<style scoped>
.backup-codes-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1070;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    overflow-y: auto;
    background: rgba(0, 0, 0, .5);
}
.backup-codes-dialog {
    width: 32rem;
    max-width: 100%;
    padding: 1.5rem;
    border: 1px solid var(--bs-border-color);
    border-radius: .5rem;
    background: var(--bs-body-bg);
    color: var(--bs-body-color);
}
.backup-codes-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .5rem 1rem;
    margin: 0 0 1rem;
    padding: 1rem;
    list-style: none;
    border: 1px dashed var(--bs-border-color);
    border-radius: .375rem;
    font-size: 1.1rem;
}
</style>
