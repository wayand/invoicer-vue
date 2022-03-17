
const required = value => {
    const requiredMessage = 'This field is required'
    if (value === undefined || value === null || value === 0) return requiredMessage
    if (!String(value).length) return requiredMessage
    return true
}

const minLength = (value, min) => {
    return value.length < min ? `The field must be atleast ${min} characters long` : true
}

const maxLength = (value, max) => {
    return value.length > max ? `The field must be max ${max} characters long` : true
}

const isEmail = email => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email)
}

const validateEmail = value => {
    if (isEmail(value) !== true) return "Enter Valid Email address"
    return true;
}

const isNum = value => {
    let num = isNaN(value)
    return num ? `The field must only have numbers` : true
}

const isPhone = (value) => {
    return !value ? required(value) : isNum(value)
}

const isName = (value, min=false, max=false) => {
    if (!value) return required(value)
    if (min) { let res; if ((res = minLength(value, min)) !== true ) return res }
    if (max) { let res; if ((res = maxLength(value, max)) !== true ) return res }
    return true
}

const isPassword = (value, min, max) => {
    if (!value) return required(value)
    if (min) { let res; if ((res = minLength(value, min)) !== true ) return res }
    if (max) { let res; if ((res = maxLength(value, max)) !== true ) return res }
    return true
}

export { required, minLength, maxLength, validateEmail, isEmail, isNum, isPhone, isName, isPassword }
