<template>
    <div id="error">
        <div class="error-page container">
            <div class="col-md-8 col-12 offset-md-2">
                <img class="img-error" src="/assets/static/images/samples/error-404.svg" alt="Not Found">
                <div class="text-center">
                    <h1 class="error-title">Oops!</h1>
                    <p class='fs-5 text-gray-600'>The {{ resource }} you are looking not found.</p>
                    <router-link :to="{ name: 'Dashboard' }" class="btn btn-lg btn-outline-primary mt-3">Back to the home page</router-link>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
export default {
    props: {
        resource: {
            type: String,
            required: true,
            default: 'page'
        }
    },
    setup() {
    },
}
</script>
<style>
/* @import "/assets/css/pages/error.css"; */
</style>