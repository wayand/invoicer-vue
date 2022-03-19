import OrganizationService from '@/services/OrganizationService'

export default {
    state: {
        organizations: [],
        organization: {},
    },
    getters: {
        organizations: state => state.organizations,
        organization: state => state.organization,
        invoiceSetting: state => state.organization?.invoice_setting,
    },
    actions: {
        fetchOrganizations({commit}) {
            return OrganizationService.getAll()
                .then(response => {
                    commit('SET_ORGANIZATIONS', response.data)
                    return response
                })
        },
        fetchOrganization({commit}, organizationId) {
            return OrganizationService.getOne(organizationId)
                .then(response => {
                    commit('SET_ORGANIZATION', response.data)
                    return response
                })
        },
        updateOrganization({commit}, organization) {
            return OrganizationService.update(organization)
                .then(response => {
                    commit('UPDATE_ORGANIZATIONS', response.data)
                    return response
                })
        },
        uploadLogo(_, {organizationId, logo}) {
            return OrganizationService.uploadLogo(organizationId, logo)
        },
        updateInvoiceSetting({commit}, invoiceSetting) {
            return OrganizationService.updateInvoiceSetting(invoiceSetting)
                .then(response => {
                    commit('UPDATE_INVOICE_SETTING', response.data)
                    return response
                })
        }
    },
    mutations: {
        SET_ORGANIZATIONS(state, organizations) {
            state.organizations = organizations
        },
        SET_ORGANIZATION(state, organization) {
            state.organization = organization
            if (Object.keys(state.organization?.invoice_setting || {}).length <= 1) {
                state.organization.invoice_setting = {
                    organization_id: state.organization.id,
                    default_account_id: 0,
                    default_deposit_account_id: 0,
                    lines_incl_vat: false,
                    hide_product_numbers: false,
                    invoice_no_mode: 'sequential',
                    next_invoice_no: 1,
                    template_id: '1',
                    default_reminder_fee: 0
                }
            }
        },
        ADD_ORGANIZATION(state, organization) {
            state.organizations.push(organization)
        },
        UPDATE_ORGANIZATIONS(state, organization) {
            const index = state.organizations.findIndex(item => item.id === organization.id)
            if ( index !==  -1 ) {
                state.organizations[index] = organization
            } else {
                state.organizations.push(organization)
            }
        },
        UPDATE_ORGANIZATION_PROPERTY(state, property) {
            state.organization[property.key] = property.value === null ? '' : property.value
        },
        UPDATE_INVOICE_SETTING(state, invoiceSetting) {
            state.organization.invoice_setting = invoiceSetting
        },
        UPDATE_INVOICE_SETTING_PROPERTY(state, property) {
            state.organization.invoice_setting[property.key] = property.value
        },
        REMOVE_ORGANIZATIONS(state, organizationId) {
            const index = state.organizations.findIndex(item => item.id === organizationId)
            if ( index !==  -1 ) {
                state.organizations.splice(index, 1)
            } else {
                console.error('mutation -> REMOVE_ORGANIZATIONS:', organizationId)
            }
        },
    }
}