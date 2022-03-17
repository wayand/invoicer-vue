<template>
    <div class="page-heading">
        <div class="page-title">
            <div class="row">
                <div class="col-12 col-md-6 order-md-1 order-last">
                    <h3>Products</h3>
                    <p class="text-subtitle text-muted">For user to check they list</p>
                </div>
                <div class="col-12 col-md-6 order-md-2 order-first">
                    <button @click.prevent="openProductFormModal()" type="button" class="btn btn-primary me-1 mb-1 float-end">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
                        </svg>
                        Create
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div class="page-content">
        <section class="section">
            <div class="card">
                <div class="card-header">
                    All Products <span class="badge bg-secondary">{{ products.length }}</span>
                    <div class="form-check form-switch d-inline-block ms-2">
                        <input v-model="showArchived" class="form-check-input" type="checkbox" id="flexSwitchCheckArchived">
                        <label class="form-check-label" for="flexSwitchCheckArchived">Show archived</label>
                    </div>
                </div>
                <div class="card-body">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Unit Price</th>
                                <th>Account</th>
                                <th>Last Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-if="products.length">
                                <tr v-for="product in products" :key="product.id" @click.prevent="openProductFormModal(product.id)">
                                    <td>{{ product.name }} <span v-if="product.archived" class="badge bg-light-secondary">Archived</span></td>
                                    <td>{{ $filters.toCurrency(product.unit_price) }}</td>
                                    <td>{{ product.account?.name }}</td>
                                    <td :title="product.created_at">{{ lastUpdated(product.updated_at) || 'Never' }}</td>
                                </tr>
                            </template>
                            <tr v-else>
                                <td colspan="5">No Product yet, please create new.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    </div>
    <teleport to="body">
        <ProductFormModal :productId="selectedProductId" v-if="showProductFormModal" @close="closeProductFormModal" />
    </teleport>
</template>
<script>
import { computed, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { toast } from '@/utilities/toast'
import ProductFormModal from '@/components/product/ProductFormModal'
import MyDatetimeObject from '@/utilities/mydate'

export default {
    components: {
        ProductFormModal
    },
    setup() {
        const store = useStore()
        const showProductFormModal = ref(false)
        const selectedProductId = ref(null)
        const showArchived = ref(false)
        const products = computed(() => store.getters.products.filter(p => {    
            return showArchived.value ? true : p.archived === false
        }))

        const { luxon } = MyDatetimeObject()

        const lastUpdated = date => luxon(date).toFormat('yyyy-MM-dd')
        
        onMounted( async () => {
            await store.dispatch('fetchProducts', store.getters.user.organizationId)
                .catch(e => toast('products error ' + e, 'error'))    
        })

        const openProductFormModal = (productId = null) => {
            if (productId) {
                console.log('why am i here', productId)
                selectedProductId.value = products.value.filter(p => p.id === productId)[0].id
            } else {
                selectedProductId.value = null
            }
            document.body.classList.add("modal-open")
            showProductFormModal.value = true
        }

        const closeProductFormModal = () => {
            document.body.classList.remove("modal-open")
            showProductFormModal.value = false
        }

        return {
            selectedProductId,
            showProductFormModal,
            openProductFormModal,
            closeProductFormModal,
            products,
            showArchived,
            lastUpdated
        }
    },
}
</script>