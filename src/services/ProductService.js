import { HTTP } from './http'

export default {
    getAll() {
        return HTTP.get(`/products`)
    },
    getOne(productId) {
        return HTTP.get(`/products/${productId}`)
    },
    update(product) {
        // eslint-disable-next-line no-unused-vars
        const { id: productId, account, created_at, updated_at, ...requiredFields } = product
        return HTTP.put(`/products/${productId}`, requiredFields)
    },
    create(product) {
        return HTTP.post(`/products`, product)
    },
    delete(productId) {
        return HTTP.delete(`/products/${productId}`)
    }
}