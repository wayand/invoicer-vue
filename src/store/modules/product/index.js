import ProductService from '@/services/ProductService'

export default {
    state: {
        products: [],
        product: {}
    },
    getters: {
        products: state => state.products,
        product: state => state.product
    },
    actions: {
        fetchProducts({commit}) {
            return ProductService.getAll()
                .then(response => {
                    commit('SET_PRODUCTS', response.data)
                    return response
                })
        },
        fetchProduct({commit}, productId) {
            return ProductService.getOne(productId)
                .then(response => {
                    commit('SET_PRODUCT', response.data)
                    return response
                })
        },
        updateProduct({commit}, product) {
            return ProductService.update(product)
                .then(response => {
                    commit('UPDATE_PRODUCTS', response.data)
                    return response
                })
        },
        createProduct({commit}, product) {
            return ProductService.create(product)
                .then(response => {
                    commit('ADD_PRODUCT', response.data)
                    return response
                })
        }
    },
    mutations: {
        SET_PRODUCTS(state, products) {
            state.products = products
        },
        SET_PRODUCT(state, product) {
            state.product = product
        },
        ADD_PRODUCT(state, product) {
            state.products.push(product)
        },
        UPDATE_PRODUCTS(state, product) {
            const index = state.products.findIndex(item => item.id === product.id)
            if ( index !==  -1 ) {
                state.products[index] = product
            } else {
                state.products.push(product)
            }
        },
        UPDATE_PRODUCT_PROPERTY (state, property) {
            state.product[property.key] = property.value === null ? '' : property.value
        },
        REMOVE_PRODUCT(state, productId) {
            const index = state.products.findIndex(item => item.id === productId)
            if ( index !==  -1 ) {
                state.products.splice(index, 1)
            } else {
                console.error('mutation -> REMOVE_PRODUCT:', productId)
            }
        },
    }
}