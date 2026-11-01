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
        <td class="w-40">
            <input
                :class="{ 'is-invalid': error.description }"
                type="text"
                class="description form-control"
                v-model="description"
            />
            <div v-if="error.description" class="invalid-feedback">
                <i class="bx bx-radio-circle"></i>
            </div>
        </td>
        <td class="w-12">
            <input type="number" step="any" class="quantity form-control" v-model.number="quantity" maxlength="10" />
        </td>
        <td class="w-12">
            <input
                :class="{ 'is-invalid': error.unit_price }"
                type="number"
                steps="0.00"
                v-model.number="unit_price"
                placeholder="Unit price"
                class="unit-price form-control"
                autocomplete="off"
                inputmode="numeric"
            />
            <div v-if="error.unit_price" class="invalid-feedback">
                <i class="bx bx-radio-circle"></i>
            </div>
        </td>
        <td v-if="showVat" class="w-12">
            <select
                :class="{ 'is-invalid': error.vat_code }"
                class="vat-code form-select"
                name="vat_code"
                v-model="vat_code"
            >
                <option v-if="!hasCode" value="">Select VAT code</option>
                <option v-for="vatCode in vatCodes" :key="vatCode.code" :value="vatCode.code" :title="vatCode.title">
                    {{ vatCode.code }} {{ percent(vatCode) }}%
                </option>
            </select>
            <div v-if="error.vat_code" class="invalid-feedback">
                <i class="bx bx-radio-circle"></i>
            </div>
        </td>
        <td class="w-10 total">{{ $filters.toCurrency(total) }}</td>
        <td class="w-auto">
            <a href="javascript:void(0)">
                <svg
                    v-if="count > 1"
                    @click="$emit('deleteLine', lineIndex)"
                    class="bi"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                >
                    <use xlink:href="/assets/extensions/bootstrap-icons/bootstrap-icons.svg#trash"></use>
                </svg>
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
import { lineAmount, ratePercent, salesRate } from '@/utilities/money'

export default {
    name: 'InvoiceLine',
    components: {
        BaseSelectWithAddNew,
        ProductFormModal,
    },
    emits: ['deleteLine', 'validate'],
    props: {
        products: {
            type: Object,
            required: true,
        },
        // An organization that is not VAT-registered shows no VAT: the line keeps its code (S81)
        showVat: {
            type: Boolean,
            default: true,
        },
        // The VAT codes an invoice line can have
        vatCodes: {
            type: Array,
            default: () => [],
        },
        lineIndex: {
            type: Number,
            required: true,
        },
        theLine: {
            type: Object,
            required: true,
        },
        error: {
            type: [Object, String],
            default: () => {
                return {}
            },
        },
        count: {
            type: Number,
            required: true,
        },
    },
    setup(props, { emit }) {
        const store = useStore()
        const showProductFormModal = ref(false)
        const oldProductID = ref('-1')
        const selectedProduct = ref(null)

        const product_id = computed({
            get: () => props.theLine.product_id,
            set: (val) =>
                store.commit('UPDATE_INVOICE_LINES_PROPERTY', {
                    index: props.lineIndex,
                    key: 'product_id',
                    value: val,
                }),
        })
        const description = computed({
            get: () => props.theLine.description,
            set: (val) =>
                store.commit('UPDATE_INVOICE_LINES_PROPERTY', {
                    index: props.lineIndex,
                    key: 'description',
                    value: val,
                }),
        })
        const quantity = computed({
            get: () => props.theLine.quantity,
            set: (val) =>
                store.commit('UPDATE_INVOICE_LINES_PROPERTY', { index: props.lineIndex, key: 'quantity', value: val }),
        })
        const unit_price = computed({
            get: () => props.theLine.unit_price,
            set: (val) =>
                store.commit('UPDATE_INVOICE_LINES_PROPERTY', {
                    index: props.lineIndex,
                    key: 'unit_price',
                    value: val,
                }),
        })
        const vat_code = computed({
            get: () => props.theLine.vat_code || '',
            set: (val) =>
                store.commit('UPDATE_INVOICE_LINES_PROPERTY', { index: props.lineIndex, key: 'vat_code', value: val }),
        })
        const hasCode = computed(() => props.vatCodes.some((vatCode) => vatCode.code === vat_code.value))
        const percent = (vatCode) => ratePercent(salesRate(vatCode))
        const total = computed(() => lineAmount(quantity.value, unit_price.value))

        const openProductFormModal = () => {
            document.body.classList.add('modal-open')
            showProductFormModal.value = true
        }

        const closeProductFormModal = () => {
            document.body.classList.remove('modal-open')
            showProductFormModal.value = false
        }

        const productHandler = (e) => {
            if (e.target.value === 'new') {
                product_id.value = oldProductID.value
                openProductFormModal()
            } else {
                selectedProduct.value = props.products.filter((p) => p.id == e.target.value)[0]
                unit_price.value = selectedProduct.value?.unit_price || 0.0
                oldProductID.value = e.target.value
                description.value = selectedProduct.value?.description
                console.log('product: ', e.target.value)
            }
        }

        watch([() => product_id.value, () => unit_price.value, () => quantity.value, () => vat_code.value], () => {
            setTimeout(function () {
                emit('validate')
            }, 1)
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
            vat_code,
            hasCode,
            percent,
            oldProductID,
            total,
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
input.unit-price[type='number'] {
    -moz-appearance: textfield;
}

.w-5 {
    width: 5% !important;
}
.w-15 {
    width: 15% !important;
}
.w-10 {
    width: 10% !important;
}
.w-10.total {
    max-width: 120px !important;
}
.w-12 {
    width: 12% !important;
}
.w-40 {
    width: 40% !important;
}
.w-50 {
    width: 50% !important;
}
select.vat-code {
    min-width: 8rem;
}
</style>
