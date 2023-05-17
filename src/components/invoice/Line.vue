<template>
    <tr>
        <td class="w-15">
            <BaseSelectWithAddNew 
                :name="'product'"
                :options="products"
                :class="{ 'is-invalid': error.product_id }"
                v-model.number="product_id"
                @input="productHandler"
            />
            <div v-if="error.product_id" class="invalid-feedback">
                <i class="bx bx-radio-circle"></i>
            </div>
        </td>
        <td class="w-50">
            <input :class="{ 'is-invalid': error.description }" type="text" class="description form-control" v-model="description">
            <div v-if="error.description" class="invalid-feedback">
                <i class="bx bx-radio-circle"></i>
            </div>
        </td>
        <td class="w-12"><input type="number" step="any" class="quantity form-control" v-model.number="quantity" maxlength="10"></td>
        <td class="w-12">
            <input :class="{ 'is-invalid': error.unit_price }" type="number" steps="0.00" v-model.number="unit_price" placeholder="Unit price" class="unit-price form-control" autocomplete="off" inputmode="numeric">
            <div v-if="error.unit_price" class="invalid-feedback">
                <i class="bx bx-radio-circle"></i>
            </div>
        </td>
        <td class="w-10 total">{{ $filters.toCurrency(total) }}</td>
        <td class="w-auto">
            <a href="javascript:void(0)">
                <svg v-if="count > 1" @click="$emit('deleteLine', lineIndex)" class="bi" width="1em" height="1em" fill="currentColor"><use xlink:href="/assets/extensions/bootstrap-icons/bootstrap-icons.svg#trash"></use></svg>
            </a>
        </td>
    </tr>
    <teleport to="body">
        <ProductFormModal v-if="showProductFormModal" @close="closeProductFormModal" />
    </teleport>
</template>
<script>
import { ref, watch, computed } from 'vue'
import { useStore } from 'vuex'
import BaseSelectWithAddNew from '@/components/formBaseElements/BaseSelectWithAddNew'
import ProductFormModal from '@/components/product/ProductFormModal'

export default {
    components: {
        BaseSelectWithAddNew,
        ProductFormModal
    },
    emits: ['deleteLine', 'updateInvoice', 'validate'],
    props: {
        products: {
            type: Object,
            required: true
        },
        lineIndex: {
            type: Number,
            required: true
        },
        theLine: {
            type: Object,
            required: true
        },
        error: {
            type: [Object, String],
            default: () => { return {} }
        },
        count: {
            type: Number,
            required: true
        },
    },
    setup(props, {emit}) {
        const store = useStore()
        const showProductFormModal = ref(false)
        const oldProductID = ref("-1")
        const selectedProduct = ref(null)

        const product_id = computed({
            get: () => props.theLine.product_id,
            set: val => store.commit('UPDATE_INVOICE_LINES_PROPERTY', {index: props.lineIndex, key: 'product_id', value: val})
        })
        const description = computed({
            get: () => props.theLine.description,
            set: val => store.commit('UPDATE_INVOICE_LINES_PROPERTY', {index: props.lineIndex, key: 'description', value: val})
        })
        const quantity = computed({
            get: () => props.theLine.quantity,
            set: val => store.commit('UPDATE_INVOICE_LINES_PROPERTY', {index: props.lineIndex, key:  'quantity', value: val})
        })
        const unit_price = computed({
            get: () => props.theLine.unit_price,
            set: val => store.commit('UPDATE_INVOICE_LINES_PROPERTY', {index: props.lineIndex, key:  'unit_price', value: val})
        })
        const total = computed({
            get: () => parseFloat(quantity.value * unit_price.value),
            set: val => store.commit('UPDATE_INVOICE_LINES_PROPERTY', {index: props.lineIndex, key: 'amount', value: val})
        })

        const openProductFormModal = () => {
            document.body.classList.add("modal-open")
            showProductFormModal.value = true
        }

        const closeProductFormModal = () => {
            document.body.classList.remove("modal-open")
            showProductFormModal.value = false
        }

        const productHandler = e => {
            if (e.target.value === 'new') {
                product_id.value = oldProductID.value
                openProductFormModal()
            } else {
                selectedProduct.value = props.products.filter( p => p.id == e.target.value)[0]
                unit_price.value = selectedProduct.value?.unit_price || 0.00
                oldProductID.value = e.target.value
                description.value = selectedProduct.value?.description
                console.log('product: ', e.target.value)
            }
        }

        watch([() => product_id.value, () => unit_price.value, () => quantity.value], () => {
            store.commit('UPDATE_INVOICE_LINES_PROPERTY', {index: props.lineIndex, key:  'amount', value: total.value})
            emit('updateInvoice')

            setTimeout(function(){ emit('validate') }, 1);
        })

        return {
            showProductFormModal,
            openProductFormModal,
            closeProductFormModal,
            selectedProduct,
            productHandler,
            product_id,
            description,
            quantity,
            unit_price,
            oldProductID,
            total
        }
    },
}
</script>
<style scoped>
/* Chrome, Safari, Edge, Opera */
input.unit-price::-webkit-outer-spin-button,
input.unit-price::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
/* Firefox */
input.unit-price[type=number] {
    -moz-appearance: textfield;
}

.w-5 { width: 5% !important; }
.w-15 { width: 15% !important; }
.w-10 { width: 10% !important; }
.w-10.total { max-width: 120px !important; }
.w-12 { width: 12% !important; }
.w-50 { width: 50% !important; }
</style>