<template>
    <div id="error">
        <div class="error-page container">
            <div class="col-md-8 col-12 offset-md-2">
                <div class="text-center">
                    <template v-if="confirmed">
                        <h1 class="error-title">Welcome!</h1>
                        <p class='fs-5 text-gray-600'>
                            Congratulations!. Your Invoicer account is now activated.
                        </p>
                    </template>
                    <template v-else>
                        <h1>Woops!</h1>
                        <p>Either the provided activation token is invalid or this account has already been activated.</p>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { useStore } from 'vuex'
import { toRefs, onMounted, ref } from 'vue'
export default {
    props: {
        token: {
            type: String,
            required: true,
        }
    },
    setup(props) {
        const { token } = toRefs(props)
        const confirmed = ref(false)
        const confirmedResponse = ref('')
        const store = useStore()

        onMounted(async () => {
            await store.dispatch('confirmEmail', token.value)
                .then((result) => {
                    confirmed.value = true
                    console.log('result', result.data)
                    confirmedResponse.value = result.data
                })
        })

        return {
            confirmed
        }
    },
}
</script>