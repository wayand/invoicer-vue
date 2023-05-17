<template>
    <div id="error">
        <div class="error-page container">
            <div class="col-md-8 col-12 offset-md-2">
                <img class="img-error" src="/assets/static/images/samples/error-500.svg" alt="Not Found">
                <div class="text-center">
                    <h1 class="error-title">Uh-Oh! - System Error</h1>
                    <p class="fs-5 text-gray-600">The website is currently unaivailable. Try again later or contact the developer.</p>
                    <a @click="$router.push({name: 'Dashboard'})" class="btn btn-lg btn-outline-primary mt-3">Back to the home page</a>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
export default {
    setup() {},
}
</script>
<style scoped>
/*@import "/assets/static/css/pages/error.css";*/
</style>