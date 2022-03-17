<template>
    <div v-if="show" class="swal2-container swal2-center swal2-backdrop-show" style="overflow-y: auto;">
        <div aria-labelledby="swal2-title" aria-describedby="swal2-html-container" :class="`swal2-popup swal2-modal swal2-icon-${data.type} swal2-show`" tabindex="-1" role="dialog" aria-live="assertive" aria-modal="true" style="display: grid;">
            <button @click="close(false)" type="button" class="swal2-close" aria-label="Close this dialog">×</button>
            <div :class="`swal2-icon swal2-${data.type} swal2-icon-show`" style="display: flex;">

                <template v-if="data.type === 'error'">
                    <span class="swal2-x-mark">
                        <span class="swal2-x-mark-line-left"></span>
                        <span class="swal2-x-mark-line-right"></span>
                    </span>
                </template>

                <template v-else-if="data.type === 'warning'">
                    <div class="swal2-icon-content">!</div>
                </template>

                <template v-else-if="data.type === 'success'">
                    <div class="swal2-success-circular-line-left" style="background-color: rgb(255, 255, 255);"></div>
                    <span class="swal2-success-line-tip"></span> 
                    <span class="swal2-success-line-long"></span>
                    <div class="swal2-success-ring"></div> 
                    <div class="swal2-success-fix" style="background-color: rgb(255, 255, 255);"></div>
                    <div class="swal2-success-circular-line-right" style="background-color: rgb(255, 255, 255);"></div>
                </template>
            </div>
            <h2 class="swal2-title" id="swal2-title" style="display: block;">{{ data.title }}</h2>
            <div class="swal2-html-container" id="swal2-html-container">
                {{ data.content }}
            </div>
            <div class="swal2-actions" style="display: flex;">
                <div class="swal2-loader"></div>
                <button @click="close(false)" type="button" class="swal2-cancel swal2-styled" aria-label="">{{ data.reject }}</button>
                <button @click="close(true)" type="button" class="swal2-confirm swal2-styled" aria-label="">{{ data.accept }}</button>
            </div>
        </div>
    </div>
