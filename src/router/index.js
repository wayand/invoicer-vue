import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard'
import Login from '../views/Login'
import ForgotPassword from '../views/ForgotPassword'
import ResetPassword from '../views/ResetPassword'
import Invoices from '../views/invoice/Invoices'
import InvoiceForm from '../views/invoice/InvoiceForm'
import ShowInvoice from '../views/invoice/ShowInvoice'
import AnnualReport from '../views/reports/AnnualReport'
import Organization from '../views/settings/Organization'
import InvoiceSetting from '../views/settings/InvoiceSetting'
import Clients from '../views/settings/Clients'
import Accounts from '../views/settings/Accounts'
import Authentication from '../views/settings/Authentication'
import AuthTwoFactorSetup from '../views/settings/AuthTwoFactorSetup'
import AuthManagement from '../views/settings/AuthManagement'
import Products from '../views/settings/Products'
import NotFound from '../views/NotFound'
import NetworkError from '../views/NetworkError'
import store from '../store'

const routes = [
    {
        path: '/',
        name: 'Dashboard',
        component: Dashboard,
        meta: { requiresAuth: true, title: 'Invoicer - Dashboard' }
    },
    {
        path: '/invoices',
        name: 'Invoices',
        component: Invoices,
        meta: { requiresAuth: true, title: 'Invoicer - Invoices' }
    },
    {
        path: '/invoices/new',
        name: 'NewInvoice',
        component: InvoiceForm,
        meta: { requiresAuth: true, title: 'Invoicer - Create new invoice' }
    },
    {
        path: '/invoices/:invoiceId(\\d+)',
        name: 'ShowInvoice',
        component: ShowInvoice,
        props: true,
        meta: { requiresAuth: true, title: 'Invoicer - Show invoice' }
    },
    {
        path: '/invoices/:invoiceId(\\d+)/edit',
        name: 'EditInvoice',
        component: InvoiceForm,
        props: true,
        meta: { requiresAuth: true, title: 'Invoicer - Edit invoice' }
    },
    {
        path: '/reports/annual-report',
        name: 'AnnualReport',
        component: AnnualReport,
        meta: { requiresAuth: true, title: 'Invoicer - Annual Report' }
    },
    {
        path: '/settings/organizations/:id(\\d+)',
        name: 'Organization',
        component: Organization,
        props: true,
        meta: { requiresAuth: true, title: 'Invoicer - Organization' }
    },
    {
        path: '/settings/authentication',
        name: 'Authentication',
        component: Authentication,
        meta: { requiresAuth: true, title: 'Invoicer - Authentication' }
    },
    {
        path: '/settings/invoice-setting',
        name: 'InvoiceSetting',
        component: InvoiceSetting,
        meta: { requiresAuth: true, title: 'Invoicer - Invoice Setting' }
    },
    {
        path: '/settings/authentication/setup',
        name: 'AuthTwoFactorSetup',
        component: AuthTwoFactorSetup,
        meta: { requiresAuth: true, title: 'Invoicer - Authentication Setup' }
    },
    {
        path: '/settings/auth-management',
        name: 'AuthManagement',
        component: AuthManagement,
        meta: { requiresAuth: true, title: 'Invoicer - Authentication Management' }
    },
    {
        path: '/settings/clients',
        name: 'Clients',
        component: Clients,
        meta: { requiresAuth: true, title: 'Invoicer - Clients' }
    },
    {
        path: '/settings/accounts',
        name: 'Accounts',
        component: Accounts,
        meta: { requiresAuth: true, title: 'Invoicer - Accounts' }
    },
    {
        path: '/settings/products',
        name: 'Products',
        component: Products,
        meta: { requiresAuth: true, title: 'Invoicer - Products' }
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { hideForAuth: true, title: 'Invoicer - Login' }
    },
    {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: ForgotPassword,
        meta: { hideForAuth: true, title: 'Invoicer - Forgot Password' }
    },
    {
        path: '/reset-password',
        name: 'ResetPassword',
        component: ResetPassword,
        meta: { hideForAuth: true, title: 'Invoicer - Reset Password' }
    },
    {
        path: '/network-error',
        name: 'NetworkError',
        component: NetworkError,
        meta: { title: 'Invoicer - Network Error' }
    },
    {
        path: '/404/:resource',
        name: '404Resource',
        component: NotFound,
        props: true,
        meta: { title: 'Invoicer - 404 Not Fount' }
    },
    {
        path: '/:catchAll(.*)',
        name: 'NotFound',
        component: NotFound
    }
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    linkActiveClass: 'active',
    routes
})

const setPageMetaFields = (to) => {
    window.document.title = to.meta.title
}

router.beforeEach((to,from, next) => {
    setPageMetaFields(to)
    const loggedIn = store.getters.loggedIn
    if (!loggedIn && to.matched.some(record => record.meta.requiresAuth) && to.path != '/login') {
        
        next({
            name: 'Login',
            query: { redirect: to.path }
        })
        return
        
    } else {
        if (loggedIn && to.matched.some(record => record.meta.hideForAuth)) {
            console.log('He is logged in, se: ', loggedIn)
            next({
                name: 'Dashboard'
            })
            return
        }
        next()
    }
})

export default router