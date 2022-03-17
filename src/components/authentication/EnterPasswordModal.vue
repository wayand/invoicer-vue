<template>
    <div v-if="show" class="swal2-container swal2-center swal2-backdrop-show" style="overflow-y: auto;">
        <div aria-labelledby="swal2-title" aria-describedby="swal2-html-container" :class="`swal2-popup swal2-modal swal2-icon-${data.type} swal2-show`" tabindex="-1" role="dialog" aria-live="assertive" aria-modal="true" style="display: grid;">
            <button @click="close" type="button" class="swal2-close" aria-label="Close this dialog">×</button>
            
            <h2 class="swal2-title" id="swal2-title" style="display: block;">{{ data.title }}</h2>
            <div class="swal2-html-container" id="swal2-html-container">
                {{ data.content }}
                <div class="form-group mt-3">
                    <input v-model="password" autocapitalize="off" autocorrect="off" :class="{ 'is-invalid': error.password }" class="form-control swal2-input" id="swal2-input" placeholder="Enter your password" type="password" style="display: flex;">
                    <div v-if="error.password" class="invalid-feedback">
                        <span>{{ error.password }}</span>
                    </div>
                </div>
            </div>
            <div class="swal2-actions" style="display: flex;">
                <div class="swal2-loader"></div>
                <button @click="close" type="button" class="swal2-cancel swal2-styled" aria-label="">{{ data.reject }}</button>
                <button @click="accept" type="button" class="swal2-confirm swal2-styled" aria-label="">{{ data.accept }}</button>
            </div>
        </div>
    </div>
</template>
<script>
import { ref, toRefs } from 'vue'

export default {
    props: {
        error: {
            type: Object,
            required: false,
        },
    },
    setup(props, {emit}) {
        const { error } = toRefs(props)
        const password = ref('')

        const show = ref(false)
        const data = ref({
            type: 'primary',
            title: 'Enter your password',
            content: 'Are you sure you want to delete this two-factor authentication method?',
            accept: 'Accept',
            reject: 'Cancel'
        })
        
        const showModal = async () => {
            document.documentElement.classList.add('swal2-shown','swal2-height-auto')
            document.body.classList.add('swal2-shown','swal2-height-auto')
            show.value = true
        }

        const accept = () => {
            document.documentElement.classList.remove('swal2-shown','swal2-height-auto')
            document.body.classList.remove('swal2-shown','swal2-height-auto')
            if (password.value.length > 5) {
                emit('accept', password.value)
            } else {
                error.value['password'] = 'Password is required!'
            }
        }

        const close = () => {
            document.documentElement.classList.remove('swal2-shown','swal2-height-auto')
            document.body.classList.remove('swal2-shown','swal2-height-auto')
            document.body.classList.remove("modal-open")
            show.value = false
            emit('cancel')
        }

        return {
            password,
            showModal,
            show,
            accept,
            close,
            data
        }    
    },
}
</script>
<style>
[class^=swal2] {
    -webkit-tap-highlight-color: transparent;
}
body.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown) {
    overflow: hidden;
}
body.swal2-height-auto {
    height: auto!important;
}
.swal2-container.swal2-bottom, .swal2-container.swal2-center, .swal2-container.swal2-top {
    grid-template-columns: auto minmax(0,1fr) auto;
}
.swal2-container.swal2-backdrop-show, .swal2-container.swal2-noanimation {
    background: rgba(0,0,0,.4);
}
.swal2-container {
    display: grid;
    position: fixed;
    z-index: 1060;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    box-sizing: border-box;
    grid-template-areas:
        "top-start top top-end"
        "center-start center center-end"
        "bottom-start bottom-center bottom-end";
    grid-template-rows: minmax(-webkit-min-content,auto) minmax(-webkit-min-content,auto) minmax(-webkit-min-content,auto);
    grid-template-rows: minmax(min-content,auto) minmax(min-content,auto) minmax(min-content,auto);
    height: 100%;
    padding: 0.625em;
    overflow-x: hidden;
    transition: background-color .1s;
    -webkit-overflow-scrolling: touch;
}
.swal2-container.swal2-center>.swal2-popup {
    grid-column: 2;
    grid-row: 2;
    align-self: center;
    justify-self: center;
}
.swal2-show {
    -webkit-animation: swal2-show .3s;
    animation: swal2-show .3s;
}
.swal2-popup {
    display: none;
    position: relative;
    box-sizing: border-box;
    grid-template-columns: minmax(0,100%);
    width: 32em;
    max-width: 100%;
    padding: 0 0 1.25em;
    border: none;
    border-radius: 5px;
    background: #fff;
    color: #545454;
    font-family: inherit;
    font-size: 1rem;
}
.swal2-close {
    z-index: 2;
    align-items: center;
    justify-content: center;
    width: 1em;
    height: 1em;
    margin-top: 0;
    margin-right: 0;
    margin-bottom: -1.2em;
    padding: 0;
    overflow: hidden;
    transition: color .1s,box-shadow .1s;
    border: none;
    border-radius: 5px;
    background: 0 0;
    color: #ccc;
    font-family: serif;
    font-family: monospace;
    font-size: 2.5em;
    cursor: pointer;
    justify-self: end;
}
.swal2-input {
    height: 2.625em;
    padding: 0 0.75em;
}
</style>