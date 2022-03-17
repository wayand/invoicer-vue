import Toastify from 'toastify-js'

export const toast = (msg, style, duration=5000) => { // error, warn, success
    const styles = {
        error: "#e57777",
        warn: "#efab45",
        success: "#7bb75d"
    }
    Toastify({
        text: msg,
        duration: duration,
        close:true,
        style: {
            background: styles[style]
        }
    }).showToast()
}