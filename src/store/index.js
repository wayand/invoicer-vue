import { createStore, createLogger } from 'vuex'
import authModule from './modules/auth'
import organizationModule from './modules/organization'
import countryModule from './modules/country'
import invoiceModule from './modules/invoice'
import productModule from './modules/product'
import clientModule from './modules/client'
import accountModule from './modules/account'
import taxrateModule from './modules/taxrate'

const debug = false//process.env.NODE_ENV !== 'production'

const Store = createStore({

    strict: debug,
    plugins: debug ? [createLogger()] : [],
    modules: {
        auth: authModule,
        org: organizationModule,
        country: countryModule,
        invoice: invoiceModule,
        product: productModule,
        client: clientModule,
        account: accountModule,
        taxrate: taxrateModule,
    }
})

export default Store