// Turn a failed API call into text a person can read. The API answers with
// { error: "..." } or { errors: { field: ["..."] } }, and the rate limiter
// (HTTP 429) uses the first form.
export const apiErrorMessage = (e, fallback = 'Something went wrong. Please try again.') => {
    if (!e || !e.response) return (e && e.message) || fallback
    const data = e.response.data || {}
    if (typeof data.error === 'string') return data.error
    if (Array.isArray(data.error)) return data.error.join(' ')
    if (data.errors && typeof data.errors === 'object') {
        return Object.values(data.errors).flat().join(' ') || fallback
    }
    return fallback
}

// For forms that render `errors.<field>`: use the API's field errors when it
// sent them, otherwise show the message under `field`, so templates never
// read a property of undefined.
export const fieldErrors = (e, field = 'password') => {
    const errors = e && e.response && e.response.data && e.response.data.errors
    return errors && typeof errors === 'object' ? errors : { [field]: apiErrorMessage(e) }
}
