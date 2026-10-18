import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createStore } from 'vuex'
import { defineComponent, h } from 'vue'
import ShowInvoice from '@/views/invoice/ShowInvoice.vue'

// html2pdf is a chain (from -> set -> save); the real one needs a canvas
const { chain, html2pdf } = vi.hoisted(() => {
    const chain = { from: vi.fn(), set: vi.fn(), save: vi.fn() }
    chain.from.mockReturnValue(chain)
    chain.set.mockReturnValue(chain)
    return { chain, html2pdf: vi.fn(() => chain) }
})
vi.mock('html2pdf.js', () => ({ default: html2pdf }))
vi.mock('@/components/invoice/InvoicePreview', () => ({
    default: { render: () => h('div', { id: 'invoice-preview' }) },
}))
vi.mock('@/utilities/toast', () => ({ toast: vi.fn() }))

const invoice = {
    id: 2,
    invoice_no: '1001',
    state: 'approved',
    is_sent: false,
    is_paid: false,
    contact: { name: 'Acme' },
}

const other = defineComponent({ render: () => h('div') })
const mounted = []

const mountPage = async () => {
    const store = createStore({
        state: () => ({ invoice }),
        getters: {
            organization: () => ({ id: 1, slug: 'demo-aps' }),
            invoice: (state) => state.invoice,
            user: () => ({ organizationId: 1 }),
        },
        actions: { fetchOrganization: () => {}, fetchInvoice: () => {} },
    })
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/invoices', name: 'Invoices', component: other },
            { path: '/invoices/new', name: 'NewInvoice', component: other },
            { path: '/invoices/:invoiceId', name: 'ShowInvoice', component: ShowInvoice, props: true },
            { path: '/invoices/:invoiceId/edit', name: 'EditInvoice', component: other, props: true },
        ],
    })
    router.push('/invoices/2')
    await router.isReady()
    const wrapper = mount(defineComponent({ render: () => h(RouterView) }), {
        attachTo: document.body, // the page looks the invoice up in the document
        global: {
            plugins: [store, router],
            components: { PromiseDialog: defineComponent({ render: () => null }) },
            stubs: { teleport: true },
        },
    })
    mounted.push(wrapper)
    await flushPromises()
    return wrapper
}

const savePdf = async (wrapper) => {
    await wrapper
        .findAll('.dropdown-item')
        .find((item) => item.text() === 'Save as PDF')
        .trigger('click')
    await flushPromises()
}
const darkDocument = () => {
    const doc = document.implementation.createHTMLDocument('copy')
    doc.documentElement.setAttribute('data-bs-theme', 'dark')
    return doc
}

describe('Save as PDF', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        document.documentElement.setAttribute('data-bs-theme', 'dark')
    })
    afterEach(() => {
        mounted.splice(0).forEach((wrapper) => wrapper.unmount())
        document.documentElement.removeAttribute('data-bs-theme')
    })

    it('renders the invoice element to an A4 PDF', async () => {
        const wrapper = await mountPage()

        await savePdf(wrapper)

        expect(html2pdf).toHaveBeenCalledTimes(1)
        expect(chain.from.mock.calls[0][0].id).toBe('invoice-preview')
        expect(chain.set.mock.calls[0][0].jsPDF.format).toBe('a4')
        expect(chain.save).toHaveBeenCalledTimes(1)
    })

    it('draws the page in the light theme even when the app is in dark mode', async () => {
        const wrapper = await mountPage()
        await savePdf(wrapper)

        const { onclone } = chain.set.mock.calls[0][0].html2canvas
        expect(onclone).toBeTypeOf('function')

        const copy = darkDocument() // the copy html2canvas renders from
        onclone(copy)
        expect(copy.documentElement.getAttribute('data-bs-theme')).toBe('light')
    })

    it('leaves the page the user is looking at in dark mode', async () => {
        const wrapper = await mountPage()
        await savePdf(wrapper)

        chain.set.mock.calls[0][0].html2canvas.onclone(darkDocument())

        expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark')
    })

    it('keeps its other options (the logo is loaded cross-origin, at twice the resolution)', async () => {
        const wrapper = await mountPage()

        await savePdf(wrapper)

        const options = chain.set.mock.calls[0][0]
        expect(options.html2canvas).toMatchObject({ useCORS: true, scale: 2 })
        expect(options.margin).toBe(0)
        expect(options.filename).toBe('invoiceAsPdf')
    })
})