</template>
<script>
import { ref } from 'vue'
export default {
    setup() {

        const show = ref(false)
        const resolve = ref(null)
        const data = ref({
            type: 'primary',
            title: 'Confirm',
            content: 'Are you sure?',
            accept: 'Accept',
            reject: 'Cancel'
        })
        
        const showModal = async () => {
            document.documentElement.classList.add('swal2-shown','swal2-height-auto')
            document.body.classList.add('swal2-shown','swal2-height-auto')

            return new Promise(reslv => {
                resolve.value = reslv
                show.value = true
            })
        }

        const close = (response) => {
            document.documentElement.classList.remove('swal2-shown','swal2-height-auto')
            document.body.classList.remove('swal2-shown','swal2-height-auto')
            show.value = false
            return resolve.value(response)
        }

        return {
            showModal,
            show,
            resolve,
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
/*******   sweet Alert Icon */
.swal2-icon {
    position: relative;
    box-sizing: content-box;
    justify-content: center;
    width: 2em;
    height: 2em;
    margin: .5em 0 0 .6em;
    border: 0.25em solid transparent;
    border-radius: 50%;
    border-color: #000;
    font-family: inherit;
    line-height: 5em;
    cursor: default;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
.swal2-icon .swal2-icon-content {
    display: flex;
    align-items: center;
    font-size: 2em;
}

/** warning */
.swal2-icon.swal2-warning {
    border-color: #facea8;
    color: #f8bb86;
}

/** Error */
.swal2-icon.swal2-error.swal2-icon-show .swal2-x-mark {
    -webkit-animation: swal2-animate-error-x-mark .5s;
    animation: swal2-animate-error-x-mark .5s;
}
.swal2-icon.swal2-error [class^=swal2-x-mark-line][class$=left] {
    left: .2em;
    transform: rotate(45deg);
}
.swal2-icon.swal2-error [class^=swal2-x-mark-line][class$=right] {
    right: .2em;
    transform: rotate(-45deg);
}
.swal2-icon.swal2-error [class^=swal2-x-mark-line] {
    display: block;
    position: absolute;
    top: 0.9em;
    width: 1.6em;
    height: 0.25em;
    border-radius: 0.125em;
    background-color: #f27474;
}
.swal2-icon.swal2-error.swal2-icon-show {
    -webkit-animation: swal2-animate-error-icon .5s;
    animation: swal2-animate-error-icon .5s;
}
.swal2-icon.swal2-error {
    border-color: #f27474;
    color: #f27474;
}
.swal2-icon.swal2-error .swal2-x-mark {
    position: relative;
    flex-grow: 1;
}

/**success */
.swal2-icon.swal2-success [class^=swal2-success-circular-line] {
    position: absolute;
    width: 3.75em;
    height: 7.5em;
    transform: rotate(45deg);
    border-radius: 50%;
}

.swal2-icon.swal2-success [class^=swal2-success-circular-line][class$=left] {
    top: -0.4375em;
    left: -0.0635em;
    transform: rotate(-45deg);
    transform-origin: 3.75em 3.75em;
    border-radius: 7.5em 0 0 7.5em;
}
.swal2-icon.swal2-success {
    border-color: #a5dc86;
    color: #a5dc86;
}
.swal2-icon.swal2-success.swal2-icon-show .swal2-success-line-tip {
    -webkit-animation: swal2-animate-success-line-tip .75s;
    animation: swal2-animate-success-line-tip .75s;
}
.swal2-icon.swal2-success [class^=swal2-success-line][class$=tip] {
    top: 1.0789em;
    left: 0.5em;
    width: 0.5625em;
    transform: rotate(45deg);
}
.swal2-icon.swal2-success.swal2-icon-show .swal2-success-line-long {
    -webkit-animation: swal2-animate-success-line-long .75s;
    animation: swal2-animate-success-line-long .75s;
}
.swal2-icon.swal2-success [class^=swal2-success-line][class$=long] {
    top: 0.9em;
    right: 0.09em;
    width: 1.2em;
    transform: rotate(-45deg);
}
.swal2-icon.swal2-success [class^=swal2-success-line] {
    display: block;
    position: absolute;
    z-index: 2;
    height: 0.3125em;
    border-radius: 0.125em;
    background-color: #a5dc86;
}
.swal2-icon.swal2-success .swal2-success-ring {
    position: absolute;
    z-index: 2;
    top: -0.25em;
    left: -0.25em;
    box-sizing: content-box;
    width: 100%;
    height: 100%;
    border: 0.25em solid rgba(165,220,134,.3);
    border-radius: 50%;
}
.swal2-icon.swal2-success .swal2-success-fix {
    position: absolute;
    z-index: 1;
    top: 0.5em;
    left: 1.625em;
    width: 0.4375em;
    height: 5.625em;
    transform: rotate(-45deg);
}
.swal2-icon.swal2-success.swal2-icon-show .swal2-success-circular-line-right {
    -webkit-animation: swal2-rotate-success-circular-line 4.25s ease-in;
    animation: swal2-rotate-success-circular-line 4.25s ease-in;
}
.swal2-icon.swal2-success [class^=swal2-success-circular-line][class$=right] {
    top: -0.6875em;
    left: 1.875em;
    transform: rotate(-45deg);
    transform-origin: 0 3.75em;
    border-radius: 0 7.5em 7.5em 0;
}

/************ sweet alert Icon end */

.swal2-title {
    position: relative;
    max-width: 100%;
    margin: 0;
    padding: 0.2em 1em 0;
    color: #595959;
    font-size: 1.875em;
    font-weight: 600;
    text-align: center;
    text-transform: none;
    word-wrap: break-word;
}
.swal2-html-container {
    z-index: 1;
    justify-content: center;
    margin: 1em 1.6em 0.3em;
    padding: 0;
    overflow: auto;
    color: #545454;
    font-size: 1.125em;
    font-weight: 400;
    line-height: normal;
    text-align: center;
    word-wrap: break-word;
    word-break: break-word;
}
.swal2-actions {
    display: flex;
    z-index: 1;
    box-sizing: border-box;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    width: auto;
    margin: 1.25em auto 0;
    padding: 0;
}
.swal2-loader {
    display: none;
    align-items: center;
    justify-content: center;
    width: 2.2em;
    height: 2.2em;
    margin: 0 1.875em;
    -webkit-animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
    animation: swal2-rotate-loading 1.5s linear 0s infinite normal;
    border-width: 0.25em;
    border-style: solid;
    border-radius: 100%;
    border-color: #2778c4 transparent #2778c4 transparent;
}
.swal2-styled.swal2-confirm {
    border: 0;
    border-radius: 0.25em;
    background: initial;
    background-color: #7367f0;
    color: #fff;
    font-size: 1em;
}
.swal2-styled.swal2-cancel {
    border: 0;
    border-radius: 0.25em;
    background: initial;
    background-color: #6e7d88;
    color: #fff;
    font-size: 1em;
}
.swal2-styled.swal2-deny {
    border: 0;
    border-radius: 0.25em;
    background: initial;
    background-color: #ea5455;
    color: #fff;
    font-size: 1em;
}
.swal2-styled:not([disabled]) {
    cursor: pointer;
}
.swal2-styled {
    margin: 0.3125em;
    padding: 0.625em 1.1em;
    transition: box-shadow .1s;
    box-shadow: 0 0 0 3px transparent;
    font-weight: 500;
}
</style>