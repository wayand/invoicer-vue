import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createStore } from 'vuex'
import { defineComponent, h } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import { toast } from '@/utilities/toast'

// The scrolling and the theme work on the page itself: this test is about the menu
vi.mock('@/utilities/sidebar', () => ({ init: vi.fn() }))
vi.mock('@/composables/useDarkTheme', () => ({ UseSetTheme: vi.fn(), UseInitTheme: vi.fn() }))
vi.mock('@/utilities/toast', () => ({ toast: vi.fn() }))

const page = () => defineComponent({ render: () => h('div') })

const open = async ({ organization = {}, fetchOrganization = vi.fn(), path = '/' } = {}) => {
    const store = createStore({
        getters: { user: () => ({ organizationId: 3 }), organization: () => organization },
        actions: { fetchOrganization },
    })
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            '/',
            '/vouchers',
            '/vat/periods',
            '/reports/vat',
            '/reports/trial-balance',
            '/settings/organizations/3',
        ].map((route) => ({
            path: route,
            name: { '/vat/periods': 'VatPeriods', '/reports/vat': 'VatReport' }[route] || route,
            component: page(),
        })),
    })
    router.push(path)
    await router.isReady()
    const wrapper = mount(Sidebar, {
        global: { plugins: [store, router], stubs: { RouterLink: { props: ['to'], template: '<a><slot /></a>' } } },
    })
    await flushPromises()
    return { wrapper, fetchOrganization }
}

describe('sidebar, VAT menu', () => {
    beforeEach(() => vi.clearAllMocks())

    it('has no VAT menu for an organization that is not VAT-registered', async () => {
        const { wrapper } = await open({ organization: { id: 3, vat_period_type: null } })

        expect(wrapper.find('.vat-menu').exists()).toBe(false)
    })

    it.each(['month', 'quarter', 'half_year'])('has the VAT menu for a %s return', async (period) => {
        const { wrapper } = await open({ organization: { id: 3, vat_period_type: period } })

        const links = wrapper.findAll('.vat-menu .submenu-link').map((link) => link.text())
        expect(links).toEqual(['VAT periods', 'VAT report'])
    })

    it('loads the organization when no screen has, to know whether it is VAT-registered', async () => {
        const { fetchOrganization } = await open({ organization: {} })

        expect(fetchOrganization).toHaveBeenCalledTimes(1)
        expect(fetchOrganization.mock.calls[0][1]).toBe(3)
    })

    it('does not load it again when it is there', async () => {
        const { fetchOrganization } = await open({ organization: { id: 3, vat_period_type: 'quarter' } })

        expect(fetchOrganization).not.toHaveBeenCalled()
    })

    it('says so when the organization cannot be loaded', async () => {
        const failing = vi.fn().mockRejectedValue({ response: { data: { error: 'No way' } } })

        await open({ fetchOrganization: failing })

        expect(toast).toHaveBeenCalledWith('No way', 'error')
    })
})
