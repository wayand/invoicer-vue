import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import contact from '@/store/modules/contact'
import ContactService from '@/services/ContactService'

vi.mock('@/services/ContactService', () => ({
    default: { getAll: vi.fn(), getOne: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() }
}))

const newStore = () =>
    createStore({ modules: { contact: { ...contact, state: () => ({ contacts: [], contact: {} }) } } })

describe('contact store', () => {
    let store
    beforeEach(() => {
        vi.clearAllMocks()
        store = newStore()
    })

    it('turns null into an empty string when a property is set (inputs need a string)', () => {
        store.commit('SET_CONTACT', { phone: '123' })

        store.commit('UPDATE_CONTACT_PROPERTY', { key: 'phone', value: null })
        store.commit('UPDATE_CONTACT_PROPERTY', { key: 'city', value: 'Aarhus' })

        expect(store.getters.contact).toEqual({ phone: '', city: 'Aarhus' })
    })

    it('replaces a contact in the list, or adds it when it is not there', () => {
        store.commit('SET_CONTACTS', [{ id: 1, name: 'Old' }])

        store.commit('UPDATE_CONTACTS', { id: 1, name: 'New' })
        store.commit('UPDATE_CONTACTS', { id: 2, name: 'Other' })

        expect(store.getters.contacts).toEqual([
            { id: 1, name: 'New' },
            { id: 2, name: 'Other' }
        ])
    })

    it('fetches the list and a single contact', async () => {
        ContactService.getAll.mockResolvedValue({ data: [{ id: 1 }] })
        ContactService.getOne.mockResolvedValue({ data: { id: 1, name: 'Acme' } })

        await store.dispatch('fetchContacts', 4)
        await store.dispatch('fetchContact', { organizationId: 4, contactId: 1 })

        expect(ContactService.getAll).toHaveBeenCalledWith(4)
        expect(ContactService.getOne).toHaveBeenCalledWith(4, 1)
        expect(store.getters.contacts).toEqual([{ id: 1 }])
        expect(store.getters.contact.name).toBe('Acme')
    })

    it('creates a contact and adds it to the list', async () => {
        ContactService.create.mockResolvedValue({ data: { id: 9, name: 'New ApS' } })

        await store.dispatch('createContact', { organizationId: 4, contact: { name: 'New ApS' } })

        expect(ContactService.create).toHaveBeenCalledWith(4, { name: 'New ApS' })
        expect(store.getters.contacts).toEqual([{ id: 9, name: 'New ApS' }])
    })

    it('updates a contact and replaces it in the list', async () => {
        ContactService.update.mockResolvedValue({ data: { id: 1, name: 'Renamed' } })
        store.commit('SET_CONTACTS', [{ id: 1, name: 'Old' }])

        await store.dispatch('updateContact', { organizationId: 4, contact: { id: 1, name: 'Renamed' } })

        expect(store.getters.contacts).toEqual([{ id: 1, name: 'Renamed' }])
    })
})
